<?php

namespace Tests\Feature;

use App\Http\Controllers\FacturacionController;
use App\Models\Caja;
use App\Models\Categoria;
use App\Models\Impuesto;
use App\Models\Producto;
use App\Models\ProductoVariacion;
use App\Models\Talla;
use App\Models\Usuario;
use App\Models\VariacionTalla;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

class InventarioVariacionTest extends TestCase
{
    public function test_vender_variacion_descuenta_tambien_el_stock_general_del_producto(): void
    {
        $usuario = Usuario::query()->firstOrFail();

        Caja::query()->update(['estado_caja' => 0]);
        $caja = Caja::query()->firstOrCreate(
            ['estado_caja' => 1],
            [
                'fecha_apertura' => now(),
                'monto_inicial' => 0,
                'monto_final' => 0,
                'id_usuario' => $usuario->id_usuario,
            ]
        );

        $categoria = Categoria::query()->firstOrFail();
        $impuesto = Impuesto::query()->firstOrFail();
        $talla = Talla::query()->firstOrFail();

        $producto = Producto::create([
            'nombre_producto' => 'Producto variación test ' . uniqid(),
            'descripcion_producto' => 'Test de stock general',
            'id_categoria' => $categoria->id_categoria,
            'id_impuesto' => $impuesto->id_impuesto,
            'id_medida' => null,
            'id_ubicacion' => null,
            'imagen_producto' => null,
            'precio_compra' => 30,
            'precio_venta' => 50,
            'stock_actual' => 6,
            'estado_producto' => true,
            'fecha_creacion_producto' => now(),
        ]);

        $variacion = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Azul-' . uniqid(),
            'estado_variacion' => true,
        ]);

        $variacionTalla = VariacionTalla::create([
            'id_variacion' => $variacion->id_variacion,
            'id_talla' => $talla->id_talla,
            'stock' => 6,
            'precio_venta' => 50,
        ]);

        Session::put('usuario.id', $usuario->id_usuario);

        $request = new Request([
            'cliente' => null,
            'id_metodo_pago' => 1,
            'recibido' => 100,
            'carrito' => [[
                'id' => $producto->id_producto,
                'cantidad' => 2,
                'id_variacion_talla' => $variacionTalla->id_variacion_talla,
            ]],
        ]);

        app(FacturacionController::class)->FacturarProductosPOS($request);

        $producto->refresh();
        $variacionTalla->refresh();

        $this->assertSame(4, $producto->stock_actual);
        $this->assertSame(4, $variacionTalla->stock);
    }
}
