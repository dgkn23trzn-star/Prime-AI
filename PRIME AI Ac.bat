@echo off
rem PRIME AI - klasordeki kopyayi acar. Bu dosyaya cift tiklayin.
rem Uygulama zaten aciksa ikinci kopya baslamaz; pencere one gelir.
setlocal
set "EXE=%~dp0dist\win-unpacked\PRIME AI.exe"

if not exist "%EXE%" (
  echo PRIME AI bulunamadi:
  echo   %EXE%
  echo Once "npm run dist" ile paketleyin.
  pause
  exit /b 1
)

start "" "%EXE%"
exit /b 0
