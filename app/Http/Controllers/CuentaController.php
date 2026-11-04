<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use App\Models\MovimientoCuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CuentaController extends Controller
{
    /*  ╔═════════════ Crear Cuenta ══════════════╗
        ╚═════════════════════════════════════════╝ */

    public function CrearCuenta(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_cuenta' => $request->nombre_cuenta,
                    'tipo_cuenta' => $request->tipo_cuenta,
                    'descripcion' => $request->descripcion,
                    'saldo_actual' => $request->saldo_actual,
                ],
                [
                    'nombre_cuenta' => [
                        'required',
                        'unique:cuentas,nombre_cuenta',
                        'max:100',
                    ],
                    'tipo_cuenta' => [
                        'required',
                        'max:50',
                    ],
                    'descripcion' => [
                        'nullable',
                        'max:150',
                    ],
                    'saldo_actual' => [
                        'required',
                        'numeric',
                        'min:0',
                    ],
                ],
                [
                    'nombre_cuenta.required' => 'El nombre de la cuenta es obligatorio.',
                    'nombre_cuenta.unique' => 'Ya existe una cuenta con ese nombre.',
                    'saldo_actual.numeric' => 'El saldo debe ser numérico.',
                    'saldo_actual.min' => 'El saldo no puede ser negativo.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Cuenta::create([
                'nombre_cuenta' => $request->nombre_cuenta,
                'tipo_cuenta' => $request->tipo_cuenta,
                'descripcion' => $request->descripcion,
                'saldo_actual' => $request->saldo_actual,
                'estado' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Cuenta creada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear cuenta',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Cuenta ══════════════╗
        ╚══════════════════════════════════════════╝ */

    public function EditarCuenta($id)
    {
        try {

            $cuenta = Cuenta::find($id);

            if (! $cuenta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cuenta no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'cuenta' => $cuenta,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener cuenta',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Cuenta ═══════════╗
        ╚═════════════════════════════════════════╝ */

    public function ActualizarCuenta(Request $request, $id)
    {
        try {

            $cuenta = Cuenta::find($id);

            if (! $cuenta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cuenta no encontrada',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_cuenta' => $request->nombre_cuenta,
                    'tipo_cuenta' => $request->tipo_cuenta,
                    'descripcion' => $request->descripcion,
                    'saldo_actual' => $request->saldo_actual,
                    'estado' => $request->estado,
                ],
                [
                    'nombre_cuenta' => [
                        'required',
                        "unique:cuentas,nombre_cuenta,$id,id_cuenta",
                        'max:100',
                    ],
                    'tipo_cuenta' => [
                        'required',
                        'max:50',
                    ],
                    'descripcion' => [
                        'nullable',
                        'max:150',
                    ],
                    'saldo_actual' => [
                        'required',
                        'numeric',
                        'min:0',
                    ],
                    'estado' => [
                        'required',
                        'boolean',
                    ],
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $cuenta->nombre_cuenta = $request->nombre_cuenta;
            $cuenta->tipo_cuenta = $request->tipo_cuenta;
            $cuenta->descripcion = $request->descripcion;
            // $cuenta->saldo_actual = $request->saldo_actual;
            $cuenta->estado = $request->estado;
            $cuenta->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Cuenta actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar cuenta',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar Estado Cuenta ═════════╗
        ╚═══════════════════════════════════════════╝ */

    public function CambiarEstadoCuenta($id)
    {
        try {

            $cuenta = Cuenta::find($id);

            if (! $cuenta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cuenta no encontrada',
                ], 404);
            }

            $cuenta->estado = ! $cuenta->estado;
            $cuenta->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la cuenta actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Cuentas ════════════╗
        ╚════════════════════════════════════════╝ */
    public function MostrarCuentas()
    {
        try {

            $cuentas = Cuenta::all();

            return response()->json([
                'success' => true,
                'cuentas' => $cuentas,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener cuentas',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Transferir Entre Cuentas ═══════════╗
        ╚════════════════════════════════════════════════╝ */

    public function TransferirEntreCuentas(Request $request)
    {
        try {

            $validator = Validator::make(
                $request->all(),
                [
                    'cuenta_origen' => [
                        'required',
                        'exists:cuentas,id_cuenta',
                    ],
                    'cuenta_destino' => [
                        'required',
                        'exists:cuentas,id_cuenta',
                        'different:cuenta_origen',
                    ],
                    'monto' => [
                        'required',
                        'numeric',
                        'min:0.01',
                    ],
                    'descripcion' => [
                        'nullable',
                        'max:255',
                    ],
                ],
                [
                    'cuenta_destino.different' => 'No puedes transferir a la misma cuenta.',
                    'monto.min' => 'El monto debe ser mayor a 0.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            \DB::beginTransaction();

            $monto = (float) $request->monto;
            $idUsuario = session('usuario.id');

            $cuentaOrigen = Cuenta::where('id_cuenta', $request->cuenta_origen)
                ->lockForUpdate()
                ->first();

            $cuentaDestino = Cuenta::where('id_cuenta', $request->cuenta_destino)
                ->lockForUpdate()
                ->first();

            if (! $cuentaOrigen || ! $cuentaDestino) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cuenta no encontrada',
                ], 404);
            }

            if (! $cuentaOrigen->estado || ! $cuentaDestino->estado) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Una de las cuentas está inactiva',
                ], 400);
            }

            if ($cuentaOrigen->saldo_actual < $monto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Saldo insuficiente en la cuenta origen',
                ], 400);
            }

            $descripcion = $request->descripcion
                ? $request->descripcion
                : "Transferencia de {$cuentaOrigen->nombre_cuenta} a {$cuentaDestino->nombre_cuenta}";

            $fecha = now();

            /* ═════════════ ACTUALIZAR SALDOS ═════════════ */

            $cuentaOrigen->saldo_actual -= $monto;
            $cuentaOrigen->save();

            $cuentaDestino->saldo_actual += $monto;
            $cuentaDestino->save();

            /* ═════════════ MOVIMIENTOS ═════════════ */

            MovimientoCuenta::create([
                'id_cuenta' => $cuentaOrigen->id_cuenta,
                'tipo_movimiento' => 'SALIDA',
                'descripcion' => $descripcion,
                'monto' => $monto,
                'fecha' => $fecha,
                'id_usuario' => $idUsuario,
            ]);

            MovimientoCuenta::create([
                'id_cuenta' => $cuentaDestino->id_cuenta,
                'tipo_movimiento' => 'INGRESO',
                'descripcion' => $descripcion,
                'monto' => $monto,
                'fecha' => $fecha,
                'id_usuario' => $idUsuario,
            ]);

            \DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Transferencia realizada correctamente',
            ], 200);

        } catch (\Exception $e) {

            \DB::rollBack();

            \Log::error('Error en transferencia entre cuentas: '.$e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al transferir entre cuentas',
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Cuentas Selector ═══════════╗
        ╚════════════════════════════════════════════════╝ */

    public function MostrarCuentasSelector()
    {
        try {
            // Trae solo las cuentas activas
            $cuentas = Cuenta::where('estado', 1)
                ->orderBy('nombre_cuenta', 'asc')
                ->get();

            // Formatea los datos para el <select>
            $data = $cuentas->map(function ($cuenta) {
                return [
                    'id' => $cuenta->id_cuenta, // valor real que se envía al backend
                    'nombre' => $cuenta->nombre_cuenta,
                    'saldo_actual' => $cuenta->saldo_actual,
                    'display' => "{$cuenta->nombre_cuenta} (Saldo: C$ ".number_format($cuenta->saldo_actual, 2).')',
                ];
            });

            return response()->json([
                'success' => true,
                'cuentas' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener cuentas',
            ], 500);
        }
    }

    public function MovimientoCuenta(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'id_cuenta' => 'required|exists:cuentas,id_cuenta',
                'tipo_movimiento' => 'required|in:AGREGAR,RETIRAR',
                'monto' => 'required|numeric|min:0.01',
                'descripcion' => 'nullable|max:150',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $idUsuario = session('usuario.id');

            if (! $idUsuario) {
                throw new \Exception('Sesión no válida');
            }

            $resultado = DB::transaction(function () use ($request, $idUsuario) {

                $cuenta = Cuenta::lockForUpdate()->find($request->id_cuenta);

                if (! $cuenta) {
                    throw new \Exception('Cuenta no encontrada', 404);
                }

                $monto = (float) $request->monto;

                if ($request->tipo_movimiento === 'RETIRAR' && $monto > $cuenta->saldo_actual) {
                    throw new \Exception('Saldo insuficiente', 400);
                }

                $tipoReal = $request->tipo_movimiento === 'AGREGAR'
                    ? 'INGRESO'
                    : 'SALIDA';

                $descripcion = trim($request->descripcion);

                if (! $descripcion) {
                    $descripcion = $tipoReal === 'INGRESO'
                        ? 'Ingreso de dinero'
                        : 'Salida de dinero';
                }

                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => $tipoReal,
                    'descripcion' => $descripcion,
                    'monto' => $monto,
                    'fecha' => now(),
                    'id_usuario' => $idUsuario,
                    'id_transferencia' => null,
                ]);

                if ($tipoReal === 'INGRESO') {
                    $cuenta->saldo_actual += $monto;
                } else {
                    $cuenta->saldo_actual -= $monto;
                }

                $cuenta->save();

                return [
                    'success' => true,
                    'mensaje' => 'Movimiento realizado correctamente',
                    'saldo_actual' => $cuenta->saldo_actual,
                ];
            });

            return response()->json($resultado, 200);

        } catch (\Exception $e) {

            $code = $e->getCode();
            $status = ($code >= 400 && $code < 600) ? $code : 500;

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], $status);
        }
    }
}
