<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CuponDescuentoController extends Controller
{
    public function Mostrar(Request $request)
    {
        try {
            $cupones = DB::table('cupones as c')
                ->leftJoin('cupones_clientes as cc', 'cc.id_cupon', '=', 'c.id_cupon')
                ->select([
                    'c.id_cupon',
                    'c.codigo_cupon',
                    'c.nombre_cupon',
                    'c.descripcion_cupon',
                    'c.tipo_descuento_cupon',
                    'c.valor_descuento_cupon',
                    'c.categoria_cupon',
                    'c.tope_descuento_cupon',
                    'c.usos_maximos',
                    'c.usos_realizados',
                    'c.fecha_inicio_cupon',
                    'c.fecha_fin_cupon',
                    'c.estado_cupon',
                    'c.fecha_creacion_cupon',
                ])
                ->selectRaw('count(cc.id_cupon_cliente) as asignados')
                ->selectRaw('coalesce(sum(case when cc.usado_cupon then 1 else 0 end), 0) as usados')
                ->groupBy('c.id_cupon')
                ->orderByDesc('c.estado_cupon')
                ->orderByDesc('c.fecha_creacion_cupon')
                ->get()
                ->map(function ($cupon) {
                    $cupon->asignados = (int) $cupon->asignados;
                    $cupon->usados = (int) $cupon->usados;
                    $cupon->valor = (float) $cupon->valor_descuento_cupon;
                    $cupon->origen = str_starts_with(strtoupper((string) $cupon->codigo_cupon), 'FIEL-')
                        ? 'fidelidad'
                        : 'manual';

                    $inicio = $cupon->fecha_inicio_cupon;
                    $fin = $cupon->fecha_fin_cupon;

                    $cupon->vigente = (! $inicio || now()->greaterThanOrEqualTo($inicio))
                        && (! $fin || now()->lessThanOrEqualTo($fin));

                    return $cupon;
                })
                ->values();

            $resumen = [
                'total' => $cupones->count(),
                'activos' => $cupones->filter(fn ($cupon) => (bool) $cupon->estado_cupon)->count(),
                'fidelidad' => $cupones->filter(fn ($cupon) => $cupon->origen === 'fidelidad')->count(),
                'usados' => (int) $cupones->sum('usos_realizados'),
                'asignaciones' => (int) $cupones->sum('asignados'),
                'promociones_activas' => DB::table('promociones')->where('estado_promocion', true)->count(),
            ];

            $bienvenida = $this->resumenBienvenida();
            $resumen['bienvenida_disponibles'] = $bienvenida['disponibles'];
            $resumen['bienvenida_usados'] = $bienvenida['usados'];

            return response()->json([
                'success' => true,
                'cupones' => $cupones,
                'resumen' => $resumen,
                'categorias' => DB::table('categoria')
                    ->where('estado_categoria', true)
                    ->orderBy('nombre_categoria')
                    ->pluck('nombre_categoria'),
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los cupones.',
            ], 500);
        }
    }

    public function Detalle($id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $clientes = DB::table('cupones_clientes as cc')
            ->join('clientes as cl', 'cl.id_cliente', '=', 'cc.id_cliente')
            ->where('cc.id_cupon', $id)
            ->select([
                'cc.id_cupon_cliente',
                'cc.usado_cupon',
                'cc.fecha_uso_cupon',
                'cc.fecha_asignacion_cupon',
                'cl.nombre_cliente',
                'cl.correo_cliente',
                'cl.telefono_cliente',
            ])
            ->orderByDesc('cc.usado_cupon')
            ->orderBy('cl.nombre_cliente')
            ->get();

        return response()->json([
            'success' => true,
            'cupon' => $cupon,
            'clientes' => $clientes,
        ]);
    }

    public function Clientes(Request $request)
    {
        try {
            $idCupon = (int) $request->query('cupon', 0);

            if ($idCupon && ! DB::table('cupones')->where('id_cupon', $idCupon)->exists()) {
                return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
            }

            $clientes = DB::table('clientes')
                ->select('id_cliente', 'nombre_cliente', 'correo_cliente', 'estado_cliente')
                ->orderBy('nombre_cliente')
                ->get();

            $asignados = $idCupon
                ? DB::table('cupones_clientes')
                    ->where('id_cupon', $idCupon)
                    ->pluck('id_cliente')
                    ->map(fn ($idCliente) => (int) $idCliente)
                    ->all()
                : [];

            return response()->json([
                'success' => true,
                'clientes' => $clientes,
                'asignados' => $asignados,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los clientes.',
            ], 500);
        }
    }

    public function ClientesResumen()
    {
        try {
            $clientes = DB::table('clientes as cl')
                ->leftJoin('auth.users as u', 'u.id', '=', 'cl.auth_id')
                ->select([
                    'cl.id_cliente',
                    'cl.nombre_cliente',
                    'cl.correo_cliente',
                    'cl.telefono_cliente',
                    'cl.estado_cliente',
                ])
                ->selectRaw('(select count(*) from ventas v where v.id_cliente = cl.id_cliente and coalesce(v.estado_venta, true)) as compras')
                ->selectRaw('(select coalesce(sum(v.total_venta), 0) from ventas v where v.id_cliente = cl.id_cliente and coalesce(v.estado_venta, true)) as total_compras')
                ->selectRaw('(select max(v.fecha_venta) from ventas v where v.id_cliente = cl.id_cliente and coalesce(v.estado_venta, true)) as ultima_compra')
                ->selectRaw("(select count(*) from pedidos_web p where p.id_cliente = cl.id_cliente and p.id_venta is null and p.estado_pedido not in ('cancelado', 'rechazado')) as pedidos_web")
                ->selectRaw("(select coalesce(sum(p.total_pedido), 0) from pedidos_web p where p.id_cliente = cl.id_cliente and p.id_venta is null and p.estado_pedido not in ('cancelado', 'rechazado')) as total_pedidos_web")
                ->selectRaw('(select max(p.fecha_pedido) from pedidos_web p where p.id_cliente = cl.id_cliente) as ultimo_pedido')
                ->selectRaw('(select count(*) from cupones_clientes cc where cc.id_cliente = cl.id_cliente) as cupones_asignados')
                ->selectRaw('(select count(*) from cupones_clientes cc where cc.id_cliente = cl.id_cliente and cc.usado_cupon) as cupones_usados')
                ->selectRaw("lower(coalesce(u.raw_user_meta_data->>'descuento_primera_compra', '')) as bienvenida_meta")
                ->selectRaw("lower(coalesce(u.raw_user_meta_data->>'descuento_primera_compra_usado', '')) as bienvenida_usada_meta")
                ->orderBy('cl.nombre_cliente')
                ->get()
                ->map(function ($cliente) {
                    $verdadero = fn ($valor) => in_array((string) $valor, ['true', 't', '1'], true);

                    $usada = $verdadero($cliente->bienvenida_usada_meta);

                    $cliente->compras = (int) $cliente->compras;
                    $cliente->pedidos_web = (int) $cliente->pedidos_web;
                    $cliente->total_compras = (float) $cliente->total_compras;
                    $cliente->total_pedidos_web = (float) $cliente->total_pedidos_web;
                    $cliente->cupones_asignados = (int) $cliente->cupones_asignados;
                    $cliente->cupones_usados = (int) $cliente->cupones_usados;
                    $cliente->bienvenida_usada = $usada;
                    $cliente->bienvenida_disponible = ! $usada && $verdadero($cliente->bienvenida_meta);
                    $cliente->total_gastado = $cliente->total_compras + $cliente->total_pedidos_web;
                    $cliente->ultima_actividad = collect([$cliente->ultima_compra, $cliente->ultimo_pedido])
                        ->filter()
                        ->sort()
                        ->last();

                    unset($cliente->bienvenida_meta, $cliente->bienvenida_usada_meta);

                    return $cliente;
                })
                ->values();

            $resumen = [
                'total' => $clientes->count(),
                'con_compras' => $clientes->filter(fn ($cliente) => ($cliente->compras + $cliente->pedidos_web) > 0)->count(),
                'sin_compras' => $clientes->filter(fn ($cliente) => ($cliente->compras + $cliente->pedidos_web) === 0)->count(),
                'bienvenida_disponible' => $clientes->filter(fn ($cliente) => $cliente->bienvenida_disponible)->count(),
                'bienvenida_usada' => $clientes->filter(fn ($cliente) => $cliente->bienvenida_usada)->count(),
                'con_cupones' => $clientes->filter(fn ($cliente) => $cliente->cupones_asignados > 0)->count(),
            ];

            return response()->json([
                'success' => true,
                'clientes' => $clientes,
                'resumen' => $resumen,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los clientes.',
            ], 500);
        }
    }

    public function ClienteDetalle($id)
    {
        $cliente = $this->clienteConMetricas((int) $id);

        if (! $cliente) {
            return response()->json(['success' => false, 'mensaje' => 'Cliente no encontrado.'], 404);
        }

        $cupones = DB::table('cupones_clientes as cc')
            ->join('cupones as c', 'c.id_cupon', '=', 'cc.id_cupon')
            ->where('cc.id_cliente', $id)
            ->select([
                'cc.id_cupon_cliente',
                'cc.usado_cupon',
                'cc.fecha_asignacion_cupon',
                'cc.fecha_uso_cupon',
                'c.id_cupon',
                'c.codigo_cupon',
                'c.nombre_cupon',
                'c.tipo_descuento_cupon',
                'c.valor_descuento_cupon',
                'c.categoria_cupon',
                'c.tope_descuento_cupon',
                'c.fecha_fin_cupon',
                'c.estado_cupon',
            ])
            ->orderBy('cc.usado_cupon')
            ->orderByDesc('cc.fecha_asignacion_cupon')
            ->get()
            ->map(function ($cupon) {
                $cupon->usado_cupon = (bool) $cupon->usado_cupon;
                $cupon->valor_descuento_cupon = (float) $cupon->valor_descuento_cupon;

                return $cupon;
            });

        $ventas = DB::table('ventas')
            ->where('id_cliente', $id)
            ->orderByDesc('fecha_venta')
            ->limit(5)
            ->get(['numero_factura', 'fecha_venta', 'total_venta', 'estado_venta']);

        $pedidos = DB::table('pedidos_web')
            ->where('id_cliente', $id)
            ->orderByDesc('fecha_pedido')
            ->limit(5)
            ->get(['numero_pedido', 'fecha_pedido', 'total_pedido', 'estado_pedido']);

        return response()->json([
            'success' => true,
            'cliente' => $cliente,
            'cupones' => $cupones,
            'ventas' => $ventas,
            'pedidos' => $pedidos,
        ]);
    }

    public function QuitarCuponCliente($id, $idCupon)
    {
        $asignacion = DB::table('cupones_clientes')
            ->where('id_cliente', $id)
            ->where('id_cupon', $idCupon);

        if (! (clone $asignacion)->exists()) {
            return response()->json(['success' => false, 'mensaje' => 'El cliente no tiene ese cupón.'], 404);
        }

        $asignacion->delete();

        /* Los cupones manuales (MAN-) se eliminan si ya no quedan asignados. */
        $cupon = DB::table('cupones')->where('id_cupon', $idCupon)->first();
        $quedan = DB::table('cupones_clientes')->where('id_cupon', $idCupon)->count();

        if ($cupon && $quedan === 0 && str_starts_with(strtoupper((string) $cupon->codigo_cupon), 'MAN-')) {
            DB::table('cupones')->where('id_cupon', $idCupon)->delete();
        }

        return response()->json(['success' => true, 'mensaje' => 'Cupón quitado al cliente.']);
    }

    public function ExtenderCuponCliente(Request $request, $id, $idCupon)
    {
        $validator = Validator::make($request->all(), [
            'dias' => 'required|integer|min:1|max:365',
        ], [
            'required' => 'Indica cuántos días extender.',
            'integer' => 'Los días deben ser un número entero.',
            'min' => 'Los días deben ser al menos 1.',
            'max' => 'No puedes extender más de 365 días.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (! DB::table('cupones_clientes')->where('id_cliente', $id)->where('id_cupon', $idCupon)->exists()) {
            return response()->json(['success' => false, 'mensaje' => 'El cliente no tiene ese cupón.'], 404);
        }

        $cupon = DB::table('cupones')->where('id_cupon', $idCupon)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $base = $cupon->fecha_fin_cupon && now()->lessThan($cupon->fecha_fin_cupon)
            ? $cupon->fecha_fin_cupon
            : now()->toDateTimeString();

        $nuevaFecha = date('Y-m-d H:i:s', strtotime($base.' +'.(int) $request->input('dias').' days'));

        DB::table('cupones')->where('id_cupon', $idCupon)->update([
            'fecha_fin_cupon' => $nuevaFecha,
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => 'Vigencia extendida hasta '.date('d/m/Y', strtotime($nuevaFecha)).'.',
            'fecha_fin_cupon' => $nuevaFecha,
        ]);
    }

    public function AgregarCuponManual(Request $request, $id)
    {
        $cliente = DB::table('clientes')->where('id_cliente', $id)->first();

        if (! $cliente) {
            return response()->json(['success' => false, 'mensaje' => 'Cliente no encontrado.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'tipo_descuento_cupon' => 'required|in:porcentaje,monto',
            'valor_descuento_cupon' => 'required|numeric|min:0.01',
            'nombre_cupon' => 'nullable|max:120',
            'categoria_cupon' => 'nullable|max:80',
            'tope_descuento_cupon' => 'nullable|numeric|min:0.01',
            'dias' => 'nullable|integer|min:1|max:365',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'numeric' => 'El campo :attribute debe ser numérico.',
            'min' => 'El campo :attribute debe ser mayor o igual a :min.',
            'in' => 'El campo :attribute no es válido.',
            'max' => 'El campo :attribute no debe superar :max.',
        ], [
            'tipo_descuento_cupon' => 'tipo',
            'valor_descuento_cupon' => 'valor',
            'nombre_cupon' => 'nombre',
            'categoria_cupon' => 'categoría',
            'tope_descuento_cupon' => 'tope',
            'dias' => 'días',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tipo = $request->input('tipo_descuento_cupon');
        $valor = (float) $request->input('valor_descuento_cupon');

        if ($tipo === 'porcentaje' && $valor > 100) {
            return response()->json(['success' => false, 'mensaje' => 'El porcentaje no puede superar 100.'], 422);
        }

        $dias = (int) ($request->input('dias') ?: 30);
        $nombre = trim((string) $request->input('nombre_cupon'));
        $categoria = $tipo === 'porcentaje'
            ? (trim((string) $request->input('categoria_cupon')) ?: null)
            : null;
        $tope = $tipo === 'porcentaje' && $request->filled('tope_descuento_cupon')
            ? round((float) $request->input('tope_descuento_cupon'), 2)
            : null;

        if ($nombre === '') {
            $nombre = $tipo === 'porcentaje'
                ? 'Descuento '.$valor.'%'
                : 'Crédito '.number_format($valor, 2);
        }

        try {
            $idCupon = DB::transaction(function () use ($id, $cliente, $tipo, $valor, $nombre, $dias, $categoria, $tope) {
                do {
                    $codigo = 'MAN-'.strtoupper(bin2hex(random_bytes(3)));
                } while (DB::table('cupones')->whereRaw('upper(codigo_cupon) = ?', [$codigo])->exists());

                $idCupon = DB::table('cupones')->insertGetId([
                    'codigo_cupon' => $codigo,
                    'nombre_cupon' => $nombre,
                    'descripcion_cupon' => 'Cupón manual para '.$cliente->nombre_cliente,
                    'tipo_descuento_cupon' => $tipo,
                    'valor_descuento_cupon' => $valor,
                    'categoria_cupon' => $categoria,
                    'tope_descuento_cupon' => $tope,
                    'usos_maximos' => 1,
                    'usos_realizados' => 0,
                    'fecha_inicio_cupon' => now(),
                    'fecha_fin_cupon' => now()->addDays($dias),
                    'estado_cupon' => true,
                    'fecha_creacion_cupon' => now(),
                ], 'id_cupon');

                DB::table('cupones_clientes')->insert([
                    'id_cupon' => $idCupon,
                    'id_cliente' => (int) $id,
                    'usado_cupon' => false,
                    'fecha_asignacion_cupon' => now(),
                ]);

                return $idCupon;
            });

            return response()->json([
                'success' => true,
                'id_cupon' => $idCupon,
                'mensaje' => 'Cupón agregado al cliente.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo agregar el cupón.',
            ], 500);
        }
    }

    private function clienteConMetricas(int $id)
    {
        $cliente = DB::table('clientes as cl')
            ->leftJoin('auth.users as u', 'u.id', '=', 'cl.auth_id')
            ->where('cl.id_cliente', $id)
            ->select([
                'cl.id_cliente',
                'cl.nombre_cliente',
                'cl.correo_cliente',
                'cl.telefono_cliente',
                'cl.estado_cliente',
                'cl.fecha_creacion_cliente',
            ])
            ->selectRaw('(select count(*) from ventas v where v.id_cliente = cl.id_cliente and coalesce(v.estado_venta, true)) as compras')
            ->selectRaw('(select coalesce(sum(v.total_venta), 0) from ventas v where v.id_cliente = cl.id_cliente and coalesce(v.estado_venta, true)) as total_compras')
            ->selectRaw("(select count(*) from pedidos_web p where p.id_cliente = cl.id_cliente and p.id_venta is null and p.estado_pedido not in ('cancelado', 'rechazado')) as pedidos_web")
            ->selectRaw("(select coalesce(sum(p.total_pedido), 0) from pedidos_web p where p.id_cliente = cl.id_cliente and p.id_venta is null and p.estado_pedido not in ('cancelado', 'rechazado')) as total_pedidos_web")
            ->selectRaw('(select count(*) from cupones_clientes cc where cc.id_cliente = cl.id_cliente) as cupones_asignados')
            ->selectRaw("lower(coalesce(u.raw_user_meta_data->>'descuento_primera_compra', '')) as bienvenida_meta")
            ->selectRaw("lower(coalesce(u.raw_user_meta_data->>'descuento_primera_compra_usado', '')) as bienvenida_usada_meta")
            ->first();

        if (! $cliente) {
            return null;
        }

        $verdadero = fn ($valor) => in_array((string) $valor, ['true', 't', '1'], true);

        $usada = $verdadero($cliente->bienvenida_usada_meta);

        $cliente->compras = (int) $cliente->compras;
        $cliente->pedidos_web = (int) $cliente->pedidos_web;
        $cliente->total_compras = (float) $cliente->total_compras;
        $cliente->total_pedidos_web = (float) $cliente->total_pedidos_web;
        $cliente->total_gastado = $cliente->total_compras + $cliente->total_pedidos_web;
        $cliente->cupones_asignados = (int) $cliente->cupones_asignados;
        $cliente->bienvenida_usada = $usada;
        $cliente->bienvenida_disponible = ! $usada && $verdadero($cliente->bienvenida_meta);

        unset($cliente->bienvenida_meta, $cliente->bienvenida_usada_meta);

        return $cliente;
    }

    public function Crear(Request $request)
    {
        $validator = $this->validarCupon($request);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $datos = $this->datosCupon($request);
            $datos['usos_realizados'] = 0;
            $datos['fecha_creacion_cupon'] = now();

            $idCupon = DB::table('cupones')->insertGetId($datos, 'id_cupon');

            return response()->json([
                'success' => true,
                'id_cupon' => $idCupon,
                'mensaje' => 'Cupón creado correctamente.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear el cupón.',
            ], 500);
        }
    }

    public function Actualizar(Request $request, $id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $validator = $this->validarCupon($request, (int) $id);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::table('cupones')->where('id_cupon', $id)->update($this->datosCupon($request));

            return response()->json([
                'success' => true,
                'mensaje' => 'Cupón actualizado correctamente.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar el cupón.',
            ], 500);
        }
    }

    public function Asignar(Request $request, $id)
    {
        $cupon = DB::table('cupones')->where('id_cupon', $id)->first();

        if (! $cupon) {
            return response()->json(['success' => false, 'mensaje' => 'Cupón no encontrado.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'clientes' => 'required|array|min:1',
            'clientes.*' => 'integer',
        ], [
            'required' => 'Selecciona al menos un cliente.',
            'array' => 'Selecciona al menos un cliente.',
            'min' => 'Selecciona al menos un cliente.',
            'integer' => 'Los clientes seleccionados no son válidos.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $solicitados = collect($request->input('clientes', []))
                ->map(fn ($idCliente) => (int) $idCliente)
                ->unique()
                ->values();

            $validos = DB::table('clientes')
                ->whereIn('id_cliente', $solicitados)
                ->pluck('id_cliente')
                ->map(fn ($idCliente) => (int) $idCliente);

            $existentes = DB::table('cupones_clientes')
                ->where('id_cupon', $id)
                ->pluck('id_cliente')
                ->map(fn ($idCliente) => (int) $idCliente);

            $nuevos = $validos->diff($existentes)->values();

            if ($nuevos->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'asignados' => 0,
                    'omitidos' => $validos->count(),
                    'mensaje' => 'Los clientes seleccionados ya tenían este cupón.',
                ]);
            }

            $ahora = now();

            $filas = $nuevos->map(fn ($idCliente) => [
                'id_cupon' => (int) $id,
                'id_cliente' => $idCliente,
                'usado_cupon' => false,
                'fecha_asignacion_cupon' => $ahora,
            ])->all();

            DB::transaction(fn () => DB::table('cupones_clientes')->insert($filas));

            return response()->json([
                'success' => true,
                'asignados' => count($filas),
                'omitidos' => $validos->count() - count($filas),
                'mensaje' => count($filas) === 1
                    ? 'Cupón asignado a 1 cliente.'
                    : 'Cupón asignado a '.count($filas).' clientes.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo asignar el cupón.',
            ], 500);
        }
    }

    private function validarCupon(Request $request, ?int $idCupon = null)
    {
        $validator = Validator::make($request->all(), [
            'codigo_cupon' => ['required', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'nombre_cupon' => 'required|max:120',
            'descripcion_cupon' => 'nullable|max:255',
            'tipo_descuento_cupon' => 'required|in:porcentaje,monto',
            'valor_descuento_cupon' => 'required|numeric|min:0.01',
            'categoria_cupon' => 'nullable|max:80',
            'tope_descuento_cupon' => 'nullable|numeric|min:0.01',
            'usos_maximos' => 'required|integer|min:1',
            'fecha_inicio_cupon' => 'nullable|date',
            'fecha_fin_cupon' => 'nullable|date|after_or_equal:fecha_inicio_cupon',
            'estado_cupon' => 'nullable|boolean',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'numeric' => 'El campo :attribute debe ser numérico.',
            'integer' => 'El campo :attribute debe ser un número entero.',
            'min' => 'El campo :attribute debe ser mayor o igual a :min.',
            'max' => 'El campo :attribute no debe superar :max caracteres.',
            'regex' => 'El :attribute solo permite letras, números, guiones y guiones bajos.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
            'after_or_equal' => 'La fecha fin debe ser igual o posterior a la fecha inicio.',
            'in' => 'El campo :attribute no es válido.',
            'boolean' => 'El campo :attribute no es válido.',
        ], [
            'codigo_cupon' => 'código',
            'nombre_cupon' => 'nombre',
            'descripcion_cupon' => 'descripción',
            'tipo_descuento_cupon' => 'tipo',
            'valor_descuento_cupon' => 'valor',
            'categoria_cupon' => 'categoría',
            'usos_maximos' => 'usos máximos',
            'fecha_inicio_cupon' => 'fecha inicio',
            'fecha_fin_cupon' => 'fecha fin',
        ]);

        $validator->after(function ($validator) use ($request, $idCupon) {
            $codigo = strtoupper(trim((string) $request->input('codigo_cupon')));

            if ($codigo === '') {
                return;
            }

            $existe = DB::table('cupones')
                ->whereRaw('upper(codigo_cupon) = ?', [$codigo])
                ->when($idCupon, fn ($consulta) => $consulta->where('id_cupon', '!=', $idCupon))
                ->exists();

            if ($existe) {
                $validator->errors()->add('codigo_cupon', 'Ya existe un cupón con ese código.');
            }

            if ($request->input('tipo_descuento_cupon') === 'porcentaje'
                && (float) $request->input('valor_descuento_cupon') > 100) {
                $validator->errors()->add('valor_descuento_cupon', 'El porcentaje no puede ser mayor a 100.');
            }
        });

        return $validator;
    }

    private function datosCupon(Request $request): array
    {
        return [
            'codigo_cupon' => strtoupper(trim((string) $request->input('codigo_cupon'))),
            'nombre_cupon' => trim((string) $request->input('nombre_cupon')),
            'descripcion_cupon' => $request->filled('descripcion_cupon')
                ? trim((string) $request->input('descripcion_cupon'))
                : null,
            'tipo_descuento_cupon' => $request->input('tipo_descuento_cupon'),
            'valor_descuento_cupon' => round((float) $request->input('valor_descuento_cupon'), 2),
            'categoria_cupon' => $request->filled('categoria_cupon')
                ? trim((string) $request->input('categoria_cupon'))
                : null,
            'tope_descuento_cupon' => $request->input('tipo_descuento_cupon') === 'porcentaje'
                && $request->filled('tope_descuento_cupon')
                ? round((float) $request->input('tope_descuento_cupon'), 2)
                : null,
            'usos_maximos' => (int) $request->input('usos_maximos'),
            'fecha_inicio_cupon' => $request->filled('fecha_inicio_cupon')
                ? $request->input('fecha_inicio_cupon')
                : now()->toDateString(),
            'fecha_fin_cupon' => $request->filled('fecha_fin_cupon')
                ? $request->input('fecha_fin_cupon')
                : null,
            'estado_cupon' => $request->boolean('estado_cupon'),
        ];
    }

    private function resumenBienvenida(): array
    {
        $resumen = DB::table('auth.users')
            ->selectRaw("count(*) filter (
                where lower(coalesce(raw_user_meta_data->>'descuento_primera_compra', '')) in ('true', 't', '1')
                  and lower(coalesce(raw_user_meta_data->>'descuento_primera_compra_usado', '')) not in ('true', 't', '1')
            ) as disponibles")
            ->selectRaw("count(*) filter (
                where lower(coalesce(raw_user_meta_data->>'descuento_primera_compra_usado', '')) in ('true', 't', '1')
            ) as usados")
            ->first();

        return [
            'disponibles' => (int) ($resumen->disponibles ?? 0),
            'usados' => (int) ($resumen->usados ?? 0),
        ];
    }
}
