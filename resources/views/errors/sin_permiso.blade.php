<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acceso denegado</title>

    <!-- Bootstrap (asumiendo que ya lo tienes global, si no, puedes omitir esto) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Phosphor Icons (CDN con respaldo local) -->
    <link rel="stylesheet" href="{{ \App\Support\Recursos::url('phosphor_css') }}">
</head>

<body>

<div class="box d-flex align-items-center justify-content-center text-center vh-100">

    <div class="p-4">

        <!-- Icono -->
        <div class="mb-3">
            <i class="ph ph-shield-check text-danger" style="font-size: 4rem;"></i>
        </div>

        <!-- Título -->
        <h1 class="fw-bold text-danger mb-2">
            Acceso denegado
        </h1>

        <!-- Mensaje -->
        <p class="text-secondary mb-4">
            No tienes permisos para acceder a esta sección del sistema.
        </p>

        <!-- Botón opcional -->
        <a href="/" class="btn btn-primary">
            <i class="ph ph-house"></i>
            Ir al inicio
        </a>

    </div>

</div>

</body>
</html>