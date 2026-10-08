<!DOCTYPE html>
<html lang="es">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login - Sistema POS</title>

    @include('principal.links')
    @vite(['resources/css/variables.css'])
    @vite(['resources/css/login/login.css'])

    <script src="{{ Vite::asset('resources/js/Login.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/FuncionesGlobales.js') }}"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">

</head>

<body>

    <!-- Fondo -->
    <div class="position-fixed top-0 start-0 w-100 h-100 overflow-hidden" style="z-index:0;">
        <div class="bg-shape bg-1"></div>
        <div class="bg-shape bg-2"></div>
    </div>

    <div class="container min-vh-100 d-flex justify-content-center align-items-center position-relative" style="z-index:1;">

        <div class="card login-card">

            <div class="card-body p-4">

                <!-- Logo -->
                <div class="text-center mb-4">

                    <img src="{{ asset('img/icono.png') }}"
                         class="login-logo"
                         alt="Logo">

                    <h4 class="fw-bold mt-3 mb-1">
                        Tellez S.A
                    </h4>

                    <p class="text-muted small mb-0">
                        Sistema POS
                    </p>

                </div>

                <form id="formLogin">

                    @csrf

                    <div class="mb-3">
                        <label class="form-label">
                            Usuario
                        </label>

                        <div class="input-group">

                            <span class="input-group-text">
                                <i class="bi bi-person"></i>
                            </span>

                            <input
                                type="text"
                                name="nombre_usuario"
                                class="form-control"
                                placeholder="Ingrese su usuario"
                                required>

                        </div>
                    </div>

                    <div class="mb-4">

                        <label class="form-label">
                            Contraseña
                        </label>

                        <div class="input-group">

                            <span class="input-group-text">
                                <i class="bi bi-lock"></i>
                            </span>

                            <input
                                type="password"
                                name="password"
                                class="form-control"
                                placeholder="Ingrese su contraseña"
                                required>

                        </div>

                    </div>

                    <button
                        class="btn guardar w-100"
                        type="submit">

                        <i class="bi bi-box-arrow-in-right me-2"></i>
                        Ingresar

                    </button>

                </form>

                <div class="text-center mt-4">

                    <small class="text-muted">
                        © {{ date('Y') }} Tellez S.A
                    </small>

                </div>

            </div>

        </div>

    </div>

</body>

</html>
