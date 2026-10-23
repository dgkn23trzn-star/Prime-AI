# PRIME AI — klasördeki kopyayı tek tuşla açma.
#
# Başlat menüsüne bir kısayol koyar ve kısayolun "Kısayol tuşu" alanına
# Ctrl+Alt+P yazar. Windows kısayol tuşlarını yalnızca masaüstü ve Başlat
# menüsündeki .lnk dosyaları için çalıştırdığından kısayol oraya konur;
# böylece tuş, uygulama kapalıyken de onu açar.
#
# Kullanım:  powershell -ExecutionPolicy Bypass -File scripts\kisayol-tusu.ps1
# Kaldırma:  aynı betiği -Kaldir ile çalıştırın.

param(
  [string]$Tus = 'Ctrl+Alt+P',
  [switch]$Kaldir
)

$ErrorActionPreference = 'Stop'

$kok = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $kok 'dist\win-unpacked\PRIME AI.exe'
$baslat = [Environment]::GetFolderPath('Programs')
# Adı karakter kodundan kur: betik BOM'suz UTF-8 okunsa da “klasör” bozulmaz.
$ad = 'PRIME AI (klas' + [char]0xF6 + 'r)'
$lnk = Join-Path $baslat ($ad + '.lnk')
$eski = Join-Path $baslat 'PRIME AI (klasor).lnk'

if ($Kaldir) {
  $silindi = $false
  foreach ($x in @($lnk, $eski)) {
    if (Test-Path $x) { Remove-Item $x -Force; Write-Output ('kaldirildi: ' + $x); $silindi = $true }
  }
  if (-not $silindi) { Write-Output 'kaldirilacak kisayol yok' }
  exit 0
}

if (-not (Test-Path $exe)) {
  Write-Output ('HATA: exe bulunamadi: ' + $exe)
  Write-Output 'Once "npm run dist" ile paketleyin.'
  exit 1
}

$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
$s.TargetPath = $exe
$s.WorkingDirectory = Split-Path -Parent $exe
$s.IconLocation = $exe + ',0'
$s.Description = ('PRIME AI - klas' + [char]0xF6 + 'rdeki kopya')
$s.Hotkey = $Tus
$s.Save()

# Geri okuyup doğrula: Windows bazi tus birlesimlerini sessizce reddeder.
$kontrol = $sh.CreateShortcut($lnk)
if (-not $kontrol.Hotkey) {
  Write-Output ('HATA: kisayol olustu ama tus atanamadi: ' + $lnk)
  exit 1
}

if (Test-Path $eski) { Remove-Item $eski -Force }

Write-Output ('kisayol : ' + $lnk)
Write-Output ('hedef   : ' + $kontrol.TargetPath)
Write-Output ('tus     : ' + $kontrol.Hotkey)
