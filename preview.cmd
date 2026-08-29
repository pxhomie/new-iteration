@echo off
REM Local preview server. Double-click, then open http://localhost:8080
REM Needed because a page opened as a file:// has no origin, and YouTube
REM refuses to play an embed into it (Error 153).
cd /d "%~dp0"
start "" http://localhost:8080/index.html
py -m http.server 8080 2>NUL || python -m http.server 8080
