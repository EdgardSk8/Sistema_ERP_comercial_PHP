<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use App\Models\MetodoPago;
use App\Models\MetodoPagoCuenta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MetodoPagoCuentaController extends Controller
{
    public function CrearMetodoPagoCuenta(Request $request): JsonResponse
    {
        try {

            $validator = Validator::make(
                [
                    'id_metodo_pago' => $request->id_metodo_pago,
                    'id_cuenta' => $request->id_cuenta,
                ],
                [
                    'id_metodo_pago' => [
                        'required',
                        'exists:metodos_pago,id_metodo_pago',
                    ],
                    'id_cuenta' => [
                        'required',
                        'exists:cuentas,id_cuenta',
                    ],
                ]

            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $existe = MetodoPagoCuenta::where('id_metodo_pago', $request->id_metodo_pago)
                ->where('id_cuenta', $request->id_cuenta)
                ->exists();

            if ($existe) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'La relación ya existe',
                ], 422);
            }

            MetodoPagoCuenta::create([
                'id_metodo_pago' => $request->id_metodo_pago,
                'id_cuenta' => $request->id_cuenta,
                'estado' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Referencia creada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear referencia',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function EditarMetodoPagoCuenta(int|string $id): JsonResponse
    {
        try {

            $referencia = MetodoPagoCuenta::join(
                'metodos_pago',
                'metodo_pago_cuenta.id_metodo_pago',
                '=',
                'metodos_pago.id_metodo_pago'
            )
                ->where(
                    'metodo_pago_cuenta.id_metodo_pago_cuenta',
                    $id
                )
                ->select(
                    'metodo_pago_cuenta.id_metodo_pago_cuenta',
                    'metodo_pago_cuenta.id_metodo_pago',
                    'metodos_pago.nombre_metodo_pago'
                )
                ->first();

            if (! $referencia) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Referencia no encontrada',
                ], 404);
            }

            $cuentasVinculadas = MetodoPagoCuenta::join(
                'cuentas',
                'metodo_pago_cuenta.id_cuenta',
                '=',
                'cuentas.id_cuenta'
            )
                ->where(
                    'metodo_pago_cuenta.id_metodo_pago',
                    $referencia->id_metodo_pago
                )
                ->select(
                    'metodo_pago_cuenta.id_metodo_pago_cuenta',
                    'cuentas.id_cuenta',
                    'cuentas.nombre_cuenta'
                )
                ->get();

            return response()->json([
                'success' => true,
                'referencia' => $referencia,
                'cuentas_vinculadas' => $cuentasVinculadas,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener referencia',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }

    public function ActualizarMetodoPagoCuenta(Request $request, int|string $id): JsonResponse
    {
        try {

            $referencia = MetodoPagoCuenta::find($id);

            if (! $referencia) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Referencia no encontrada',
                ], 404);
            }

            // $validator = Validator::make($request->all(), [
            //     'id_metodo_pago' => 'required|exists:metodos_pago,id_metodo_pago',
            //     'id_cuenta'      => 'required|exists:cuentas,id_cuenta',
            //     'estado'         => 'required|in:0,1',
            // ]);

            // if ($validator->fails()) {
            //     return response()->json([
            //         'success' => false,
            //         'errors' => $validator->errors()
            //     ], 422);
            // }

            $existe = MetodoPagoCuenta::where('id_metodo_pago', $request->id_metodo_pago)
                ->where('id_cuenta', $request->id_cuenta)
                ->where('id_metodo_pago_cuenta', '!=', (int) $id)
                ->exists();

            if ($existe) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'La relación ya existe',
                ], 422);
            }

            MetodoPagoCuenta::whereIn(
                'id_metodo_pago_cuenta',
                $request->cuentas_eliminar
            )->delete();

            return response()->json([
                'success' => true,
                'mensaje' => 'Referencia actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar referencia',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function CambiarEstadoMetodoPagoCuenta(int|string $id): JsonResponse
    {
        try {

            $referencia = MetodoPagoCuenta::find($id);

            if (! $referencia) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Referencia no encontrada',
                ], 404);
            }

            $referencia->estado = ! $referencia->estado;
            $referencia->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    // MOSTRAR
    public function MostrarMetodoPagoCuenta(): JsonResponse
    {
        try {

            $referencias = DB::table('metodos_pago')
                ->leftJoin(
                    'metodo_pago_cuenta',
                    'metodos_pago.id_metodo_pago',
                    '=',
                    'metodo_pago_cuenta.id_metodo_pago'
                )
                ->leftJoin(
                    'cuentas',
                    'metodo_pago_cuenta.id_cuenta',
                    '=',
                    'cuentas.id_cuenta'
                )
                ->where('metodos_pago.id_metodo_pago', '!=', 1) // OCULTA METODO DE PAGO EFECTIVO
                ->select(
                    'metodos_pago.id_metodo_pago',
                    'metodos_pago.nombre_metodo_pago',
                    'metodo_pago_cuenta.id_metodo_pago_cuenta',
                    'metodo_pago_cuenta.estado',
                    'cuentas.nombre_cuenta'
                )
                ->get()
                ->groupBy('id_metodo_pago')
                ->map(function ($grupo) {

                    $cuentas = $grupo
                        ->pluck('nombre_cuenta')
                        ->filter()
                        ->values();

                    return [
                        'id_metodo_pago_cuenta' => $grupo->first()->id_metodo_pago_cuenta,
                        'id_metodo_pago' => $grupo->first()->id_metodo_pago,
                        'nombre_metodo_pago' => $grupo->first()->nombre_metodo_pago,
                        'estado' => $grupo->first()->estado,
                        'cuentas' => $cuentas,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'referencias' => $referencias,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener referencias',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function ObtenerDatosFormulario(): JsonResponse
    {
        try {

            $metodosPago = MetodoPago::select(
                'id_metodo_pago',
                'nombre_metodo_pago'
            )
                ->where('estado_metodo_pago', 1)
                ->where('metodos_pago.id_metodo_pago', '!=', 1) // OCULTA METODO DE PAGO EFECTIVO
                ->orderBy('nombre_metodo_pago')
                ->get();

            $cuentas = Cuenta::select(
                'id_cuenta',
                'nombre_cuenta'
            )
                ->where('estado', 1)
                ->orderBy('nombre_cuenta')
                ->get();

            return response()->json([
                'success' => true,
                'metodos_pago' => $metodosPago,
                'cuentas' => $cuentas,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al cargar datos',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }

    public function ObtenerCuentasMetodoPago(int|string $idMetodoPago): JsonResponse
    {
        try {

            $cuentas = MetodoPagoCuenta::join(
                'cuentas',
                'metodo_pago_cuenta.id_cuenta',
                '=',
                'cuentas.id_cuenta'
            )
                ->where('metodo_pago_cuenta.id_metodo_pago', $idMetodoPago)
                ->where('metodo_pago_cuenta.estado', 1)
                ->select(
                    'cuentas.id_cuenta',
                    'cuentas.nombre_cuenta'
                )
                ->orderBy('cuentas.nombre_cuenta')
                ->get();

            return response()->json([
                'success' => true,
                'cuentas' => $cuentas,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener cuentas',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }
}
