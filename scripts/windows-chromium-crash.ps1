param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('setup', 'collect')]
    [string] $Phase
)

$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Chromium native crash collection requires Windows.' }
$directory = Join-Path $PSScriptRoot '../.vite/windows-host'
New-Item -ItemType Directory -Force $directory | Out-Null
$directory = (Resolve-Path -LiteralPath $directory).Path
$dumpFolder = Join-Path $directory 'crash-dumps'
$key = 'HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\chrome-headless-shell.exe'
$configurationPath = Join-Path $directory 'crash-collection.json'

# The pinned Windows headless shell prints StackDumpExceptionFilter's stack and
# returns EXCEPTION_CONTINUE_SEARCH; it is not Chrome's custom Crashpad client.
# https://github.com/chromium/chromium/blob/153.0.8010.12/base/debug/stack_trace_win.cc
# https://github.com/chromium/chromium/blob/153.0.8010.12/headless/lib/headless_content_main_delegate.cc
# WER's application key must match the actual executable, including its suffix.
# https://learn.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps
if ($Phase -eq 'setup') {
    if ($env:GITHUB_ACTIONS -cne 'true' -or $env:RUNNER_ENVIRONMENT -cne 'github-hosted') {
        throw 'Crash-dump registry configuration is restricted to an ephemeral GitHub-hosted runner.'
    }
    $principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'WER local dump configuration requires an administrator.'
    }
    New-Item -ItemType Directory -Force $dumpFolder | Out-Null
    New-Item -Path $key -Force | Out-Null
    New-ItemProperty -Path $key -Name DumpFolder -Value $dumpFolder -PropertyType ExpandString -Force | Out-Null
    New-ItemProperty -Path $key -Name DumpType -Value 1 -PropertyType DWord -Force | Out-Null
    New-ItemProperty -Path $key -Name DumpCount -Value 4 -PropertyType DWord -Force | Out-Null
    $actual = Get-ItemProperty -LiteralPath $key
    if ($actual.DumpFolder -cne $dumpFolder -or $actual.DumpType -ne 1 -or $actual.DumpCount -ne 4) {
        throw 'WER settings did not retain the requested application-specific mini dump configuration.'
    }
    [ordered]@{
        configuredAt = [DateTimeOffset]::UtcNow.ToString('o')
        executable = 'chrome-headless-shell.exe'
        registryKey = $key
        dumpFolder = $actual.DumpFolder
        dumpType = $actual.DumpType
        dumpCount = $actual.DumpCount
        browserArgumentsChanged = $false
        symbolPath = $env:_NT_SYMBOL_PATH
        matchingBrowserSymbols = 'UNCONFIRMED'
        sources = @(
            'https://github.com/chromium/chromium/blob/153.0.8010.12/base/debug/stack_trace_win.cc',
            'https://github.com/chromium/chromium/blob/153.0.8010.12/headless/lib/headless_content_main_delegate.cc',
            'https://learn.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps',
            'https://www.chromium.org/developers/how-tos/debugging-on-windows/windbg-help/'
        )
        captureStatus = 'CONFIGURED_NOT_YET_CAPTURED'
    } | ConvertTo-Json | Set-Content -LiteralPath $configurationPath -Encoding utf8
    return
}

$configuration = Get-Content -LiteralPath $configurationPath -Raw | ConvertFrom-Json
$start = [DateTimeOffset]::Parse($configuration.configuredAt).LocalDateTime
$faults = @()
$eventQueryError = $null
try {
    $faults = @(Get-WinEvent -FilterHashtable @{ LogName = 'Application'; Id = 1000,1001; StartTime = $start } |
        Where-Object { $_.Message -match 'chrome-headless-shell\.exe' } |
        Select-Object TimeCreated,Id,ProviderName,Message)
} catch {
    # An empty Windows event query throws too; retain the real error instead of
    # treating absent events as proof that the native process did not crash.
    $eventQueryError = $_.Exception.Message
}
ConvertTo-Json -InputObject $faults -Depth 5 | Set-Content -LiteralPath (Join-Path $directory 'application-faults.json') -Encoding utf8
$dumps = @(Get-ChildItem -LiteralPath $dumpFolder -Filter '*.dmp' -File | ForEach-Object {
    $stream = [IO.File]::OpenRead($_.FullName)
    try {
        $header = [byte[]]::new(4)
        $read = $stream.Read($header, 0, $header.Length)
        $minidumpSignature = $read -eq 4 -and [Text.Encoding]::ASCII.GetString($header) -ceq 'MDMP'
    } finally { $stream.Dispose() }
    [ordered]@{
        file = $_.Name
        bytes = $_.Length
        lastWriteTimeUtc = $_.LastWriteTimeUtc.ToString('o')
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        minidumpSignature = $minidumpSignature
    }
})
[ordered]@{
    collectedAt = [DateTimeOffset]::UtcNow.ToString('o')
    executable = $configuration.executable
    registryKey = $key
    dumpFolder = $dumpFolder
    captureStatus = $(if (@($dumps | Where-Object { $_.minidumpSignature }).Count -gt 0) { 'DUMP_CAPTURED_NOT_ANALYZED' } else { 'NO_VALID_DUMP_CAPTURED' })
    dumps = $dumps
    applicationFaultCount = $faults.Count
    eventQueryError = $eventQueryError
    symbolPath = $env:_NT_SYMBOL_PATH
    matchingBrowserSymbols = 'UNCONFIRMED'
    sources = $configuration.sources
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $directory 'crash-dump-inventory.json') -Encoding utf8
