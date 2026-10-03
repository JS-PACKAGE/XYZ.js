# CI-only self-use of VB-CABLE; never shipped with XYZ.js or used on persistent runners.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$downloadUrl = 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip'
$expectedHash = 'b950e39f01af1d04ea623c8f6d8eb9b6ea5c477c637295fabf20631c85116bfb'
$evidenceDirectory = Join-Path $PSScriptRoot '../.vite/windows-host'
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
$evidence = [ordered]@{
    startedAt = [DateTime]::UtcNow.ToString('o')
    source = $downloadUrl
    expectedSha256 = $expectedHash
    runnerEnvironment = $env:XYZ_RUNNER_ENVIRONMENT
    signatures = @()
    installer = $null
    trustedPublisherBefore = $null
    trustedPublisherAfter = $null
    trustedPublisherAdditions = @()
    before = $null
    after = $null
    success = $false
    error = $null
}
$failure = $null
$guardPassed = $false
$publisherBefore = $null

function Get-TrustedPublishers {
    foreach ($store in @('LocalMachine', 'CurrentUser')) {
        foreach ($certificate in @(Get-ChildItem -LiteralPath "Cert:\$store\TrustedPublisher")) {
            [pscustomobject]@{
                store = $store
                thumbprint = $certificate.Thumbprint
                subject = $certificate.Subject
                issuer = $certificate.Issuer
            }
        }
    }
}

function Get-AudioInventory {
    $inventory = [ordered]@{ services = @(); soundDevices = @(); endpoints = @(); nativeEndpoints = @(); defaultRenderId = $null; codeIntegrityOptions = $null; errors = @() }
    try {
        $inventory.services = @(Get-CimInstance -ClassName Win32_Service -Filter "Name='Audiosrv' OR Name='AudioEndpointBuilder'" -OperationTimeoutSec 20 |
            Select-Object Name, State, StartMode)
    } catch { $inventory.errors += "services: $($_.Exception.Message)" }
    try {
        $inventory.soundDevices = @(Get-CimInstance -ClassName Win32_SoundDevice -OperationTimeoutSec 20 |
            Select-Object Name, Manufacturer, PNPDeviceID, Status, ConfigManagerErrorCode)
    } catch { $inventory.errors += "soundDevices: $($_.Exception.Message)" }
    try {
        $inventory.endpoints = @(Get-CimInstance -ClassName Win32_PnPEntity -Filter "PNPClass='AudioEndpoint'" -OperationTimeoutSec 20 |
            Select-Object Name, PNPDeviceID, Status, ConfigManagerErrorCode)
    } catch { $inventory.errors += "endpoints: $($_.Exception.Message)" }
    try {
        $inventory.nativeEndpoints = @([XYZWindowsAudio]::ReadEndpoints())
        $inventory.defaultRenderId = [XYZWindowsAudio]::DefaultRenderId()
    } catch { $inventory.errors += "nativeEndpoints: $($_.Exception.Message)" }
    try {
        $inventory.codeIntegrityOptions = [XYZWindowsAudio]::CodeIntegrityOptions()
    } catch { $inventory.errors += "codeIntegrity: $($_.Exception.Message)" }
    return $inventory
}

