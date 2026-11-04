# Genera MAPA-PROYECTO.md escaneando vistas, CSS, JS y el menu lateral.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\generar-mapa.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$views = Join-Path $root 'resources\views'
$jsDir = Join-Path $root 'resources\js'
$outFile = Join-Path $root 'MAPA-PROYECTO.md'

function Read-Utf8($p) { [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }

# 1) Menu lateral: grupo -> ruta -> texto
$sidebar = Read-Utf8 (Join-Path $views 'principal\principal.blade.php')
$sidebarLines = $sidebar -split "`r?`n"
$grupos = @()
$grupoActual = ''
for ($i = 0; $i -lt $sidebarLines.Count; $i++) {
    $line = $sidebarLines[$i]
    $m = [regex]::Match($line, 'data-section-label="([^"]+)"')
    if ($m.Success) { $grupoActual = $m.Groups[1].Value }
    $rm = [regex]::Match($line, "route\('([^']+)'\)")
    if (-not $rm.Success) { continue }
    $texto = ''
    for ($j = $i; $j -lt [Math]::Min($i + 12, $sidebarLines.Count); $j++) {
        $l = $sidebarLines[$j].Trim()
        if ($l -match '^</a>') { break }
        if ($l -match '^<') { continue }
        if ($l -match '^@') { continue }
        if ($l -match '^[a-zA-Z_][a-zA-Z0-9_-]*=') { continue }
        if ($l -match '^\s*$') { continue }
        $texto = $l
        break
    }
    $grupos += [pscustomobject]@{ Grupo = $grupoActual; Ruta = $rm.Groups[1].Value; Texto = $texto }
}

# 2) app.js: selector raiz -> modulo JS
$appjs = Read-Utf8 (Join-Path $jsDir 'app.js')
$modMap = @()
foreach ($m in [regex]::Matches($appjs, "\['([^']+)',\s*\(\)\s*=>\s*import\('\./([^']+)'\)\]")) {
    $modMap += [pscustomobject]@{ Selector = $m.Groups[1].Value; Modulo = $m.Groups[2].Value }
}

# 3) Vistas: @vite, @include, modales, botones e IDs
$viewRows = @()
foreach ($f in (Get-ChildItem $views -Recurse -Filter '*.blade.php')) {
    $rel = $f.FullName.Substring($views.Length + 1).Replace('\', '/')
    if ($rel -like 'principal/*' -or $rel -like 'manual/*') { continue }
    $text = Read-Utf8 $f.FullName
    $vite = @()
    foreach ($m in [regex]::Matches($text, "@vite\(\[([^\]]+)\]\)")) {
        foreach ($q in [regex]::Matches($m.Groups[1].Value, "'([^']+)'")) { $vite += $q.Groups[1].Value }
    }
    $inc = @()
    foreach ($m in [regex]::Matches($text, "@include\('([^']+)'\)")) { $inc += $m.Groups[1].Value }
    $ids = @()
    foreach ($m in [regex]::Matches($text, 'id="([^"]+)"')) { $ids += $m.Groups[1].Value }
    $ids = @($ids | Select-Object -Unique)
    $modales = @($ids | Where-Object { $_ -like 'modal*' })
    $botones = @()
    foreach ($m in [regex]::Matches($text, '<button[^>]*id="([^"]+)"')) { $botones += $m.Groups[1].Value }
    $botones = @($botones | Select-Object -Unique)
    $viewRows += [pscustomobject]@{
        Vista = $rel
        Vite = ($vite -join ', ')
        Includes = ($inc -join ', ')
        Modales = ($modales -join ', ')
        Botones = ($botones -join ', ')
        Ids = (($ids | Select-Object -First 20) -join ', ')
    }
}

# 4) JS: funcion exportada e IDs que consulta
$jsRows = @()
foreach ($f in (Get-ChildItem $jsDir -File -Filter '*.js')) {
    $text = Read-Utf8 $f.FullName
    $fn = [regex]::Match($text, 'export\s+default\s+function\s+(\w+)').Groups[1].Value
    $sel = @()
    foreach ($m in [regex]::Matches($text, "getElementById\('([^']+)'\)")) { $sel += '#' + $m.Groups[1].Value }
    $sel = @($sel | Select-Object -Unique)
    if ($fn -ne '' -or $sel.Count -gt 0) {
        $jsRows += [pscustomobject]@{ Archivo = $f.Name; Funcion = $fn; Selectores = (($sel | Select-Object -First 12) -join ', ') }
    }
}

# 5) Markdown
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# Mapa del proyecto')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> Generado automaticamente por `scripts/generar-mapa.ps1`. No editar a mano.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Convencion')
[void]$sb.AppendLine('- Vista: `resources/views/<modulo>/<Vista>.blade.php`')
[void]$sb.AppendLine('- CSS: `resources/css/<modulo>/<Vista>.css` (se carga con `@vite([...])` en la vista)')
[void]$sb.AppendLine('- JS: `resources/js/<Vista>.js` (registrado en `resources/js/app.js` -> arreglo `modulos`)')
[void]$sb.AppendLine('- Ruta: `routes/web.php`')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Menu lateral (grupo -> ruta -> texto)')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Grupo | Ruta | Texto del menu |')
[void]$sb.AppendLine('|---|---|---|')
foreach ($g in $grupos) { [void]$sb.AppendLine("| $($g.Grupo) | $($g.Ruta) | $($g.Texto) |") }
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Vistas por modulo')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Vista (blade) | CSS/JS (@vite) | Includes | Modales | Botones | IDs principales |')
[void]$sb.AppendLine('|---|---|---|---|---|---|')
foreach ($r in ($viewRows | Sort-Object Vista)) {
    [void]$sb.AppendLine("| $($r.Vista) | $($r.Vite) | $($r.Includes) | $($r.Modales) | $($r.Botones) | $($r.Ids) |")
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Mapa JS (selector raiz -> modulo)')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Selector raiz | Modulo JS |')
[void]$sb.AppendLine('|---|---|')
foreach ($m in $modMap) { [void]$sb.AppendLine("| $($m.Selector) | resources/js/$($m.Modulo).js |") }
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Selectores que consulta cada JS')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| JS | Funcion | IDs principales |')
[void]$sb.AppendLine('|---|---|---|')
foreach ($j in ($jsRows | Sort-Object Archivo)) { [void]$sb.AppendLine("| $($j.Archivo) | $($j.Funcion) | $($j.Selectores) |") }

[System.IO.File]::WriteAllText($outFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Generado: $outFile"
Write-Output ("Vistas: " + $viewRows.Count + " | Modulos JS: " + $modMap.Count + " | Enlaces menu: " + $grupos.Count)
