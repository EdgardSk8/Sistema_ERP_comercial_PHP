<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AsignarPasswordTemporal extends Command
{
    protected $signature = 'tienda:password-temporal
                            {correo : Correo del cliente en la tienda}
                            {--password=123456 : Contraseña temporal a asignar}';

    protected $description = 'Asigna una contraseña temporal a una cuenta de la tienda para que el cliente la cambie en su perfil';

    public function handle(): int
    {
        $correo = strtolower(trim((string) $this->argument('correo')));
        $password = (string) $this->option('password');

        if (! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $this->error('El correo no es válido.');

            return self::FAILURE;
        }

        if (strlen($password) < 6) {
            $this->error('La contraseña temporal debe tener al menos 6 caracteres.');

            return self::FAILURE;
        }

        $usuario = DB::table('auth.users')->where('email', $correo)->first();

        if (! $usuario) {
            $this->error("No existe una cuenta con el correo {$correo}.");

            return self::FAILURE;
        }

        $cliente = DB::table('clientes')->where('auth_id', $usuario->id)->first();

        if ($cliente && ! $cliente->estado_cliente) {
            $this->warn('La cuenta del cliente está desactivada. Actívala antes de entregar la contraseña.');
        }

        try {
            DB::statement('create extension if not exists pgcrypto with schema extensions');

            $hash = DB::selectOne(
                'select extensions.crypt(?, extensions.gen_salt(?)) as hash',
                [$password, 'bf']
            )->hash;

            DB::table('auth.users')
                ->where('id', $usuario->id)
                ->update([
                    'encrypted_password' => $hash,
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            $this->error('No se pudo asignar la contraseña: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info("Contraseña temporal asignada a {$correo}.");
        $this->line("Contraseña: {$password}");
        $this->line('Pídele al cliente que entre y la cambie en Mi cuenta → Configuración.');

        return self::SUCCESS;
    }
}
