<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PermisoMiddleware
{
    /**
     * Permiso de vista que corresponde a cada módulo. Toda acción exige
     * además el permiso de vista del módulo al que pertenece.
     */
    private const VISTAS_POR_MODULO = [
        'dashboard' => 'vista_dashboard',
        'usuarios' => 'vista_usuarios',
        'roles' => 'vista_roles',
        'permisos' => 'vista_permisos',
        'categorias' => 'vista_categorias',
        'ubicaciones' => 'vista_ubicaciones',
        'clientes' => 'vista_clientes',
        'proveedores' => 'vista_proveedores',
        'productos' => 'vista_productos',
        'ventas' => 'vista_ventas',
        'compras' => 'vista_compras',
        'inventario' => 'vista_movimientos_inventario',
        'cajas' => 'vista_cajas',
        'movimiento_cajas' => 'vista_movimientos_cajas',
        'facturacion' => 'vista_facturacion',
        'cuentas' => 'vista_cuentas',
        'movimiento_cuentas' => 'vista_movimientos_cuentas',
        'transferencias' => 'vista_transferenciacajacuenta',
        'gastos' => 'vista_gastos',
        'movimiento_gastos' => 'vista_movimientos_gastos',
        'tipos_gasto' => 'vista_tipos_gasto',
        'metodos_pago' => 'vista_metodos_pago',
        'metodos_pago_cuenta' => 'vista_metodos_pago_cuenta',
        'impuestos' => 'vista_impuestos',
        'credenciales' => 'vista_credenciales',
        'sistema' => 'vista_respaldo',
        'reportes' => 'vista_reportes',
        'tipos_medidas' => 'vista_tipos_medidas',
        'medidas' => 'vista_medidas',
    ];

    public function handle(Request $request, Closure $next, $permiso): Response
    {
        $usuario = session('usuario');

        // Las peticiones AJAX/JSON reciben JSON con el motivo real. Antes se
        // devolvia una redireccion (HTML) y el front mostraba "error de conexion"
        // en lugar de "no estas autorizado".
        $esperaJson = $request->expectsJson() || $request->ajax();

        if (! $usuario) {

            if ($esperaJson) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Tu sesión expiró. Vuelve a iniciar sesión.',
                ], 401);
            }

            return response()->view('errors.sin_permiso', [], 401);
        }

        $permisoInfo = DB::table('permisos')
            ->where('nombre_permiso', $permiso)
            ->first(['modulo_permiso']);

        $requeridos = [$permiso];
        $vista = $permisoInfo
            ? $this->vistaRequerida($permiso, $permisoInfo->modulo_permiso)
            : null;

        if ($vista && ! in_array($vista, $requeridos, true)) {
            $requeridos[] = $vista;
        }

        $asignados = DB::table('rol_permiso')
            ->join('permisos', 'rol_permiso.id_permiso', '=', 'permisos.id_permiso')
            ->where('rol_permiso.id_rol', $usuario['id_rol'])
            ->whereIn('permisos.nombre_permiso', $requeridos)
            ->where('permisos.estado_permiso', 1)
            ->distinct()
            ->pluck('permisos.nombre_permiso')
            ->all();

        $faltantes = array_values(array_diff($requeridos, $asignados));

        if (! empty($faltantes)) {

            if ($esperaJson) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No estás autorizado para esta acción.',
                    'permiso' => $permiso,
                    'permisos_faltantes' => $faltantes,
                ], 403);
            }

            return redirect()->route('error');
        }

        return $next($request);
    }

    /**
     * Devuelve el permiso de vista que debe tener el usuario para ejecutar
     * la acción indicada. Los permisos "vista_*" no requieren otro permiso.
     */
    private function vistaRequerida(string $permiso, string $modulo): ?string
    {
        if (str_starts_with($permiso, 'vista_')) {
            return null;
        }

        if ($modulo === 'producto_variaciones') {
            if (str_contains($permiso, 'variacion_imagen') || str_contains($permiso, 'variacion_talla')) {
                return 'vista_producto_variaciones_detalle';
            }

            if (str_contains($permiso, 'tallas')) {
                return 'vista_tallas';
            }

            return 'vista_producto_variaciones';
        }

        if ($modulo === 'ventas') {
            return in_array($permiso, ['mostrar_cuentas_por_cobrar', 'registrar_pagos_venta'], true)
                ? 'vista_cuentas_por_cobrar'
                : 'vista_ventas';
        }

        if ($modulo === 'compras') {
            return $permiso === 'crear_compras' ? 'vista_crear_compras' : 'vista_compras';
        }

        if ($modulo === 'movimiento_cuentas') {
            return $permiso === 'movimiento_cuentas' ? 'vista_cuentas' : 'vista_movimientos_cuentas';
        }

        return self::VISTAS_POR_MODULO[$modulo] ?? null;
    }
}
