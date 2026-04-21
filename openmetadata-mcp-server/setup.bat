@echo off
REM OpenMetadata MCP Server - Quick Start Script for Windows
REM =============================================

echo.
echo OpenMetadata MCP Server - Setup
echo ============================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+ first.
    echo Download: https://python.org/downloads
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -e .

if errorlevel 1 (
    echo ERROR: Failed to install dependencies. Try:
    echo   pip install mcp httpx pydantic python-dotenv
    pause
    exit /b 1
)

echo.
echo [2/3] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please edit it with your credentials!
) else (
    echo .env already exists.
)

echo.
echo [3/3] Running demo...
python demo.py

echo.
echo ========
echo SETUP COMPLETE!
echo.
echo Next steps:
echo 1. Edit .env with your OpenMetadata credentials
echo 2. Run: python -m openmetadata_mcp.server
echo.
echo Docs: openmetadata-mcp-server\README.md
echo.
pause