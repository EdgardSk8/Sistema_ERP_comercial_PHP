<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CuponDescuentoController extends Controller
{
    public function Mostrar(Request $request)
    {
        try {
            $cupones = DB::table('cupones as c')
                ->leftJoin('cupones_clientes as cc', 'cc.id_cupon', '=', 'c.id_cupon')
                ->select([
                    'c.id_cupon',
                    'c.codigo_cupon',
                    'c.nombre_cupon',
                    'c.descripcion_cupon',
                    'c.tipo_descuento_cupon',
                    'c.valor_descuento_cupon',
                    'c.categoria_cupon',
                    'c.usos_maximos',
                    'c.usos_realizados',
                    'c.fecha_inicio_cupon',
                    'c.fecha_fin_cupon',
                    'c.estado_cupon',
                    'c.fecha_creacion_cupon',
                ])
                ->selectRaw('count(cc.id_cupon_cliente) as asignados')
                ->selectRaw('coalesce(sum(case when cc.usado_cupon then 1 else 0 end), 0) as usados')
                ->groupBy('c.id_cupon')
                ->orderByDesc('c.estado_cupon')
                ->orderByDesc('c.fecha_creacion_cupon')
                ->get()
                ->map(function ($cupon) {
                    $cupon->asignados = (int) $cupon->asignados;
                    $cupon->usados = (int) $cupon->usados;
                    $cupon->valor = (float) $cupon->valor_descuento_cupon;
                    $cupon->origen = str_starts_with(strtoupper((string) $cupon->codigo_cupon), 'FIEL-')
                        ? 'fidelidad'
                        : 'manual';

                    $inicio = $cupon->fecha_inicio_cupon;
                    $fin = $cupon->fecha_fin_cupon;

                    $cupon->vigente = (! $inicio || now()->greaterThanOrEqualTo($inicio))
                        && (! $fin || now()->lessThanOrEqualTo($fin));

                    return $cupon;
                })
                ->values();

            $resumen = [
                'total' => $cupones->count(),
                'activos' => $cupones->filter(fn ($cupon) => (bool) $cupon->estado_cupon)->count(),
                'fidelidad' => $cupones->filter(fn ($cupon) => $cupon->origen === 'fidelidad')->count(),
                'usados' => (int) $cupones->sum('usos_realizados'),
                'asignaciones' => (int) $cupones->sum('asignados'),
                'promociones_activas' => DB::table('promociones')->where('estado_promocion', true)->count(),
            ];

            $bienvenida = $this->resumenBienvenida();
            $resumen['bienvenida_disponibles'] = $bienvenida['disponibles'];
            $resumen['bienvenida_usados'] = $bienvenida['usados'];

            return response()->json([
                'success' => true,
                'cupones' => $cupones,
                'resumen' => $resumen,
                'categorias' => DB::table('categoria')
                    ->where('estado_categoria', true)
                    ->orderBy('nombre_categoria')
                    ->pluck('nombre_categoria'),
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los cupones.',
            ], 500);
        }
    }

    public function Detalle($id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $clientes = DB::table('cupones_clientes as cc')
            ->join('clientes as cl', 'cl.id_cliente', '=', 'cc.id_cliente')
            ->where('cc.id_cupon', $id)
            ->select([
                'cc.id_cupon_cliente',
                'cc.usado_cupon',
                'cc.fecha_uso_cupon',
                'cc.fecha_asignacion_cupon',
                'cl.nombre_cliente',
                'cl.correo_cliente',
                'cl.telefono_cliente',
            ])
            ->orderByDesc('cc.usado_cupon')
            ->orderBy('cl.nombre_cliente')
            ->get();

        return response()->json([
            'success' => true,
            'cupon' => $cupon,
            'clientes' => $clientes,
        ]);
    }

    public function Clientes(Request $request)
    {
        try {
            $idCupon = (int) $request->query('cupon', 0);

            if ($idCupon && ! DB::table('cupones')->where('id_cupon', $idCupon)->exists()) {
                return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
            }

            $clientes = DB::table('clientes')
                ->select('id_cliente', 'nombre_cliente', 'correo_cliente', 'estado_cliente')
                ->orderBy('nombre_cliente')
                ->get();

            $asignados = $idCupon
                ? DB::table('cupones_clientes')
                    ->where('id_cupon', $idCupon)
                    ->pluck('id_cliente')
                    ->map(fn ($idCliente) => (int) $idCliente)
                    ->all()
                : [];

            return response()->json([
                'success' => true,
                'clientes' => $clientes,
                'asignados' => $asignados,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los clientes.',
            ], 500);
        }
    }

    public function Crear(Request $request)
    {
        $validator = $this->validarCupon($request);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $datos = $this->datosCupon($request);
            $datos['usos_realizados'] = 0;
            $datos['fecha_creacion_cupon'] = now();

            $idCupon = DB::table('cupones')->insertGetId($datos, 'id_cupon');

            return response()->json([
                'success' => true,
                'id_cupon' => $idCupon,
                'mensaje' => 'Cupón creado correctamente.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear el cupón.',
            ], 500);
        }
    }

    public function Actualizar(Request $request, $id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $validator = $this->validarCupon($request, (int) $id);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::table('cupones')->where('id_cupon', $id)->update($this->datosCupon($request));

            return response()->json([
                'success' => true,
                'mensaje' => 'Cupón actualizado correctamente.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar el cupón.',
            ], 500);
        }
    }

    public function Asignar(Request $request, $id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'clientes' => 'required|array|min:1',
            'clientes.*' => 'integer',
        ], [
            'required' => 'Selecciona al menos un cliente.',
            'array' => 'Selecciona al menos un cliente.',
            'min' => 'Selecciona al menos un cliente.',
            'integer' => 'Los clientes seleccionados no son válidos.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $solicitados = collect($request->input('clientes', []))
                ->map(fn ($idCliente) => (int) $idCliente)
                ->unique()
                ->values();

            $validos = DB::table('clientes')
                ->whereIn('id_cliente', $solicitados)
                ->pluck('id_cliente')
                ->map(fn ($idCliente) => (int) $idCliente);

            $existentes = DB::table('cupones_clientes')
                ->where('id_cupon', $id)
                ->pluck('id_cliente')
                ->map(fn ($idCliente) => (int) $idCliente);

            $nuevos = $validos->diff($existentes)->values();

            if ($nuevos->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'asignados' => 0,
                    'omitidos' => $validos->count(),
                    'mensaje' => 'Los clientes seleccionados ya tenían este cupón.',
                ]);
            }

            $ahora = now();

            $filas = $nuevos->map(fn ($idCliente) => [
                'id_cupon' => (int) $id,
                'id_cliente' => $idCliente,
                'usado_cupon' => false,
                'fecha_asignacion_cupon' => $ahora,
            ])->all();

            DB::transaction(fn () => DB::table('cupones_clientes')->insert($filas));

            return response()->json([
                'success' => true,
                'asignados' => count($filas),
                'omitidos' => $validos->count() - count($filas),
                'mensaje' => count($filas) === 1
                    ? 'Cupón asignado a 1 cliente.'
                    : 'Cupón asignado a '.count($filas).' clientes.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo asignar el cupón.',
            ], 500);
        }
    }

    private function validarCupon(Request $request, ?int $idCupon = null)
    {
        $validator = Validator::make($request->all(), [
            'codigo_cupon' => ['required', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'nombre_cupon' => 'required|max:120',
            'descripcion_cupon' => 'nullable|max:255',
            'tipo_descuento_cupon' => 'required|in:porcentaje,monto',
            'valor_descuento_cupon' => 'required|numeric|min:0.01',
            'categoria_cupon' => 'nullable|max:80',
            'usos_maximos' => 'required|integer|min:1',
            'fecha_inicio_cupon' => 'nullable|date',
            'fecha_fin_cupon' => 'nullable|date|after_or_equal:fecha_inicio_cupon',
            'estado_cupon' => 'nullable|boolean',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'numeric' => 'El campo :attribute debe ser numérico.',
            'integer' => 'El campo :attribute debe ser un número entero.',
            'min' => 'El campo :attribute debe ser mayor o igual a :min.',
            'max' => 'El campo :attribute no debe superar :max caracteres.',
            'regex' => 'El :attribute solo permite letras, números, guiones y guiones bajos.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
            'after_or_equal' => 'La fecha fin debe ser igual o posterior a la fecha inicio.',
            'in' => 'El campo :attribute no es válido.',
            'boolean' => 'El campo :attribute no es válido.',
        ], [
            'codigo_cupon' => 'código',
            'nombre_cupon' => 'nombre',
            'descripcion_cupon' => 'descripción',
            'tipo_descuento_cupon' => 'tipo',
            'valor_descuento_cupon' => 'valor',
            'categoria_cupon' => 'categoría',
            'usos_maximos' => 'usos máximos',
            'fecha_inicio_cupon' => 'fecha inicio',
            'fecha_fin_cupon' => 'fecha fin',
        ]);

        $validator->after(function ($validator) use ($request, $idCupon) {
            $codigo = strtoupper(trim((string) $request->input('codigo_cupon')));

            if ($codigo === '') {
                return;
            }

            $existe = DB::table('cupones')
                ->whereRaw('upper(codigo_cupon) = ?', [$codigo])
                ->when($idCupon, fn ($consulta) => $consulta->where('id_cupon', '!=', $idCupon))
                ->exists();

            if ($existe) {
                $validator->errors()->add('codigo_cupon', 'Ya existe un cupón con ese código.');
            }

            if ($request->input('tipo_descuento_cupon') === 'porcentaje'
                && (float) $request->input('valor_descuento_cupon') > 100) {
                $validator->errors()->add('valor_descuento_cupon', 'El porcentaje no puede ser mayor a 100.');
            }
        });

        return $validator;
    }

    private function datosCupon(Request $request): array
    {
        return [
            'codigo_cupon' => strtoupper(trim((string) $request->input('codigo_cupon'))),
            'nombre_cupon' => trim((string) $request->input('nombre_cupon')),
            'descripcion_cupon' => $request->filled('descripcion_cupon')
                ? trim((string) $request->input('descripcion_cupon'))
                : null,
            'tipo_descuento_cupon' => $request->input('tipo_descuento_cupon'),
            'valor_descuento_cupon' => round((float) $request->input('valor_descuento_cupon'), 2),
            'categoria_cupon' => $request->filled('categoria_cupon')
                ? trim((string) $request->input('categoria_cupon'))
                : null,
            'usos_maximos' => (int) $request->input('usos_maximos'),
            'fecha_inicio_cupon' => $request->filled('fecha_inicio_cupon')
                ? $request->input('fecha_inicio_cupon')
                : now()->toDateString(),
            'fecha_fin_cupon' => $request->filled('fecha_fin_cupon')
                ? $request->input('fecha_fin_cupon')
                : null,
            'estado_cupon' => $request->boolean('estado_cupon'),
        ];
    }

    private function resumenBienvenida(): array
    {
        $resumen = DB::table('auth.users')
            ->selectRaw("count(*) filter (
                where lower(coalesce(raw_user_meta_data->>'descuento_primera_compra', '')) in ('true', 't', '1')
                  and lower(coalesce(raw_user_meta_data->>'descuento_primera_compra_usado', '')) not in ('true', 't', '1')
            ) as disponibles")
            ->selectRaw("count(*) filter (
                where lower(coalesce(raw_user_meta_data->>'descuento_primera_compra_usado', '')) in ('true', 't', '1')
            ) as usados")
            ->first();

        return [
            'disponibles' => (int) ($resumen->disponibles ?? 0),
            'usados' => (int) ($resumen->usados ?? 0),
        ];
    }
}
