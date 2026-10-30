<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Cliente;

class ClienteController extends Controller
{

/*  ╔════════════ Crear Cliente ═════════════╗ 
    ╚════════════════════════════════════════╝ */

    public function CrearCliente(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_cliente' => $request->nombre_cliente,
                    'cedula_cliente' => $request->cedula_cliente,
                    'ruc_cliente' => $request->ruc_cliente,
                    'telefono_cliente' => $request->telefono_cliente,
                    'direccion_cliente' => $request->direccion_cliente,
                    'correo_cliente' => $request->correo_cliente,
                    'fecha_nacimiento_cliente' => $request->fecha_nacimiento_cliente,
                    'usuario_cliente' => $request->usuario_cliente,
                    'password_cliente' => $request->password_cliente,
                    'descuento_tipo_cliente' => $request->descuento_tipo_cliente,
                    'descuento_valor_cliente' => $request->descuento_valor_cliente,
                ],
                [
                    'nombre_cliente' => [
                        'required',
                        'max:150'
                    ],
                    'cedula_cliente' => [
                        'nullable',
                        'unique:clientes,cedula_cliente',
                        'max:16'
                    ],
                    'ruc_cliente' => [
                        'nullable',
                        'unique:clientes,ruc_cliente',
                        'max:20'
                    ],
                    'telefono_cliente' => [
                        'nullable',
                        'max:20'
                    ],
                    'direccion_cliente' => [
                        'nullable',
                        'max:200'
                    ],
                    'correo_cliente' => [
                        'nullable',
                        'email',
                        'max:100'
                    ],
                    'fecha_nacimiento_cliente' => [
                        'nullable',
                        'date',
                        'before:today'
                    ],
                    'usuario_cliente' => [
                        'nullable',
                        'alpha_dash',
                        'min:4',
                        'max:60',
                        'unique:clientes,usuario_cliente'
                    ],
                    'password_cliente' => [
                        'nullable',
                        'min:6'
                    ],
                    'descuento_tipo_cliente' => [
                        'nullable',
                        'in:porcentaje,monto'
                    ],
                    'descuento_valor_cliente' => [
                        'nullable',
                        'numeric',
                        'min:0'
                    ]
                ],
                [
                    'nombre_cliente.required' => 'El nombre del cliente es obligatorio.',
                    'nombre_cliente.max' => 'El nombre no puede exceder 150 caracteres.',

                    'cedula_cliente.unique' => 'Ya existe un cliente con esta cédula.',
                    'cedula_cliente.max' => 'La cédula no puede exceder 16 caracteres.',

                    'ruc_cliente.unique' => 'Ya existe un cliente con este RUC.',
                    'ruc_cliente.max' => 'El RUC no puede exceder 20 caracteres.',

                    'correo_cliente.email' => 'Debe ingresar un correo válido.',
                    'correo_cliente.max' => 'El correo no puede exceder 100 caracteres.',

                    'fecha_nacimiento_cliente.date' => 'La fecha de nacimiento no es válida.',
                    'fecha_nacimiento_cliente.before' => 'La fecha de nacimiento debe ser anterior a hoy.',

                    'usuario_cliente.unique' => 'Ya existe un cliente con ese usuario web.',
                    'usuario_cliente.alpha_dash' => 'El usuario web solo puede tener letras, números, guiones y guiones bajos.',
                    'usuario_cliente.min' => 'El usuario web debe tener al menos 4 caracteres.',
                    'usuario_cliente.max' => 'El usuario web no puede exceder 60 caracteres.',

                    'password_cliente.min' => 'La contraseña web debe tener al menos 6 caracteres.',

                    'descuento_tipo_cliente.in' => 'El tipo de descuento no es válido.',
                    'descuento_valor_cliente.numeric' => 'El descuento debe ser numérico.',
                    'descuento_valor_cliente.min' => 'El descuento no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Cliente::create([
                'nombre_cliente' => $request->nombre_cliente,
                'cedula_cliente' => $request->cedula_cliente,
                'ruc_cliente' => $request->ruc_cliente,
                'telefono_cliente' => $request->telefono_cliente,
                'fecha_nacimiento_cliente' => $request->filled('fecha_nacimiento_cliente') ? $request->fecha_nacimiento_cliente : null,
                'direccion_cliente' => $request->direccion_cliente,
                'correo_cliente' => $request->correo_cliente,
                'usuario_cliente' => $request->filled('usuario_cliente') ? trim($request->usuario_cliente) : null,
                'password_hash_cliente' => $request->filled('password_cliente') ? Hash::make($request->password_cliente) : null,
                'descuento_tipo_cliente' => $request->filled('descuento_tipo_cliente') ? $request->descuento_tipo_cliente : null,
                'descuento_valor_cliente' => $request->filled('descuento_valor_cliente') ? $request->descuento_valor_cliente : 0,
                'estado_cliente' => true
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Cliente creado correctamente'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear cliente',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔════════════ Editar Cliente ═════════════╗ 
    ╚═════════════════════════════════════════╝ */

    public function EditarCliente($id)
    {
        try {

            $cliente = Cliente::find($id);

            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cliente no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'cliente' => $cliente
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener cliente',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔═══════════ Actualizar Cliente ═══════════╗ 
    ╚══════════════════════════════════════════╝ */

    public function ActualizarCliente(Request $request, $id)
    {
        try {

            $cliente = Cliente::find($id);

            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cliente no encontrado'
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_cliente' => $request->nombre_cliente,
                    'cedula_cliente' => $request->cedula_cliente,
                    'ruc_cliente' => $request->ruc_cliente,
                    'telefono_cliente' => $request->telefono_cliente,
                    'direccion_cliente' => $request->direccion_cliente,
                    'correo_cliente' => $request->correo_cliente,
                    'estado_cliente' => $request->estado_cliente,
                    'fecha_nacimiento_cliente' => $request->fecha_nacimiento_cliente,
                    'usuario_cliente' => $request->usuario_cliente,
                    'password_cliente' => $request->password_cliente,
                    'descuento_tipo_cliente' => $request->descuento_tipo_cliente,
                    'descuento_valor_cliente' => $request->descuento_valor_cliente,
                ],
                [
                    'nombre_cliente' => [
                        'required',
                        'max:150'
                    ],
                    'cedula_cliente' => [
                        'nullable',
                        "unique:clientes,cedula_cliente,$id,id_cliente",
                        'max:16'
                    ],
                    'ruc_cliente' => [
                        'nullable',
                        "unique:clientes,ruc_cliente,$id,id_cliente",
                        'max:20'
                    ],
                    'telefono_cliente' => [
                        'nullable',
                        'max:20'
                    ],
                    'direccion_cliente' => [
                        'nullable',
                        'max:200'
                    ],
                    'correo_cliente' => [
                        'nullable',
                        'email',
                        'max:100'
                    ],
                    'estado_cliente' => [
                        'required',
                        'boolean'
                    ],
                    'fecha_nacimiento_cliente' => [
                        'nullable',
                        'date',
                        'before:today'
                    ],
                    'usuario_cliente' => [
                        'nullable',
                        'alpha_dash',
                        'min:4',
                        'max:60',
                        "unique:clientes,usuario_cliente,$id,id_cliente"
                    ],
                    'password_cliente' => [
                        'nullable',
                        'min:6'
                    ],
                    'descuento_tipo_cliente' => [
                        'nullable',
                        'in:porcentaje,monto'
                    ],
                    'descuento_valor_cliente' => [
                        'nullable',
                        'numeric',
                        'min:0'
                    ]
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $cliente->nombre_cliente = $request->nombre_cliente;
            $cliente->cedula_cliente = $request->cedula_cliente;
            $cliente->ruc_cliente = $request->ruc_cliente;
            $cliente->telefono_cliente = $request->telefono_cliente;
            $cliente->fecha_nacimiento_cliente = $request->filled('fecha_nacimiento_cliente') ? $request->fecha_nacimiento_cliente : null;
            $cliente->direccion_cliente = $request->direccion_cliente;
            $cliente->correo_cliente = $request->correo_cliente;
            $cliente->usuario_cliente = $request->filled('usuario_cliente') ? trim($request->usuario_cliente) : null;

            if ($request->filled('password_cliente')) {
                $cliente->password_hash_cliente = Hash::make($request->password_cliente);
            }

            $cliente->descuento_tipo_cliente = $request->filled('descuento_tipo_cliente') ? $request->descuento_tipo_cliente : null;
            $cliente->descuento_valor_cliente = $request->filled('descuento_valor_cliente') ? $request->descuento_valor_cliente : 0;
            $cliente->estado_cliente = $request->estado_cliente;

            $cliente->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Cliente actualizado correctamente'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar cliente',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔═══════════ Cambiar Estado Cliente ═════════╗ 
    ╚════════════════════════════════════════════╝ */

    public function CambiarEstadoCliente($id){
        try {

            $cliente = Cliente::find($id);

            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Cliente no encontrado'
                ], 404);
            }

            $cliente->estado_cliente = !$cliente->estado_cliente;
            $cliente->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del cliente actualizado'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del cliente',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔═══════════ Mostrar Clientes ════════════╗ 
    ╚═════════════════════════════════════════╝ */

    public function MostrarClientes(){
        try {

            $clientes = Cliente::all();

            return response()->json([
                'success' => true,
                'clientes' => $clientes
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener clientes',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

} // Fin de controlador
