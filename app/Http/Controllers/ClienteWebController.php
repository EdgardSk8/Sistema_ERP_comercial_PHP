<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\ClienteDireccion;
use App\Models\ClienteFavorito;
use App\Models\Producto;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class ClienteWebController extends Controller
{
    /** Proveedores sociales habilitados para la tienda. */
    private const PROVEEDORES_SOCIALES = ['google'];

    /*  ╔══════════════ Sesión del cliente ═══════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function sesion(Request $request): JsonResponse
    {
        $cliente = $this->clienteDeSesion($request);

        return response()->json([
            'success' => true,
            'autenticado' => (bool) $cliente,
            'cliente' => $cliente ? $this->datosCliente($cliente) : null,
        ]);
    }

    public function registro(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_cliente' => 'required|max:150',
            'usuario_cliente' => 'required|alpha_dash|min:4|max:60|unique:clientes,usuario_cliente',
            'correo_cliente' => 'required|email|max:100|unique:clientes,correo_cliente',
            'telefono_cliente' => 'nullable|max:20',
            'fecha_nacimiento_cliente' => 'nullable|date|before:today',
            'cedula_cliente' => 'nullable|max:16|unique:clientes,cedula_cliente',
            'password' => 'required|min:6|confirmed',
        ], [
            'nombre_cliente.required' => 'El nombre es obligatorio.',
            'usuario_cliente.required' => 'El usuario es obligatorio.',
            'usuario_cliente.alpha_dash' => 'El usuario solo puede tener letras, números, guiones y guiones bajos.',
            'usuario_cliente.min' => 'El usuario debe tener al menos 4 caracteres.',
            'usuario_cliente.unique' => 'Ese usuario ya está registrado.',
            'correo_cliente.required' => 'El correo es obligatorio.',
            'correo_cliente.email' => 'Debes ingresar un correo válido.',
            'correo_cliente.unique' => 'Ese correo ya está registrado.',
            'cedula_cliente.unique' => 'Ya existe un cliente con esa cédula.',
            'fecha_nacimiento_cliente.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $cliente = DB::transaction(function () use ($request) {
                return Cliente::create([
                    'nombre_cliente' => trim($request->nombre_cliente),
                    'cedula_cliente' => $request->filled('cedula_cliente') ? trim($request->cedula_cliente) : null,
                    'telefono_cliente' => $request->filled('telefono_cliente') ? trim($request->telefono_cliente) : null,
                    'fecha_nacimiento_cliente' => $request->filled('fecha_nacimiento_cliente') ? $request->fecha_nacimiento_cliente : null,
                    'correo_cliente' => strtolower(trim($request->correo_cliente)),
                    'usuario_cliente' => trim($request->usuario_cliente),
                    'password_hash_cliente' => Hash::make($request->password),
                    'descuento_tipo_cliente' => null,
                    'descuento_valor_cliente' => 0,
                    'estado_cliente' => true,
                ]);
            });

            $this->iniciarSesion($request, $cliente);

            return response()->json([
                'success' => true,
                'mensaje' => 'Cuenta creada correctamente.',
                'cliente' => $this->datosCliente($cliente),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear la cuenta. Intenta nuevamente.',
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'usuario_cliente' => 'required',
            'password' => 'required',
        ], [
            'usuario_cliente.required' => 'Ingresa tu usuario.',
            'password.required' => 'Ingresa tu contraseña.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $cliente = Cliente::where('usuario_cliente', trim($request->usuario_cliente))->first();

        if (! $cliente || ! $cliente->password_hash_cliente || ! Hash::check($request->password, $cliente->password_hash_cliente)) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Usuario o contraseña incorrectos.',
            ], 401);
        }

        if (! $cliente->estado_cliente) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Tu cuenta está desactivada. Contacta a la tienda.',
            ], 403);
        }

        $this->iniciarSesion($request, $cliente);

        return response()->json([
            'success' => true,
            'mensaje' => 'Sesión iniciada correctamente.',
            'cliente' => $this->datosCliente($cliente),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->forget('cliente_web');
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'mensaje' => 'Sesión cerrada correctamente.',
        ]);
    }

    /*  ╔══════════════ Acceso con redes sociales ════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function redirigirProveedor(Request $request, string $proveedor): RedirectResponse
    {
        if (! in_array($proveedor, self::PROVEEDORES_SOCIALES, true)) {
            abort(404);
        }

        $destino = $this->destinoPermitido($request->query('redirect'));

        if ($destino) {
            $request->session()->put('oauth_destino', $destino);
        }

        // Google y Facebook ya solicitan los scopes profile/email por defecto.
        // La URL de callback se toma del host actual para que funcione en
        // localhost, 127.0.0.1 o un túnel HTTPS (Cloudflare/ngrok).
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver($proveedor);

        return $driver
            ->redirectUrl($this->urlCallback($proveedor))
            ->redirect();
    }

    public function callbackProveedor(Request $request, string $proveedor): RedirectResponse
    {
        if (! in_array($proveedor, self::PROVEEDORES_SOCIALES, true)) {
            abort(404);
        }

        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver($proveedor);

            $usuarioSocial = $driver
                ->redirectUrl($this->urlCallback($proveedor))
                ->user();
        } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
            report($e);

            return redirect()->route('tienda.login', [
                'error' => 'La sesión de acceso expiró o cambió el dominio. Vuelve a intentarlo desde la misma URL de la tienda.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return redirect()->route('tienda.login', [
                'error' => 'No se pudo completar el acceso con '.$this->nombreProveedor($proveedor).'. Intenta nuevamente.',
            ]);
        }

        $correo = strtolower(trim((string) $usuarioSocial->getEmail()));

        if ($correo === '') {
            return redirect()->route('tienda.login', [
                'error' => 'Tu cuenta de '.$this->nombreProveedor($proveedor).' no compartió un correo. Autoriza el acceso al correo para continuar.',
            ]);
        }

        try {
            $cliente = DB::transaction(function () use ($proveedor, $usuarioSocial, $correo) {
                $campo = $proveedor.'_id';
                $identificador = (string) $usuarioSocial->getId();

                $cliente = Cliente::where($campo, $identificador)->first()
                    ?? Cliente::whereRaw('LOWER(correo_cliente) = ?', [$correo])->first();

                if (! $cliente) {
                    $cliente = Cliente::create([
                        'nombre_cliente' => trim((string) ($usuarioSocial->getName() ?: $this->nombreDesdeCorreo($correo))),
                        'correo_cliente' => $correo,
                        'usuario_cliente' => $this->usuarioUnico($usuarioSocial->getNickname() ?: (strstr($correo, '@', true) ?: $correo)),
                        'password_hash_cliente' => null,
                        'descuento_tipo_cliente' => null,
                        'descuento_valor_cliente' => 0,
                        'estado_cliente' => true,
                    ]);
                }

                if (! $cliente->{$campo}) {
                    $cliente->{$campo} = $identificador;
                    $cliente->save();
                }

                return $cliente;
            });
        } catch (\Throwable $e) {
            report($e);

            return redirect()->route('tienda.login', [
                'error' => 'No se pudo crear o vincular tu cuenta. Intenta nuevamente.',
            ]);
        }

        if (! $cliente->estado_cliente) {
            return redirect()->route('tienda.login', [
                'error' => 'Tu cuenta está desactivada. Contacta a la tienda.',
            ]);
        }

        $this->iniciarSesion($request, $cliente);

        $destino = $this->destinoPermitido($request->session()->pull('oauth_destino'));

        return redirect($destino ?? '/tienda/perfil');
    }

    /*  ╔══════════════ Perfil ═══════════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function mostrarPerfil(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'cliente' => $this->datosCliente($this->clienteAutenticado($request)),
        ]);
    }

    public function actualizarPerfil(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $validator = Validator::make($request->all(), [
            'nombre_cliente' => 'required|max:150',
            'usuario_cliente' => [
                'required',
                'alpha_dash',
                'min:4',
                'max:60',
                Rule::unique('clientes', 'usuario_cliente')->ignore($cliente->id_cliente, 'id_cliente'),
            ],
            'correo_cliente' => [
                'required',
                'email',
                'max:100',
                Rule::unique('clientes', 'correo_cliente')->ignore($cliente->id_cliente, 'id_cliente'),
            ],
            'telefono_cliente' => 'nullable|max:20',
            'fecha_nacimiento_cliente' => 'nullable|date|before:today',
            'cedula_cliente' => [
                'nullable',
                'max:16',
                Rule::unique('clientes', 'cedula_cliente')->ignore($cliente->id_cliente, 'id_cliente'),
            ],
        ], [
            'nombre_cliente.required' => 'El nombre es obligatorio.',
            'usuario_cliente.required' => 'El usuario es obligatorio.',
            'usuario_cliente.alpha_dash' => 'El usuario solo puede tener letras, números, guiones y guiones bajos.',
            'usuario_cliente.unique' => 'Ese usuario ya está registrado.',
            'correo_cliente.required' => 'El correo es obligatorio.',
            'correo_cliente.email' => 'Debes ingresar un correo válido.',
            'correo_cliente.unique' => 'Ese correo ya está registrado.',
            'fecha_nacimiento_cliente.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
            'cedula_cliente.unique' => 'Ya existe un cliente con esa cédula.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $cliente->update([
            'nombre_cliente' => trim($request->nombre_cliente),
            'usuario_cliente' => trim($request->usuario_cliente),
            'correo_cliente' => strtolower(trim($request->correo_cliente)),
            'telefono_cliente' => $request->filled('telefono_cliente') ? trim($request->telefono_cliente) : null,
            'fecha_nacimiento_cliente' => $request->filled('fecha_nacimiento_cliente') ? $request->fecha_nacimiento_cliente : null,
            'cedula_cliente' => $request->filled('cedula_cliente') ? trim($request->cedula_cliente) : null,
        ]);

        $request->session()->put('cliente_web', [
            'id_cliente' => $cliente->id_cliente,
            'nombre' => $cliente->nombre_cliente,
            'usuario' => $cliente->usuario_cliente,
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => 'Perfil actualizado correctamente.',
            'cliente' => $this->datosCliente($cliente->fresh()),
        ]);
    }

    public function cambiarPassword(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $validator = Validator::make($request->all(), [
            'password_actual' => 'required',
            'password_nueva' => 'required|min:6|confirmed',
        ], [
            'password_actual.required' => 'Ingresa tu contraseña actual.',
            'password_nueva.required' => 'Ingresa la nueva contraseña.',
            'password_nueva.min' => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'password_nueva.confirmed' => 'Las contraseñas nuevas no coinciden.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! $cliente->password_hash_cliente || ! Hash::check($request->password_actual, $cliente->password_hash_cliente)) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'password_actual' => ['La contraseña actual no es correcta.'],
                ],
            ], 422);
        }

        $cliente->update([
            'password_hash_cliente' => Hash::make($request->password_nueva),
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => 'Contraseña actualizada correctamente.',
        ]);
    }

    /*  ╔══════════════ Direcciones ══════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function listarDirecciones(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $direcciones = $cliente->direcciones()
            ->where('estado_direccion', 1)
            ->orderByDesc('predeterminada_direccion')
            ->orderBy('nombre_direccion')
            ->get()
            ->map(fn (ClienteDireccion $direccion) => $this->datosDireccion($direccion))
            ->values();

        return response()->json([
            'success' => true,
            'direcciones' => $direcciones,
        ]);
    }

    public function crearDireccion(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $validator = Validator::make($request->all(), [
            'nombre_direccion' => 'required|max:80',
            'ubicacion_maps' => 'nullable|url|max:500',
            'referencia_direccion' => 'nullable|max:500',
            'direccion_manual' => 'nullable|max:500',
            'latitud_direccion' => 'nullable|numeric|between:-90,90|required_with:longitud_direccion',
            'longitud_direccion' => 'nullable|numeric|between:-180,180|required_with:latitud_direccion',
            'predeterminada_direccion' => 'nullable|boolean',
        ], [
            'nombre_direccion.required' => 'Ponle un nombre a la dirección (Casa, Trabajo, etc.).',
            'nombre_direccion.max' => 'El nombre no puede exceder 80 caracteres.',
            'ubicacion_maps.url' => 'El enlace de Google Maps no es válido.',
            'latitud_direccion.between' => 'La latitud de la ubicación no es válida.',
            'longitud_direccion.between' => 'La longitud de la ubicación no es válida.',
            'latitud_direccion.required_with' => 'Falta la latitud de la ubicación.',
            'longitud_direccion.required_with' => 'Falta la longitud de la ubicación.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! $this->tieneUbicacion($request)) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'direccion_manual' => ['Indica un enlace de Maps, una referencia o la dirección manual.'],
                ],
            ], 422);
        }

        $direccion = DB::transaction(function () use ($cliente, $request) {
            $esPrimera = ! $cliente->direcciones()->where('estado_direccion', 1)->exists();
            $predeterminada = $request->boolean('predeterminada_direccion') || $esPrimera;

            if ($predeterminada) {
                $cliente->direcciones()->update(['predeterminada_direccion' => false]);
            }

            return ClienteDireccion::create([
                'id_cliente' => $cliente->id_cliente,
                'nombre_direccion' => trim($request->nombre_direccion),
                'ubicacion_maps' => $this->enlaceMaps($request),
                'referencia_direccion' => $request->filled('referencia_direccion') ? trim($request->referencia_direccion) : null,
                'direccion_manual' => $request->filled('direccion_manual') ? trim($request->direccion_manual) : null,
                'latitud_direccion' => $this->coordenada($request->input('latitud_direccion'), 90),
                'longitud_direccion' => $this->coordenada($request->input('longitud_direccion'), 180),
                'predeterminada_direccion' => $predeterminada,
                'estado_direccion' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'mensaje' => 'Dirección agregada correctamente.',
            'direccion' => $this->datosDireccion($direccion),
        ], 201);
    }

    public function actualizarDireccion(Request $request, int|string $id): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);
        $direccion = $this->buscarDireccion($cliente, $id);

        if (! $direccion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Dirección no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre_direccion' => 'required|max:80',
            'ubicacion_maps' => 'nullable|url|max:500',
            'referencia_direccion' => 'nullable|max:500',
            'direccion_manual' => 'nullable|max:500',
            'latitud_direccion' => 'nullable|numeric|between:-90,90|required_with:longitud_direccion',
            'longitud_direccion' => 'nullable|numeric|between:-180,180|required_with:latitud_direccion',
            'predeterminada_direccion' => 'nullable|boolean',
        ], [
            'nombre_direccion.required' => 'Ponle un nombre a la dirección (Casa, Trabajo, etc.).',
            'nombre_direccion.max' => 'El nombre no puede exceder 80 caracteres.',
            'ubicacion_maps.url' => 'El enlace de Google Maps no es válido.',
            'latitud_direccion.between' => 'La latitud de la ubicación no es válida.',
            'longitud_direccion.between' => 'La longitud de la ubicación no es válida.',
            'latitud_direccion.required_with' => 'Falta la latitud de la ubicación.',
            'longitud_direccion.required_with' => 'Falta la longitud de la ubicación.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! $this->tieneUbicacion($request)) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'direccion_manual' => ['Indica un enlace de Maps, una referencia o la dirección manual.'],
                ],
            ], 422);
        }

        DB::transaction(function () use ($cliente, $direccion, $request) {
            $predeterminada = $request->boolean('predeterminada_direccion');

            if ($predeterminada) {
                $cliente->direcciones()
                    ->where('id_direccion_cliente', '!=', $direccion->id_direccion_cliente)
                    ->update(['predeterminada_direccion' => false]);
            }

            $direccion->update([
                'nombre_direccion' => trim($request->nombre_direccion),
                'ubicacion_maps' => $this->enlaceMaps($request),
                'referencia_direccion' => $request->filled('referencia_direccion') ? trim($request->referencia_direccion) : null,
                'direccion_manual' => $request->filled('direccion_manual') ? trim($request->direccion_manual) : null,
                'latitud_direccion' => $this->coordenada($request->input('latitud_direccion'), 90),
                'longitud_direccion' => $this->coordenada($request->input('longitud_direccion'), 180),
                'predeterminada_direccion' => $predeterminada,
            ]);
        });

        return response()->json([
            'success' => true,
            'mensaje' => 'Dirección actualizada correctamente.',
            'direccion' => $this->datosDireccion($direccion->fresh()),
        ]);
    }

    public function eliminarDireccion(Request $request, int|string $id): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);
        $direccion = $this->buscarDireccion($cliente, $id);

        if (! $direccion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Dirección no encontrada.',
            ], 404);
        }

        DB::transaction(function () use ($cliente, $direccion) {
            $eraPredeterminada = (bool) $direccion->predeterminada_direccion;
            $direccion->delete();

            if ($eraPredeterminada) {
                $siguiente = $cliente->direcciones()
                    ->where('estado_direccion', 1)
                    ->orderBy('id_direccion_cliente')
                    ->first();

                if ($siguiente) {
                    $siguiente->update(['predeterminada_direccion' => true]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'mensaje' => 'Dirección eliminada correctamente.',
        ]);
    }

    public function marcarDireccionPredeterminada(Request $request, int|string $id): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);
        $direccion = $this->buscarDireccion($cliente, $id);

        if (! $direccion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Dirección no encontrada.',
            ], 404);
        }

        DB::transaction(function () use ($cliente, $direccion) {
            $cliente->direcciones()->update(['predeterminada_direccion' => false]);

            $cliente->direcciones()
                ->where('id_direccion_cliente', $direccion->id_direccion_cliente)
                ->update(['predeterminada_direccion' => true]);
        });

        return response()->json([
            'success' => true,
            'mensaje' => 'Dirección predeterminada actualizada.',
        ]);
    }

    /*  ╔══════════════ Favoritos ════════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function listarFavoritos(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $favoritos = $cliente->favoritos()
            ->with(['producto.categoria', 'producto.impuesto', 'producto.variaciones.imagenes'])
            ->whereHas('producto', fn ($query) => $query->where('estado_producto', 1))
            ->orderByDesc('fecha_creacion_favorito')
            ->get()
            ->map(fn (ClienteFavorito $favorito) => $this->datosFavorito($favorito))
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'favoritos' => $favoritos,
        ]);
    }

    public function agregarFavorito(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $validator = Validator::make($request->all(), [
            'id_producto' => 'required|integer|exists:productos,id_producto',
        ], [
            'id_producto.required' => 'Selecciona un producto.',
            'id_producto.exists' => 'El producto no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $producto = Producto::where('id_producto', $request->id_producto)
            ->where('estado_producto', 1)
            ->first();

        if (! $producto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'El producto no está disponible.',
            ], 404);
        }

        $favorito = ClienteFavorito::firstOrCreate([
            'id_cliente' => $cliente->id_cliente,
            'id_producto' => $producto->id_producto,
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => $favorito->wasRecentlyCreated
                ? 'Producto agregado a favoritos.'
                : 'El producto ya estaba en favoritos.',
            'id_producto' => $producto->id_producto,
        ]);
    }

    public function eliminarFavorito(Request $request, int|string $idProducto): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        ClienteFavorito::where('id_cliente', $cliente->id_cliente)
            ->where('id_producto', $idProducto)
            ->delete();

        return response()->json([
            'success' => true,
            'mensaje' => 'Producto eliminado de favoritos.',
        ]);
    }

    /*  ╔══════════════ Historial de compras ═════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function historialCompras(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $ventas = Venta::with(['detalles.producto', 'metodoPago'])
            ->where('id_cliente', $cliente->id_cliente)
            ->orderByDesc('fecha_venta')
            ->limit(50)
            ->get()
            ->map(fn (Venta $venta) => $this->datosVenta($venta))
            ->values();

        return response()->json([
            'success' => true,
            'compras' => $ventas,
        ]);
    }

    /*  ╔══════════════ Helpers ══════════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    private function clienteAutenticado(Request $request): Cliente
    {
        return $request->attributes->get('cliente_web');
    }

    private function clienteDeSesion(Request $request): ?Cliente
    {
        $idCliente = $request->session()->get('cliente_web.id_cliente');

        if (! $idCliente) {
            return null;
        }

        return Cliente::where('id_cliente', $idCliente)
            ->where('estado_cliente', 1)
            ->first();
    }

    private function iniciarSesion(Request $request, Cliente $cliente): void
    {
        $request->session()->put('cliente_web', [
            'id_cliente' => $cliente->id_cliente,
            'nombre' => $cliente->nombre_cliente,
            'usuario' => $cliente->usuario_cliente,
        ]);

        $request->session()->regenerate();
    }

    private function urlCallback(string $proveedor): string
    {
        return url('/tienda/auth/'.$proveedor.'/callback');
    }

    private function destinoPermitido(?string $destino): ?string
    {
        $destino = trim((string) $destino);

        if ($destino !== '/tienda' && ! str_starts_with($destino, '/tienda/')) {
            return null;
        }

        return $destino;
    }

    private function nombreProveedor(string $proveedor): string
    {
        return $proveedor === 'google' ? 'Google' : 'Facebook';
    }

    private function nombreDesdeCorreo(string $correo): string
    {
        $nombre = strstr($correo, '@', true) ?: $correo;

        return ucfirst(str_replace(['.', '_', '-'], ' ', $nombre));
    }

    private function usuarioUnico(?string $base): string
    {
        $base = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $base);

        if (strlen($base) < 4) {
            $base = 'cliente'.$base;
        }

        $base = substr($base, 0, 50);
        $candidato = $base;
        $contador = 1;

        while (Cliente::where('usuario_cliente', $candidato)->exists()) {
            $candidato = $base.$contador;
            $contador++;
        }

        return $candidato;
    }

    private function datosCliente(Cliente $cliente): array
    {
        return [
            'id_cliente' => $cliente->id_cliente,
            'nombre_cliente' => $cliente->nombre_cliente,
            'usuario_cliente' => $cliente->usuario_cliente,
            'correo_cliente' => $cliente->correo_cliente,
            'telefono_cliente' => $cliente->telefono_cliente,
            'fecha_nacimiento_cliente' => $cliente->fecha_nacimiento_cliente?->format('Y-m-d'),
            'cedula_cliente' => $cliente->cedula_cliente,
            'descuento' => $this->datosDescuento($cliente),
        ];
    }

    private function datosDescuento(Cliente $cliente): ?array
    {
        $tipo = $cliente->descuento_tipo_cliente;
        $valor = (float) $cliente->descuento_valor_cliente;

        if (! in_array($tipo, ['porcentaje', 'monto'], true) || $valor <= 0) {
            return null;
        }

        return [
            'tipo' => $tipo,
            'valor' => $valor,
            'etiqueta' => $tipo === 'porcentaje'
                ? rtrim(rtrim(number_format($valor, 2, '.', ''), '0'), '.').'%'
                : 'C$ '.number_format($valor, 2, '.', ','),
        ];
    }

    private function datosDireccion(ClienteDireccion $direccion): array
    {
        return [
            'id_direccion_cliente' => $direccion->id_direccion_cliente,
            'nombre_direccion' => $direccion->nombre_direccion,
            'ubicacion_maps' => $direccion->ubicacion_maps,
            'referencia_direccion' => $direccion->referencia_direccion,
            'direccion_manual' => $direccion->direccion_manual,
            'latitud_direccion' => $direccion->latitud_direccion !== null ? (float) $direccion->latitud_direccion : null,
            'longitud_direccion' => $direccion->longitud_direccion !== null ? (float) $direccion->longitud_direccion : null,
            'predeterminada_direccion' => (bool) $direccion->predeterminada_direccion,
        ];
    }

    private function buscarDireccion(Cliente $cliente, int|string $id): ?ClienteDireccion
    {
        return $cliente->direcciones()
            ->where('id_direccion_cliente', $id)
            ->where('estado_direccion', 1)
            ->first();
    }

    private function tieneUbicacion(Request $request): bool
    {
        return trim((string) $request->input('ubicacion_maps')) !== ''
            || trim((string) $request->input('referencia_direccion')) !== ''
            || trim((string) $request->input('direccion_manual')) !== ''
            || ($request->filled('latitud_direccion') && $request->filled('longitud_direccion'));
    }

    private function coordenada(mixed $valor, float $limite): ?float
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        $numero = (float) $valor;

        return abs($numero) <= $limite ? round($numero, 7) : null;
    }

    private function enlaceMaps(Request $request): ?string
    {
        if ($request->filled('ubicacion_maps')) {
            return trim($request->ubicacion_maps);
        }

        $latitud = $this->coordenada($request->input('latitud_direccion'), 90);
        $longitud = $this->coordenada($request->input('longitud_direccion'), 180);

        if ($latitud === null || $longitud === null) {
            return null;
        }

        // Enlace listo para que el repartidor abra la ubicación exacta.
        return 'https://www.google.com/maps/search/?api=1&query='.$latitud.','.$longitud;
    }

    private function datosFavorito(ClienteFavorito $favorito): ?array
    {
        $producto = $favorito->producto;

        if (! $producto) {
            return null;
        }

        $impuesto = (float) ($producto->impuesto->porcentaje_impuesto ?? 0);
        $precio = round((float) $producto->precio_venta * (1 + $impuesto / 100), 2);

        return [
            'id_producto' => $producto->id_producto,
            'nombre_producto' => $producto->nombre_producto,
            'categoria' => $producto->categoria->nombre_categoria ?? 'General',
            'precio' => $precio,
            'imagen' => $this->imagenProducto($producto),
        ];
    }

    private function datosVenta(Venta $venta): array
    {
        return [
            'id_venta' => $venta->id_venta,
            'numero_factura' => $venta->numero_factura,
            'fecha_venta' => $venta->fecha_venta,
            'estado_venta' => (bool) $venta->estado_venta,
            'subtotal_venta' => (float) $venta->subtotal_venta,
            'descuento_venta' => (float) $venta->descuento_venta,
            'impuesto_venta' => (float) $venta->impuesto_venta,
            'total_venta' => (float) $venta->total_venta,
            'metodo_pago' => $venta->metodoPago->nombre_metodo_pago ?? '—',
            'items' => $venta->detalles->map(fn ($detalle) => [
                'producto' => $detalle->producto->nombre_producto ?? 'Producto eliminado',
                'cantidad' => (int) $detalle->cantidad_venta,
                'precio' => (float) $detalle->precio_unitario_venta,
                'subtotal' => (float) $detalle->subtotal_detalle_venta,
            ])->values(),
        ];
    }

    private function imagenProducto(Producto $producto): ?string
    {
        $variacion = $producto->variaciones->first();
        $imagen = $variacion?->imagenes->first()->imagen ?? null;

        if ($imagen) {
            $ruta = ltrim(str_replace('\\', '/', $imagen), '/');

            return str_starts_with($ruta, 'imagenes/')
                ? '/'.$ruta
                : '/imagenes/productosvariaciones/'.$ruta;
        }

        if (! $producto->imagen_producto) {
            return null;
        }

        $ruta = ltrim(str_replace('\\', '/', $producto->imagen_producto), '/');

        return str_contains($ruta, '/') ? '/'.$ruta : '/imagenes/productos/'.$ruta;
    }
}
