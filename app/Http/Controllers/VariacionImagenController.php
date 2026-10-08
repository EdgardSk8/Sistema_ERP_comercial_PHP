<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use App\Models\VariacionImagen;


class VariacionImagenController extends Controller
{

/*  ╔══════════════ Crear Imagen Variación ══════════════╗
    ╚════════════════════════════════════════════════════╝ */

    public function CrearVariacionImagen(Request $request)
    {
        $rutaImagen = null;
        try {

            $validator = Validator::make(
                [
                    'id_variacion' => $request->id_variacion,
                    'imagen' => $request->imagen,
                    'orden' => $request->orden
                ],
                [
                    'id_variacion' => [
                        'required',
                        'exists:producto_variaciones,id_variacion'
                    ],
                    'imagen' => [
                        'required',
                        'image',
                        'mimes:jpg,jpeg,png,gif,webp',
                        'max:5120'
                    ],
                    'orden' => [
                        'nullable',
                        'integer',
                        'min:0'
                    ]
                ],
                [
                    'id_variacion.required' => 'La variación es obligatoria.',
                    'id_variacion.exists' => 'La variación seleccionada no existe.',
                    'imagen.required' => 'La imagen es obligatoria.',
                    'imagen.image' => 'El archivo debe ser una imagen.',
                    'imagen.mimes' => 'La imagen debe ser JPG, JPEG, PNG, GIF o WEBP.',
                    'imagen.max' => 'La imagen no puede exceder 5 MB.',
                    'orden.integer' => 'El orden debe ser un número entero.',
                    'orden.min' => 'El orden no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $rutaImagen = $this->guardarArchivoImagen($request->file('imagen'));

            VariacionImagen::create([
                'id_variacion' => $request->id_variacion,
                'imagen' => $rutaImagen,
                'orden' => $request->orden ?? 0
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Imagen agregada correctamente'
            ], 200);

        } catch (\Exception $e) {
            $this->eliminarArchivoImagen($rutaImagen);
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al agregar imagen',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔══════════════ Editar Imagen Variación ═════════════╗
    ╚════════════════════════════════════════════════════╝ */

    public function EditarVariacionImagen($id)
    {
        try {

            $imagen = VariacionImagen::find($id);

            if (!$imagen) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Imagen no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'imagen' => $imagen
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener imagen',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Actualizar Imagen Variación ═══════════╗
    ╚════════════════════════════════════════════════════╝ */

    public function ActualizarVariacionImagen(Request $request, $id)
    {
        $rutaNueva = null;
        try {

            $imagen = VariacionImagen::find($id);

            if (!$imagen) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Imagen no encontrada'
                ], 404);
            }

            $validator = Validator::make(
                [
                    'imagen' => $request->imagen,
                    'orden' => $request->orden
                ],
                [
                    'imagen' => [
                        'nullable',
                        'image',
                        'mimes:jpg,jpeg,png,gif,webp',
                        'max:5120'
                    ],
                    'orden' => [
                        'required',
                        'integer',
                        'min:0'
                    ]
                ],
                [
                    'imagen.image' => 'El archivo debe ser una imagen.',
                    'imagen.mimes' => 'La imagen debe ser JPG, JPEG, PNG, GIF o WEBP.',
                    'imagen.max' => 'La imagen no puede exceder 5 MB.',
                    'orden.required' => 'El orden es obligatorio.',
                    'orden.integer' => 'El orden debe ser un número entero.',
                    'orden.min' => 'El orden no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $rutaAnterior = $imagen->imagen;
            if ($request->hasFile('imagen')) {
                $rutaNueva = $this->guardarArchivoImagen($request->file('imagen'));
                $imagen->imagen = $rutaNueva;
            }
            $imagen->orden = $request->orden;
            $imagen->save();

            if ($rutaNueva) {
                $this->eliminarArchivoImagen($rutaAnterior);
            }

            return response()->json([
                'success' => true,
                'mensaje' => 'Imagen actualizada correctamente'
            ], 200);

        } catch (\Exception $e) {
            $this->eliminarArchivoImagen($rutaNueva);
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar imagen',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Cambiar Orden Imagen ════════════╗
    ╚══════════════════════════════════════════════╝ */

    public function CambiarOrdenVariacionImagen(Request $request, $id)
    {
        try {

            $imagen = VariacionImagen::find($id);

            if (!$imagen) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Imagen no encontrada'
                ], 404);
            }

            $validator = Validator::make(
                [
                    'orden' => $request->orden
                ],
                [
                    'orden' => [
                        'required',
                        'integer',
                        'min:0'
                    ]
                ],
                [
                    'orden.required' => 'El orden es obligatorio.',
                    'orden.integer' => 'El orden debe ser un número entero.',
                    'orden.min' => 'El orden no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $imagen->orden = $request->orden;
            $imagen->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Orden de imagen actualizado correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar orden de imagen',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Mostrar Imágenes Variación ════════════╗
    ╚════════════════════════════════════════════════════╝ */

    public function MostrarVariacionImagen()
    {
        try {

            $imagenes = VariacionImagen::orderBy('orden')->get();

            return response()->json([
                'success' => true,
                'imagenes' => $imagenes
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener imágenes',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function EliminarVariacionImagen($id)
    {
        try {
            $imagen = VariacionImagen::find($id);

            if (!$imagen) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Imagen no encontrada'
                ], 404);
            }

            $rutaImagen = $imagen->imagen;
            $imagen->delete();
            $this->eliminarArchivoImagen($rutaImagen);

            return response()->json([
                'success' => true,
                'mensaje' => 'Imagen eliminada correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al eliminar imagen',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    private function guardarArchivoImagen($archivo): string
    {
        $directorio = public_path('imagenes/productosvariaciones');

        if (!File::exists($directorio)) {
            File::makeDirectory($directorio, 0755, true);
        }

        $nombreArchivo = $archivo->hashName();
        $archivo->move($directorio, $nombreArchivo);

        return 'imagenes/productosvariaciones/' . $nombreArchivo;
    }

    private function eliminarArchivoImagen(?string $ruta): void
    {
        if (!$ruta || strpos($ruta, 'imagenes/productosvariaciones/') !== 0) {
            return;
        }

        $nombreArchivo = basename($ruta);
        if ($nombreArchivo === '' || $nombreArchivo === '.' || $nombreArchivo === '..') {
            return;
        }

        $archivo = public_path('imagenes/productosvariaciones/' . $nombreArchivo);
        if (File::exists($archivo)) {
            File::delete($archivo);
        }
    }

} // Fin de controlador
