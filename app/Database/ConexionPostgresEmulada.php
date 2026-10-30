<?php

namespace App\Database;

use Illuminate\Database\PostgresConnection;
use PDO;

/**
 * Conexión PostgreSQL pensada para trabajar con prepared statements emulados.
 *
 * Con Supabase fuera de la red local cada consulta cuesta ~225 ms porque el
 * `prepare` nativo gasta 3 viajes de red (parse, bind/execute, sync). Al
 * emularlos, PDO inserta los valores en el SQL y baja a 1 viaje (~74 ms).
 *
 * El problema es que PDO, al emular, escribe los enteros sin comillas
 * (`where estado = 1`), y las columnas booleanas de este esquema se comparan
 * con 1/0, lo que provoca "operator does not exist: boolean = integer".
 *
 * Enviando todos los parámetros como texto (`PARAM_STR`) se recupera el
 * comportamiento previo: PostgreSQL recibe literales de tipo desconocido y los
 * convierte al tipo de la columna.
 */
class ConexionPostgresEmulada extends PostgresConnection
{
    /**
     * Vincula los valores del query builder al statement PDO.
     *
     * @param  \PDOStatement  $statement
     * @param  array<int|string, mixed>  $bindings
     * @return void
     */
    public function bindValues($statement, $bindings)
    {
        foreach ($bindings as $clave => $valor) {
            $tipo = match (true) {
                is_null($valor) => PDO::PARAM_NULL,
                is_resource($valor) => PDO::PARAM_LOB,
                default => PDO::PARAM_STR,
            };

            $statement->bindValue(
                is_string($clave) ? $clave : $clave + 1,
                $valor,
                $tipo
            );
        }
    }

    /**
     * Sin prepared statements nativos no hace falta liberar nada en el servidor.
     *
     * @param  string|null  $name
     * @return void
     */
    public function deallocate($name = null)
    {
        //
    }
}
