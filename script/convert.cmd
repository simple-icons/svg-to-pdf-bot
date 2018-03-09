@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\convert" %*
) ELSE (
  node  "%~dp0\convert" %*
)