try {
    if ($env:GITHUB_ACTIONS -cne 'true' -or $env:RUNNER_OS -cne 'Windows' -or
        $env:RUNNER_ARCH -cne 'X64' -or $env:XYZ_RUNNER_ENVIRONMENT -cne 'github-hosted' -or
        [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne [System.Runtime.InteropServices.Architecture]::X64 -or
        [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -ne [System.Runtime.InteropServices.Architecture]::X64) {
        throw 'Audio driver installation is restricted to explicitly identified ephemeral GitHub-hosted Windows x64 runners.'
    }
    $guardPassed = $true
    $principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'The CI process must already be an administrator; interactive elevation is forbidden.'
    }

    # Read real Core Audio state; PnP presence alone does not prove an active default render endpoint.
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    void EnumAudioEndpoints(int flow, uint states, out IMMDeviceCollection devices);
    [PreserveSig] int GetDefaultAudioEndpoint(int flow, int role, out IMMDevice device);
}
[ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-C0A7B1E3BD19"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection {
    void GetCount(out uint count);
    void Item(uint index, out IMMDevice device);
}
[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    void Activate(ref Guid iid, uint context, IntPtr parameters, out IntPtr instance);
    void OpenPropertyStore(uint access, out IntPtr properties);
    void GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    void GetState(out uint state);
}
public sealed class XYZAudioEndpoint {
    public string Id { get; set; }
    public string Flow { get; set; }
    public uint State { get; set; }
}
public static class XYZWindowsAudio {
    [StructLayout(LayoutKind.Sequential)]
    struct CodeIntegrityInformation { public uint Length; public uint Options; }
    [DllImport("ntdll.dll")]
    static extern int NtQuerySystemInformation(int informationClass, ref CodeIntegrityInformation information, uint length, out uint returnedLength);
    public static uint CodeIntegrityOptions() {
        var information = new CodeIntegrityInformation { Length = 8 };
        uint returnedLength;
        int status = NtQuerySystemInformation(103, ref information, information.Length, out returnedLength);
        if (status != 0 || returnedLength != information.Length)
            throw new InvalidOperationException("Cannot read kernel Code Integrity state: NTSTATUS 0x" + status.ToString("X8"));
        return information.Options;
    }
    static IMMDeviceEnumerator CreateEnumerator() {
        return (IMMDeviceEnumerator)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")));
    }
    public static XYZAudioEndpoint[] ReadEndpoints() {
        var result = new List<XYZAudioEndpoint>();
        var enumerator = CreateEnumerator();
        try {
            for (int flow = 0; flow < 2; flow++) {
                IMMDeviceCollection devices;
                enumerator.EnumAudioEndpoints(flow, 15, out devices);
                try {
                    uint count;
                    devices.GetCount(out count);
                    for (uint index = 0; index < count; index++) {
                        IMMDevice device;
                        devices.Item(index, out device);
                        try {
                            string id;
                            uint state;
                            device.GetId(out id);
                            device.GetState(out state);
                            result.Add(new XYZAudioEndpoint { Id = id, Flow = flow == 0 ? "render" : "capture", State = state });
                        } finally { Marshal.ReleaseComObject(device); }
                    }
                } finally { Marshal.ReleaseComObject(devices); }
            }
            return result.ToArray();
        } finally { Marshal.ReleaseComObject(enumerator); }
    }
    public static string DefaultRenderId() {
        var enumerator = CreateEnumerator();
        try {
            IMMDevice device;
            int status = enumerator.GetDefaultAudioEndpoint(0, 1, out device);
            if (status == unchecked((int)0x80070490)) return null;
            Marshal.ThrowExceptionForHR(status);
            try {
                string id;
                device.GetId(out id);
                return id;
            } finally { Marshal.ReleaseComObject(device); }
        } finally { Marshal.ReleaseComObject(enumerator); }
    }
}
'@
    $publisherBefore = @(Get-TrustedPublishers)
    $evidence.trustedPublisherBefore = $publisherBefore
    $evidence.before = Get-AudioInventory
    if ($evidence.before.errors.Count -ne 0) {
        throw 'Pre-install audio inventory could not be collected completely.'
    }
    # Microsoft documents bit 1 as kernel enforcement, bit 2 as test signing and bit 0x80 as debugger bypass.
    if (($evidence.before.codeIntegrityOptions -band 1) -eq 0 -or ($evidence.before.codeIntegrityOptions -band 0x82) -ne 0) {
        throw 'Native kernel driver signing enforcement must be enabled without test-signing or debugger bypass.'
    }
    if ([string]::IsNullOrWhiteSpace($env:RUNNER_TEMP)) { throw 'RUNNER_TEMP is required.' }
    $tempDirectory = Join-Path $env:RUNNER_TEMP ("xyz-windows-audio-" + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempDirectory | Out-Null
    $archive = Join-Path $tempDirectory 'VBCABLE_Driver_Pack45.zip'
    $package = Join-Path $tempDirectory 'package'

    # No redirect following, custom trust, certificate import, or driver-signing policy change.
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $false
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(60)
    try {
        $response = $client.GetAsync($downloadUrl).GetAwaiter().GetResult()
        try {
            if ([int]$response.StatusCode -ne 200 -or $null -ne $response.Headers.Location -or
                $response.RequestMessage.RequestUri.AbsoluteUri -cne $downloadUrl) {
                throw "Official package download rejected: HTTP $([int]$response.StatusCode), redirect or unexpected origin."
            }
            $file = [System.IO.File]::Create($archive)
            try { $response.Content.CopyToAsync($file).GetAwaiter().GetResult() } finally { $file.Dispose() }
        } finally { $response.Dispose() }
    } finally { $client.Dispose(); $handler.Dispose() }
    $evidence.actualSha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($evidence.actualSha256 -cne $expectedHash) { throw 'Official audio driver archive SHA256 mismatch.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $package

    $signedFiles = @(
        @{ name = 'VBCABLE_Setup_x64.exe'; signer = 'BUREL VINCENT Entrepreneur individuel' },
        @{ name = 'vbaudio_cable64_win10.sys'; signer = 'BUREL VINCENT Entrepreneur individuel' },
        @{ name = 'vbaudio_cable64_win10.cat'; signer = 'Microsoft Windows Hardware Compatibility Publisher' }
    )
    $invalidSignatures = @()
    foreach ($signedFile in $signedFiles) {
        $signature = Get-AuthenticodeSignature -LiteralPath (Join-Path $package $signedFile.name)
        $signer = $signature.SignerCertificate
        $identity = if ($null -ne $signer) { $signer.GetNameInfo([Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false) } else { $null }
        $evidence.signatures += [pscustomobject]@{
            file = $signedFile.name
            status = $signature.Status.ToString()
            statusMessage = $signature.StatusMessage
            signatureType = $signature.SignatureType.ToString()
            identity = $identity
            subject = if ($null -ne $signer) { $signer.Subject } else { $null }
            issuer = if ($null -ne $signer) { $signer.Issuer } else { $null }
            thumbprint = if ($null -ne $signer) { $signer.Thumbprint } else { $null }
        }
        if ($signature.Status -ne [System.Management.Automation.SignatureStatus]::Valid -or $identity -cne $signedFile.signer) {
            $invalidSignatures += $signedFile.name
        }
    }
    if ($invalidSignatures.Count -ne 0) { throw "Authenticode validation rejected: $($invalidSignatures -join ', ')." }

    # Pack45 binary parser 0x140002d20 accepts -i and -h; -h hides its own UI, not Windows security prompts.
    # Official readme requires a reboot. We never reboot CI or assume a successful exit means usable audio.
    $installer = Start-Process -FilePath (Join-Path $package 'VBCABLE_Setup_x64.exe') -ArgumentList '-i', '-h' -WorkingDirectory $package -PassThru
    $evidence.installer = [ordered]@{ arguments = @('-i', '-h'); timeoutSeconds = 120; exitCode = $null; timedOut = $false }
    try {
        if (-not $installer.WaitForExit(120000)) {
            $evidence.installer.timedOut = $true
            $installer.Kill($true)
            if (-not $installer.WaitForExit(5000)) { throw 'Timed-out audio installer could not be terminated within five seconds.' }
            throw 'Audio installer exceeded 120 seconds; possible Windows security prompt or reboot requirement. No trust changes or reboot will be attempted.'
        }
        $evidence.installer.exitCode = $installer.ExitCode
        if ($installer.ExitCode -ne 0) { throw "Audio installer returned unexpected exit code $($installer.ExitCode); reboot-required results are not accepted." }
    } finally { $installer.Dispose() }
    $evidence.after = Get-AudioInventory
    if ($evidence.after.errors.Count -ne 0) { throw 'Post-install audio inventory could not be collected completely.' }
    $audioServices = @($evidence.after.services | Where-Object { $_.State -eq 'Running' })
    $cableDevices = @($evidence.after.soundDevices | Where-Object { $_.Name -eq 'VB-Audio Virtual Cable' -and $_.ConfigManagerErrorCode -eq 0 })
    $defaultRender = @($evidence.after.nativeEndpoints | Where-Object { $_.Flow -eq 'render' -and $_.State -eq 1 -and $_.Id -eq $evidence.after.defaultRenderId })
    $cableRender = @($evidence.after.endpoints | Where-Object {
        $_.Name -like '*VB-Audio Virtual Cable*' -and $_.ConfigManagerErrorCode -eq 0 -and
        $null -ne $evidence.after.defaultRenderId -and $_.PNPDeviceID.EndsWith($evidence.after.defaultRenderId, [StringComparison]::OrdinalIgnoreCase)
    })
    if ($audioServices.Count -ne 2 -or $cableDevices.Count -eq 0 -or $defaultRender.Count -ne 1 -or $cableRender.Count -ne 1) {
        throw 'Signed driver did not expose a healthy, active VB-CABLE default render endpoint. Official installation may require reboot; this CI runner will not reboot or bypass native browser gates.'
    }
} catch {
    $failure = $_.Exception.Message
} finally {
    if ($guardPassed) {
        if ($null -eq $evidence.after) { $evidence.after = Get-AudioInventory }
        if ($null -ne $evidence.before -and
            ($null -eq $evidence.after.codeIntegrityOptions -or $evidence.after.codeIntegrityOptions -ne $evidence.before.codeIntegrityOptions)) {
            $failure = "Kernel Code Integrity state changed or could not be verified after bootstrap. $failure"
        }
        try {
            $evidence.trustedPublisherAfter = @(Get-TrustedPublishers)
            if ($null -ne $publisherBefore) {
                $beforeKeys = @($publisherBefore | ForEach-Object { "$($_.store):$($_.thumbprint)" })
                $evidence.trustedPublisherAdditions = @($evidence.trustedPublisherAfter | Where-Object { "$($_.store):$($_.thumbprint)" -notin $beforeKeys })
                if ($evidence.trustedPublisherAdditions.Count -ne 0) {
                    $failure = "TrustedPublisher certificate additions detected; bootstrap rejected. $failure"
                }
            } else { $failure = "TrustedPublisher pre-install snapshot unavailable; bootstrap rejected. $failure" }
        } catch { $failure = "TrustedPublisher post-install snapshot failed: $($_.Exception.Message). $failure" }
    }
    $evidence.success = $null -eq $failure
    $evidence.error = $failure
    $evidence.completedAt = [DateTime]::UtcNow.ToString('o')
    $evidence | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $evidenceDirectory 'audio-bootstrap.json') -Encoding utf8
}
if ($null -ne $failure) { throw $failure }
Write-Host 'Signed VB-CABLE installed with unchanged TrustedPublisher stores and an active native default render endpoint. Browser audio gates remain required.'
