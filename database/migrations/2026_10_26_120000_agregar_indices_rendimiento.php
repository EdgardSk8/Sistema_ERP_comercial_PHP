<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Índices de rendimiento para Supabase.
 *
 * Las claves foráneas de Postgres NO crean índice automáticamente: cada
 * JOIN o filtro por esas columnas hacía un escaneo completo. Con la base
 * en un servidor remoto (latencia ~230 ms por consulta) eso se nota mucho.
 */
return new class extends Migration
{
    private array $indices = [
        'medidas' => ['id_tipo_medida'],
        'productos' => ['id_medida', 'id_ubicacion', 'estado_producto'],
        'variacion_imagenes' => ['id_variacion'],
        'compras' => ['id_cuenta', 'id_metodo_pago', 'id_tipo_factura'],
        'detalle_compras' => ['id_variacion_talla'],
        'ventas' => ['id_cuenta', 'numero_factura', 'fecha_venta'],
        'detalle_ventas' => ['id_variacion_talla'],
        'devoluciones' => ['id_usuario'],
        'planes_pago' => ['id_usuario'],
        'pagos_venta' => ['id_caja', 'id_cuenta', 'id_metodo_pago', 'id_usuario'],
        'movimientos_inventario' => ['id_usuario', 'id_variacion_talla'],
        'lotes_inventario' => ['id_detalle_compra'],
        'transferencias_caja_cuenta' => ['id_usuario'],
        'movimientos_caja' => ['id_cuenta_destino', 'id_transferencia'],
        'movimientos_cuentas' => ['id_transferencia'],
        'movimientos_gastos' => ['id_caja', 'id_cuenta'],
    ];

    public function up(): void
    {
        foreach ($this->indices as $tabla => $columnas) {
            foreach ($columnas as $columna) {
                DB::statement(sprintf(
                    'CREATE INDEX IF NOT EXISTS %s ON %s (%s)',
                    $this->nombre($tabla, $columna),
                    $this->citar($tabla),
                    $this->citar($columna)
                ));
            }
        }
    }

    public function down(): void
    {
        foreach ($this->indices as $tabla => $columnas) {
            foreach ($columnas as $columna) {
                DB::statement(sprintf(
                    'DROP INDEX IF EXISTS %s',
                    $this->nombre($tabla, $columna)
                ));
            }
        }
    }

    private function nombre(string $tabla, string $columna): string
    {
        return $this->citar('idx_'.$tabla.'_'.$columna);
    }

    private function citar(string $valor): string
    {
        return '"'.str_replace('"', '""', $valor).'"';
    }
};
