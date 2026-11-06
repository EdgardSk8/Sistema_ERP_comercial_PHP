<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Catálogos base para marca y atributos de producto.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada y también
 * asigna marca a los productos existentes cuando el nombre empieza por ella.
 */
class CatalogosProductoSeeder extends Seeder
{
    private const MARCAS = [
        'Nike',
        'Adidas',
        'New Balance',
        'Crocs',
        'Vans',
        'Skechers',
        'Next Line',
        'Nexus',
        'N Sport',
        'Seavees',
        'Honor',
    ];

    private const ATRIBUTOS = [
        'Género' => ['Hombre', 'Mujer', 'Unisex'],
        'Tipo' => ['Zapatilla', 'Sandalia', 'Ropa', 'Tecnología'],
        'Deporte' => ['Deportivo', 'Casual', 'Urbano'],
        'Material' => ['Cuero', 'Textil', 'Sintético'],
    ];

    public function run(): void
    {
        foreach (self::MARCAS as $nombre) {
            DB::table('marcas')->updateOrInsert(
                ['nombre_marca' => $nombre],
                [
                    'slug_marca' => Str::slug($nombre),
                    'estado_marca' => true,
                ]
            );
        }

        foreach (self::ATRIBUTOS as $nombreAtributo => $valores) {
            DB::table('atributos')->updateOrInsert(
                ['nombre_atributo' => $nombreAtributo],
                ['tipo_atributo' => 'lista', 'estado_atributo' => true]
            );

            $idAtributo = DB::table('atributos')
                ->where('nombre_atributo', $nombreAtributo)
                ->value('id_atributo');

            foreach ($valores as $orden => $valor) {
                DB::table('atributo_valores')->updateOrInsert(
                    ['id_atributo' => $idAtributo, 'valor_atributo' => $valor],
                    ['orden_valor' => $orden, 'estado_valor' => true]
                );
            }
        }

        $this->asignarMarcasExistentes();
        $this->asignarAtributosExistentes();
    }

    /** Asigna marca a los productos cuyo nombre empieza por una marca conocida. */
    private function asignarMarcasExistentes(): void
    {
        $marcas = DB::table('marcas')
            ->orderByRaw('length(nombre_marca) desc')
            ->get(['id_marca', 'nombre_marca']);

        $productos = DB::table('productos')
            ->whereNull('id_marca')
            ->get(['id_producto', 'nombre_producto']);

        foreach ($productos as $producto) {
            $nombre = Str::lower($producto->nombre_producto);

            foreach ($marcas as $marca) {
                if (Str::startsWith($nombre, Str::lower($marca->nombre_marca))) {
                    DB::table('productos')
                        ->where('id_producto', $producto->id_producto)
                        ->update(['id_marca' => $marca->id_marca]);

                    break;
                }
            }
        }
    }

    /**
     * Asigna atributos base a los productos existentes según su categoría y nombre.
     * Es solo una carga inicial: después se ajusta desde el ERP.
     */
    private function asignarAtributosExistentes(): void
    {
        $valores = DB::table('atributo_valores as av')
            ->join('atributos as a', 'a.id_atributo', '=', 'av.id_atributo')
            ->get(['a.nombre_atributo', 'av.id_valor', 'av.valor_atributo'])
            ->keyBy(fn ($fila) => $fila->nombre_atributo.'|'.$fila->valor_atributo);

        $productos = DB::table('productos as p')
            ->leftJoin('categoria as c', 'c.id_categoria', '=', 'p.id_categoria')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('producto_atributos as pa')
                    ->whereColumn('pa.id_producto', 'p.id_producto');
            })
            ->get(['p.id_producto', 'p.nombre_producto', 'c.nombre_categoria']);

        foreach ($productos as $producto) {
            $categoria = Str::lower((string) $producto->nombre_categoria);
            $nombre = Str::lower($producto->nombre_producto);

            $elegidos = [
                'Género' => match (true) {
                    Str::contains($nombre, 'hombre') => 'Hombre',
                    Str::contains($nombre, 'mujer') => 'Mujer',
                    default => 'Unisex',
                },
                'Tipo' => match (true) {
                    Str::contains($categoria, 'chinela') => 'Sandalia',
                    Str::contains($categoria, 'ropa') => 'Ropa',
                    Str::contains($categoria, 'tecn') => 'Tecnología',
                    default => 'Zapatilla',
                },
            ];

            $filas = [];

            foreach ($elegidos as $nombreAtributo => $valorAtributo) {
                $valor = $valores->get($nombreAtributo.'|'.$valorAtributo);

                if (! $valor) {
                    continue;
                }

                $filas[] = [
                    'id_producto' => $producto->id_producto,
                    'id_atributo' => DB::table('atributos')->where('nombre_atributo', $nombreAtributo)->value('id_atributo'),
                    'id_valor' => $valor->id_valor,
                ];
            }

            if ($filas) {
                DB::table('producto_atributos')->insert($filas);
            }
        }
    }
}
