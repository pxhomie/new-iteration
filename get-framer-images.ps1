# Скачивает картинки шаблона с CDN Framer в assets\framer\
# Запуск: правый клик -> Run with PowerShell (или: powershell -ExecutionPolicy Bypass -File get-framer-images.ps1)
$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "assets\framer"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$files = @(
  "38NpwzghYIptRRbFZ6Soejx3wVY.jpeg",
  "3beBMzMms4PiDEE80T3VPXN7FoE.jpg",
  "4WbRXwPAFJbnEFjFuWDs7LLC4ds.jpg",
  "7ZSIdyPw23PAYM3qvBNhoBOW828.jpg",
  "8jCrp6UAdvY0BvbZMQ69FMrPWU.jpg",
  "CLNNeZ7sGt3ywvDzR7D6Mi3TE.jpg",
  "CQiGiMt8KaPh7SAIXpl7ZHUpwYU.jpg",
  "CtZtT97lx3imoMOuinUNyvOUo.jpg",
  "DczfUPHFJwtBAhU9Ab1X68Glg.jpg",
  "F1UsC3Qy2MBxr7spZdOv8SWIZpQ.jpg",
  "GCGprlnbGpXM6hbSFQyr2FmQhs.jpg",
  "HSDuVqMhSgRPV5plzbPZvxsh3c.jpg",
  "IQe1Ak6IQCv8JGUh2qx9RiQCBQ.jpg",
  "IUemvQkLgDMcBDfk0JMW2zfw.jpg",
  "IXWqaCHPbvPQKcyZ9Mch2cWh9hU.jpg",
  "IaiFRY4S4OYymE10NQ9ipQb5dwc.jpg",
  "J4dgxrD9A3uDkL6hIukWwcBQ.jpg",
  "Lc4erlgEmXN8fEJjyK8QzjEA3Qo.jpg",
  "MI76ZMTeB2Mvtl0tBcBCscmA.jpg",
  "MuKacYjazqkYtwK8LUQanQB1xg.jpeg",
  "NF5tRpn3xrpV81CGf1SDQo60Lk.jpg",
  "NbVapMiBN3O1B79hPfn55Ut68.jpg",
  "Pif2nYDSD873fW1ucLhDUQ1GuU.jpeg",
  "S2aS99cMH11aKHuGDtt8CdqYPqs.jpg",
  "XV4YnqughlDjgvzzkHLMNN6HQ10.jpg",
  "Y0PKmJR8OR83TST953hq4wrsmtI.jpg",
  "YLqSXPwuRjvZniqgw49AQYJMSzM.png",
  "ZCltSDBMvX6dGq8gfKZbNA61y0.jpg",
  "ZUKAuHzqrTMon49eyQdZ9vuSDfY.jpeg",
  "akJQe3BhYVaYiW8D7XTtFNAS2A.jpg",
  "aqkakFzIkX11TpipSH4MurMn1c.jpg",
  "dYAD6XIGC1k0IidBb9wX6b7srM.jpg",
  "eVUJNyjJhxR10nfVGCa4oIhTCcE.jpg",
  "g5F6UzHD1nQOgfXK6ToLD2aIEk.jpg",
  "gEOx0H4nV830aP9scARGi9DEvc.jpg",
  "gJRsKq8nmNa966w6uRWMJoB7p90.jpg",
  "gU8yKC3ZiCyONDaKr0hgrinSY5U.jpg",
  "qWS4BiNWHU6BsV03nquz3LOXcM.jpeg",
  "qkntRVyDFXSavXk2fE20yVB6CU.jpg",
  "vJ0BOWZIknJPSUQfc9t1XTrJIE.jpeg",
  "vT4xPYmbaRCnYfkKyzUAbKKiR0.jpg"
)
$i = 0
foreach ($f in $files) {
  $i++
  $out = Join-Path $dir $f
  if (Test-Path $out) { Write-Host "[$i/$($files.Count)] есть: $f"; continue }
  Write-Host "[$i/$($files.Count)] качаю: $f"
  curl.exe -sSL -o $out "https://framerusercontent.com/images/$f"
}
Write-Host "Готово: $($files.Count) файлов в assets\framer\"