<?php

namespace App\Http\Controllers;

use App\Models\TipoTalla;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TipoTallaController extends Controller
{
    /*  ╔═════════════ Mostrar tipos de talla ══════════════╗
        ╚═══════════════════════════════════════════════════╝ */

    public function MostrarTipoTalla(Request $request)
    {
        try {
            $query = TipoTalla::withCount('tallas');

            if ($request->has('estado')) {
                $query->where('estado_tipo_talla', $request->boolean('estado'));
            }

            $tipos = $query->orderBy('nombre_tipo_talla')->get();

            return response()->json([
                'success' => true,
                'total' => $tipos->count(),
                'tipos' => $tipos,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener los tipos de talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Crear tipo de talla ══════════════╗
        ╚════════════════════════════════════════════════╝ */

    public function CrearTipoTalla(Request $request)
    {
        $request->merge([
            'nombre_tipo_talla' => trim((string) $request->input('nombre_tipo_talla')),
            'descripcion_tipo_talla' => trim((string) $request->input('descripcion_tipo_talla')),
        ]);

        $validator = Validator::make($request->all(), [
            'nombre_tipo_talla' => ['required', 'string', 'max:60', 'unique:tipos_talla,nombre_tipo_talla'],
            'descripcion_tipo_talla' => ['nullable', 'string', 'max:150'],
            'estado_tipo_talla' => ['nullable', 'boolean'],
        ], [
            'nombre_tipo_talla.required' => 'El nombre del tipo de talla es obligatorio.',
            'nombre_tipo_talla.max' => 'El nombre no puede exceder 60 caracteres.',
            'nombre_tipo_talla.unique' => 'Ya existe un tipo de talla con ese nombre.',
            'descripcion_tipo_talla.max' => 'La descripción no puede exceder 150 caracteres.',
            'estado_tipo_talla.boolean' => 'El estado del tipo de talla no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear el tipo de talla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $tipo = TipoTalla::create([
                'nombre_tipo_talla' => $request->input('nombre_tipo_talla'),
                'descripcion_tipo_talla' => $request->input('descripcion_tipo_talla') ?: null,
                'estado_tipo_talla' => $request->has('estado_tipo_talla')
                    ? $request->boolean('estado_tipo_talla')
                    : true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Tipo de talla creado correctamente.',
                'tipo' => $tipo->loadCount('tallas'),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al crear el tipo de talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Consultar tipo de talla ══════════════╗
        ╚════════════════════════════════════════════════════╝ */

    public function EditarTipoTalla($id)
    {
        $tipo = TipoTalla::withCount('tallas')->find($id);

        if (! $tipo) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Tipo de talla no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'tipo' => $tipo,
        ]);
    }

    /*  ╔═════════════ Actualizar tipo de talla ══════════════╗
        ╚═════════════════════════════════════════════════════╝ */

    public function ActualizarTipoTalla(Request $request, $id)
    {
        $tipo = TipoTalla::find($id);

        if (! $tipo) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Tipo de talla no encontrado.',
            ], 404);
        }

        $request->merge([
            'nombre_tipo_talla' => trim((string) $request->input('nombre_tipo_talla')),
            'descripcion_tipo_talla' => trim((string) $request->input('descripcion_tipo_talla')),
        ]);

        $validator = Validator::make($request->all(), [
            'nombre_tipo_talla' => [
                'required', 'string', 'max:60',
                'unique:tipos_talla,nombre_tipo_talla,' . $tipo->id_tipo_talla . ',id_tipo_talla',
            ],
            'descripcion_tipo_talla' => ['nullable', 'string', 'max:150'],
            'estado_tipo_talla' => ['required', 'boolean'],
        ], [
            'nombre_tipo_talla.required' => 'El nombre del tipo de talla es obligatorio.',
            'nombre_tipo_talla.max' => 'El nombre no puede exceder 60 caracteres.',
            'nombre_tipo_talla.unique' => 'Ya existe un tipo de talla con ese nombre.',
            'descripcion_tipo_talla.max' => 'La descripción no puede exceder 150 caracteres.',
            'estado_tipo_talla.required' => 'El estado del tipo de talla es obligatorio.',
            'estado_tipo_talla.boolean' => 'El estado del tipo de talla no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar el tipo de talla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $tipo->update([
                'nombre_tipo_talla' => $request->input('nombre_tipo_talla'),
                'descripcion_tipo_talla' => $request->input('descripcion_tipo_talla') ?: null,
                'estado_tipo_talla' => $request->boolean('estado_tipo_talla'),
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Tipo de talla actualizado correctamente.',
                'tipo' => $tipo->fresh()->loadCount('tallas'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al actualizar el tipo de talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Cambiar estado ══════════════╗
        ╚═══════════════════════════════════════════╝ */

    public function CambiarEstadoTipoTalla($id)
    {
        $tipo = TipoTalla::withCount('tallas')->find($id);

        if (! $tipo) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Tipo de talla no encontrado.',
            ], 404);
        }

        if ($tipo->estado_tipo_talla && $tipo->tallas_count > 0) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se puede desactivar este tipo porque tiene tallas asignadas.',
            ], 409);
        }

        try {
            $tipo->estado_tipo_talla = ! $tipo->estado_tipo_talla;
            $tipo->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del tipo de talla actualizado correctamente.',
                'estado_tipo_talla' => (bool) $tipo->estado_tipo_talla,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al cambiar el estado del tipo de talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
