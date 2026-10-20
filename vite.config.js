import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                // CSS globales
                'resources/css/variables.css',
                'resources/css/app.css',
                'resources/css/principal/principal.css',
                'resources/css/login/login.css',

                // CSS por modulo (los piden las vistas con @vite o Vite::asset)
                'resources/css/cajas/Cajas.css',
                'resources/css/compras/Compras.css',
                'resources/css/cuentasporcobrar/CuentasPorCobrar.css',
                'resources/css/dashboard/Dashboard.css',
                'resources/css/facturacion/Facturacion.css',
                'resources/css/permisos/Permisos.css',
                'resources/css/reportes/Reportes.css',
                'resources/css/respaldo/Respaldo.css',

                // JS cargados directamente desde las vistas (no por app.js)
                'resources/js/app.js',
                'resources/js/FuncionesGlobales.js',
                'resources/js/Login.js',
                'resources/js/logout.js',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
/* ------------------------------------------------------------------------------------------------------------------------ */
       
        //host: '0.0.0.0', // Escucha en todas las direcciones de red
        cors: true,
        hmr: {
            //host: '192.168.136.196',
            //host: '192.168.18.7',
            //host: '172.20.10.1'
        },
        
/* ------------------------------------------------------------------------------------------------------------------------ */
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        target: 'es2018',
        sourcemap: false,
        minify: 'esbuild',
        cssCodeSplit: true,
    }
});
