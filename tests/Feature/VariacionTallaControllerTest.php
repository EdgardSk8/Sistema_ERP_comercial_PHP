<?php

namespace Tests\Feature;

use App\Http\Controllers\VariacionTallaController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\VariacionImagenController;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\ProductoVariacion;
use App\Models\Talla;
use App\Models\VariacionTalla;
use App\Models\VariacionImagen;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Session;
use Illuminate\Http\Request;
use Tests\TestCase;

class VariacionTallaControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['movimientos_inventario', 'variacion_imagenes', 'variacion_tallas', 'producto_variaciones', 'tallas', 'productos', 'categoria', 'impuestos', 'ubicaciones'] as $tabla) {
            Schema::dropIfExists($tabla);
        }

        Schema::create('productos', function (Blueprint $table) {
            $table->increments('id_producto');
            $table->string('nombre_producto');
            $table->text('descripcion_producto')->nullable();
            $table->unsignedInteger('id_categoria')->default(1);
            $table->unsignedInteger('id_impuesto')->default(1);
            $table->unsignedInteger('id_ubicacion')->nullable();
            $table->unsignedBigInteger('id_medida')->nullable();
            $table->string('imagen_producto')->nullable();
            $table->unsignedInteger('stock_actual')->default(0);
            $table->decimal('precio_compra', 10, 2)->default(0);
            $table->decimal('precio_venta', 10, 2)->default(0);
            $table->boolean('estado_producto')->default(true);
            $table->dateTime('fecha_creacion_producto')->nullable();
        });

        Schema::create('categoria', function (Blueprint $table) {
            $table->increments('id_categoria');
            $table->string('nombre_categoria');
        });

        Schema::create('impuestos', function (Blueprint $table) {
            $table->increments('id_impuesto');
            $table->string('nombre_impuesto');
            $table->decimal('porcentaje_impuesto', 5, 2)->default(0);
        });

        Schema::create('ubicaciones', function (Blueprint $table) {
            $table->increments('id_ubicacion');
            $table->string('nombre_ubicacion');
        });

        Schema::create('producto_variaciones', function (Blueprint $table) {
            $table->increments('id_variacion');
            $table->unsignedInteger('id_producto');
            $table->string('color');
            $table->boolean('estado_variacion')->default(true);
        });

        Schema::create('tallas', function (Blueprint $table) {
            $table->increments('id_talla');
            $table->string('talla');
            $table->boolean('estado_talla')->default(true);
        });

        Schema::create('variacion_tallas', function (Blueprint $table) {
            $table->increments('id_variacion_talla');
            $table->unsignedInteger('id_variacion');
            $table->unsignedInteger('id_talla');
            $table->unsignedInteger('stock')->default(0);
            $table->string('sku')->nullable()->unique();
            $table->decimal('precio_compra', 10, 2)->nullable();
            $table->decimal('precio_venta', 10, 2)->nullable();
            $table->unique(['id_variacion', 'id_talla']);
        });

        Schema::create('variacion_imagenes', function (Blueprint $table) {
            $table->increments('id_imagen');
            $table->unsignedInteger('id_variacion');
            $table->string('imagen');
            $table->unsignedInteger('orden')->default(0);
        });

        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->increments('id_movimiento_inventario');
            $table->unsignedInteger('id_producto');
            $table->unsignedInteger('id_variacion_talla')->nullable();
            $table->string('tipo_movimiento');
            $table->unsignedInteger('cantidad_movimiento');
            $table->unsignedInteger('stock_resultante');
            $table->string('motivo_movimiento')->nullable();
            $table->unsignedInteger('id_referencia')->nullable();
            $table->string('tipo_referencia')->nullable();
            $table->decimal('precio_unitario', 10, 2)->nullable();
            $table->dateTime('fecha_movimiento');
            $table->unsignedInteger('id_usuario')->nullable();
        });
    }

    public function test_stock_de_tallas_de_todos_los_colores_no_supera_stock_del_producto(): void
    {
        $producto = Producto::create([
            'nombre_producto' => 'Zapato deportivo',
            'stock_actual' => 6,
            'precio_compra' => 30,
            'precio_venta' => 50,
        ]);
        $variacionNegra = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Negro',
            'estado_variacion' => true,
        ]);
        $variacionBlanca = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Blanco',
            'estado_variacion' => true,
        ]);
        $talla = Talla::create(['talla' => '40', 'estado_talla' => true]);
        $otraTalla = Talla::create(['talla' => '41', 'estado_talla' => true]);
        $controller = app(VariacionTallaController::class);

        $primera = $controller->CrearVariacionTalla(new Request([
            'id_variacion' => $variacionNegra->id_variacion,
            'id_talla' => $talla->id_talla,
            'stock' => 3,
            'sku' => 'ZAPATO-NEGRO-40',
        ]));
        $segunda = $controller->CrearVariacionTalla(new Request([
            'id_variacion' => $variacionBlanca->id_variacion,
            'id_talla' => $talla->id_talla,
            'stock' => 3,
            'sku' => 'ZAPATO-BLANCO-40',
        ]));
        $exceso = $controller->CrearVariacionTalla(new Request([
            'id_variacion' => $variacionNegra->id_variacion,
            'id_talla' => $otraTalla->id_talla,
            'stock' => 1,
            'sku' => 'ZAPATO-NEGRO-41',
        ]));
        $tallaNegra = VariacionTalla::where('sku', 'ZAPATO-NEGRO-40')->firstOrFail();
        $actualizacionExcedida = $controller->ActualizarVariacionTalla(new Request([
            'id_talla' => $talla->id_talla,
            'stock' => 4,
            'sku' => $tallaNegra->sku,
        ]), $tallaNegra->id_variacion_talla);

        $this->assertSame(200, $primera->getStatusCode());
        $this->assertSame(200, $segunda->getStatusCode());
        $this->assertSame(422, $exceso->getStatusCode());
        $this->assertSame(422, $actualizacionExcedida->getStatusCode());
    }

    public function test_cambiar_talla_actualiza_el_sku_autogenerado(): void
    {
        $producto = Producto::create([
            'nombre_producto' => 'Zapato deportivo',
            'stock_actual' => 6,
            'precio_compra' => 30,
            'precio_venta' => 50,
        ]);
        $variacion = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Negro',
            'estado_variacion' => true,
        ]);
        $tallaAnterior = Talla::create(['talla' => '40', 'estado_talla' => true]);
        $tallaNueva = Talla::create(['talla' => '41', 'estado_talla' => true]);
        $variacionTalla = VariacionTalla::create([
            'id_variacion' => $variacion->id_variacion,
            'id_talla' => $tallaAnterior->id_talla,
            'stock' => 2,
            'sku' => 'ZAPATO-DEPORTIVO-NEGRO-40',
        ]);

        $response = app(VariacionTallaController::class)->ActualizarVariacionTalla(
            new Request([
                'id_talla' => $tallaNueva->id_talla,
                'stock' => 2,
                'sku' => $variacionTalla->sku,
            ]),
            $variacionTalla->id_variacion_talla
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('ZAPATO-DEPORTIVO-NEGRO-41', $variacionTalla->fresh()->sku);
    }

    public function test_reordenar_imagenes_guarda_la_secuencia_completa_de_la_variacion(): void
    {
        $producto = Producto::create([
            'nombre_producto' => 'Zapato deportivo',
            'stock_actual' => 0,
            'precio_compra' => 30,
            'precio_venta' => 50,
        ]);
        $variacion = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Negro',
            'estado_variacion' => true,
        ]);
        $imagenUno = VariacionImagen::create([
            'id_variacion' => $variacion->id_variacion,
            'imagen' => 'imagen-uno.png',
            'orden' => 1,
        ]);
        $imagenDos = VariacionImagen::create([
            'id_variacion' => $variacion->id_variacion,
            'imagen' => 'imagen-dos.png',
            'orden' => 2,
        ]);
        $imagenTres = VariacionImagen::create([
            'id_variacion' => $variacion->id_variacion,
            'imagen' => 'imagen-tres.png',
            'orden' => 3,
        ]);

        $response = app(VariacionImagenController::class)->OrdenarVariacionImagenes(
            new Request(['ids' => [
                $imagenTres->id_imagen,
                $imagenUno->id_imagen,
                $imagenDos->id_imagen,
            ]]),
            $variacion->id_variacion
        );

        $ordenGuardado = VariacionImagen::where('id_variacion', $variacion->id_variacion)
            ->orderBy('orden')
            ->pluck('id_imagen')
            ->map(fn ($id) => (int) $id)
            ->all();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame([
            $imagenTres->id_imagen,
            $imagenUno->id_imagen,
            $imagenDos->id_imagen,
        ], $ordenGuardado);
    }

    public function test_baja_de_producto_descuenta_la_talla_seleccionada_y_la_registra_en_kardex(): void
    {
        \Illuminate\Support\Facades\DB::table('categoria')->insert(['nombre_categoria' => 'Calzado']);
        \Illuminate\Support\Facades\DB::table('impuestos')->insert(['nombre_impuesto' => 'Exento', 'porcentaje_impuesto' => 0]);
        $producto = Producto::create([
            'nombre_producto' => 'Chinela',
            'id_categoria' => 1,
            'id_impuesto' => 1,
            'stock_actual' => 6,
            'precio_compra' => 100,
            'precio_venta' => 150,
        ]);
        $variacion = ProductoVariacion::create([
            'id_producto' => $producto->id_producto,
            'color' => 'Negro',
            'estado_variacion' => true,
        ]);
        $talla39 = Talla::create(['talla' => '39', 'estado_talla' => true]);
        $talla40 = Talla::create(['talla' => '40', 'estado_talla' => true]);
        $variante39 = VariacionTalla::create([
            'id_variacion' => $variacion->id_variacion,
            'id_talla' => $talla39->id_talla,
            'stock' => 3,
            'sku' => 'CHINELA-NEGRO-39',
        ]);
        $variante40 = VariacionTalla::create([
            'id_variacion' => $variacion->id_variacion,
            'id_talla' => $talla40->id_talla,
            'stock' => 3,
            'sku' => 'CHINELA-NEGRO-40',
        ]);
        Session::put('usuario.id', 1);

        $datosActualizacion = [
            'nombre_producto' => 'Chinela',
            'descripcion_producto' => null,
            'id_categoria' => 1,
            'id_impuesto' => 1,
            'id_ubicacion' => null,
            'precio_compra' => 100,
            'precio_venta' => 150,
            'stock_actual' => 5,
            'id_medida' => null,
            'motivo_movimiento' => 'Consumo interno',
        ];
        $controller = app(ProductoController::class);
        $sinDistribucion = $controller->ActualizarProducto(new Request($datosActualizacion), $producto->id_producto);
        $this->assertSame(422, $sinDistribucion->getStatusCode());
        $this->assertSame(6, (int) $producto->fresh()->stock_actual);

        $datosActualizacion['variacion_ajustes'] = json_encode([[
            'id_variacion_talla' => $variante39->id_variacion_talla,
            'cantidad' => 1,
        ]]);
        $response = $controller->ActualizarProducto(new Request($datosActualizacion), $producto->id_producto);

        $movimiento = MovimientoInventario::firstOrFail();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(5, (int) $producto->fresh()->stock_actual);
        $this->assertSame(2, (int) $variante39->fresh()->stock);
        $this->assertSame(3, (int) $variante40->fresh()->stock);
        $this->assertSame($variante39->id_variacion_talla, (int) $movimiento->id_variacion_talla);
        $this->assertSame(5, (int) $movimiento->stock_resultante);
    }
}