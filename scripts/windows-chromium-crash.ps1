param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('setup', 'monitor', 'collect')]
    [string] $Phase,
    [string] $CaptureDirectory
)

$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Chromium native crash collection requires Windows.' }
if ($env:GITHUB_ACTIONS -cne 'true' -or $env:RUNNER_ENVIRONMENT -cne 'github-hosted' -or
    $env:XYZ_CHROMIUM_NATIVE_CAPTURE -cne 'approved-owned-gpu') {
    throw 'ProcDump is restricted to explicitly approved ephemeral GitHub-hosted diagnostics.'
}
$ownedDir = Join-Path $PSScriptRoot '../.vite/windows-host'
New-Item -ItemType Directory -Force $ownedDir | Out-Null
$ownedDir = (Resolve-Path -LiteralPath $ownedDir).Path
$tool = Join-Path $ownedDir 'procdump/procdump64.exe'
$configurationPath = Join-Path $ownedDir 'crash-collection.json'

function Assert-TrustedTool {
    $signature = Get-AuthenticodeSignature -LiteralPath $tool
    if ($signature.Status -ne 'Valid' -or
        $signature.SignerCertificate.Subject -notmatch '(^|,\s*)O=Microsoft Corporation(,|$)') {
        throw 'ProcDump must have a valid Authenticode signature from Microsoft Corporation.'
    }
    return $signature
}
function Save-Json($path, $value) {
    # Atomic publication prevents the Node readiness handshake reading partial JSON.
    $temporary = "$path.tmp"
    $value | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $temporary -Encoding utf8
    Move-Item -LiteralPath $temporary -Destination $path -Force
}

if ($Phase -eq 'setup') {
    $url = 'https://download.sysinternals.com/files/Procdump.zip'
    $archive = Join-Path $ownedDir 'Procdump.zip'
    Invoke-WebRequest -Uri $url -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $ownedDir 'procdump') -Force
    $signature = Assert-TrustedTool
    Save-Json $configurationPath ([ordered]@{
        configuredAt = [DateTimeOffset]::UtcNow.ToString('o')
        packageUrl = $url
        packageSha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
        tool = $tool
        toolSha256 = (Get-FileHash -LiteralPath $tool -Algorithm SHA256).Hash
        signatureStatus = [string]$signature.Status
        signer = $signature.SignerCertificate.Subject
        signerThumbprint = $signature.SignerCertificate.Thumbprint
        eulaApproval = 'explicit-user-approved; -accepteula supplied only to owned diagnostic invocation'
        timingCertification = $false
        matchingBrowserSymbols = 'UNCONFIRMED'
        sources = @('https://learn.microsoft.com/en-us/sysinternals/downloads/procdump',
            'https://learn.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-checkremotedebuggerpresent',
            'https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-process')
    })
    return
}

