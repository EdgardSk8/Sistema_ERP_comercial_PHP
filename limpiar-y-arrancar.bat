@echo off
setlocal
title ERP - Limpieza y arranque
cd /d "%~dp0"

where php >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encontro PHP en el PATH.
    pause
    exit /b 1
)

echo ==========================================
echo   1^) Limpiar y arrancar (solo este equipo)
echo   2^) Limpiar y arrancar (red local)
echo   3^) Solo limpiar
echo ==========================================
set /p OPCION="Opcion [1]: "
if "%OPCION%"=="" set OPCION=1

echo.
echo -- Limpiando config, cache, rutas, vistas, eventos...
php artisan optimize:clear

if exist "bootstrap\cache\packages.php" del /q "bootstrap\cache\packages.php"
if exist "bootstrap\cache\services.php" del /q "bootstrap\cache\services.php"
if exist "storage\framework\views\*.php" del /q "storage\framework\views\*.php"

php artisan event:clear >nul 2>&1
php artisan debugbar:clear >nul 2>&1

echo.
echo [OK] Limpieza completada.
echo.

if "%OPCION%"=="3" goto :fin

if "%OPCION%"=="2" goto :red

call :liberar_puerto
echo -- Levantando servidor en http://127.0.0.1:8000
start "" /b cmd /c "timeout /t 3 >nul & start http://127.0.0.1:8000"
php artisan serve
goto :fin

:red
call :liberar_puerto
call :detectar_ip
call :abrir_firewall
echo -- Levantando servidor accesible en la red local
 echo    Este equipo:   http://127.0.0.1:8000
 echo    Otros equipos: http://%IP_LAN%:8000
 echo    Si no responde, permite el puerto 8000 en el Firewall de Windows.
 echo.
start "" /b cmd /c "timeout /t 3 >nul & start http://127.0.0.1:8000"
php artisan serve --host=0.0.0.0 --port=8000
goto :fin

:detectar_ip
set "IP_LAN="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    if not defined IP_LAN (
        for /f "tokens=* delims= " %%b in ("%%a") do set "IP_LAN=%%b"
    )
)
if not defined IP_LAN set "IP_LAN=TU_IP_LAN"
exit /b 0

:liberar_puerto
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /c:":8000" ^| findstr /i "LISTENING"') do taskkill /f /pid %%p >nul 2>&1
exit /b 0

:abrir_firewall
net session >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Ejecuta el .bat como Administrador una vez para abrir el puerto 8000.
    exit /b 0
)
netsh advfirewall firewall show rule name="ERP Laravel 8000" >nul 2>&1
if errorlevel 1 (
    netsh advfirewall firewall add rule name="ERP Laravel 8000" dir=in action=allow protocol=TCP localport=8000 profile=any >nul
    echo [OK] Regla de Firewall creada para el puerto 8000.
)
exit /b 0

:fin
pause
endlocal
