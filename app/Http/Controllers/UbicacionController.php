<?php

namespace App\Http\Controllers;

use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UbicacionController extends Controller
{
    public function MostrarUbicaciones()
    {
        try {
            return response()->json([
                'success' => true,
                'ubicaciones' => Ubicacion::orderBy('nombre_ubicacion')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener las ubicaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function CrearUbicacion(Request $request)
    {
        $validator = Validator::make(
            $request->only(['nombre_ubicacion', 'descripcion_ubicacion']),
            [
                'nombre_ubicacion' => ['required', 'string', 'max:100', 'unique:ubicaciones,nombre_ubicacion'],
                'descripcion_ubicacion' => ['nullable', 'string', 'max:150']
            ],
            [
                'nombre_ubicacion.required' => 'El nombre de la ubicación es obligatorio.',
                'nombre_ubicacion.unique' => 'Ya existe una ubicación con ese nombre.',
                'nombre_ubicacion.max' => 'El nombre no puede exceder 100 caracteres.',
                'descripcion_ubicacion.max' => 'La descripción no puede exceder 150 caracteres.'
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Ubicacion::create([
                'nombre_ubicacion' => $validator->validated()['nombre_ubicacion'],
                'descripcion_ubicacion' => $validator->validated()['descripcion_ubicacion'] ?? null,
                'estado_ubicacion' => true
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Ubicación creada correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear la ubicación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function EditarUbicacion(int|string $id)
    {
        $ubicacion = Ubicacion::find($id);

        if (!$ubicacion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Ubicación no encontrada.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'ubicacion' => $ubicacion
        ]);
    }

    public function ActualizarUbicacion(Request $request, int|string $id)
    {
        $ubicacion = Ubicacion::find($id);

        if (!$ubicacion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Ubicación no encontrada.'
            ], 404);
        }

        $validator = Validator::make(
            $request->only(['nombre_ubicacion', 'descripcion_ubicacion']),
            [
                'nombre_ubicacion' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('ubicaciones', 'nombre_ubicacion')->ignore($ubicacion->id_ubicacion, 'id_ubicacion')
                ],
                'descripcion_ubicacion' => ['nullable', 'string', 'max:150']
            ],
            [
                'nombre_ubicacion.required' => 'El nombre de la ubicación es obligatorio.',
                'nombre_ubicacion.unique' => 'Ya existe una ubicación con ese nombre.',
                'nombre_ubicacion.max' => 'El nombre no puede exceder 100 caracteres.',
                'descripcion_ubicacion.max' => 'La descripción no puede exceder 150 caracteres.'
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $datos = $validator->validated();
            $ubicacion->nombre_ubicacion = $datos['nombre_ubicacion'];
            $ubicacion->descripcion_ubicacion = $datos['descripcion_ubicacion'] ?? null;
            $ubicacion->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Ubicación actualizada correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar la ubicación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function CambiarEstadoUbicacion(int|string $id)
    {
        $ubicacion = Ubicacion::find($id);

        if (!$ubicacion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Ubicación no encontrada.'
            ], 404);
        }

        try {
            $ubicacion->estado_ubicacion = !$ubicacion->estado_ubicacion;
            $ubicacion->save();

            return response()->json([
                'success' => true,
                'estado_ubicacion' => $ubicacion->estado_ubicacion,
                'mensaje' => $ubicacion->estado_ubicacion
                    ? 'Ubicación reactivada correctamente.'
                    : 'Ubicación dada de baja correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar el estado de la ubicación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}