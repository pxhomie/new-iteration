# Скачивает картинки кейса ASI (Halo Lab CDN) в assets\asi\
# Запуск: powershell -ExecutionPolicy Bypass -File get-asi-images.ps1
$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "assets\asi"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Write-Host "качаю: hero.avif"
curl.exe -sSL -o (Join-Path $dir "hero.avif") "https://cdn.prod.website-files.com/63fc977c14aaea404dce4439/67b8544cb159a68ee4351ec0_Hero-Desktop.avif"
Write-Host "качаю: cover.webp"
curl.exe -sSL -o (Join-Path $dir "cover.webp") "https://cdn.prod.website-files.com/63fc977c14aaea404dce4439/67b73ed97827c343eb5ef03c_preview.webp"
Write-Host "качаю: flow.avif"
curl.exe -sSL -o (Join-Path $dir "flow.avif") "https://cdn.prod.website-files.com/63fc977c14aaea404dce4439/67b73f9f2212299ef7063b89_workflow-desktop.avif"
Write-Host "качаю: screens.avif"
curl.exe -sSL -o (Join-Path $dir "screens.avif") "https://cdn.prod.website-files.com/63fc977c14aaea404dce4439/67b74307a0fb1e5b768f0f8f_img-01.avif"
Write-Host "Готово: 4 файла в assets\asi\"