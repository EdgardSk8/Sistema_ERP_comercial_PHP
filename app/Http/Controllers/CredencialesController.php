<?php

namespace App\Http\Controllers;

use App\Models\Credenciales;
use App\Support\ImagenOptimizada;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class CredencialesController extends Controller
{
    /*  ╔═════════════ Mostrar Credenciales ══════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function MostrarCredenciales()
    {
        try {
            $config = Credenciales::first();

            return response()->json([
                'success' => true,
                'data' => $config,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuración',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════════════ Editar Credenciales ══════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function EditarCredencial(int $id)
    {
        try {
            $credenciales = Credenciales::find($id);

            if (! $credenciales) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Credenciales no encontradas',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'credenciales' => $credenciales,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener credenciales',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Credenciales ═══════════╗
        ╚═══════════════════════════════════════════════╝ */

    public function ActualizarCredenciales(Request $request, int $id)
    {
        try {
            $credenciales = Credenciales::find($id);

            if (! $credenciales) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Credenciales no encontradas',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_empresa' => $request->nombre_empresa,
                    'ruc_empresa' => $request->ruc_empresa,
                    'direccion_empresa' => $request->direccion_empresa,
                    'telefono_empresa' => $request->telefono_empresa,
                    'correo_empresa' => $request->correo_empresa,
                    'tipo_cambio' => $request->tipo_cambio,
                    'tarifa_km' => $request->tarifa_km,
                    'latitud_empresa' => $request->latitud_empresa,
                    'longitud_empresa' => $request->longitud_empresa,
                ],
                [
                    'nombre_empresa' => ['nullable', 'max:100'],
                    'ruc_empresa' => ['nullable', 'max:20'],
                    'direccion_empresa' => ['nullable', 'max:255'],
                    'telefono_empresa' => ['nullable', 'max:20'],
                    'correo_empresa' => ['nullable', 'email', 'max:100'],
                    'tipo_cambio' => ['required', 'numeric'],
                    'tarifa_km' => ['nullable', 'numeric', 'min:0'],
                    'latitud_empresa' => ['nullable', 'numeric', 'between:-90,90'],
                    'longitud_empresa' => ['nullable', 'numeric', 'between:-180,180'],
                ],
                [
                    'nombre_empresa.' => 'El nombre de la empresa es obligatorio.',
                    'ruc_empresa' => 'El RUC es obligatorio.',
                    'direccion_empresa' => 'La dirección es obligatoria.',
                    'telefono_empresa' => 'El teléfono es obligatorio.',
                    'correo_empresa' => 'El correo es obligatorio.',
                    'correo_empresa.email' => 'El correo no es válido.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $credenciales->nombre_empresa = $request->nombre_empresa;
            $credenciales->ruc_empresa = $request->ruc_empresa;
            $credenciales->direccion_empresa = $request->direccion_empresa;
            $credenciales->telefono_empresa = $request->telefono_empresa;
            $credenciales->correo_empresa = $request->correo_empresa;
            $credenciales->tipo_cambio = $request->tipo_cambio;
            $credenciales->tarifa_km = $request->filled('tarifa_km') ? $request->tarifa_km : null;
            $credenciales->latitud_empresa = $request->filled('latitud_empresa') ? $request->latitud_empresa : null;
            $credenciales->longitud_empresa = $request->filled('longitud_empresa') ? $request->longitud_empresa : null;

            $credenciales->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Credenciales actualizadas correctamente',
                'credenciales' => $credenciales,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar credenciales',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function GuardarLogo(Request $request, int $id)
    {
        return $this->persistirLogo($request, $id);
    }

    public function ActualizarLogo(Request $request, int $id)
    {
        return $this->persistirLogo($request, $id);
    }

    private function persistirLogo(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'logo_empresa' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'logo_empresa.required' => 'Seleccione una imagen para el logo.',
            'logo_empresa.image' => 'El archivo debe ser una imagen.',
            'logo_empresa.mimes' => 'El logo debe estar en formato JPG, PNG o WEBP.',
            'logo_empresa.max' => 'El logo no puede pesar más de 4 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $credenciales = Credenciales::find($id);
        if (! $credenciales) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Credenciales no encontradas',
            ], 404);
        }

        /** @var UploadedFile $archivo */
        $archivo = $validator->validated()['logo_empresa'];
        $directorio = public_path('imagenes/logo');
        File::ensureDirectoryExists($directorio);

        // Redimensiona (máx. 1200px) y comprime en WebP (< 300 KB) sin perder nitidez.
        $nombreArchivo = ImagenOptimizada::guardar(
            $archivo,
            $directorio,
            'Logo'
        );

        $logoAnterior = $credenciales->logo_empresa;
        $credenciales->logo_empresa = 'imagenes/logo/'.$nombreArchivo;

        try {
            $credenciales->save();
        } catch (\Exception $e) {
            File::delete($directorio.DIRECTORY_SEPARATOR.$nombreArchivo);
            throw $e;
        }

        $this->eliminarArchivoLogo($logoAnterior);

        return response()->json([
            'success' => true,
            'mensaje' => 'Logo guardado correctamente',
            'credenciales' => $credenciales,
        ], 200);
    }

    public function EliminarLogo(int $id)
    {
        $credenciales = Credenciales::find($id);
        if (! $credenciales) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Credenciales no encontradas',
            ], 404);
        }

        $logoAnterior = $credenciales->logo_empresa;
        $credenciales->logo_empresa = null;
        $credenciales->save();
        $this->eliminarArchivoLogo($logoAnterior);

        return response()->json([
            'success' => true,
            'mensaje' => 'Logo eliminado correctamente',
            'credenciales' => $credenciales,
        ], 200);
    }

    private function eliminarArchivoLogo(?string $ruta): void
    {
        if (! $ruta || ! str_starts_with($ruta, 'imagenes/logo/') || basename($ruta) !== substr($ruta, strlen('imagenes/logo/'))) {
            return;
        }

        $rutaCompleta = public_path($ruta);
        if (File::exists($rutaCompleta) && File::isFile($rutaCompleta)) {
            File::delete($rutaCompleta);
        }
    }
}
