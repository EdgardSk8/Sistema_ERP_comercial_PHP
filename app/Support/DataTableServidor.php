<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Responde endpoints en formato DataTables server-side.
 *
 * Ventaja frente a traer todo: la base de datos solo devuelve la pagina
 * visible (25-100 filas) y el filtrado/orden ocurre en SQL.
 *
 * Config por columna (el indice es la posicion de la columna en la tabla):
 *
 * [
 *   'columnas' => [
 *       1 => ['col' => 'numero_factura', 'buscar' => true],
 *       2 => ['rel' => 'cliente', 'col' => 'nombre_cliente', 'buscar' => true],
 *       5 => ['fecha' => 'fecha_venta'],
 *       9 => ['callback' => fn ($q, $valor) => $q->has('planPago')],
 *   ],
 *   'orden' => [2 => '(select nombre_cliente from clientes where clientes.id_cliente = ventas.id_cliente)'],
 *   'ordenDefault' => ['columna' => 'id_venta', 'dir' => 'desc'],
 * ]
 */
class DataTableServidor
{
    /**
     * @param  array<string, mixed>  $config
     */
    public static function responder(Request $request, Builder $consulta, array $config = []): JsonResponse
    {
        $columnas = $config['columnas'] ?? [];
        $total = (clone $consulta)->toBase()->getCountForPagination();

        self::aplicarBusquedaGlobal($consulta, $columnas, trim((string) $request->input('search.value')));
        self::aplicarFiltrosPorColumna($consulta, $columnas, (array) $request->input('columns', []));
        self::aplicarOrden($consulta, $columnas, $config, (array) $request->input('order', []));

        $filtrado = (clone $consulta)->toBase()->getCountForPagination();

        $inicio = max(0, (int) $request->input('start', 0));
        $largo = (int) $request->input('length', 50);
        $largo = ($largo <= 0 || $largo > 500) ? 50 : $largo;

        $filas = $consulta->skip($inicio)->take($largo)->get();

        return response()->json(array_merge([
            'draw' => (int) $request->input('draw', 0),
            'recordsTotal' => $total,
            'recordsFiltered' => $filtrado,
            'data' => $filas,
        ], $config['extras'] ?? []));
    }

    /**
     * @param  array<int, array<string, mixed>>  $columnas
     */
    protected static function aplicarBusquedaGlobal(Builder $consulta, array $columnas, string $valor): void
    {
        if ($valor === '') {
            return;
        }

        $consulta->where(function (Builder $query) use ($columnas, $valor) {
            foreach ($columnas as $config) {
                if (empty($config['buscar'])) {
                    continue;
                }

                $like = '%'.$valor.'%';

                if (! empty($config['rel'])) {
                    $query->orWhereHas($config['rel'], fn (Builder $rel) => $rel->where($config['col'], 'like', $like));

                    continue;
                }

                if (! empty($config['col'])) {
                    $query->orWhere($config['col'], 'like', $like);
                }
            }
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $columnas
     * @param  array<int, array<string, mixed>>  $recibidas
     */
    protected static function aplicarFiltrosPorColumna(Builder $consulta, array $columnas, array $recibidas): void
    {
        foreach ($recibidas as $indice => $columna) {
            $valor = trim((string) ($columna['search']['value'] ?? ''));

            if ($valor === '' || ! isset($columnas[(int) $indice])) {
                continue;
            }

            $config = $columnas[(int) $indice];

            if (! empty($config['fecha'])) {
                self::filtrarFecha($consulta, $config['fecha'], $valor);

                continue;
            }

            if (isset($config['callback'])) {
                ($config['callback'])($consulta, $valor);

                continue;
            }

            $limpio = self::limpiarValor($valor);
            $like = '%'.$limpio.'%';

            if (! empty($config['rel'])) {
                $consulta->whereHas($config['rel'], fn (Builder $rel) => $rel->where($config['col'], 'like', $like));

                continue;
            }

            if (! empty($config['col'])) {
                $consulta->where($config['col'], 'like', $like);
            }
        }
    }

    /**
     * Interpreta el filtro de una columna de fecha. Acepta lo que escriba el
     * usuario (25/10/2026) y el patron que genera el buscador de DataTables.
     */
    protected static function filtrarFecha(Builder $consulta, string $columna, string $valor): void
    {
        $limpio = str_replace(['\\', '^', '$', '(', ')', '?', '.*', '\\s+', '+', '{', '}'], ' ', $valor);
        $limpio = str_replace('d', ' ', $limpio);

        if (! str_contains($limpio, '/')) {
            return;
        }

        [$dia, $mes, $anio] = array_pad(explode('/', $limpio), 3, '');

        $dia = ctype_digit(trim($dia)) && trim($dia) !== '00' ? trim($dia) : null;
        $mes = ctype_digit(trim($mes)) && trim($mes) !== '00' ? trim($mes) : null;
        $anio = ctype_digit(trim($anio)) && strlen(trim($anio)) === 4 ? trim($anio) : null;

        if ($anio && $mes && $dia) {
            $consulta->whereDate($columna, "{$anio}-{$mes}-{$dia}");

            return;
        }

        if ($anio && $mes) {
            $consulta->whereYear($columna, $anio)->whereMonth($columna, $mes);

            return;
        }

        if ($anio) {
            $consulta->whereYear($columna, $anio);

            return;
        }

        if ($mes) {
            $consulta->whereMonth($columna, $mes);
        }
    }

    protected static function limpiarValor(string $valor): string
    {
        return str_replace('\\', '', trim($valor, '^$'));
    }

    /**
     * @param  array<int, array<string, mixed>>  $columnas
     * @param  array<string, mixed>  $config
     * @param  array<int, array<string, mixed>>  $orden
     */
    protected static function aplicarOrden(Builder $consulta, array $columnas, array $config, array $orden): void
    {
        $primero = $orden[0] ?? null;

        if ($primero) {
            $indice = (int) ($primero['column'] ?? 0);
            $dir = ($primero['dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

            $expresion = $config['orden'][$indice]
                ?? $columnas[$indice]['col']
                ?? $columnas[$indice]['fecha']
                ?? null;

            if ($expresion) {
                $consulta->orderBy($expresion, $dir);

                return;
            }
        }

        $default = $config['ordenDefault'] ?? null;

        if ($default) {
            $consulta->orderBy($default['columna'], $default['dir'] ?? 'desc');
        }
    }
}
