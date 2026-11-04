<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Cliente;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Usuario;
use App\Models\Venta;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function ReporteVentas(Request $request)
    {
        try {

            // =====================================
            // FILTROS
            // =====================================

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            // =====================================
            // CONSULTA
            // =====================================

            $ventas = Venta::with([
                'cliente',
                'usuario',
                'metodoPago',
                'detalles' => function ($q) {
                    $q->select('id_venta', 'cantidad_venta');
                },
            ])
                ->when($fechaInicio && $fechaFin, function ($query) use ($fechaInicio, $fechaFin) {

                    $query->whereBetween(
                        'fecha_venta',
                        [
                            $fechaInicio.' 00:00:00',
                            $fechaFin.' 23:59:59',
                        ]
                    );

                })
                ->orderByDesc('id_venta')
                ->when($limite, function ($query) use ($limite) {
                    $query->limit((int) $limite);
                })
                ->get();

            // =====================================
            // SOLO ACTIVAS
            // =====================================

            $ventasActivas = $ventas->where(
                'estado_venta',
                1
            );

            // =====================================
            // DATOS
            // =====================================

            $datos = $ventas->map(function ($venta) {

                $productosVendidos =
                    $venta->detalles->sum('cantidad_venta');

                return [

                    'id_venta' => $venta->id_venta,

                    'numero_factura' => $venta->numero_factura,

                    'fecha_venta' => \Carbon\Carbon::parse(
                        $venta->fecha_venta
                    )->format('d/m/Y h:i A'),

                    'cliente' => $venta->cliente
                        ->nombre_cliente

                        ?? 'Consumidor Final',

                    'usuario' => $venta->usuario
                        ->nombre_usuario

                        ?? '-',

                    'productos_vendidos' => $productosVendidos,

                    'subtotal' => 'C$ '.number_format(
                        $venta->subtotal_venta,
                        2
                    ),

                    'impuesto' => 'C$ '.number_format(
                        $venta->impuesto_venta,
                        2
                    ),

                    'total' => 'C$ '.number_format(
                        $venta->total_venta,
                        2
                    ),

                    'metodo_pago' => $venta->metodoPago
                        ->nombre_metodo_pago

                        ?? '-',

                    'monto_recibido' => 'C$ '.number_format(
                        $venta->monto_recibido,
                        2
                    ),

                    'vuelto' => 'C$ '.number_format(
                        $venta->vuelto,
                        2
                    ),

                    'estado' => $venta->estado_venta
                            ? 'Activa'
                            : 'Anulada',

                ];

            });

            // =====================================
            // RESPONSE
            // =====================================

            return response()->json([

                'success' => true,

                // =====================================
                // COLUMNAS
                // =====================================

                'columnas' => [

                    [
                        'data' => 'id_venta',
                        'title' => 'ID',
                    ],

                    [
                        'data' => 'numero_factura',
                        'title' => 'Factura',
                    ],

                    [
                        'data' => 'fecha_venta',
                        'title' => 'Fecha Venta',
                    ],

                    [
                        'data' => 'cliente',
                        'title' => 'Cliente',
                    ],

                    [
                        'data' => 'usuario',
                        'title' => 'Usuario',
                    ],

                    [
                        'data' => 'productos_vendidos',
                        'title' => 'Prod',
                    ],

                    [
                        'data' => 'subtotal',
                        'title' => 'Subtotal',
                    ],

                    [
                        'data' => 'impuesto',
                        'title' => 'Imp',
                    ],

                    [
                        'data' => 'total',
                        'title' => 'Total',
                    ],

                    [
                        'data' => 'metodo_pago',
                        'title' => 'Método Pago',
                    ],

                    [
                        'data' => 'monto_recibido',
                        'title' => 'Recibido',
                    ],

                    [
                        'data' => 'vuelto',
                        'title' => 'Vuelto',
                    ],

                    [
                        'data' => 'estado',
                        'title' => 'Estado',
                    ],

                ],

                // =====================================
                // DATOS
                // =====================================

                'datos' => $datos,

                // =====================================
                // FOOTER
                // =====================================

                'tfoot' => [

                    'total_ventas' => $ventas->count(),

                    'ventas_activas' => $ventasActivas->count(),

                    'ventas_canceladas' => $ventas
                        ->where('estado_venta', 0)
                        ->count(),

                    'productos_vendidos' => $ventas->sum(function ($venta) {

                        return $venta->detalles
                            ->sum('cantidad_venta');

                    }),

                    'subtotal_general' => number_format(

                        $ventasActivas
                            ->sum('subtotal_venta'),

                        2

                    ),

                    'impuesto_general' => number_format(

                        $ventasActivas
                            ->sum('impuesto_venta'),

                        2

                    ),

                    'total_general' => 'C$'.number_format(

                        $ventasActivas
                            ->sum('total_venta'),

                        2

                    ),

                    'ticket_promedio' => 'C$'.number_format(

                        $ventasActivas->count() > 0

                            ? $ventasActivas
                                ->avg('total_venta')

                            : 0,

                        2

                    ),

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'mensaje' => 'Error al generar reporte de ventas',

                'error' => $e->getMessage(),

            ], 500);

        }
    }

    public function ReporteInventario(Request $request)
    {
        try {

            // =====================================
            // FILTROS
            // =====================================

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            // =====================================
            // CONSULTA
            // =====================================

            $productos = Producto::with([
                'categoria',
                'ubicacion',
                'impuesto',
            ])
                ->when($fechaInicio && $fechaFin, function ($query) use ($fechaInicio, $fechaFin) {

                    $query->whereBetween(
                        'fecha_creacion_producto',
                        [
                            $fechaInicio.' 00:00:00',
                            $fechaFin.' 23:59:59',
                        ]
                    );

                })
                ->orderByDesc('id_producto')

            // ->limit($limite)
                ->get();

            // =====================================
            // DATOS
            // =====================================

            $datos = $productos->map(function ($producto) {

                // =====================================
                // IMPUESTO
                // =====================================

                $porcentajeImpuesto =
                    $producto->impuesto->porcentaje_impuesto ?? 0;

                // =====================================
                // PRECIOS
                // =====================================

                $precioCompra =
                    $producto->precio_compra;

                $precioVentaConIVA =
                    $producto->precio_venta;

                // =====================================
                // PRECIO SIN IVA
                // =====================================

                $precioVentaSinIVA =
                    $porcentajeImpuesto > 0

                    ? $precioVentaConIVA /
                        (1 + ($porcentajeImpuesto / 100))

                    : $precioVentaConIVA;

                // =====================================
                // PORCENTAJE GANANCIA
                // =====================================

                $porcentajeGanancia =
                    $precioCompra > 0

                    ? (
                        (
                            $precioVentaSinIVA -
                            $precioCompra
                        ) / $precioCompra
                    ) * 100

                    : 0;

                // =====================================
                // GANANCIA DINERO
                // =====================================

                $gananciaPorUnidad =
                    $precioVentaSinIVA -
                    $precioCompra;

                // =====================================
                // VALORES INVENTARIO
                // =====================================

                $valorInventarioCompra =
                    $producto->stock_actual *
                    $precioCompra;

                $valorInventarioVenta =
                    $producto->stock_actual *
                    $precioVentaConIVA;

                return [

                    'id_producto' => $producto->id_producto,

                    'nombre_producto' => $producto->nombre_producto,

                    'categoria' => $producto->categoria
                        ->nombre_categoria

                        ?? 'Sin Categoria',

                    'ubicacion' => $producto->ubicacion
                        ->nombre_ubicacion

                        ?? '-',

                    'impuesto' => $porcentajeImpuesto.' %',

                    'precio_compra' => 'C$ '.number_format(
                        $precioCompra,
                        2
                    ),

                    'precio_venta_sin_iva' => 'C$ '.number_format(
                        $precioVentaSinIVA,
                        2
                    ),

                    'precio_venta_con_iva' => 'C$ '.number_format(
                        $precioVentaConIVA,
                        2
                    ),

                    'porcentaje_ganancia' => number_format(
                        $porcentajeGanancia,
                        2
                    ).'%',

                    'ganancia_unidad' => 'C$ '.number_format(
                        $gananciaPorUnidad,
                        2
                    ),

                    'stock_actual' => $producto->stock_actual,

                    'valor_inventario_compra' => 'C$ '.number_format(
                        $valorInventarioCompra,
                        2
                    ),

                    'valor_inventario_venta' => 'C$ '.number_format(
                        $valorInventarioVenta,
                        2
                    ),

                    'fecha_entrada' => \Carbon\Carbon::parse(
                        $producto->fecha_creacion_producto
                    )->format('d/m/Y'),

                ];

            });

            // =====================================
            // FOOTER
            // =====================================

            $valorTotalCompra = $productos->sum(function ($producto) {

                return
                    $producto->stock_actual *
                    $producto->precio_compra;

            });

            $valorTotalVenta = $productos->sum(function ($producto) {

                return
                    $producto->stock_actual *
                    $producto->precio_venta;

            });

            // =====================================
            // RESPONSE
            // =====================================

            return response()->json([

                'success' => true,

                // =====================================
                // COLUMNAS
                // =====================================

                'columnas' => [

                    [
                        'data' => 'id_producto',
                        'title' => 'ID',
                    ],

                    [
                        'data' => 'nombre_producto',
                        'title' => 'Producto',
                    ],

                    [
                        'data' => 'categoria',
                        'title' => 'Categoría',
                    ],

                    [
                        'data' => 'ubicacion',
                        'title' => 'Ubicación',
                    ],

                    [
                        'data' => 'impuesto',
                        'title' => 'TASA',
                    ],

                    [
                        'data' => 'precio_compra',
                        'title' => 'P. Compra',
                    ],

                    [
                        'data' => 'precio_venta_sin_iva',
                        'title' => 'P. Venta',
                    ],

                    [
                        'data' => 'precio_venta_con_iva',
                        'title' => 'V. Final',
                    ],

                    [
                        'data' => 'porcentaje_ganancia',
                        'title' => '% Gan',
                    ],
                    [
                        'data' => 'ganancia_unidad',
                        'title' => 'Gan/U',
                    ],
                    [
                        'data' => 'stock_actual',
                        'title' => 'Stock',
                    ],

                    [
                        'data' => 'valor_inventario_compra',
                        'title' => 'Inversion Total',
                    ],

                    [
                        'data' => 'valor_inventario_venta',
                        'title' => 'Ganancia Total',
                    ],

                    [
                        'data' => 'fecha_entrada',
                        'title' => 'Fecha Ent',
                    ],

                ],

                // =====================================
                // DATOS
                // =====================================

                'datos' => $datos,

                // =====================================
                // FOOTER
                // =====================================

                'tfoot' => [

                    'total_productos' => $productos->count(),

                    'stock_total' => $productos->sum('stock_actual'),

                    'valor_total_compra' => number_format(
                        $valorTotalCompra,
                        2
                    ),

                    'valor_total_venta' => number_format(
                        $valorTotalVenta,
                        2
                    ),

                    'ganancia_potencial' => number_format(
                        $valorTotalVenta -
                        $valorTotalCompra,
                        2
                    ),

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'mensaje' => 'Error al generar reporte inventario',

                'error' => $e->getMessage(),

            ], 500);

        }
    }

    public function ReporteMovimientoInventario(Request $request)
    {
        try {

            // =====================================
            // FILTROS
            // =====================================

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            // =====================================
            // CONSULTA
            // =====================================

            $movimientos = MovimientoInventario::with([
                'producto',
                'usuario',
            ])
                ->when($fechaInicio && $fechaFin, function ($query) use ($fechaInicio, $fechaFin) {

                    $query->whereBetween(
                        'fecha_movimiento',
                        [
                            $fechaInicio.' 00:00:00',
                            $fechaFin.' 23:59:59',
                        ]
                    );

                })
                ->orderByDesc('id_movimiento_inventario')
                ->limit($limite)
                ->get();

            // =====================================
            // DATOS
            // =====================================

            $datos = $movimientos->map(function ($movimiento) {

                $precioUnitario = $movimiento->precio_unitario ?? 0;

                return [

                    'id_movimiento' => $movimiento->id_movimiento_inventario,

                    'producto' => $movimiento->producto->nombre_producto ?? '-',

                    'tipo_movimiento' => $movimiento->tipo_movimiento,

                    'cantidad_movimiento' => $movimiento->cantidad_movimiento,

                    'stock_resultante' => $movimiento->stock_resultante,

                    'motivo_movimiento' => $movimiento->motivo_movimiento ?? '-',

                    'tipo_referencia' => $movimiento->tipo_referencia ?? '-',

                    'precio_unitario' => $movimiento->precio_unitario !== null
                            ? 'C$ '.number_format($precioUnitario, 2)
                            : '-',

                    'total_movimiento' => $movimiento->precio_unitario !== null
                            ? 'C$ '.number_format(
                                $precioUnitario * $movimiento->cantidad_movimiento,
                                2
                            )
                            : '-',

                    'usuario' => $movimiento->usuario->nombre_usuario ?? '-',

                    'fecha_movimiento' => \Carbon\Carbon::parse(
                        $movimiento->fecha_movimiento
                    )->format('d/m/Y h:i A'),

                ];

            });

            // =====================================
            // FOOTER
            // =====================================

            $totalValor = $movimientos->sum(function ($movimiento) {

                return
                    ($movimiento->precio_unitario ?? 0) *
                    $movimiento->cantidad_movimiento;

            });

            // =====================================
            // RESPONSE
            // =====================================

            return response()->json([

                'success' => true,

                // =====================================
                // COLUMNAS
                // =====================================

                'columnas' => [

                    ['data' => 'id_movimiento', 'title' => 'ID'],
                    ['data' => 'producto', 'title' => 'Producto'],
                    ['data' => 'tipo_movimiento', 'title' => 'Movimiento'],
                    ['data' => 'cantidad_movimiento', 'title' => 'Cant'],
                    ['data' => 'stock_resultante', 'title' => 'Stock Actual'],
                    ['data' => 'motivo_movimiento', 'title' => 'Motivo'],
                    ['data' => 'tipo_referencia', 'title' => 'Referencia'],
                    ['data' => 'precio_unitario', 'title' => 'P. Unit'],
                    ['data' => 'total_movimiento', 'title' => 'T. Movimiento'],
                    ['data' => 'usuario', 'title' => 'Usuario'],
                    ['data' => 'fecha_movimiento', 'title' => 'Fecha / Hora'],

                ],

                // =====================================
                // DATOS
                // =====================================

                'datos' => $datos,

                // =====================================
                // TFOOT
                // =====================================

                'tfoot' => [

                    'total_movimientos' => $movimientos->count(),

                    'total_entradas' => $movimientos->where('tipo_movimiento', 'ENTRADA')
                        ->sum('cantidad_movimiento'),

                    'total_salidas' => $movimientos->where('tipo_movimiento', 'SALIDA')
                        ->sum('cantidad_movimiento'),

                    'total_ajustes' => $movimientos->where('tipo_movimiento', 'AJUSTE')
                        ->sum('cantidad_movimiento'),

                    'valor_total_movimientos' => number_format($totalValor, 2),

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,
                'mensaje' => 'Error al generar reporte de movimientos inventario',
                'error' => $e->getMessage(),

            ], 500);
        }
    }

    public function ReporteClientes(Request $request)
    {
        try {

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            $clientes = Cliente::with([
                'ventas.metodoPago',
            ])
                ->orderByDesc('id_cliente')
                ->limit($limite)->get();

            $datos = $clientes->map(function ($cliente) use ($fechaInicio, $fechaFin) {

                // =====================================
                // FILTRO POR FECHA DE REGISTRO
                // =====================================

                if ($fechaInicio && $fechaFin) {

                    if (
                        $cliente->fecha_creacion_cliente < $fechaInicio.' 00:00:00' ||
                        $cliente->fecha_creacion_cliente > $fechaFin.' 23:59:59'
                    ) {
                        return null;
                    }

                }

                // =====================================
                // VENTAS
                // =====================================

                $ventas = $cliente->ventas;

                // =====================================
                // ESTADISTICAS
                // =====================================

                $comprasRealizadas = $ventas->count();

                $totalGastado = $ventas->sum('total_venta');

                $ticketPromedio =
                    $comprasRealizadas > 0
                        ? $totalGastado / $comprasRealizadas
                        : 0;

                $ultimaCompra =
                    $ventas->sortByDesc('fecha_venta')->first();

                $primeraCompra =
                    $ventas->sortBy('fecha_venta')->first();

                // =====================================
                // METODO PAGO FAVORITO
                // =====================================

                $metodoFavorito = '-';

                if ($ventas->count() > 0) {

                    $metodo = $ventas
                        ->groupBy('id_metodo_pago')
                        ->sortByDesc(function ($grupo) {
                            return $grupo->count();
                        })
                        ->first();

                    if ($metodo && $metodo->first()->metodoPago) {

                        $metodoFavorito =
                            $metodo->first()
                                ->metodoPago
                                ->nombre_metodo_pago;
                    }
                }

                return [

                    'id_cliente' => $cliente->id_cliente,

                    'nombre_cliente' => $cliente->nombre_cliente,

                    'telefono_cliente' => $cliente->telefono_cliente ?? '-',

                    'correo_cliente' => $cliente->correo_cliente ?? '-',

                    'estado_cliente' => $cliente->estado_cliente ? 'Activo' : 'Inactivo',

                    'compras_realizadas' => $comprasRealizadas,

                    'total_gastado' => 'C$ '.number_format($totalGastado, 2),

                    'ticket_promedio' => 'C$ '.number_format($ticketPromedio, 2),

                    'metodo_pago_favorito' => $metodoFavorito,

                    'primera_compra' => $primeraCompra
                            ? \Carbon\Carbon::parse($primeraCompra->fecha_venta)
                                ->format('d/m/Y')
                            : '-',

                    'ultima_compra' => $ultimaCompra
                            ? \Carbon\Carbon::parse($ultimaCompra->fecha_venta)
                                ->format('d/m/Y')
                            : '-',

                    'fecha_registro' => \Carbon\Carbon::parse($cliente->fecha_creacion_cliente)
                        ->format('d/m/Y'),

                ];

            })

            // quitar nulls del filtro
                ->filter()
                ->values()
                ->sortByDesc(function ($cliente) {
                    return (float) str_replace(',', '', $cliente['total_gastado']);
                })
                ->values();

            return response()->json([

                'success' => true,

                'columnas' => [

                    ['data' => 'id_cliente', 'title' => 'ID'],
                    ['data' => 'nombre_cliente', 'title' => 'Cliente'],
                    ['data' => 'telefono_cliente', 'title' => 'Teléfono'],
                    ['data' => 'correo_cliente', 'title' => 'Correo'],
                    ['data' => 'estado_cliente', 'title' => 'Estado'],
                    ['data' => 'compras_realizadas', 'title' => '# Compras'],
                    ['data' => 'total_gastado', 'title' => 'Total Gastado'],
                    ['data' => 'ticket_promedio', 'title' => 'Gasto Prom'],
                    ['data' => 'metodo_pago_favorito', 'title' => 'Método Favorito'],
                    ['data' => 'primera_compra', 'title' => '1ra Compra'],
                    ['data' => 'ultima_compra', 'title' => 'Ult. Compra'],
                    ['data' => 'fecha_registro', 'title' => 'Registro'],
                ],

                'datos' => $datos,

                'tfoot' => [

                    'total_clientes' => $clientes->count(),

                    'clientes_activos' => $clientes->where('estado_cliente', 1)->count(),

                    'ingresos_totales' => number_format(
                        $clientes->sum(function ($cliente) {
                            return $cliente->ventas->sum('total_venta');
                        }),
                        2
                    ),

                    'cliente_top' => $datos->first()['nombre_cliente'] ?? '-',

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,
                'mensaje' => 'Error al generar reporte de clientes',
                'error' => $e->getMessage(),

            ], 500);
        }
    }

    public function ReporteUsuarios(Request $request)
    {
        try {

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            $usuarios = Usuario::with([
                'rol',
                'ventas.metodoPago',
            ])
                ->orderByDesc('id_usuario')
                ->limit($limite)
                ->get();

            $datos = $usuarios->map(function ($usuario) use ($fechaInicio, $fechaFin) {

                // =====================================
                // FILTRO POR FECHA DE REGISTRO
                // =====================================

                if ($fechaInicio && $fechaFin) {

                    if (
                        $usuario->fecha_creacion_usuario < $fechaInicio.' 00:00:00' ||
                        $usuario->fecha_creacion_usuario > $fechaFin.' 23:59:59'
                    ) {
                        return null;
                    }

                }

                // =====================================
                // VENTAS
                // =====================================

                $ventas = $usuario->ventas;

                // =====================================
                // VENTAS ACTIVAS
                // =====================================

                $ventasActivas = $ventas->where('estado_venta', 1);

                // =====================================
                // FACTURAS ANULADAS
                // =====================================

                $ventasAnuladas = $ventas->where('estado_venta', 0);

                // =====================================
                // ESTADISTICAS
                // =====================================

                $ventasRealizadas = $ventasActivas->count();

                $facturasAnuladas = $ventasAnuladas->count();

                $dineroGenerado = $ventasActivas->sum('total_venta');

                $ticketPromedio = $ventasRealizadas > 0
                    ? $dineroGenerado / $ventasRealizadas
                    : 0;

                // =====================================
                // METODO PAGO MAS USADO
                // =====================================

                $metodoMasUsado = '-';

                if ($ventasActivas->count() > 0) {

                    $metodo = $ventasActivas
                        ->groupBy('id_metodo_pago')
                        ->sortByDesc(function ($grupo) {
                            return $grupo->count();
                        })
                        ->first();

                    if ($metodo && $metodo->first()->metodoPago) {

                        $metodoMasUsado =
                            $metodo->first()
                                ->metodoPago
                                ->nombre_metodo_pago;
                    }
                }

                // =====================================
                // PRIMERA Y ULTIMA VENTA
                // =====================================

                $primeraVenta = $ventasActivas->sortBy('fecha_venta')->first();

                $ultimaVenta = $ventasActivas->sortByDesc('fecha_venta')->first();

                return [

                    'id_usuario' => $usuario->id_usuario,

                    'nombre_completo' => $usuario->nombre_completo_usuario,

                    'nombre_usuario' => $usuario->nombre_usuario,

                    'rol' => $usuario->rol->nombre_rol ?? '-',

                    'estado' => $usuario->estado_usuario ? 'Activo' : 'Inactivo',

                    'ventas_realizadas' => $ventasRealizadas,

                    'facturas_anuladas' => $facturasAnuladas,

                    'dinero_generado' => 'C$ '.number_format($dineroGenerado, 2),

                    'ticket_promedio' => 'C$ '.number_format($ticketPromedio, 2),

                    'metodo_mas_usado' => $metodoMasUsado,

                    'primera_venta' => $primeraVenta
                            ? \Carbon\Carbon::parse($primeraVenta->fecha_venta)
                                ->format('d/m/Y')
                            : '-',

                    'ultima_venta' => $ultimaVenta
                            ? \Carbon\Carbon::parse($ultimaVenta->fecha_venta)
                                ->format('d/m/Y')
                            : '-',

                    'fecha_registro' => \Carbon\Carbon::parse($usuario->fecha_creacion_usuario)
                        ->format('d/m/Y'),

                ];

            })

            // quitar nulls por filtro de registro
                ->filter()
                ->values()

            // =====================================
            // ORDENAR TOP VENDEDORES
            // =====================================
                ->sortByDesc(function ($usuario) {
                    return (float) str_replace(',', '', $usuario['dinero_generado']);
                })
                ->values();

            return response()->json([

                'success' => true,

                'columnas' => [

                    ['data' => 'id_usuario', 'title' => 'ID'],
                    ['data' => 'nombre_completo', 'title' => 'Nombre Completo'],
                    ['data' => 'nombre_usuario', 'title' => 'Usuario'],
                    ['data' => 'rol', 'title' => 'Rol'],
                    ['data' => 'estado', 'title' => 'Estado'],
                    ['data' => 'ventas_realizadas', 'title' => 'Ventas'],
                    ['data' => 'facturas_anuladas', 'title' => 'Anulada'],
                    ['data' => 'dinero_generado', 'title' => 'V. Total'],
                    ['data' => 'ticket_promedio', 'title' => 'V. Promedio'],
                    ['data' => 'metodo_mas_usado', 'title' => 'Método Más Usado'],
                    ['data' => 'primera_venta', 'title' => '1ra. Venta'],
                    ['data' => 'ultima_venta', 'title' => 'Ult. Venta'],
                    ['data' => 'fecha_registro', 'title' => 'Registro'],
                ],

                'datos' => $datos,

                'tfoot' => [

                    'usuarios_totales' => $usuarios->count(),

                    'usuarios_activos' => $usuarios->where('estado_usuario', 1)->count(),

                    'ventas_totales' => $datos->sum('ventas_realizadas'),

                    'facturas_anuladas_totales' => $datos->sum('facturas_anuladas'),

                    'dinero_total_generado' => number_format(
                        $usuarios->sum(function ($usuario) {
                            return $usuario->ventas
                                ->where('estado_venta', 1)
                                ->sum('total_venta');
                        }),
                        2
                    ),

                    'mejor_vendedor' => $datos->first()['nombre_completo'] ?? '-',

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,
                'mensaje' => 'Error al generar reporte de usuarios',
                'error' => $e->getMessage(),

            ], 500);
        }
    }

    public function ReporteCajas(Request $request)
    {
        try {

            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            $limite = $request->limite;

            // si viene vacío o no numérico, no aplicar límite
            if (! is_numeric($limite) || (int) $limite <= 0) {
                $limite = null;
            } else {
                $limite = (int) $limite;
            }

            $cajas = Caja::with([
                'usuario',
                'movimientos',
            ])
                ->when($fechaInicio && $fechaFin, function ($query) use ($fechaInicio, $fechaFin) {

                    $query->whereBetween(
                        'fecha_apertura',
                        [
                            $fechaInicio.' 00:00:00',
                            $fechaFin.' 23:59:59',
                        ]
                    );

                })->orderByDesc('id_caja')
                ->limit($limite)->get();

            $datos = $cajas->map(function ($caja) {

                // =====================================
                // DURACION SESION
                // =====================================

                $duracionSesion = 'Caja Abierta';

                if ($caja->fecha_cierre) {

                    $inicio = \Carbon\Carbon::parse($caja->fecha_apertura);
                    $fin = \Carbon\Carbon::parse($caja->fecha_cierre);

                    $diff = $inicio->diff($fin);

                    $duracionSesion = "{$diff->h}h {$diff->i}m";
                }

                // =====================================
                // MOVIMIENTOS
                // =====================================

                $ingresos = $caja->movimientos
                    ->where('tipo_movimiento_caja', 'INGRESO')
                    ->sum('monto_movimiento_caja');

                $salidas = $caja->movimientos
                    ->where('tipo_movimiento_caja', 'SALIDA')
                    ->sum('monto_movimiento_caja');

                return [

                    'id_caja' => $caja->id_caja,

                    'usuario' => $caja->usuario->nombre_completo_usuario
                        ?? '-',

                    'fecha_apertura' => \Carbon\Carbon::parse(
                        $caja->fecha_apertura
                    )->format('d/m/Y h:i A'),

                    'fecha_cierre' => $caja->fecha_cierre

                            ? \Carbon\Carbon::parse(
                                $caja->fecha_cierre
                            )->format('d/m/Y h:i A')

                            : 'Caja Abierta',

                    'duracion_sesion' => $duracionSesion,

                    'monto_inicial' => 'C$ '.number_format(
                        $caja->monto_inicial,
                        2
                    ),

                    'monto_final' => $caja->monto_final !== null

                            ? 'C$ '.number_format(
                                $caja->monto_final,
                                2
                            )

                            : '-',
                    /*
                    'monto_teorico' =>

                        $caja->monto_teorico !== null

                            ? 'C$ ' . number_format(
                                $caja->monto_teorico,
                                2
                            )

                            : '-',

                    'monto_real' =>

                        $caja->monto_real !== null

                            ? 'C$ ' . number_format(
                                $caja->monto_real,
                                2
                            )

                            : '-',

                    'diferencia' =>

                        $caja->diferencia !== null

                            ? 'C$ ' . number_format(
                                $caja->diferencia,
                                2
                            )

                            : '-',

                            */

                    'total_ingresos' => 'C$ '.number_format($ingresos, 2),

                    'total_salidas' => 'C$ '.number_format($salidas, 2),

                    'balance_caja' => 'C$ '.number_format(
                        $ingresos - $salidas,
                        2
                    ),

                ];

            });

            return response()->json([

                'success' => true,

                // =====================================
                // COLUMNAS
                // =====================================

                'columnas' => [

                    [
                        'data' => 'id_caja',
                        'title' => 'ID',
                    ],

                    [
                        'data' => 'usuario',
                        'title' => 'Usuario',
                    ],

                    [
                        'data' => 'fecha_apertura',
                        'title' => 'Fecha Apertura',
                    ],

                    [
                        'data' => 'fecha_cierre',
                        'title' => 'Fecha Cierre',
                    ],

                    [
                        'data' => 'duracion_sesion',
                        'title' => 'Duracion',
                    ],

                    [
                        'data' => 'monto_inicial',
                        'title' => 'Monto Ini',
                    ],

                    [
                        'data' => 'monto_final',
                        'title' => 'Monto Fin',
                    ],
                    /*
                    [
                        'data'  => 'monto_teorico',
                        'title' => 'Monto Teórico'
                    ],

                    [
                        'data'  => 'monto_real',
                        'title' => 'Monto Real'
                    ],

                    [
                        'data'  => 'diferencia',
                        'title' => 'Diferencia'
                    ],
                    */
                    [
                        'data' => 'total_ingresos',
                        'title' => 'Ingresos',
                    ],

                    [
                        'data' => 'total_salidas',
                        'title' => 'Salidas',
                    ],

                    [
                        'data' => 'balance_caja',
                        'title' => 'Balance',
                    ],

                ],

                // =====================================
                // DATOS
                // =====================================

                'datos' => $datos,

                // =====================================
                // FOOTER
                // =====================================

                'tfoot' => [

                    'total_cajas' => $cajas->count(),

                    'total_ingresos' => number_format(

                        $cajas->sum(function ($caja) {

                            return $caja->movimientos
                                ->where(
                                    'tipo_movimiento_caja',
                                    'INGRESO'
                                )
                                ->sum(
                                    'monto_movimiento_caja'
                                );

                        }),

                        2

                    ),

                    'total_salidas' => 'C$ '.number_format(

                        $cajas->sum(function ($caja) {

                            return $caja->movimientos
                                ->where(
                                    'tipo_movimiento_caja',
                                    'SALIDA'
                                )
                                ->sum(
                                    'monto_movimiento_caja'
                                );

                        }),

                        2

                    ),

                    'diferencia_total' => number_format(

                        $cajas->sum('diferencia'),

                        2

                    ),

                ],

            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'mensaje' => 'Error al generar reporte de cajas',

                'error' => $e->getMessage(),

            ], 500);

        }
    }
}
