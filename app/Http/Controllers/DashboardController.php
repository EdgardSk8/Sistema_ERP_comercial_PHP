<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    //  GRAFICA DE VENTAS
    public function Ventas(Request $request)
    {
        $tipo = $request->get('tipo', 'dia');
        $inicio = $request->inicio;
        $fin = $request->fin;
        $query = Venta::query()->where('estado_venta', 1);

        // FILTRO FECHAS
        if ($inicio && $fin) {
            $query->whereBetween('fecha_venta', [$inicio.' 00:00:00', $fin.' 23:59:59']);
        }

        // DATASET PRINCIPAL (grafica 1 y grafica 2)
        switch ($tipo) {

            case 'dia':

                $ventas = (clone $query)
                    ->selectRaw('DAYOFWEEK(fecha_venta) as orden')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_venta) as total')
                    ->groupBy('orden')->orderBy('orden')->get();

                $dias = [2 => 'Lunes', 3 => 'Martes', 4 => 'Miércoles', 5 => 'Jueves', 6 => 'Viernes', 7 => 'Sábado', 1 => 'Domingo'];
                $grafica = collect();

                foreach ($dias as $orden => $nombre) {
                    $venta = $ventas->firstWhere('orden', $orden);
                    $grafica->push(['label' => $nombre, 'cantidad' => (int) ($venta->cantidad ?? 0), 'total' => round((float) ($venta->total ?? 0), 2)]);
                }

                break;

            case 'mes':

                $ventas = (clone $query)
                    ->selectRaw('MONTH(fecha_venta) as mes')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_venta) as total')
                    ->groupBy('mes')->get()->keyBy('mes');

                $meses = [
                    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 5 => 'Mayo', 6 => 'Junio',
                    7 => 'Julio', 8 => 'Agosto', 9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
                ];

                $grafica = collect();

                foreach ($meses as $numero => $nombre) {
                    $venta = $ventas->get($numero);
                    $grafica->push(['label' => $nombre, 'cantidad' => (int) ($venta->cantidad ?? 0), 'total' => round((float) ($venta->total ?? 0), 2)]);
                }

                break;

            case 'anio':

                $grafica = (clone $query)
                    ->selectRaw('YEAR(fecha_venta) as label')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_venta) as total')
                    ->groupBy(DB::raw('YEAR(fecha_venta)'))
                    ->orderBy('label')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'label' => $item->label,
                            'cantidad' => (int) $item->cantidad,
                            'total' => round((float) $item->total, 2),
                        ];
                    });

                break;

            default: $grafica = collect();
                break;

        }

        $respuesta = [];

        // GRAFICAS 1 Y 2 MISMO DATASET
        $respuesta['grafica_1'] = $grafica;
        $respuesta['grafica_2'] = $grafica;

        // GRAFICA 3 VENTAS POR HORA
        $respuesta['grafica_3'] = (clone $query)
            ->selectRaw('HOUR(fecha_venta) as hora')
            ->selectRaw('COUNT(*) as cantidad')
            ->selectRaw('SUM(total_venta) as total')
            ->groupBy('hora')->orderBy('hora')->get()
            ->map(function ($item) {
                return ['label' => sprintf('%02d:00', $item->hora), 'cantidad' => (int) $item->cantidad, 'total' => round((float) $item->total, 2)];
            });

        // TABLA PRODUCTOS MAS VENDIDOS
        $respuesta['tabla_1'] = (clone $query)
            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->selectRaw('productos.nombre_producto as label')
            ->selectRaw('SUM(detalle_ventas.cantidad_venta) as cantidad')
            ->selectRaw('SUM(detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto) as total ')
            ->groupBy('productos.id_producto', 'productos.nombre_producto')->orderByDesc('cantidad')->limit(10)->get();

        // KPIS (5 OBLIGATORIO)
        $respuesta['kpis'] = [

            'ingresos' => [
                'titulo' => 'INGRESO BRUTO',
                'valor' => 'C$ '.number_format(round((float) ((clone $query)->sum('total_venta') ?? 0), 2), 2, ',', '.'),
                'tooltip' => 'Ingresos brutos totales generados',
                'icono' => 'fas fa-dollar-sign',
            ],

            'total_ventas' => [
                'titulo' => 'VENTAS TOTALES',
                'valor' => number_format((clone $query)->count(), 0, ',', '.'),
                'tooltip' => 'Total de Ventas Registradas',
                'icono' => 'fas fa-cash-register',
            ],

            'unidades_vendidas' => [
                'titulo' => 'UNIDADES VENDIDAS',
                'valor' => number_format(
                    (clone $query)->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
                        ->sum('detalle_ventas.cantidad_venta'), 0, ',', '.'),
                'tooltip' => 'Unidades vendidas en total',
                'icono' => 'fas fa-boxes',
            ],

            'promedio_venta' => [
                'titulo' => 'TICKET PROMEDIO',
                'valor' => 'C$ '.number_format(round((float) ((clone $query)->avg('total_venta') ?? 0), 2), 2, ',', '.'),
                'tooltip' => 'Promedio por cada venta',
                'icono' => 'fas fa-shopping-cart',
            ],

        ];

        // TEXTOS UI GRAFICAS Y TABLAS
        $respuesta['ui'] = [

            'grafica_1' => [
                'titulo' => 'Ingreso por Ventas',
                'dataset' => 'Ingresos (C$)',
                'labels' => [
                    'cantidad' => ' Ventas',
                    'total' => ' Ingresos',
                ],
            ],

            'grafica_2' => [
                'titulo' => 'Número de Ventas',
                'dataset' => 'Cantidad de Ventas',
                'labels' => [
                    'cantidad' => ' Ventas',
                ],
            ],

            'grafica_3' => [
                'titulo' => 'Ventas por Horas',
                'dataset' => 'Ventas',
                'labels' => [
                    'cantidad' => ' Ventas',
                    'total' => ' Ingresos',
                ],
            ],

            'tabla_1' => [
                'titulo' => 'Productos Más Vendidos',
                'vacio' => 'Sin productos vendidos',
                'columnas' => [
                    'label' => 'Producto',
                    'cantidad' => 'Cantidad',
                    'total' => 'Ingresos',
                ],
            ],

        ];

        return response()->json($respuesta);

    }

    // GRAFICA DE GANANCIAS
    public function Ganancias(Request $request)
    {

        $tipo = $request->get('tipo', 'dia');
        $inicio = $request->inicio;
        $fin = $request->fin;

        $query = Venta::query()->where('estado_venta', 1);
        // FILTRO FECHAS
        if ($inicio && $fin) {
            $query->whereBetween('fecha_venta', [$inicio.' 00:00:00', $fin.' 23:59:59']);
        }

        // 📸 Costo histórico: usa el snapshot congelado al momento de la venta;
        // las ventas antiguas sin snapshot caen al costo vigente de la variante o del producto.
        $costoSQL = 'COALESCE(detalle_ventas.costo_unitario_venta, variacion_tallas.precio_compra, productos.precio_compra, 0)';
        $gananciaSQL = "SUM((detalle_ventas.precio_unitario_venta - $costoSQL) * detalle_ventas.cantidad_venta)";

        $margen = (clone $query)
            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->leftJoin('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')
            ->selectRaw("$gananciaSQL AS ganancia, SUM(detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto) AS ventas")->first();

        $porcentaje = ($margen && $margen->ventas > 0) ? ($margen->ganancia / $margen->ventas) * 100 : 0;
        $gananciaTotal = (float) ($margen->ganancia ?? 0);
        $cantidadVentas = (clone $query)->count();

        // DATASET PRINCIPAL (grafica 1)
        $graficaQuery = (clone $query)
            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->leftJoin('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla');

        switch ($tipo) {

            case 'dia':

                $ganancias = (clone $graficaQuery)
                    ->selectRaw('DAYOFWEEK(fecha_venta) as orden')
                    ->selectRaw('COUNT(DISTINCT ventas.id_venta) as cantidad')
                    ->selectRaw("$gananciaSQL as ganancia")
                    ->groupBy('orden')
                    ->orderBy('orden')
                    ->get();

                $dias = [
                    2 => 'Lunes',
                    3 => 'Martes',
                    4 => 'Miércoles',
                    5 => 'Jueves',
                    6 => 'Viernes',
                    7 => 'Sábado',
                    1 => 'Domingo',
                ];

                $grafica = collect();

                foreach ($dias as $orden => $nombre) {

                    $venta = $ganancias->firstWhere('orden', $orden);

                    $grafica->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($venta->cantidad ?? 0),
                        'total' => round((float) ($venta->ganancia ?? 0), 2),
                    ]);

                }

                break;

            case 'mes':

                $ganancias = (clone $graficaQuery)
                    ->selectRaw("MONTH(fecha_venta) as mes, COUNT(DISTINCT ventas.id_venta) as cantidad, $gananciaSQL as ganancia")
                    ->groupBy('mes')
                    ->orderBy('mes')
                    ->get()
                    ->keyBy('mes');

                $meses = [
                    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
                ];

                $grafica = collect();

                foreach ($meses as $numero => $nombre) {

                    $venta = $ganancias->get($numero);

                    $grafica->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($venta->cantidad ?? 0),
                        'total' => round((float) ($venta->ganancia ?? 0), 2),
                    ]);

                }

                break;

            case 'anio':

                $grafica = (clone $graficaQuery)

                    ->selectRaw('YEAR(fecha_venta) as label')
                    ->selectRaw('COUNT(DISTINCT ventas.id_venta) as cantidad')
                    ->selectRaw("$gananciaSQL as ganancia")

                    ->groupBy(DB::raw('YEAR(fecha_venta)'))
                    ->orderBy('label')

                    ->get()
                    ->map(function ($item) {
                        return [
                            'label' => $item->label,
                            'cantidad' => (int) $item->cantidad,
                            'total' => round((float) $item->ganancia, 2),
                        ];
                    });

                break;

            default: $grafica = collect();
                break;

        }

        $respuesta = [];

        $respuesta['grafica_1'] = $grafica;

        $gananciasPorCategoria = (clone $query)
            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->leftJoin('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')
            ->join('categoria', 'productos.id_categoria', '=', 'categoria.id_categoria')
            ->selectRaw("
                categoria.nombre_categoria as label,
                SUM(detalle_ventas.cantidad_venta) as cantidad,
                SUM(detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto) as total,
                $gananciaSQL as ganancia
            ")
            ->groupBy('categoria.id_categoria', 'categoria.nombre_categoria')->orderByDesc('ganancia')->limit(10)->get();

        $respuesta['grafica_2'] = $gananciasPorCategoria->take(10)
            ->map(function ($item) {

                return [
                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->ganancia, 2),
                ];

            });

        // GRAFICA 3 GANANCIA POR HORA
        $respuesta['grafica_3'] = (clone $query)

            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->leftJoin('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')

            ->selectRaw('HOUR(fecha_venta) as hora')
            ->selectRaw('COUNT(DISTINCT ventas.id_venta) as cantidad')
            ->selectRaw("$gananciaSQL as ganancia")->groupBy('hora')->orderBy('hora')->get()

            ->map(function ($item) {

                return [
                    'label' => sprintf('%02d:00', $item->hora),
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->ganancia, 2),
                ];

            });

        // TABLA PRODUCTOS MAYOR GANANCIA
        $respuesta['tabla_1'] = (clone $query)

            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('productos', 'detalle_ventas.id_producto', '=', 'productos.id_producto')
            ->leftJoin('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')

            ->selectRaw('productos.nombre_producto as label')
            ->selectRaw('SUM(detalle_ventas.cantidad_venta) as cantidad')
            ->selectRaw('SUM(detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto) as total')
            ->selectRaw("$gananciaSQL as ganancia")
            ->groupBy('productos.id_producto', 'productos.nombre_producto')->orderByDesc('ganancia')->limit(10)->get()
            ->map(function ($item) {
                return [
                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->ganancia, 2),
                    'total_venta' => round((float) $item->total, 2),
                ];
            });

        // KPIS
        $categoriaMasRentable = $gananciasPorCategoria->first();
        $respuesta['kpis'] = [

            'ganancia_total' => [
                'titulo' => 'UTILIDAD BRUTA',
                'valor' => 'C$ '.number_format(
                    round($gananciaTotal, 2),
                    2,
                    ',',
                    '.'
                ),
                'tooltip' => 'Ganancia generada',
                'icono' => 'fas fa-money-bill-wave',
            ],

            'margen_ganancia' => [
                'titulo' => 'PORCENTAJE DE GANANCIA',
                'valor' => number_format($porcentaje, 2, ',', '.').' %',
                'tooltip' => 'Porcentaje de utilidad sobre las ventas',
                'icono' => 'fas fa-percent',
            ],

            'ganancia_promedio' => [
                'titulo' => 'GANANCIA PROMEDIO',
                'valor' => 'C$ '.number_format(
                    round($cantidadVentas > 0 ? $gananciaTotal / $cantidadVentas : 0, 2), 2, ',', '.'),
                'tooltip' => 'Ganancia promedio por venta',
                'icono' => 'fas fa-chart-line',
            ],

            'categoria_mas_rentable' => [

                'titulo' => 'CATEGORÍA MÁS RENTABLE',

                'valor' => $categoriaMasRentable
                    ? 'C$ '.number_format((float) $categoriaMasRentable->ganancia, 2, ',', '.').' ('.$categoriaMasRentable->label.')'
                    : 'Sin datos',

                'tooltip' => 'Categoría que genera mayor utilidad',

                'icono' => 'fas fa-crown',

            ],

        ];

        // TEXTOS UI
        $respuesta['ui'] = [

            'grafica_1' => [
                'titulo' => 'Ganancias por Ventas',
                'dataset' => 'Ganancia (C$)',
                'labels' => [
                    'cantidad' => ' Ventas',
                    'total' => ' Ganancias',
                ],
            ],

            'grafica_2' => [
                'titulo' => 'Ganancia por Categoría',
                'dataset' => 'Ganancia (C$)',
                'labels' => [
                    'cantidad' => ' Unidades vendidas',
                    'total' => ' Ganancia',
                ],
            ],

            'grafica_3' => [
                'titulo' => 'Ganancias por Hora',
                'dataset' => 'Ganancia',
                'labels' => [
                    'cantidad' => ' Ventas',
                    'total' => 'Ganancias',
                ],
            ],

            'tabla_1' => [
                'titulo' => 'Productos Mas Rentables',
                'vacio' => 'Sin ganancias registradas',
                'columnas' => [
                    'label' => 'Producto',
                    'cantidad' => 'Cantidad',
                    'total' => 'Ganancias',
                ],
            ],

        ];

        return response()->json($respuesta);

    }

    public function Compras(Request $request)
    {
        $tipo = $request->get('tipo', 'dia');
        $inicio = $request->inicio;
        $fin = $request->fin;

        $query = Compra::query()->where('estado_compra', 1);

        // FILTRO FECHAS
        if ($inicio && $fin) {
            $query->whereBetween('fecha_compra', [
                $inicio.' 00:00:00',
                $fin.' 23:59:59',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 1 - COMPRAS POR TIEMPO
        |--------------------------------------------------------------------------
        */

        switch ($tipo) {

            case 'dia':

                $grafica = (clone $query)
                    ->selectRaw('DAYOFWEEK(fecha_compra) as orden')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_compra) as total')
                    ->groupBy('orden')
                    ->orderBy('orden')
                    ->get();

                $dias = [
                    2 => 'Lunes',
                    3 => 'Martes',
                    4 => 'Miércoles',
                    5 => 'Jueves',
                    6 => 'Viernes',
                    7 => 'Sábado',
                    1 => 'Domingo',
                ];

                $resultado = collect();

                foreach ($dias as $orden => $nombre) {

                    $item = $grafica->firstWhere('orden', $orden);

                    $resultado->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($item->cantidad ?? 0),
                        'total' => round((float) ($item->total ?? 0), 2),
                    ]);
                }

                $grafica = $resultado;

                break;

            case 'mes':

                $compras = (clone $query)
                    ->selectRaw('MONTH(fecha_compra) as mes')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_compra) as total')
                    ->groupBy('mes')
                    ->get()
                    ->keyBy('mes');

                $meses = [
                    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 5 => 'Mayo', 6 => 'Junio',
                    7 => 'Julio', 8 => 'Agosto', 9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
                ];

                $grafica = collect();

                foreach ($meses as $numero => $nombre) {

                    $compra = $compras->get($numero);

                    $grafica->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($compra->cantidad ?? 0),
                        'total' => round((float) ($compra->total ?? 0), 2),
                    ]);

                }

                break;

            case 'anio':

                $grafica = (clone $query)
                    ->selectRaw('YEAR(fecha_compra) as label')
                    ->selectRaw('COUNT(*) as cantidad')
                    ->selectRaw('SUM(total_compra) as total')
                    ->groupBy(DB::raw('YEAR(fecha_compra)'))
                    ->orderBy('label')
                    ->get();

                break;

            default:

                $grafica = collect();

                break;
        }

        $respuesta = [];

        $respuesta['grafica_1'] = $grafica;

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 2 - CATEGORIAS CON MAYOR INVERSION
        |--------------------------------------------------------------------------
        */

        $respuesta['grafica_2'] = (clone $query)

            ->join(
                'detalle_compras',
                'compras.id_compra',
                '=',
                'detalle_compras.id_compra'
            )

            ->join(
                'productos',
                'detalle_compras.id_producto',
                '=',
                'productos.id_producto'
            )

            ->join(
                'categoria',
                'productos.id_categoria',
                '=',
                'categoria.id_categoria'
            )

            ->selectRaw('
                categoria.nombre_categoria as label,
                SUM(detalle_compras.cantidad_compra) as cantidad,
                SUM(detalle_compras.subtotal_detalle_compra) as total
            ')

            ->groupBy('categoria.nombre_categoria')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 3 - PRODUCTOS COMPRADOS POR CANTIDAD
        |--------------------------------------------------------------------------
        */

        $respuesta['grafica_3'] = (clone $query)

            ->join(
                'detalle_compras',
                'compras.id_compra',
                '=',
                'detalle_compras.id_compra'
            )

            ->join(
                'productos',
                'detalle_compras.id_producto',
                '=',
                'productos.id_producto'
            )

            ->selectRaw('
                productos.nombre_producto as label,
                SUM(detalle_compras.cantidad_compra) as cantidad,
                SUM(detalle_compras.subtotal_detalle_compra) as total
            ')

            ->groupBy(
                'productos.id_producto',
                'productos.nombre_producto'
            )

            ->orderByDesc('cantidad')
            ->limit(10)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | TABLA PRODUCTOS MAS COMPRADOS
        |--------------------------------------------------------------------------
        */

        $respuesta['tabla_1'] = (clone $query)

            ->join(
                'detalle_compras',
                'compras.id_compra',
                '=',
                'detalle_compras.id_compra'
            )

            ->join(
                'productos',
                'detalle_compras.id_producto',
                '=',
                'productos.id_producto'
            )

            ->selectRaw('
                productos.nombre_producto as label,
                SUM(detalle_compras.cantidad_compra) as cantidad,
                SUM(detalle_compras.subtotal_detalle_compra) as total
            ')

            ->groupBy(
                'productos.id_producto',
                'productos.nombre_producto'
            )

            ->orderByDesc('cantidad')
            ->limit(10)

            ->get()

            ->map(function ($item) {

                return [
                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->total, 2),
                ];

            });

        /*
        |--------------------------------------------------------------------------
        | KPIS
        |--------------------------------------------------------------------------
        */

        $totalCompras = (clone $query)
            ->sum('total_compra');

        $cantidadCompras = (clone $query)
            ->count();

        $promedioCompra = $cantidadCompras > 0
            ? $totalCompras / $cantidadCompras
            : 0;

        $proveedor = (clone $query)

            ->join(
                'proveedores',
                'compras.id_proveedor',
                '=',
                'proveedores.id_proveedor'
            )

            ->selectRaw('
                proveedores.nombre_proveedor,
                SUM(compras.total_compra) as total
            ')

            ->groupBy('proveedores.nombre_proveedor')

            ->orderByDesc('total')

            ->first();

        $respuesta['kpis'] = [

            'total_comprado' => [
                'titulo' => 'TOTAL COMPRADO',
                'valor' => 'C$ '.number_format($totalCompras, 2, ',', '.'),
                'tooltip' => 'Monto total invertido en compras',
                'icono' => 'fas fa-shopping-cart',
            ],

            'cantidad_compras' => [
                'titulo' => 'CANTIDAD DE COMPRAS',
                'valor' => $cantidadCompras,
                'tooltip' => 'Número de compras realizadas',
                'icono' => 'fas fa-file-invoice',
            ],

            'compra_promedio' => [
                'titulo' => 'COMPRA PROMEDIO',
                'valor' => 'C$ '.number_format($promedioCompra, 2, ',', '.'),
                'tooltip' => 'Promedio gastado por compra',
                'icono' => 'fas fa-chart-line',
            ],

            'proveedor_principal' => [
                'titulo' => 'PROVEEDOR PRINCIPAL',
                'valor' => $proveedor
                    ? 'C$ '.number_format($proveedor->total, 2, ',', '.')
                    .' ('.$proveedor->nombre_proveedor.')'
                    : 'Sin datos',
                'tooltip' => 'Proveedor con mayor inversión',
                'icono' => 'fas fa-truck',
            ],

        ];

        /*
        |--------------------------------------------------------------------------
        | TEXTOS UI
        |--------------------------------------------------------------------------
        */

        $respuesta['ui'] = [

            'grafica_1' => [
                'titulo' => 'Compras por periodo',
                'dataset' => 'Compras (C$)',
                'labels' => [
                    'cantidad' => ' Compras',
                    'total' => ' Inversion',
                ],
            ],

            'grafica_2' => [
                'titulo' => 'Categorías con mayor inversión',
                'dataset' => 'Compras',
                'labels' => [
                    'cantidad' => ' Cantidad',
                    'total' => ' Total',
                ],
            ],

            'grafica_3' => [
                'titulo' => 'Productos más comprados',
                'dataset' => 'Cantidad',
                'labels' => [
                    'cantidad' => ' Unidades',
                    'total' => ' Inversión',
                ],
            ],

            'tabla_1' => [
                'titulo' => 'Productos más comprados',
                'vacio' => 'Sin compras registradas',
                'columnas' => [
                    'label' => 'Producto',
                    'cantidad' => 'Cantidad',
                    'total' => 'Total',
                ],
            ],

        ];

        return response()->json($respuesta);
    }

    public function Cajas(Request $request)
    {
        $tipo = $request->get('tipo', 'dia');
        $inicio = $request->inicio;
        $fin = $request->fin;

        $query = Venta::query()->where('estado_venta', 1);

        // FILTRO FECHAS
        if ($inicio && $fin) {
            $query->whereBetween('fecha_venta', [
                $inicio.' 00:00:00',
                $fin.' 23:59:59',
            ]);
        }

        // ============================
        // GRAFICA 1 (INGRESOS POR CAJA)
        // ============================

        switch ($tipo) {

            case 'dia':

                $aperturas = (clone $query)

                    ->join('cajas', 'ventas.id_caja', '=', 'cajas.id_caja')

                    ->selectRaw('DAYOFWEEK(ventas.fecha_venta) as orden')
                    ->selectRaw('COUNT(DISTINCT cajas.id_caja) as cantidad')
                    ->selectRaw('SUM(ventas.total_venta) as total')

                    ->groupBy('orden')
                    ->get()
                    ->keyBy('orden');

                $dias = [
                    2 => 'Lunes',
                    3 => 'Martes',
                    4 => 'Miércoles',
                    5 => 'Jueves',
                    6 => 'Viernes',
                    7 => 'Sábado',
                    1 => 'Domingo',
                ];

                $grafica = collect();

                foreach ($dias as $orden => $nombre) {

                    $dato = $aperturas->get($orden);

                    $grafica->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($dato->cantidad ?? 0),
                        'total' => round((float) ($dato->total ?? 0), 2),
                    ]);
                }

                break;

            case 'mes':

                $aperturas = (clone $query)

                    ->join('cajas', 'ventas.id_caja', '=', 'cajas.id_caja')

                    ->selectRaw('MONTH(ventas.fecha_venta) as mes')
                    ->selectRaw('COUNT(DISTINCT cajas.id_caja) as cantidad')
                    ->selectRaw('SUM(ventas.total_venta) as total')

                    ->groupBy('mes')
                    ->get()
                    ->keyBy('mes');

                $meses = [
                    1 => 'Enero',
                    2 => 'Febrero',
                    3 => 'Marzo',
                    4 => 'Abril',
                    5 => 'Mayo',
                    6 => 'Junio',
                    7 => 'Julio',
                    8 => 'Agosto',
                    9 => 'Septiembre',
                    10 => 'Octubre',
                    11 => 'Noviembre',
                    12 => 'Diciembre',
                ];

                $grafica = collect();

                foreach ($meses as $mes => $nombre) {

                    $dato = $aperturas->get($mes);

                    $grafica->push([
                        'label' => $nombre,
                        'cantidad' => (int) ($dato->cantidad ?? 0),
                        'total' => round((float) ($dato->total ?? 0), 2),
                    ]);
                }

                break;

            case 'anio':

                $grafica = (clone $query)

                    ->join('cajas', 'ventas.id_caja', '=', 'cajas.id_caja')

                    ->selectRaw('YEAR(ventas.fecha_venta) as label')
                    ->selectRaw('COUNT(DISTINCT cajas.id_caja) as cantidad')
                    ->selectRaw('SUM(ventas.total_venta) as total')

                    ->groupBy(DB::raw('YEAR(ventas.fecha_venta)'))
                    ->orderBy('label')

                    ->get()

                    ->map(function ($item) {

                        return [
                            'label' => $item->label,
                            'cantidad' => (int) $item->cantidad,
                            'total' => round((float) $item->total, 2),
                        ];

                    });

                break;
        }

        $respuesta = [];

        $respuesta['grafica_1'] = $grafica;

        // ==================================
        // GRAFICA 2 (USUARIO VS INGRESOS)
        // ==================================

        $respuesta['grafica_2'] = (clone $query)

            ->join('usuarios', 'ventas.id_usuario', '=', 'usuarios.id_usuario')

            ->selectRaw('usuarios.nombre_completo_usuario as label')
            ->selectRaw('COUNT(ventas.id_venta) as cantidad')
            ->selectRaw('SUM(ventas.total_venta) as total')

            ->groupBy(
                'usuarios.id_usuario',
                'usuarios.nombre_completo_usuario'
            )

            ->orderByDesc('total')

            ->get()

            ->map(function ($item) {

                return [

                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->total, 2),

                ];

            });

        // ==================================
        // GRAFICA 3 (METODOS DE PAGO)
        // ==================================

        $respuesta['grafica_3'] = (clone $query)

            ->join('metodos_pago', 'ventas.id_metodo_pago', '=', 'metodos_pago.id_metodo_pago')

            ->selectRaw('metodos_pago.nombre_metodo_pago as label')
            ->selectRaw('COUNT(ventas.id_venta) as cantidad')
            ->selectRaw('SUM(ventas.total_venta) as total')

            ->groupBy(
                'metodos_pago.id_metodo_pago',
                'metodos_pago.nombre_metodo_pago'
            )

            ->orderByDesc('total')

            ->get()

            ->map(function ($item) {

                return [

                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->total, 2),

                ];

            });

        // ==================================
        // TABLA 1
        // ==================================

        $respuesta['tabla_1'] = (clone $query)

            ->join('metodos_pago', 'ventas.id_metodo_pago', '=', 'metodos_pago.id_metodo_pago')

            ->selectRaw('metodos_pago.nombre_metodo_pago as label')
            ->selectRaw('COUNT(ventas.id_venta) as cantidad')
            ->selectRaw('SUM(ventas.total_venta) as total')

            ->groupBy(
                'metodos_pago.id_metodo_pago',
                'metodos_pago.nombre_metodo_pago'
            )

            ->orderByDesc('total')

            ->get()

            ->map(function ($item) {

                return [

                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->total, 2),

                ];

            });

        // ==================================
        // KPIS
        // ==================================

        $respuesta['kpis'] = [

            'ingresos' => [

                'titulo' => 'INGRESOS EN CAJA',

                'valor' => 'C$ '.number_format(
                    round((float) ((clone $query)->sum('total_venta') ?? 0), 2),
                    2,
                    ',',
                    '.'
                ),

                'tooltip' => 'Dinero vendido en el periodo',

                'icono' => 'fas fa-cash-register',

            ],

            'cajas' => [

                'titulo' => 'CAJAS UTILIZADAS',

                'valor' => number_format(
                    (clone $query)
                        ->distinct('id_caja')
                        ->count('id_caja'),
                    0,
                    ',',
                    '.'
                ),

                'tooltip' => 'Cantidad de cajas con ventas',

                'icono' => 'fas fa-cash-register',

            ],

            'ventas' => [

                'titulo' => 'VENTAS REALIZADAS',

                'valor' => number_format(
                    (clone $query)->count(),
                    0,
                    ',',
                    '.'
                ),

                'tooltip' => 'Ventas registradas',

                'icono' => 'fas fa-shopping-cart',

            ],

            'mejor_caja' => [

                'titulo' => 'CAJA MÁS PRODUCTIVA',

                'valor' => (function () use ($query) {

                    $caja = (clone $query)

                        ->selectRaw('id_caja')
                        ->selectRaw('SUM(total_venta) as total')

                        ->groupBy('id_caja')

                        ->orderByDesc('total')

                        ->first();

                    if (! $caja) {
                        return 'Sin datos';
                    }

                    return 'Caja #'.$caja->id_caja.
                        ' (C$ '.
                        number_format($caja->total, 2, ',', '.').
                        ')';

                })(),

                'tooltip' => 'Caja con mayores ingresos',

                'icono' => 'fas fa-trophy',

            ],

        ];

        // ==================================
        // UI
        // ==================================

        $respuesta['ui'] = [

            'grafica_1' => [

                'titulo' => 'Ingresos por Fecha de Venta',
                'dataset' => 'Ingresos',

                'labels' => [

                    'cantidad' => 'Cajas utilizadas',
                    'total' => 'Ingresos',

                ],

            ],

            'grafica_2' => [

                'titulo' => 'Rendimiento por Usuario',
                'dataset' => 'Ingresos',

                'labels' => [

                    'cantidad' => ' Ventas',
                    'total' => ' Ingresos',

                ],

            ],

            'grafica_3' => [

                'titulo' => 'Métodos de Pago',
                'dataset' => 'Ingresos',

                'labels' => [

                    'cantidad' => ' Ventas',
                    'total' => ' Ingresos',

                ],

            ],

            'tabla_1' => [

                'titulo' => 'Resumen por Método de Pago',
                'vacio' => 'Sin ventas registradas',

                'columnas' => [

                    'label' => 'Método',
                    'cantidad' => 'Ventas',
                    'total' => 'Ingresos',

                ],

            ],

        ];

        return response()->json($respuesta);

    }

    public function Movimientoinventario(Request $request)
    {
        $tipo = $request->get('tipo', 'dia');
        $vista = $request->get('vista', 'todo');

        $inicio = $request->inicio;
        $fin = $request->fin;
        /* ═══════════════
        QUERY BASE
        ═══════════════ */

        $baseQuery = MovimientoInventario::query();

        if ($inicio && $fin) {

            $baseQuery->whereBetween('fecha_movimiento', [
                $inicio.' 00:00:00',
                $fin.' 23:59:59',
            ]);

        }

        $respuesta = [];

        /* ═══════════════
        GRÁFICA PRINCIPAL
        ═══════════════ */

        if ($vista == 'grafica' || $vista == 'todo') {

            switch ($tipo) {

                case 'dia':

                    $grafica = (clone $baseQuery)

                        ->selectRaw(
                            "DATE_FORMAT(fecha_movimiento,'%Y-%m-%d') as label"
                        )

                        ->selectRaw("
                            SUM(CASE 
                                WHEN tipo_movimiento='ENTRADA'
                                THEN cantidad_movimiento 
                                ELSE 0 END
                            ) as entradas,

                            SUM(CASE 
                                WHEN tipo_movimiento='SALIDA'
                                THEN cantidad_movimiento 
                                ELSE 0 END
                            ) as salidas,

                            SUM(CASE 
                                WHEN tipo_movimiento='AJUSTE'
                                THEN cantidad_movimiento 
                                ELSE 0 END
                            ) as ajustes
                        ")

                        ->groupBy(
                            DB::raw(
                                "DATE_FORMAT(fecha_movimiento,'%Y-%m-%d')"
                            )
                        )

                        ->orderBy('label')
                        ->get();

                    break;

                case 'mes':

                    $grafica = (clone $baseQuery)

                        ->selectRaw(
                            "DATE_FORMAT(fecha_movimiento,'%Y-%m') as label"
                        )

                        ->selectRaw("
                            SUM(CASE WHEN tipo_movimiento='ENTRADA'
                                THEN cantidad_movimiento ELSE 0 END) as entradas,

                            SUM(CASE WHEN tipo_movimiento='SALIDA'
                                THEN cantidad_movimiento ELSE 0 END) as salidas,

                            SUM(CASE WHEN tipo_movimiento='AJUSTE'
                                THEN cantidad_movimiento ELSE 0 END) as ajustes
                        ")

                        ->groupBy(
                            DB::raw(
                                "DATE_FORMAT(fecha_movimiento,'%Y-%m')"
                            )
                        )

                        ->orderBy('label')
                        ->get();

                    break;

                case 'anio':

                    $grafica = (clone $baseQuery)

                        ->selectRaw(
                            'YEAR(fecha_movimiento) as label'
                        )

                        ->selectRaw("
                            SUM(CASE WHEN tipo_movimiento='ENTRADA'
                                THEN cantidad_movimiento ELSE 0 END) as entradas,

                            SUM(CASE WHEN tipo_movimiento='SALIDA'
                                THEN cantidad_movimiento ELSE 0 END) as salidas,

                            SUM(CASE WHEN tipo_movimiento='AJUSTE'
                                THEN cantidad_movimiento ELSE 0 END) as ajustes
                        ")

                        ->groupBy(
                            DB::raw(
                                'YEAR(fecha_movimiento)'
                            )
                        )

                        ->orderBy('label')
                        ->get();

                    break;

                default:

                    $grafica = collect();

                    break;

            }

            $respuesta['grafica'] = $grafica;

        }

        /* ═══════════════
        KPIS
        ═══════════════ */

        if ($vista == 'kpis' || $vista == 'todo') {

            $totalMovimientos = (clone $baseQuery)
                ->count();

            $entradas = (clone $baseQuery)

                ->where(
                    'tipo_movimiento',
                    'ENTRADA'
                )

                ->sum('cantidad_movimiento');

            $salidas = (clone $baseQuery)

                ->where(
                    'tipo_movimiento',
                    'SALIDA'
                )

                ->sum('cantidad_movimiento');

            $ajustes = (clone $baseQuery)

                ->where(
                    'tipo_movimiento',
                    'AJUSTE'
                )

                ->sum('cantidad_movimiento');

            $balance = ($entradas + $ajustes) - $salidas;

            $promedioMovimiento = $totalMovimientos > 0

                ? round(
                    ($entradas + $salidas + $ajustes)
                    / $totalMovimientos,
                    2
                )

                : 0;

            $respuesta['kpis'] = [

                'total_movimientos' => [
                    'titulo' => 'Movimientos',
                    'valor' => number_format($totalMovimientos, 0, ',', '.'),
                    'tooltip' => 'Total de movimientos registrados',
                    'icono' => 'fas fa-exchange-alt',
                ],

                'entradas' => [
                    'titulo' => 'Entradas',
                    'valor' => number_format($entradas, 0, ',', '.'),
                    'tooltip' => 'Productos ingresados',
                    'icono' => 'fas fa-arrow-down',
                ],

                'salidas' => [
                    'titulo' => 'Salidas',
                    'valor' => number_format($salidas, 0, ',', '.'),
                    'tooltip' => 'Productos retirados',
                    'icono' => 'fas fa-arrow-up',
                ],

                'ajustes' => [
                    'titulo' => 'Ajustes',
                    'valor' => number_format($ajustes, 0, ',', '.'),
                    'tooltip' => 'Ajustes de inventario',
                    'icono' => 'fas fa-sliders-h',
                ],

                'balance' => [
                    'titulo' => 'Balance',
                    'valor' => number_format($balance, 0, ',', '.'),
                    'tooltip' => 'Balance neto de inventario',
                    'icono' => 'fas fa-boxes',
                ],

                'promedio' => [
                    'titulo' => 'Promedio',
                    'valor' => number_format($promedioMovimiento,2,',','.'),
                    'tooltip' => 'Promedio por movimiento',
                    'icono' => 'fas fa-chart-line',
                ],

            ];

        }

        return response()->json($respuesta);
    }

    // GRAFICA DE TALLAS
    public function Tallas(Request $request)
    {
        $inicio = $request->inicio;
        $fin = $request->fin;

        $query = Venta::query()->where('estado_venta', 1);

        // FILTRO FECHAS
        if ($inicio && $fin) {
            $query->whereBetween('fecha_venta', [
                $inicio.' 00:00:00',
                $fin.' 23:59:59',
            ]);
        }

        $respuesta = [];

        /*
        |--------------------------------------------------------------------------
        | DATASET PRINCIPAL - TALLAS CON MAYOR MOVIMIENTO
        |--------------------------------------------------------------------------
        */

        $tallas = (clone $query)

            ->join('detalle_ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
            ->join('variacion_tallas', 'detalle_ventas.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')
            ->join('tallas', 'variacion_tallas.id_talla', '=', 'tallas.id_talla')

            ->selectRaw('tallas.talla as label')
            ->selectRaw('SUM(detalle_ventas.cantidad_venta) as cantidad')
            ->selectRaw('SUM(detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto) as total')

            ->groupBy('tallas.id_talla', 'tallas.talla')
            ->orderByDesc('cantidad')
            ->get()

            ->map(function ($item) {

                return [
                    'label' => $item->label,
                    'cantidad' => (int) $item->cantidad,
                    'total' => round((float) $item->total, 2),
                ];

            });

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 1 - UNIDADES POR TALLA
        |--------------------------------------------------------------------------
        */

        $respuesta['grafica_1'] = $tallas;

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 2 - PARTICIPACION DE TALLAS
        |--------------------------------------------------------------------------
        */

        $respuesta['grafica_2'] = $tallas->take(10)->values();

        /*
        |--------------------------------------------------------------------------
        | GRAFICA 3 - INGRESOS POR TALLA
        |--------------------------------------------------------------------------
        */

        $respuesta['grafica_3'] = $tallas
            ->sortByDesc('total')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | TABLA 1 - TALLAS MAS VENDIDAS
        |--------------------------------------------------------------------------
        */

        $respuesta['tabla_1'] = $tallas->take(10)->values();

        /*
        |--------------------------------------------------------------------------
        | KPIS
        |--------------------------------------------------------------------------
        */

        $unidades = $tallas->sum('cantidad');
        $ingresos = $tallas->sum('total');

        $tallaMasVendida = $tallas->first();

        $tallaMasRentable = $tallas
            ->sortByDesc('total')
            ->first();

        $respuesta['kpis'] = [

            'unidades' => [
                'titulo' => 'UNIDADES VENDIDAS',
                'valor' => number_format($unidades, 0, ',', '.'),
                'tooltip' => 'Unidades vendidas con talla registrada',
                'icono' => 'fas fa-boxes',
            ],

            'talla_mas_vendida' => [
                'titulo' => 'TALLA MAS VENDIDA',
                'valor' => $tallaMasVendida
                    ? $tallaMasVendida['label'].' ('.number_format($tallaMasVendida['cantidad'], 0, ',', '.').')'
                    : 'Sin datos',
                'tooltip' => 'Talla con mayor cantidad de unidades vendidas',
                'icono' => 'fas fa-crown',
            ],

            'talla_mas_rentable' => [
                'titulo' => 'TALLA MAS RENTABLE',
                'valor' => $tallaMasRentable
                    ? 'C$ '.number_format($tallaMasRentable['total'], 2, ',', '.').' ('.$tallaMasRentable['label'].')'
                    : 'Sin datos',
                'tooltip' => 'Talla que genera mayores ingresos',
                'icono' => 'fas fa-money-bill-wave',
            ],

            'promedio_talla' => [
                'titulo' => 'PROMEDIO POR TALLA',
                'valor' => number_format($tallas->count() > 0 ? $unidades / $tallas->count() : 0, 0, ',', '.'),
                'tooltip' => 'Promedio de unidades vendidas por talla',
                'icono' => 'fas fa-chart-line',
            ],

        ];

        /*
        |--------------------------------------------------------------------------
        | TEXTOS UI
        |--------------------------------------------------------------------------
        */

        $respuesta['ui'] = [

            'grafica_1' => [
                'titulo' => 'Tallas con mayor movimiento',
                'dataset' => 'Unidades vendidas',
                'labels' => [
                    'cantidad' => ' Unidades',
                    'total' => ' Ingresos',
                ],
            ],

            'grafica_2' => [
                'titulo' => 'Participacion por talla',
                'dataset' => 'Unidades',
                'labels' => [
                    'cantidad' => ' Unidades',
                    'total' => ' Ingresos',
                ],
            ],

            'grafica_3' => [
                'titulo' => 'Ingresos por talla',
                'dataset' => 'Ingresos',
                'labels' => [
                    'cantidad' => ' Unidades',
                    'total' => ' Ingresos',
                ],
            ],

            'tabla_1' => [
                'titulo' => 'Tallas mas vendidas',
                'vacio' => 'Sin tallas vendidas',
                'columnas' => [
                    'label' => 'Talla',
                    'cantidad' => 'Unidades',
                    'total' => 'Ingresos',
                ],
            ],

        ];

        return response()->json($respuesta);
    }
}
