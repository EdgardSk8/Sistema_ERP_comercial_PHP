# Expone el ERP local a Internet con Cloudflare Tunnel.
#
# Uso rapido (URL temporal, sin cuenta):
#   .\tunnel.ps1
#
# Uso con dominio propio (tunel con nombre):
#   .\tunnel.ps1 -Tunel erp
#
# Requisitos para el tunel con nombre (una sola vez):
#   cloudflared tunnel login
#   cloudflared tunnel create erp
#   cloudflared tunnel route dns erp erp.tudominio.com

param(
    [int]$Port = 8000,
    [string]$Tunel = ''
)

$ErrorActionPreference = 'Stop'

Write-Host "Iniciando servidor Laravel en http://127.0.0.1:$Port ..." -ForegroundColor Cyan

$servidor = Start-Process -FilePath 'php' `
    -ArgumentList 'artisan', 'serve', '--host=127.0.0.1', "--port=$Port" `
    -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

try {
    if ($Tunel -ne '') {
        Write-Host "Conectando el tunel '$Tunel' ..." -ForegroundColor Cyan
        & cloudflared tunnel run --url "http://127.0.0.1:$Port" $Tunel
    } else {
        Write-Host 'Creando tunel temporal (trycloudflare.com) ...' -ForegroundColor Cyan
        & cloudflared tunnel --url "http://127.0.0.1:$Port"
    }
}
finally {
    if ($servidor -and -not $servidor.HasExited) {
        Stop-Process -Id $servidor.Id -Force -ErrorAction SilentlyContinue
        Write-Host 'Servidor Laravel detenido.' -ForegroundColor Yellow
    }
}
