# Local MySQL for UNKNOWN (port 3307, password from .env)
$basedir = "C:\Program Files\MySQL\MySQL Server 8.0"
$datadir = Join-Path $PSScriptRoot "..\.mysql-data" | Resolve-Path
$mysqld = Join-Path $basedir "bin\mysqld.exe"

$existing = Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "MySQL already listening on 3307"
  exit 0
}

Start-Process -FilePath $mysqld -ArgumentList @(
  "--basedir=`"$basedir`"",
  "--datadir=`"$datadir`"",
  "--port=3307",
  "--mysqlx=0"
) -WindowStyle Hidden

Write-Host "Started local MySQL on 127.0.0.1:3307"
