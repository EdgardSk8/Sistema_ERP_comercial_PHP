<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Registro de arqueo de cajas</title>
    <style>
        :root{font-family:Arial,sans-serif;color:#20252b;background:#fff;font-size:12px}
        *{box-sizing:border-box}
        body{max-width:1100px;margin:28px auto;padding:0 20px}
        header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #252a30;padding-bottom:14px;margin-bottom:18px}
        h1{font-size:22px;margin:0 0 5px}
        p{margin:0;color:#59616b}
        button{border:1px solid #59616b;background:#fff;padding:8px 12px;border-radius:4px;cursor:pointer}
        .resumen{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:16px}
        .resumen div{border:1px solid #d8dde2;padding:7px 9px;text-align:center}
        .resumen span{display:block;color:#59616b;margin-bottom:3px;font-size:11px}
        .resumen strong{font-size:13px;font-variant-numeric:tabular-nums}
        table{width:100%;border-collapse:collapse;font-size:11.5px}
        th,td{border:1px solid #cbd0d5;padding:6px 7px;text-align:center;vertical-align:middle}
        th{background:#eef1f3;font-size:11px}
        .numero{font-variant-numeric:tabular-nums;white-space:nowrap}
        .positivo{color:#14783b;font-weight:bold}
        .negativo{color:#b42318;font-weight:bold}
        .pendiente{color:#667085}
        @media print{body{max-width:none;margin:0;padding:0}button{display:none}.resumen div{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid}}
        @media(max-width:700px){body{margin:12px auto;padding:0 10px}.resumen{grid-template-columns:repeat(2,minmax(0,1fr))}header{align-items:flex-start;flex-direction:column}table{font-size:10px}}
    </style>
</head>
<body>
    @php
        // Quién exporta (usuario de la sesión) y la fecha completa con el mismo
        // formato del helper global window.formatearFechaDiaHora().
        $usuarioExporta = session('usuario.nombre') ?? 'Usuario no identificado';
        $rolExporta = session('usuario.rol') ?? null;

        $meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        $ahora = \Carbon\Carbon::now();
        $fechaExportacion = $ahora->format('j').' de '.$meses[$ahora->month - 1].' del '.$ahora->format('Y').' '.$ahora->format('h:i A');
    @endphp

    <header>
        <div>
            <h1>Registro de arqueo de cajas</h1>
            @if ($tipo === 'caja')
                <p>Caja #{{ data_get($cajas[0], 'id_caja') }} · sesión individual</p>
            @elseif (!$fechaInicio && !$fechaFin)
                <p>Todas las sesiones de caja</p>
            @else
                <p>Periodo: {{ \Carbon\Carbon::parse($fechaInicio)->format('d/m/Y') }} al {{ \Carbon\Carbon::parse($fechaFin)->format('d/m/Y') }}</p>
            @endif
            <p>Exportado por: {{ $usuarioExporta }}@if ($rolExporta) · {{ $rolExporta }}@endif</p>
            <p>Fecha de exportación: {{ $fechaExportacion }}</p>
        </div>
        <button type="button" onclick="window.print()">Imprimir</button>
    </header>

    <section class="resumen" aria-label="Resumen del periodo">
        <div><span>Sesiones</span><strong>{{ data_get($resumen, 'total_cajas', 0) }}</strong></div>
        <div><span>Saldo teórico</span><strong>C$ {{ number_format((float) data_get($resumen, 'monto_teorico', 0), 2) }}</strong></div>
        <div><span>Efectivo contado</span><strong>C$ {{ number_format((float) data_get($resumen, 'monto_real', 0), 2) }}</strong></div>
        <div><span>Diferencia neta</span><strong>C$ {{ number_format((float) data_get($resumen, 'diferencia', 0), 2) }}</strong></div>
    </section>

    <table>
        <thead>
            <tr>
                <th>Caja</th>
                <th>Usuario</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th class="numero">Inicial</th>
                <th class="numero">Teórico / final</th>
                <th class="numero">Real</th>
                <th class="numero">Diferencia</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($cajas as $caja)
                @php
                    $real = data_get($caja, 'monto_real');
                    $diferencia = data_get($caja, 'diferencia');
                @endphp
                <tr>
                    <td>#{{ data_get($caja, 'id_caja') }}</td>
                    <td>{{ data_get($caja, 'usuario', '—') }}</td>
                    <td>{{ data_get($caja, 'fecha_apertura') ? \Carbon\Carbon::parse(data_get($caja, 'fecha_apertura'))->format('d/m/Y h:i A') : '—' }}</td>
                    <td>{{ data_get($caja, 'fecha_cierre') ? \Carbon\Carbon::parse(data_get($caja, 'fecha_cierre'))->format('d/m/Y h:i A') : '—' }}</td>
                    <td class="numero">C$ {{ number_format((float) data_get($caja, 'monto_inicial', 0), 2) }}</td>
                    <td class="numero">C$ {{ number_format((float) data_get($caja, 'monto_teorico', 0), 2) }}</td>
                    <td class="numero">{{ $real === null ? 'Pendiente' : 'C$ ' . number_format((float) $real, 2) }}</td>
                    <td class="numero {{ $diferencia === null ? 'pendiente' : ((float) $diferencia > 0 ? 'positivo' : ((float) $diferencia < 0 ? 'negativo' : '')) }}">
                        {{ $diferencia === null ? 'Pendiente' : 'C$ ' . number_format((float) $diferencia, 2) }}
                    </td>
                    <td>{{ data_get($caja, 'estado_caja') ? 'Abierta' : ($real === null ? 'Cerrada · sin arqueo' : 'Arqueada') }}</td>
                </tr>
            @empty
                <tr><td colspan="9">No hay sesiones de caja en este periodo.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
