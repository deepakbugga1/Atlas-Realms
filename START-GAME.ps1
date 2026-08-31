$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$port=8787
$listener=New-Object Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Atlas Realms running at http://127.0.0.1:$port"
$mime=@{'.html'='text/html';'.js'='text/javascript';'.css'='text/css';'.json'='application/json';'.txt'='text/plain'}
while($listener.IsListening){$ctx=$listener.GetContext();try{$path=[Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'));if([string]::IsNullOrWhiteSpace($path)){$path='index.html'}$file=Join-Path $PSScriptRoot $path;if(!(Test-Path $file -PathType Leaf)){ $ctx.Response.StatusCode=404;$ctx.Response.Close();continue }$bytes=[IO.File]::ReadAllBytes($file);$ext=[IO.Path]::GetExtension($file).ToLower();$ctx.Response.ContentType=($mime[$ext] ?? 'application/octet-stream');$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length);$ctx.Response.Close()}catch{$ctx.Response.StatusCode=500;try{$ctx.Response.Close()}catch{}}}
