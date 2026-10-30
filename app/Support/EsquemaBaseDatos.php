<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Utilidades de esquema válidas para MySQL/MariaDB y para PostgreSQL (Supabase).
 * Evita SHOW TABLES y demás sintaxis exclusiva de MySQL.
 */
class EsquemaBaseDatos
{
    public static function driver(): string
    {
        return DB::connection()->getDriverName();
    }

    public static function esPostgres(): bool
    {
        return self::driver() === 'pgsql';
    }

    /**
     * Tablas base del esquema actual (sin vistas).
     *
     * @return string[]
     */
    public static function tablas(): array
    {
        if (self::esPostgres()) {
            return collect(DB::select(
                "SELECT table_name FROM information_schema.tables
                 WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
                 ORDER BY table_name"
            ))->pluck('table_name')->all();
        }

        return collect(DB::select('SHOW TABLES'))
            ->map(fn ($fila) => array_values((array) $fila)[0])
            ->all();
    }

    /**
     * Tipo de dato de cada columna: nombre => data_type (minúsculas).
     *
     * @return array<string, string>
     */
    public static function tiposColumnas(string $tabla): array
    {
        if (! self::esPostgres()) {
            return [];
        }

        $tipos = [];

        foreach (DB::select(
            'SELECT column_name, data_type FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = ?
             ORDER BY ordinal_position',
            [$tabla]
        ) as $columna) {
            $tipos[$columna->column_name] = strtolower($columna->data_type);
        }

        return $tipos;
    }

    /**
     * Divide un script SQL en sentencias respetando comillas, dollar-quoting
     * y comentarios (un `;` dentro de un texto ya no rompe la importación).
     *
     * @return string[]
     */
    public static function dividirSQL(string $sql): array
    {
        $sentencias = [];
        $actual = '';
        $enComilla = false;
        $enDolar = null;
        $largo = strlen($sql);

        for ($i = 0; $i < $largo; $i++) {
            $caracter = $sql[$i];

            if ($enComilla) {
                $actual .= $caracter;

                if ($caracter === "'") {
                    if ($i + 1 < $largo && $sql[$i + 1] === "'") {
                        $actual .= $sql[++$i];
                    } else {
                        $enComilla = false;
                    }
                }

                continue;
            }

            if ($enDolar !== null) {
                if ($caracter === '$' && substr($sql, $i, strlen($enDolar)) === $enDolar) {
                    $actual .= $enDolar;
                    $i += strlen($enDolar) - 1;
                    $enDolar = null;

                    continue;
                }

                $actual .= $caracter;

                continue;
            }

            if ($caracter === "'") {
                $enComilla = true;
                $actual .= $caracter;

                continue;
            }

            if ($caracter === '$' && preg_match('/^\$[A-Za-z0-9_]*\$/', substr($sql, $i), $coincidencia)) {
                $enDolar = $coincidencia[0];
                $actual .= $enDolar;
                $i += strlen($enDolar) - 1;

                continue;
            }

            if ($caracter === '-' && ($sql[$i + 1] ?? '') === '-') {
                while ($i < $largo && $sql[$i] !== "\n") {
                    $actual .= $sql[$i];
                    $i++;
                }

                $actual .= "\n";

                continue;
            }

            if ($caracter === ';') {
                $sentencias[] = trim($actual);
                $actual = '';

                continue;
            }

            $actual .= $caracter;
        }

        $sentencias[] = trim($actual);

        return array_values(array_filter($sentencias, function ($sentencia) {
            $sinComentarios = trim(preg_replace('/^(\s*--[^\n]*\n?)+/', '', $sentencia));

            return $sinComentarios !== '';
        }));
    }
}
