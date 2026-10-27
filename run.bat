@echo off
setlocal EnableExtensions

rem OptiVest one-command launcher (database + backend + frontend)
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop/Docker CLI was not found on PATH.
    echo Install and start Docker Desktop, then run this file again.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Start Docker Desktop and retry.
    pause
    exit /b 1
)

echo Starting OptiVest database, backend, and frontend...
docker compose up -d --build
if errorlevel 1 (
    echo [ERROR] Docker Compose could not start OptiVest.
    docker compose ps
    pause
    exit /b 1
)

echo.
echo Service status:
docker compose ps
echo.
echo OptiVest URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000/docs
echo   Database: localhost:5432
echo.
echo To stop the project run: docker compose down
echo Logs: docker compose logs -f backend frontend
echo.
pause
exit /b 0
