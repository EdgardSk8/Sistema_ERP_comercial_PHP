<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Credenciales extends Model
{
    protected $table = 'credenciales';

    protected $primaryKey = 'id';

    protected $fillable = [
        'nombre_empresa',
        'ruc_empresa',
        'direccion_empresa',
        'telefono_empresa',
        'correo_empresa',
        'logo_empresa',
        'tipo_cambio' 
    ];

}

/* ══════════════════════════════════════════════════════════════════════════

La tabla credenciales se usa para almacenar la información de la empresa.

Cada registro guarda:

- El nombre de la empresa
- El RUC
- Dirección, teléfono y correo electrónico
- Fechas de creación y actualización

La función de la tabla credenciales es proporcionar los datos necesarios de la
empresa para mostrarlos en facturas, reportes y configuraciones del sistema.

══════════════════════════════════════════════════════════════════════════ */
