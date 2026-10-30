<?php

namespace App\Http\Controllers;

use App\Models\Talla;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TallaController extends Controller
{
    public function MostrarTalla(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'buscar' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'boolean'],
            'id_tipo_talla' => ['nullable', 'integer', 'exists:tipos_talla,id_tipo_talla'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Los filtros enviados no son válidos.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $query = Talla::with('tipoTalla')
                ->withCount('variaciones')
                ->withCount(['variaciones as variantes_con_stock_count' => function ($variantes) {
                    $variantes->where('stock', '>', 0);
                }]);

            if ($request->filled('buscar')) {
                $buscar = trim($request->input('buscar'));
                $query->where('talla', 'like', '%' . $buscar . '%');
            }

            if ($request->has('estado')) {
                $query->where('estado_talla', $request->boolean('estado'));
            }

            if ($request->filled('id_tipo_talla')) {
                $query->where('id_tipo_talla', (int) $request->input('id_tipo_talla'));
            }

            $tallas = $query
                ->orderBy('id_tipo_talla')
                ->orderByRaw('orden_talla asc nulls last')
                ->orderBy('talla')
                ->get();

            return response()->json([
                'success' => true,
                'total' => $tallas->count(),
                'tallas' => $tallas,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener las tallas.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function CrearTalla(Request $request)
    {
        $request->merge(['talla' => trim((string) $request->input('talla'))]);

        $validator = Validator::make($request->all(), [
            'talla' => [
                'required', 'string', 'max:20',
                Rule::unique('tallas', 'talla')->where(function ($consulta) use ($request) {
                    return $consulta->where('id_tipo_talla', $request->input('id_tipo_talla'));
                }),
            ],
            'id_tipo_talla' => ['required', 'integer', 'exists:tipos_talla,id_tipo_talla'],
            'estado_talla' => ['nullable', 'boolean'],
        ], [
            'talla.required' => 'El nombre de la talla es obligatorio.',
            'talla.max' => 'La talla no puede exceder 20 caracteres.',
            'talla.unique' => 'Ya existe esa talla en el tipo seleccionado.',
            'id_tipo_talla.required' => 'Selecciona el tipo de talla.',
            'id_tipo_talla.exists' => 'El tipo de talla seleccionado no existe.',
            'estado_talla.boolean' => 'El estado de la talla no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear la talla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $talla = Talla::create([
                'talla' => $request->input('talla'),
                'id_tipo_talla' => (int) $request->input('id_tipo_talla'),
                'estado_talla' => $request->has('estado_talla')
                    ? $request->boolean('estado_talla')
                    : true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla creada correctamente.',
                'talla' => $talla,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al crear la talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function EditarTalla($id)
    {
        $talla = Talla::with('tipoTalla')
            ->withCount('variaciones')
            ->withCount(['variaciones as variantes_con_stock_count' => function ($variantes) {
                $variantes->where('stock', '>', 0);
            }])->find($id);

        if (!$talla) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Talla no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'talla' => $talla,
        ]);
    }

    public function ActualizarTalla(Request $request, $id)
    {
        $talla = Talla::find($id);

        if (!$talla) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Talla no encontrada.',
            ], 404);
        }

        $request->merge(['talla' => trim((string) $request->input('talla'))]);

        $validator = Validator::make($request->all(), [
            'talla' => [
                'required', 'string', 'max:20',
                Rule::unique('tallas', 'talla')
                    ->where(function ($consulta) use ($request) {
                        return $consulta->where('id_tipo_talla', $request->input('id_tipo_talla'));
                    })
                    ->ignore($talla->id_talla, 'id_talla'),
            ],
            'id_tipo_talla' => ['required', 'integer', 'exists:tipos_talla,id_tipo_talla'],
            'estado_talla' => ['required', 'boolean'],
        ], [
            'talla.required' => 'El nombre de la talla es obligatorio.',
            'talla.max' => 'La talla no puede exceder 20 caracteres.',
            'talla.unique' => 'Ya existe esa talla en el tipo seleccionado.',
            'id_tipo_talla.required' => 'Selecciona el tipo de talla.',
            'id_tipo_talla.exists' => 'El tipo de talla seleccionado no existe.',
            'estado_talla.required' => 'El estado de la talla es obligatorio.',
            'estado_talla.boolean' => 'El estado de la talla no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar la talla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!$request->boolean('estado_talla') && $this->tieneStockAsignado($talla)) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se puede desactivar esta talla porque tiene existencias en una o más variantes.',
            ], 409);
        }

        try {
            $talla->update([
                'talla' => $request->input('talla'),
                'id_tipo_talla' => (int) $request->input('id_tipo_talla'),
                'estado_talla' => $request->boolean('estado_talla'),
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla actualizada correctamente.',
                'talla' => $talla->fresh()->loadCount('variaciones')->loadCount([
                    'variaciones as variantes_con_stock_count' => function ($variantes) {
                        $variantes->where('stock', '>', 0);
                    }
                ]),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al actualizar la talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function CambiarEstadoTalla($id)
    {
        $talla = Talla::find($id);

        if (!$talla) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Talla no encontrada.',
            ], 404);
        }

        if ($talla->estado_talla && $this->tieneStockAsignado($talla)) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se puede desactivar esta talla porque tiene existencias en una o más variantes.',
            ], 409);
        }

        try {
            $talla->estado_talla = !$talla->estado_talla;
            $talla->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la talla actualizado correctamente.',
                'estado_talla' => (bool) $talla->estado_talla,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al cambiar el estado de la talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function EliminarTalla($id)
    {
        $talla = Talla::withCount('variaciones')->find($id);

        if (!$talla) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Talla no encontrada.',
            ], 404);
        }

        if ($talla->variaciones_count > 0) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Esta talla está vinculada a variantes y no se puede eliminar. Puedes desactivarla cuando deje de utilizarse.',
            ], 409);
        }

        try {
            $talla->delete();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla eliminada correctamente.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al eliminar la talla.',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    private function tieneStockAsignado(Talla $talla): bool
    {
        return $talla->variaciones()->where('stock', '>', 0)->exists();
    }
}
