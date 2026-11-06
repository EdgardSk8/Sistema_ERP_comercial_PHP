# Chart.js 4.5.1 + chartjs-plugin-datalabels 2.0.0

Cargados por `Recursos::url('chartjs')` y `Recursos::url('chartjs_datalabels')` (UMD, global `Chart`).
El plugin de datalabels se registra solo con la carga UMD.

## Patrón del proyecto

`resources/js/Dashboard.js` es la referencia: guarda cada gráfica en una variable de módulo y la
recrea al recargar datos.

```js
Chart_Grafica_1 = new Chart(ctx_Grafica_1, {
    type: 'line',                      // 'line' | 'bar' | 'doughnut' | 'pie'
    data: { labels: [], datasets: [] },
    options: {
        responsive: true,
        maintainAspectRatio: false,    // el alto lo da el contenedor del canvas
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
    },
});
```

## Actualizar datos

```js
Chart_Grafica_1.data.labels = etiquetas;
Chart_Grafica_1.data.datasets[0].data = valores;
Chart_Grafica_1.update();

Chart_Grafica_1.destroy();            // antes de crear otra sobre el mismo canvas
```

## Gotchas

- Un `canvas` solo admite **una** instancia: destruir la anterior o reutilizar y llamar `update()`.
- Sin `maintainAspectRatio: false` + un contenedor con alto definido, la gráfica crece sin límite.
- Chart.js 4 usa `scales: { y: { ... } }` (no `yAxes`) y `plugins.legend` (no `legend` en la raíz).
- Los colores del proyecto salen de `resources/css/variables.css`; no hardcodear paletas nuevas.
- El canvas debe tener un `id` estable porque `Dashboard.js` lo busca por id.

## Documentación oficial

- https://www.chartjs.org/docs/latest/charts/ (solo el tipo de gráfica concreto)
- https://chartjs-plugin-datalabels.netlify.app/guide/options.html
