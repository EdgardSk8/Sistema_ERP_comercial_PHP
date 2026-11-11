<?php

namespace App\Http\Controllers;

use App\Services\ArqueoTrabajadorService;
use App\Support\Busqueda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class TrabajadorController extends Controller
{
    private const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'suspendido'];

    public function Mostrar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'nullable|in:todas,'.implode(',', self::ESTADOS),
            'buscar' => 'nullable|string|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $consulta = DB::table('trabajadores as t')
            ->join('clientes as c', 'c.id_cliente', '=', 't.id_cliente')
            ->select([
                't.*',
                'c.nombre_cliente',
                'c.correo_cliente',
                'c.telefono_cliente',
                'c.rol_cliente',
            ])
            ->orderByDesc('t.fecha_solicitud');

        if ($request->filled('estado') && $request->estado !== 'todas') {
            $consulta->where('t.estado_trabajador', $request->estado);
        }

        if ($request->filled('buscar')) {
            $buscar = (string) $request->buscar;

            $consulta->where(function ($query) use ($buscar) {
                Busqueda::aplicarLike($query, 't.nombre_trabajador', $buscar);
                Busqueda::aplicarLike($query, 't.cedula_trabajador', $buscar, 'or');
                Busqueda::aplicarLike($query, 't.telefono_trabajador', $buscar, 'or');
                Busqueda::aplicarLike($query, 't.vehiculo_placa', $buscar, 'or');
                Busqueda::aplicarLike($query, 't.vehiculo_marca', $buscar, 'or');
                Busqueda::aplicarLike($query, 'c.correo_cliente', $buscar, 'or');
            });
        }

        $trabajadores = $consulta->limit(500)->get();

        $resumen = DB::table('trabajadores')
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when estado_trabajador = 'pendiente' then 1 else 0 end) as pendientes")
            ->selectRaw("sum(case when estado_trabajador = 'aprobado' then 1 else 0 end) as aprobados")
            ->selectRaw("sum(case when estado_trabajador = 'rechazado' then 1 else 0 end) as rechazados")
            ->selectRaw("sum(case when estado_trabajador = 'suspendido' then 1 else 0 end) as suspendidos")
            ->first();

        return response()->json([
            'success' => true,
            'trabajadores' => $trabajadores,
            'resumen' => [
                'total' => (int) ($resumen->total ?? 0),
                'pendientes' => (int) ($resumen->pendientes ?? 0),
                'aprobados' => (int) ($resumen->aprobados ?? 0),
                'rechazados' => (int) ($resumen->rechazados ?? 0),
                'suspendidos' => (int) ($resumen->suspendidos ?? 0),
            ],
        ]);
    }

    public function Actualizar(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'estado_trabajador' => 'required|in:'.implode(',', self::ESTADOS),
            'porcentaje_comision' => 'nullable|numeric|min:0|max:100',
            'nota_erp' => 'nullable|string|max:2000',
            'motivo_rechazo' => 'nullable|string|max:2000',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'numeric' => 'El campo :attribute debe ser numérico.',
            'in' => 'El estado seleccionado no es válido.',
            'min' => 'El porcentaje no puede ser menor que :min.',
            'max' => 'El porcentaje no puede ser mayor que :max.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $trabajador = DB::table('trabajadores')->where('id_trabajador', $id)->first();

        if (! $trabajador) {
            return response()->json(['success' => false, 'mensaje' => 'Solicitud no encontrada.'], 404);
        }

        $estado = $request->estado_trabajador;

        if ($estado === 'rechazado' && ! $request->filled('motivo_rechazo')) {
            return response()->json([
                'success' => false,
                'errors' => ['motivo_rechazo' => ['Escribe el motivo del rechazo.']],
            ], 422);
        }

        try {
            $actualizado = DB::transaction(function () use ($request, $trabajador, $estado) {
                $cambiaEstado = $trabajador->estado_trabajador !== $estado;

                $datos = [
                    'estado_trabajador' => $estado,
                    'nota_erp' => $request->filled('nota_erp') ? $request->nota_erp : null,
                    'motivo_rechazo' => $estado === 'rechazado'
                        ? ($request->motivo_rechazo ?: null)
                        : null,
                    'fecha_actualizacion' => now(),
                ];

                if ($request->filled('porcentaje_comision')) {
                    $datos['porcentaje_comision'] = round((float) $request->porcentaje_comision, 2);
                }

                if ($cambiaEstado) {
                    $datos['fecha_revision'] = now();
                }

                if ($estado !== 'aprobado') {
                    $datos['disponible'] = false;
                }

                DB::table('trabajadores')
                    ->where('id_trabajador', $trabajador->id_trabajador)
                    ->update($datos);

                DB::table('clientes')
                    ->where('id_cliente', $trabajador->id_cliente)
                    ->update([
                        'rol_cliente' => $estado === 'aprobado' ? 'trabajador' : 'cliente',
                    ]);

                return DB::table('trabajadores as t')
                    ->join('clientes as c', 'c.id_cliente', '=', 't.id_cliente')
                    ->where('t.id_trabajador', $trabajador->id_trabajador)
                    ->select(['t.*', 'c.nombre_cliente', 'c.correo_cliente', 'c.telefono_cliente', 'c.rol_cliente'])
                    ->first();
            });

            return response()->json([
                'success' => true,
                'mensaje' => 'Solicitud actualizada.',
                'trabajador' => $actualizado,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar la solicitud.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function Arqueos(Request $request, $id, ArqueoTrabajadorService $arqueoService)
    {
        $validator = Validator::make($request->all(), [
            'desde' => 'nullable|date_format:Y-m-d',
            'hasta' => 'nullable|date_format:Y-m-d',
        ], [
            'date_format' => 'La fecha :attribute debe tener el formato AAAA-MM-DD.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $desde = $request->input('desde') ?: now()->subDays(6)->toDateString();
        $hasta = $request->input('hasta') ?: now()->toDateString();

        if ($hasta < $desde) {
            return response()->json([
                'success' => false,
                'mensaje' => 'La fecha final no puede ser anterior a la inicial.',
            ], 422);
        }

        try {
            return response()->json([
                'success' => true,
                ...$arqueoService->resumen((int) $id, $desde, $hasta),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'mensaje' => $e->getMessage()], 404);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo calcular el arqueo del repartidor.',
            ], 500);
        }
    }

    public function Eliminar($id)
    {
        $trabajador = DB::table('trabajadores')->where('id_trabajador', $id)->first();

        if (! $trabajador) {
            return response()->json(['success' => false, 'mensaje' => 'Solicitud no encontrada.'], 404);
        }

        try {
            DB::transaction(function () use ($trabajador) {
                DB::table('clientes')
                    ->where('id_cliente', $trabajador->id_cliente)
                    ->update(['rol_cliente' => 'cliente']);

                DB::table('trabajadores')->where('id_trabajador', $trabajador->id_trabajador)->delete();
            });

            return response()->json(['success' => true, 'mensaje' => 'Solicitud eliminada.']);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo eliminar la solicitud.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
