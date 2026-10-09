<!DOCTYPE html>
<html lang="es">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login - {{ $nombreEmpresa ?: 'Sistema POS' }}</title>

    @include('principal.links')
    @vite(['resources/css/variables.css'])
    @vite(['resources/css/login/login.css'])

    <script>
        try {
            document.documentElement.dataset.theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
        } catch (_) {
            document.documentElement.dataset.theme = 'light';
        }
    </script>

    <script src="{{ Vite::asset('resources/js/Login.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/FuncionesGlobales.js') }}"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">

</head>

<body>

    <main class="login-page">
        <div class="login-glow login-glow-one" aria-hidden="true"></div>
        <div class="login-glow login-glow-two" aria-hidden="true"></div>

        <div class="card login-card">

            <div class="login-accent" aria-hidden="true"></div>

            <div class="card-body p-4">

                <!-- Logo -->
                <div class="text-center mb-4">

                    @if(filled($logoEmpresa))
                        <img src="{{ $logoEmpresa }}"
                             class="login-logo"
                             alt="Logo de {{ $nombreEmpresa ?: 'la empresa' }}">
                    @endif

                    <h4 class="login-title fw-bold {{ filled($logoEmpresa) ? 'mt-3' : '' }} mb-1">
                        {{ $nombreEmpresa }}
                    </h4>

                    <p class="login-subtitle small mb-0">
                        <!-- Sistema POS -->
                    </p>

                </div>

                <form id="formLogin">

                    @csrf

                    <div class="mb-3">
                        <label class="form-label" for="nombre_usuario">
                            Usuario
                        </label>

                        <div class="input-group">

                            <span class="input-group-text">
                                <i class="bi bi-person"></i>
                            </span>

                            <input
                                type="text"
                                id="nombre_usuario"
                                name="nombre_usuario"
                                class="form-control"
                                placeholder="Ingrese su usuario"
                                required>

                        </div>
                    </div>

                    <div class="mb-4">

                        <label class="form-label" for="password">
                            Contraseña
                        </label>

                        <div class="input-group">

                            <span class="input-group-text">
                                <i class="bi bi-lock"></i>
                            </span>

                            <input
                                type="password"
                                id="password"
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

                <div class="text-center mt-4 login-footer">

                    <small class="text-muted">
                        <!-- © {{ date('Y') }} Tellez S.A -->
                    </small>

                </div>

            </div>

        </div>

    </main>

</body>

</html>
