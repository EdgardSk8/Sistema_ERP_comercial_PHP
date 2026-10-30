<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Caché de los endpoints del dashboard
    |--------------------------------------------------------------------------
    |
    | Supabase está fuera de la red local: cada consulta cuesta ~230 ms de ida
    | y vuelta. Los dashboards hacen entre 6 y 10 consultas por petición, así
    | que cachear la respuesta un poco evita pagar ese costo cada vez que se
    | cambia de pestaña.
    |
    | DASHBOARD_CACHE_SEGUNDOS=0 desactiva la caché.
    |
    */

    'cache_segundos' => (int) env('DASHBOARD_CACHE_SEGUNDOS', 30),

];
