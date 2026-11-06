<?php

namespace App\Http\Controllers;

use App\Models\Atributo;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CatalogoProductoController extends Controller
{
    /*  ╔═════════════ Mostrar Catálogos ═════════════╗
        ╚═════════════════════════════════════════════╝ */

    public function MostrarCatalogos()
    {
        try {

            $marcas = Marca::query()
                ->withCount('productos')
                ->orderBy('nombre_marca')
                ->get();

            $atributos = Atributo::with(['valores' => fn ($query) => $query->orderBy('orden_valor')])
                ->orderBy('nombre_atributo')
                ->get();

            return response()->json([
                'success' => true,
                'marcas' => $marcas,
                'atributos' => $atributos,
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener catálogos de productos: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener catálogos de productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════════ Marcas ═════════════════╗
        ╚═════════════════════════════════════════╝ */

    public function CrearMarca(Request $request)
    {
        try {

            $validator = Validator::make(
                ['nombre_marca' => $request->nombre_marca],
                ['nombre_marca' => ['required', 'unique:marcas,nombre_marca', 'max:100']],
                [
                    'nombre_marca.required' => 'El nombre de la marca es obligatorio.',
                    'nombre_marca.unique' => 'Ya existe una marca con este nombre.',
                    'nombre_marca.max' => 'El nombre no puede exceder 100 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Marca::create([
                'nombre_marca' => $request->nombre_marca,
                'slug_marca' => Str::slug($request->nombre_marca),
                'estado_marca' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Marca creada correctamente',
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al crear marca: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear marca',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function ActualizarMarca(Request $request, int|string $id)
    {
        try {

            $marca = Marca::find($id);

            if (! $marca) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Marca no encontrada',
                ], 404);
            }

            $validator = Validator::make(
                ['nombre_marca' => $request->nombre_marca],
                ['nombre_marca' => ['required', "unique:marcas,nombre_marca,$id,id_marca", 'max:100']],
                [
                    'nombre_marca.required' => 'El nombre de la marca es obligatorio.',
                    'nombre_marca.unique' => 'Ya existe una marca con este nombre.',
                    'nombre_marca.max' => 'El nombre no puede exceder 100 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $marca->nombre_marca = $request->nombre_marca;
            $marca->slug_marca = Str::slug($request->nombre_marca);
            $marca->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Marca actualizada correctamente',
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al actualizar marca: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar marca',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function CambiarEstadoMarca(int|string $id)
    {
        try {

            $marca = Marca::find($id);

            if (! $marca) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Marca no encontrada',
                ], 404);
            }

            $marca->estado_marca = ! $marca->estado_marca;
            $marca->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la marca actualizado',
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al cambiar estado de la marca: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado de la marca',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════════ Atributos ═══════════════╗
        ╚═════════════════════════════════════════╝ */

    public function CrearAtributo(Request $request)
    {
        DB::beginTransaction();

        try {

            $validator = Validator::make(
                [
                    'nombre_atributo' => $request->nombre_atributo,
                    'valores' => $this->leerValores($request),
                ],
                [
                    'nombre_atributo' => ['required', 'unique:atributos,nombre_atributo', 'max:80'],
                    'valores' => ['required', 'array', 'min:1'],
                    'valores.*' => ['required', 'string', 'max:100'],
                ],
                [
                    'nombre_atributo.required' => 'El nombre del atributo es obligatorio.',
                    'nombre_atributo.unique' => 'Ya existe un atributo con este nombre.',
                    'nombre_atributo.max' => 'El nombre no puede exceder 80 caracteres.',
                    'valores.required' => 'Agrega al menos un valor al atributo.',
                    'valores.min' => 'Agrega al menos un valor al atributo.',
                    'valores.*.required' => 'Los valores no pueden estar vacíos.',
                ]
            );

            if ($validator->fails()) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $atributo = Atributo::create([
                'nombre_atributo' => $request->nombre_atributo,
                'tipo_atributo' => 'lista',
                'estado_atributo' => true,
            ]);

            $this->sincronizarValores($atributo, $validator->validated()['valores']);

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Atributo creado correctamente',
            ], 200);

        } catch (\Throwable $e) {

            DB::rollBack();
            Log::error('Error al crear atributo: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear atributo',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function ActualizarAtributo(Request $request, int|string $id)
    {
        DB::beginTransaction();

        try {

            $atributo = Atributo::find($id);

            if (! $atributo) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'mensaje' => 'Atributo no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_atributo' => $request->nombre_atributo,
                    'valores' => $this->leerValores($request),
                ],
                [
                    'nombre_atributo' => ['required', "unique:atributos,nombre_atributo,$id,id_atributo", 'max:80'],
                    'valores' => ['required', 'array', 'min:1'],
                    'valores.*' => ['required', 'string', 'max:100'],
                ],
                [
                    'nombre_atributo.required' => 'El nombre del atributo es obligatorio.',
                    'nombre_atributo.unique' => 'Ya existe un atributo con este nombre.',
                    'nombre_atributo.max' => 'El nombre no puede exceder 80 caracteres.',
                    'valores.required' => 'Agrega al menos un valor al atributo.',
                    'valores.min' => 'Agrega al menos un valor al atributo.',
                    'valores.*.required' => 'Los valores no pueden estar vacíos.',
                ]
            );

            if ($validator->fails()) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $atributo->nombre_atributo = $request->nombre_atributo;
            $atributo->save();

            $this->sincronizarValores($atributo, $validator->validated()['valores']);

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Atributo actualizado correctamente',
            ], 200);

        } catch (\Throwable $e) {

            DB::rollBack();
            Log::error('Error al actualizar atributo: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar atributo',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function CambiarEstadoAtributo(int|string $id)
    {
        try {

            $atributo = Atributo::find($id);

            if (! $atributo) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Atributo no encontrado',
                ], 404);
            }

            $atributo->estado_atributo = ! $atributo->estado_atributo;
            $atributo->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del atributo actualizado',
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al cambiar estado del atributo: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del atributo',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════════ Auxiliares ══════════════╗
        ╚═════════════════════════════════════════╝ */

    /**
     * Acepta los valores como arreglo o como el JSON que envía el formulario.
     *
     * @return array<int, string>
     */
    private function leerValores(Request $request): array
    {
        $valores = $request->input('valores');

        if (is_string($valores)) {
            $valores = json_decode($valores, true);
        }

        if (! is_array($valores)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map(fn ($valor) => trim((string) $valor), $valores),
            fn ($valor) => $valor !== ''
        )));
    }

    /**
     * Agrega los valores nuevos y desactiva los que se quitaron.
     * No se eliminan filas porque los productos ya guardados las referencian.
     *
     * @param  array<int, string>  $valores
     */
    private function sincronizarValores(Atributo $atributo, array $valores): void
    {
        $existentes = DB::table('atributo_valores')
            ->where('id_atributo', $atributo->id_atributo)
            ->get(['id_valor', 'valor_atributo']);

        $orden = 0;

        foreach ($valores as $valor) {
            $fila = $existentes->firstWhere('valor_atributo', $valor);

            if ($fila) {
                DB::table('atributo_valores')
                    ->where('id_valor', $fila->id_valor)
                    ->update(['orden_valor' => $orden, 'estado_valor' => true]);
            } else {
                DB::table('atributo_valores')->insert([
                    'id_atributo' => $atributo->id_atributo,
                    'valor_atributo' => $valor,
                    'orden_valor' => $orden,
                    'estado_valor' => true,
                ]);
            }

            $orden++;
        }

        $sobran = $existentes
            ->reject(fn ($fila) => in_array($fila->valor_atributo, $valores, true))
            ->pluck('id_valor');

        if ($sobran->isNotEmpty()) {
            DB::table('atributo_valores')
                ->whereIn('id_valor', $sobran)
                ->update(['estado_valor' => false]);
        }
    }
}
