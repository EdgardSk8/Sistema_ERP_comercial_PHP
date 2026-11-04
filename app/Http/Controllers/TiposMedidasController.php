<?php

namespace App\Http\Controllers;

use App\Models\TipoMedida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TiposMedidasController extends Controller
{
    /* ══════════ MOSTRAR TIPOS DE MEDIDAS ══════════ */
    public function MostrarTiposMedidas()
    {
        try {

            $tiposMedidas = TipoMedida::all();

            return response()->json(['success' => true, 'tipos_medidas' => $tiposMedidas], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los tipos de medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ CREAR TIPOS DE MEDIDAS ══════════ */
    public function CrearTipoMedida(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_tipo_medida' => $request->nombre_tipo_medida,
                    'descripcion_tipo_medida' => $request->descripcion_tipo_medida,
                ],
                [
                    'nombre_tipo_medida' => ['required', 'unique:tipos_medidas,nombre_tipo_medida', 'max:100'],
                    'descripcion_tipo_medida' => ['nullable', 'max:255'],
                ],
                [
                    'nombre_tipo_medida.required' => 'El nombre del tipo de medida es obligatorio.',
                    'nombre_tipo_medida.unique' => 'Ya existe un tipo de medida con este nombre.',
                    'nombre_tipo_medida.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_tipo_medida.max' => 'La descripción no puede exceder 255 caracteres.',
                ]
            );

            /* VALIDACION DE DATOS */
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            /* CREACION DEL REGISTRO */
            TipoMedida::create([
                'nombre_tipo_medida' => $request->nombre_tipo_medida,
                'descripcion_tipo_medida' => $request->descripcion_tipo_medida,
                'estado_tipo_medida' => true,
            ]);

            /* MENSAJE DE EXITO */
            return response()->json(['success' => true, 'mensaje' => 'Tipo de medida creado correctamente'], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear tipo de medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ EDITAR TIPOS DE MEDIDAS ══════════ */
    public function EditarTipoMedida($id)
    {
        try {

            $tipoMedida = TipoMedida::find($id);

            if (! $tipoMedida) {
                return response()->json(['success' => false, 'mensaje' => 'Tipo de medida no encontrado'], 404);
            }

            return response()->json(['success' => true, 'tipo_medida' => $tipoMedida], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener el tipo de medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ACTUALIZAR TIPOS DE MEDIDAS */
    public function ActualizarTipoMedida(Request $request, $id)
    {
        try {

            $tipoMedida = TipoMedida::find($id);
            if (! $tipoMedida) {
                return response()->json(['success' => false, 'mensaje' => 'Tipo de medida no encontrado'], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_tipo_medida' => $request->nombre_tipo_medida,
                    'descripcion_tipo_medida' => $request->descripcion_tipo_medida,
                    'estado_tipo_medida' => $request->estado_tipo_medida,
                ],
                [
                    'nombre_tipo_medida' => ['required', "unique:tipos_medidas,nombre_tipo_medida,$id,id_tipo_medida", 'max:100'],
                    'descripcion_tipo_medida' => ['nullable', 'max:255'],
                    'estado_tipo_medida' => ['required', 'boolean'],
                ],
                [
                    'nombre_tipo_medida.required' => 'El nombre del tipo de medida es obligatorio.',
                    'nombre_tipo_medida.unique' => 'Ya existe un tipo de medida con este nombre.',
                    'nombre_tipo_medida.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_tipo_medida.max' => 'La descripción no puede exceder 255 caracteres.',
                    'estado_tipo_medida.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $tipoMedida->nombre_tipo_medida = $request->nombre_tipo_medida;
            $tipoMedida->descripcion_tipo_medida = $request->descripcion_tipo_medida;
            $tipoMedida->estado_tipo_medida = $request->estado_tipo_medida;
            $tipoMedida->save();

            return response()->json(['success' => true, 'mensaje' => 'Tipo de medida actualizado correctamente'], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar tipo de medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* CAMBIAR ESTADO DE TIPO DE MEDIDA */
    public function CambiarEstadoTipoMedida($id)
    {
        try {

            $tipoMedida = TipoMedida::find($id);
            if (! $tipoMedida) {
                return response()->json(['success' => false, 'mensaje' => 'Tipo de medida no encontrado'], 404);
            }

            $tipoMedida->estado_tipo_medida = ! $tipoMedida->estado_tipo_medida;
            $tipoMedida->save();

            return response()->json(['success' => true, 'mensaje' => 'Estado del tipo de medida actualizado'], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar el estado del tipo de medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
