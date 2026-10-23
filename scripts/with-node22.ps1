$ErrorActionPreference = 'Stop'
$Command = if ($args.Count) { [string]$args[0] } else { 'node' }
$CommandArguments = @($args | Select-Object -Skip 1)
$repository = Split-Path $PSScriptRoot -Parent
$gitDirectory = git -C $repository rev-parse --absolute-git-dir
if ($LASTEXITCODE -ne 0) { throw 'Cannot locate repository Git directory.' }
$runtime = Join-Path $gitDirectory 'basoul-local/node-v22.13.1-win-x64'
if (!(Test-Path (Join-Path $runtime 'node.exe'))) {
    throw 'Portable Node 22.13.1 is missing. See docs/operations/LOCAL_DEVELOPMENT_RECOVERY.md.'
}
if ((& (Join-Path $runtime 'node.exe') --version) -ne 'v22.13.1') { throw 'Unexpected Node version.' }
$previousPath = $env:PATH
try {
    $env:PATH = "$runtime;$previousPath"
    if ($Command -eq 'node' -and !$CommandArguments.Count) { $CommandArguments = @('--version') }
    & $Command @CommandArguments
    $commandExitCode = $LASTEXITCODE
} finally {
    $env:PATH = $previousPath
}
exit $commandExitCode