if ($Phase -eq 'monitor') {
    $signature = Assert-TrustedTool
    $configuration = Get-Content -LiteralPath $configurationPath -Raw | ConvertFrom-Json
    if ((Get-FileHash -LiteralPath $tool -Algorithm SHA256).Hash -cne $configuration.toolSha256) {
        throw 'ProcDump changed after signature-verified setup.'
    }
    $capture = (Resolve-Path -LiteralPath $CaptureDirectory).Path
    if (-not $capture.StartsWith("$ownedDir$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Capture must remain inside the owned artifact directory.'
    }
    $request = Get-Content -LiteralPath (Join-Path $capture 'request.json') -Raw | ConvertFrom-Json
    $browserPid = [int]$request.browserPid
    $gpuPid = [int]$request.gpuPid
    $nodePid = [int]$request.nodePid
    if ($browserPid -le 0 -or $gpuPid -le 0 -or $nodePid -le 0) { throw 'Invalid owned PID.' }
    $cdpBrowser = @($request.cdp.processInfo | Where-Object { $_.type -ceq 'browser' -and $_.id -eq $browserPid })
    $cdpGpu = @($request.cdp.processInfo | Where-Object { $_.type -ceq 'GPU' -and $_.id -eq $gpuPid })
    if ($cdpBrowser.Count -ne 1 -or $cdpGpu.Count -ne 1) { throw 'CDP did not identify the owned browser and GPU.' }
    $browsersRoot = (Resolve-Path -LiteralPath $request.browsersRoot).Path
    $browserProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$browserPid"
    $expectedExecutable = if ($browserProcess) { (Resolve-Path -LiteralPath $browserProcess.ExecutablePath).Path } else { $null }
    if (-not $expectedExecutable -or
        -not $expectedExecutable.StartsWith("$browsersRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase) -or
        (Split-Path -Leaf $expectedExecutable) -inotmatch '^chrome(-headless-shell)?\.exe$') {
        throw 'Owned browser executable is not the Playwright-managed Chromium.'
    }
    $gpuProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$gpuPid"
    $nodeProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$nodePid"
    if (-not $browserProcess -or -not $gpuProcess -or -not $nodeProcess -or
        $browserProcess.ParentProcessId -ne $nodePid -or $gpuProcess.ParentProcessId -ne $browserPid -or
        $nodeProcess.ExecutablePath -ine $request.nodeExecutable -or
        $browserProcess.ExecutablePath -ine $expectedExecutable -or $gpuProcess.ExecutablePath -ine $expectedExecutable -or
        $browserProcess.CommandLine -match '(^|\s)--type=' -or
        $gpuProcess.CommandLine -notmatch '(^|\s)--type=gpu-process(\s|$)' -or
        $browserProcess.CreationDate -lt $nodeProcess.CreationDate -or $gpuProcess.CreationDate -lt $browserProcess.CreationDate) {
        throw 'Win32_Process ownership/executable/command-line/start-time handshake failed.'
    }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class OwnedGpuDebug {
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool CheckRemoteDebuggerPresent(IntPtr process, out bool present);
}
'@
    $target = [Diagnostics.Process]::GetProcessById($gpuPid)
    $debugged = $false
    if (-not [OwnedGpuDebug]::CheckRemoteDebuggerPresent($target.Handle, [ref]$debugged) -or $debugged) {
        throw 'GPU debugger state unavailable or already debugged; refusing attachment.'
    }
    $dumpFolder = Join-Path $capture 'crash-dumps'
    New-Item -ItemType Directory $dumpFolder | Out-Null
    # Full memory is explicitly approved and preserves dynamically generated fault opcodes.
    $arguments = @('-accepteula', '-ma', '-e', '1', '-f', 'C000001D', '-n', '1', [string]$gpuPid, "`"$dumpFolder`"")
    $stdout = Join-Path $capture 'procdump.stdout.log'
    $stderr = Join-Path $capture 'procdump.stderr.log'
    $record = [ordered]@{
        startedAt = [DateTimeOffset]::UtcNow.ToString('o'); tool = $tool; arguments = $arguments
        browser = $browserProcess | Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine,CreationDate
        gpu = $gpuProcess | Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine,CreationDate
        executableSha256 = (Get-FileHash -LiteralPath $expectedExecutable -Algorithm SHA256).Hash
        readyAt = $null; exitCode = $null; error = $null; timingCertification = $false
    }
    $monitor = $null
    try {
        $monitor = Start-Process -FilePath $tool -ArgumentList $arguments -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        $record.monitorPid = $monitor.Id
        $deadline = [DateTimeOffset]::UtcNow.AddSeconds(30)
        $attachedSince = $null
        do {
            $monitor.Refresh()
            if ($monitor.HasExited) { throw 'ProcDump exited before debugger readiness.' }
            $current = Get-CimInstance Win32_Process -Filter "ProcessId=$gpuPid"
            if (-not $current -or $current.CreationDate -ne $gpuProcess.CreationDate -or $current.ParentProcessId -ne $browserPid) {
                throw 'GPU identity changed before readiness.'
            }
            $debugged = $false
            if (-not [OwnedGpuDebug]::CheckRemoteDebuggerPresent($target.Handle, [ref]$debugged)) {
                throw 'Cannot verify GPU debugger attachment.'
            }
            # Redirected ProcDump stdout is block-buffered until exit, so its banner cannot signal readiness.
            # Native debugger attachment held while the monitor lives for a settle interval does.
            if ($debugged) {
                if (-not $attachedSince) { $attachedSince = [DateTimeOffset]::UtcNow }
                elseif (([DateTimeOffset]::UtcNow - $attachedSince).TotalMilliseconds -ge 1500) { break }
            } else { $attachedSince = $null }
            if ([DateTimeOffset]::UtcNow -gt $deadline) { throw 'ProcDump debugger readiness deadline exceeded.' }
            Start-Sleep -Milliseconds 100
        } while ($true)
        $record.readyAt = [DateTimeOffset]::UtcNow.ToString('o')
        Save-Json (Join-Path $capture 'ready.json') $record
        while (-not (Test-Path -LiteralPath (Join-Path $capture 'stop'))) {
            $monitor.Refresh()
            if ($monitor.HasExited) { break }
            # Parent disappearance must not leave an attached debugger on the runner.
            $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$nodePid"
            if (-not $owner -or $owner.CreationDate -ne $nodeProcess.CreationDate) { break }
            Start-Sleep -Milliseconds 100
        }
    } catch {
        $record.error = $_.Exception.Message
        $record.lastDebuggerPresent = $debugged
        throw
    } finally {
        try {
            if ($monitor) {
                $monitor.Refresh()
                if (-not $monitor.HasExited) {
                    # Microsoft's documented -cancel is Ctrl+C-equivalent: detach/resume, never kill the browser.
                    & $tool -accepteula -cancel $gpuPid 2>&1 | Set-Content -LiteralPath (Join-Path $capture 'cancel.log')
                    $record.cancelExitCode = $LASTEXITCODE
                }
                $monitor.WaitForExit()
                $record.exitCode = $monitor.ExitCode
                $record.exitedAt = [DateTimeOffset]::UtcNow.ToString('o')
            }
        } finally {
            Save-Json (Join-Path $capture 'monitor-result.json') $record
            $target.Dispose()
        }
    }
    return
}

$dumps = @(Get-ChildItem -LiteralPath $ownedDir -Recurse -Filter '*.dmp' -File | ForEach-Object {
    $stream = [IO.File]::OpenRead($_.FullName)
    try {
        $header = [byte[]]::new(4)
        $valid = $stream.Read($header, 0, 4) -eq 4 -and [Text.Encoding]::ASCII.GetString($header) -ceq 'MDMP'
    } finally { $stream.Dispose() }
    [ordered]@{
        file = [IO.Path]::GetRelativePath($ownedDir, $_.FullName); bytes = $_.Length
        lastWriteTimeUtc = $_.LastWriteTimeUtc.ToString('o')
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        minidumpSignature = $valid
    }
})
Save-Json (Join-Path $ownedDir 'crash-dump-inventory.json') ([ordered]@{
    collectedAt = [DateTimeOffset]::UtcNow.ToString('o'); dumps = $dumps
    captureStatus = $(if (@($dumps | Where-Object { $_.minidumpSignature }).Count) { 'DUMP_CAPTURED_NOT_ANALYZED' } else { 'NO_VALID_DUMP_CAPTURED' })
    timingCertification = $false; matchingBrowserSymbols = 'UNCONFIRMED'
})
