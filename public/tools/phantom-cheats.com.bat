@echo off
setlocal
title phantom-cheats.com
cd /d "%~dp0"
set "UH_SCRIPT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$lines = Get-Content -LiteralPath $env:UH_SCRIPT; $i = 0; while ($i -lt $lines.Count -and $lines[$i] -ne 'exit /b') { $i++ }; $i++; $script = ($lines[$i..($lines.Count-1)] -join [Environment]::NewLine); Invoke-Expression $script"
endlocal
exit /b

$Host.UI.RawUI.WindowTitle = "phantom-cheats.com"

function Write-CheckLine([string]$Label, [string]$Value, [string]$Tone) {
  $map = @{
    ok    = "Green"
    bad   = "Red"
    white = "White"
  }
  $color = $map[$Tone]
  if (-not $color) { $color = "Gray" }
  Write-Host ("  {0,-28}" -f $Label) -NoNewline -ForegroundColor DarkGray
  Write-Host $Value -ForegroundColor $color
}

Clear-Host
Write-Host ""

$board = "Unknown"
try {
  $bb = Get-CimInstance Win32_BaseBoard -ErrorAction Stop
  $board = (("$($bb.Manufacturer) $($bb.Product)") -replace "\s+", " ").Trim()
  if ([string]::IsNullOrWhiteSpace($board)) { $board = "Unknown" }
} catch {}

Write-CheckLine "Motherboard Model" $board "white"
Write-Host "  wait..." -ForegroundColor DarkGray

# TPM is optional — ON or OFF is always green
$tpmText = "OFF / Not present"
try {
  $tpm = Get-CimInstance -Namespace "root/cimv2/Security/MicrosoftTpm" -ClassName Win32_Tpm -ErrorAction Stop
  if ($tpm) {
    $ver = if ($tpm.SpecVersion) { ($tpm.SpecVersion -split ",")[0].Trim() } else { "2.0" }
    $enabled = $false
    try {
      $gt = Get-Tpm -ErrorAction Stop
      $enabled = [bool]$gt.TpmPresent -and ([bool]$gt.TpmReady -or [bool]$gt.TpmEnabled)
    } catch {
      $enabled = [bool]$tpm.IsEnabled_InitialValue
    }
    if ($enabled) { $tpmText = "ON  (TPM $ver)" } else { $tpmText = "OFF (TPM $ver)" }
  }
} catch {}

# Secure Boot is optional — ON or OFF is always green
$sbText = "OFF / Unavailable"
try {
  if (Confirm-SecureBootUEFI -ErrorAction Stop) {
    $sbText = "ON"
  } else {
    $sbText = "OFF"
  }
} catch {
  $sbText = "OFF / Unavailable"
}

# HVCI / Memory Integrity is required OFF
$hvciText = "OFF"
$hvciTone = "ok"
try {
  $path = "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity"
  $enabled = 0
  if (Test-Path $path) {
    $enabled = (Get-ItemProperty -Path $path -Name Enabled -ErrorAction SilentlyContinue).Enabled
  }
  if ($enabled -ne 1) {
    $dg = Get-CimInstance -Namespace "root/Microsoft/Windows/DeviceGuard" -ClassName Win32_DeviceGuard -ErrorAction SilentlyContinue
    if ($dg -and $dg.SecurityServicesRunning -contains 2) { $enabled = 1 }
  }
  if ($enabled -eq 1) {
    $hvciText = "ON"
    $hvciTone = "bad"
  } else {
    $hvciText = "OFF"
    $hvciTone = "ok"
  }
} catch {}

Clear-Host
Write-Host ""
Write-CheckLine "Motherboard Model" $board "white"
Write-CheckLine "TPM 2.0" $tpmText "ok"
Write-CheckLine "Secure Boot" $sbText "ok"
Write-CheckLine "HVCI (Memory Integrity)" $hvciText $hvciTone

Write-Host ""
Write-Host "  Press any key to close..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
