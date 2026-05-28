$found = $false
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'wechat_alert_demo\.py|wechat_bridge\.py' } |
  ForEach-Object {
    $found = $true
    Write-Host ("Stopping wechat auto PID {0} ..." -f $_.ProcessId)
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host ("[OK] Stopped PID {0}" -f $_.ProcessId)
  }

if (-not $found) {
  Write-Host '[OK] No running wechat auto process found.'
}
