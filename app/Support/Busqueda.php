<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

/**
 * Búsquedas de texto tolerantes a mayúsculas y tildes.
 *
 * PostgreSQL compara LIKE de forma sensible a mayúsculas y tildes, por eso
 * se normalizan ambos lados en SQL: translate() quita los acentos y lower()
 * ignora mayúsculas. Funciona también si el término viene con o sin tilde.
 */
class Busqueda
{
    /** Caracteres acentuados del español (48) y su equivalente sin tilde. */
    private const ACENTOS = 'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ';

    private const SIN_ACENTOS = 'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC';

    /**
     * Agrega una condición LIKE normalizada (sin tildes y sin distinguir
     * mayúsculas) a una consulta Eloquent o Query Builder.
     */
    public static function aplicarLike(
        EloquentBuilder|QueryBuilder $consulta,
        string $columna,
        string $valor,
        string $boolean = 'and'
    ): void {
        $valor = trim($valor);

        if ($valor === '') {
            return;
        }

        $patron = '%'.$valor.'%';

        if ($consulta->getConnection()->getDriverName() === 'pgsql') {
            $columna = self::citarColumna($columna);

            $consulta->whereRaw(
                "lower(translate(cast({$columna} as text), ?, ?)) like lower(translate(?, ?, ?))",
                [self::ACENTOS, self::SIN_ACENTOS, $patron, self::ACENTOS, self::SIN_ACENTOS],
                $boolean
            );

            return;
        }

        // MySQL/MariaDB suelen ser insensibles a mayúsculas por su collation.
        $consulta->where($columna, 'like', $patron, $boolean);
    }

    /** Cita identificadores simples y calificados (tabla.columna). */
    private static function citarColumna(string $columna): string
    {
        if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/', $columna)) {
            return $columna;
        }

        return implode('.', array_map(
            static fn (string $parte): string => '"'.$parte.'"',
            explode('.', $columna)
        ));
    }
}
