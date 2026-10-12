import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js', 'resources/css/cuentasporcobrar/CuentasPorCobrar.css'],
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
