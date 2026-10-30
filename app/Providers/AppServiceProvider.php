<?php

namespace App\Providers;

use App\Database\ConexionPostgresEmulada;
use Illuminate\Database\Connectors\PostgresConnector;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use PDO;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registrarConexionPostgresEmulada();
    }

    /**
     * Sustituye la conexión `pgsql` por una que emula los prepared statements.
     *
     * Con la base de datos fuera de la red local, cada consulta cuesta tres
     * viajes de red por el `prepare` nativo. Emulado baja a uno solo. Se
     * controla con DB_EMULA_PREPARACIONES en el .env.
     */
    protected function registrarConexionPostgresEmulada(): void
    {
        if (! config('database.connections.pgsql.emula_preparaciones')) {
            return;
        }

        DB::extend('pgsql', function (array $config, string $nombre) {
            $config['name'] = $nombre;

            $conectar = function () use ($config) {
                $pdo = (new PostgresConnector)->connect($config);
                $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);

                return $pdo;
            };

            return new ConexionPostgresEmulada(
                $conectar,
                $config['database'],
                $config['prefix'] ?? '',
                $config
            );
        });
    }
}
