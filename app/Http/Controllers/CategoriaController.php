<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoriaController extends Controller
{
    /*  ╔════════════ Crear Categoria ═════════════╗
        ╚══════════════════════════════════════════╝ */
    public function CrearCategoria(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_categoria' => $request->nombre_categoria,
                    'descripcion_categoria' => $request->descripcion_categoria,
                ],
                [
                    'nombre_categoria' => [
                        'required',
                        'unique:categoria,nombre_categoria',
                        'max:100',
                    ],
                    'descripcion_categoria' => [
                        'nullable',
                        'max:150',
                    ],
                ],
                [
                    'nombre_categoria.unique' => 'Ya existe una categoría con este nombre.',
                    'nombre_categoria.required' => 'El nombre de la categoría es obligatorio.',
                    'nombre_categoria.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_categoria.max' => 'La descripción no puede exceder 150 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Categoria::create([
                'nombre_categoria' => $request->nombre_categoria,
                'descripcion_categoria' => $request->descripcion_categoria,
                'estado_categoria' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Categoría creada correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear categoría',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Categoria ══════════════╗
        ╚═════════════════════════════════════════════╝ */

    public function EditarCategoria($id)
    {
        try {

            $categoria = Categoria::find($id);

            if (! $categoria) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Categoría no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'categoria' => $categoria,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener categoría',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Categoria ═══════════╗
        ╚════════════════════════════════════════════╝ */

    public function ActualizarCategoria(Request $request, $id)
    {
        try {

            $categoria = Categoria::find($id);

            if (! $categoria) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Categoría no encontrada',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_categoria' => $request->nombre_categoria,
                    'descripcion_categoria' => $request->descripcion_categoria,
                    'estado_categoria' => $request->estado_categoria,
                ],
                [
                    'nombre_categoria' => [
                        'required',
                        "unique:categoria,nombre_categoria,$id,id_categoria",
                        'max:100',
                    ],
                    'descripcion_categoria' => [
                        'nullable',
                        'max:150',
                    ],
                    'estado_categoria' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'nombre_categoria.unique' => 'Ya existe una categoría con este nombre.',
                    'nombre_categoria.required' => 'El nombre de la categoría es obligatorio.',
                    'nombre_categoria.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_categoria.max' => 'La descripción no puede exceder 150 caracteres.',
                    'estado_categoria.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $categoria->nombre_categoria = $request->nombre_categoria;
            $categoria->descripcion_categoria = $request->descripcion_categoria;
            $categoria->estado_categoria = $request->estado_categoria;
            $categoria->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Categoría actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar categoría',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar Estado Categoria ═════════╗
        ╚══════════════════════════════════════════════╝ */

    public function CambiarEstadoCategoria($id)
    {
        try {

            $categoria = Categoria::find($id);

            if (! $categoria) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Categoría no encontrada',
                ], 404);
            }

            $categoria->estado_categoria = ! $categoria->estado_categoria;
            $categoria->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la categoría actualizado',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado de la categoría',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Categorias ════════════╗
        ╚═══════════════════════════════════════════╝ */

    public function MostrarCategorias()
    {
        try {

            $categorias = Categoria::all();

            return response()->json([
                'success' => true,
                'categorias' => $categorias,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener categorías',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
}
