<?php

namespace App\Http\Controllers;

use App\Models\Medida;
use App\Models\TipoMedida;
use App\Support\Busqueda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedidasController extends Controller
{
    /* ══════════ MOSTRAR MEDIDAS ══════════ */
    public function MostrarMedidas()
    {
        try {

            $medidas = Medida::with('tipomedida')->get();

            return response()->json([
                'success' => true,
                'medidas' => $medidas,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener las medidas',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ CREAR MEDIDA ══════════ */
    public function CrearMedida(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'id_tipo_medida' => $request->id_tipo_medida,
                    'nombre_medida' => $request->nombre_medida,
                    'abreviatura_medida' => $request->abreviatura_medida,
                    'orden_medida' => $request->orden_medida,
                ],
                [
                    'id_tipo_medida' => ['required', 'exists:tipos_medidas,id_tipo_medida'],
                    'nombre_medida' => ['required', 'unique:medidas,nombre_medida', 'max:100'],
                    'abreviatura_medida' => ['required', 'unique:medidas,abreviatura_medida', 'max:20'],
                    'orden_medida' => ['required', 'integer', 'min:1'],
                ],
                [
                    'id_tipo_medida.required' => 'Debe seleccionar un tipo de medida.',
                    'id_tipo_medida.exists' => 'El tipo de medida seleccionado no existe.',

                    'nombre_medida.required' => 'El nombre de la medida es obligatorio.',
                    'nombre_medida.unique' => 'Ya existe una medida con este nombre.',
                    'nombre_medida.max' => 'El nombre no puede exceder 100 caracteres.',

                    'abreviatura_medida.required' => 'La abreviatura es obligatoria.',
                    'abreviatura_medida.unique' => 'Ya existe una medida con esta abreviatura.',
                    'abreviatura_medida.max' => 'La abreviatura no puede exceder 20 caracteres.',

                    'orden_medida.required' => 'El orden es obligatorio.',
                    'orden_medida.integer' => 'El orden debe ser un número entero.',
                    'orden_medida.min' => 'El orden debe ser mayor a cero.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Medida::create([
                'id_tipo_medida' => $request->id_tipo_medida,
                'nombre_medida' => $request->nombre_medida,
                'abreviatura_medida' => $request->abreviatura_medida,
                'orden_medida' => $request->orden_medida,
                'estado_medida' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Medida creada correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear la medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ EDITAR MEDIDA ══════════ */
    public function EditarMedida($id)
    {
        try {

            $medida = Medida::with('tipomedida')->find($id);

            if (! $medida) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Medida no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'medida' => $medida,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener la medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ ACTUALIZAR MEDIDA ══════════ */
    public function ActualizarMedida(Request $request, $id)
    {
        try {

            $medida = Medida::find($id);

            if (! $medida) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Medida no encontrada',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'id_tipo_medida' => $request->id_tipo_medida,
                    'nombre_medida' => $request->nombre_medida,
                    'abreviatura_medida' => $request->abreviatura_medida,
                    'orden_medida' => $request->orden_medida,
                    'estado_medida' => $request->estado_medida,
                ],
                [
                    'id_tipo_medida' => ['required', 'exists:tipos_medidas,id_tipo_medida'],

                    'nombre_medida' => [
                        'required',
                        "unique:medidas,nombre_medida,$id,id_medida",
                        'max:100',
                    ],

                    'abreviatura_medida' => [
                        'required',
                        "unique:medidas,abreviatura_medida,$id,id_medida",
                        'max:20',
                    ],

                    'orden_medida' => ['required', 'integer', 'min:1'],
                    'estado_medida' => ['required', 'boolean'],
                ],
                [
                    'id_tipo_medida.required' => 'Debe seleccionar un tipo de medida.',
                    'id_tipo_medida.exists' => 'El tipo de medida seleccionado no existe.',

                    'nombre_medida.required' => 'El nombre de la medida es obligatorio.',
                    'nombre_medida.unique' => 'Ya existe una medida con este nombre.',
                    'nombre_medida.max' => 'El nombre no puede exceder 100 caracteres.',

                    'abreviatura_medida.required' => 'La abreviatura es obligatoria.',
                    'abreviatura_medida.unique' => 'Ya existe una medida con esta abreviatura.',
                    'abreviatura_medida.max' => 'La abreviatura no puede exceder 20 caracteres.',

                    'orden_medida.required' => 'El orden es obligatorio.',
                    'orden_medida.integer' => 'El orden debe ser un número entero.',
                    'orden_medida.min' => 'El orden debe ser mayor a cero.',

                    'estado_medida.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $medida->id_tipo_medida = $request->id_tipo_medida;
            $medida->nombre_medida = $request->nombre_medida;
            $medida->abreviatura_medida = $request->abreviatura_medida;
            $medida->orden_medida = $request->orden_medida;
            $medida->estado_medida = $request->estado_medida;
            $medida->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Medida actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar la medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /* ══════════ CAMBIAR ESTADO DE MEDIDA ══════════ */
    public function CambiarEstadoMedida($id)
    {
        try {

            $medida = Medida::find($id);

            if (! $medida) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Medida no encontrada',
                ], 404);
            }

            $medida->estado_medida = ! $medida->estado_medida;
            $medida->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la medida actualizado',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar el estado de la medida',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarTiposMedidas(Request $request)
    {
        $buscar = $request->input('term');

        $tipos = TipoMedida::where('estado_tipo_medida', 1)

            ->when($buscar, function ($query) use ($buscar) {
                Busqueda::aplicarLike($query, 'nombre_tipo_medida', (string) $buscar);
            })

            ->orderBy('nombre_tipo_medida')

            ->limit(20)

            ->get();

        return response()->json([

            'results' => $tipos->map(function ($tipo) {

                return [

                    'id' => $tipo->id_tipo_medida,

                    'text' => $tipo->nombre_tipo_medida,

                ];

            }),

        ]);

    }
}
