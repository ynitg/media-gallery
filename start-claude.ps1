param(
    [switch]$SkipApiKeyCheck,
    [switch]$SkipApiProbe,
    [string]$Proxy,
    [int]$TimeoutSec = 15
)

# ================================
# Claude Code 启动脚本（增强版）
# ================================

function Write-Info($msg){ Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg){ Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg){ Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host $msg -ForegroundColor Red }

# --- 环境准备：Node 与 Git Bash ---
if (-not ($env:Path -split ';' | Where-Object { $_ -match 'C:\\Program Files\\nodejs' })) {
    $env:Path = "C:\Program Files\nodejs;$env:Path"
}

if (-not $env:CLAUDE_CODE_GIT_BASH_PATH) {
    $defaultGitBash = "C:\\Program Files\\Git\\bin\\bash.exe"
    if (Test-Path $defaultGitBash) {
        $env:CLAUDE_CODE_GIT_BASH_PATH = $defaultGitBash
    }
}

# --- 代理设置（可选） ---
if ($Proxy) {
    Write-Info "使用代理：$Proxy"
    $env:HTTPS_PROXY = $Proxy
    $env:HTTP_PROXY  = $Proxy
}

# --- API Key 检查（可跳过） ---
if (-not $SkipApiKeyCheck) {
    if (-not $env:ANTHROPIC_API_KEY) {
        Write-Err "未检测到 ANTHROPIC_API_KEY。Claude Code 默认使用 OAuth（不需要 API Key），如果你只是启动 Claude Code 可以加 -SkipApiKeyCheck 跳过。"
        Write-Info '设置示例（永久）：setx ANTHROPIC_API_KEY "sk-ant-xxxxx"'
        Write-Info '设置示例（当前会话）：$env:ANTHROPIC_API_KEY = "sk-ant-xxxxx"'
        Write-Info '如果你只想启动 Claude Code：.\Start-Claude.ps1 -SkipApiKeyCheck'
    } else {
        Write-Ok "已检测到 ANTHROPIC_API_KEY"
    }
} else {
    Write-Warn "已跳过 API Key 检查（-SkipApiKeyCheck）"
}

function Test-AnthropicConnectivity {
    param([int]$TimeoutSec = 10)
    $domain = "api.anthropic.com"

    Write-Info "DNS 解析 $domain ..."
    try {
        try {
            $dns = Resolve-DnsName $domain -Type A -ErrorAction Stop
            $ips = $dns | Where-Object { $_.IPAddress } | Select-Object -ExpandProperty IPAddress
            if ($ips) { Write-Ok ("DNS A: " + ($ips -join ', ')) }
        } catch {
            $ns = (nslookup $domain 2>$null)
            if ($ns) { Write-Ok "nslookup 成功（简略输出）" } else { Write-Warn "DNS 查询失败（非致命）" }
        }
    } catch {
        Write-Warn "DNS 查询异常：$($_.Exception.Message)"
    }

    Write-Info "TCP 443 探测 $domain ..."
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($domain, 443, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutSec * 1000, $false)) {
            $client.Close()
            Write-Err "TCP 443 超时（可能网络/防火墙/代理问题）"
            return $false
        }
        $client.EndConnect($iar)
        $client.Close()
        Write-Ok "TCP 443 可连通"
    } catch {
        Write-Err "TCP 443 连接失败：$($_.Exception.Message)"
        return $false
    }

    Write-Info "HTTPS 头探测（curl -I）..."
    try {
        $out = & curl.exe -I https://api.anthropic.com 2>$null
        if ($LASTEXITCODE -eq 0 -and $out) {
            Write-Ok "HTTPS 可访问（收到响应头）"
        } else {
            Write-Warn "HTTPS 头探测失败（非致命）"
        }
    } catch {
        Write-Warn "HTTPS 头探测异常：$($_.Exception.Message)"
    }

    return $true
}

function Probe-AnthropicApi {
    param([int]$TimeoutSec = 10, [int]$Retries = 3)

    $uri = "https://api.anthropic.com/v1/models"
    for ($i=1; $i -le $Retries; $i++) {
        Write-Info "API 探测（$i/$Retries）: $uri"
        try {
            $headers = @{ "anthropic-version" = "2023-06-01" }
            if ($env:ANTHROPIC_API_KEY) { $headers["x-api-key"] = $env:ANTHROPIC_API_KEY }

            $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec $TimeoutSec
            if ($resp -and $resp.data) {
                Write-Ok "API 可访问，模型数：$($resp.data.Count)"
                return $true
            } else {
                Write-Warn "收到响应但无数据，稍后重试..."
            }
        } catch {
            $msg = $_.Exception.Message
            if ($msg -match '403' -or $msg -match 'forbidden') {
                Write-Err "请求 403：地区限制或账户/网络策略限制。"
                return $false
            } elseif ($msg -match '401' -or $msg -match 'authentication') {
                Write-Err "请求 401：API Key 无效/未提供（仅 SDK/curl 需要）。Claude Code 可用 OAuth。"
                return $false
            } elseif ($msg -match 'timed out' -or $msg -match 'timeout') {
                Write-Warn "请求超时，准备重试..."
            } else {
                Write-Warn "请求异常：$msg（准备重试）"
            }
        }
        Start-Sleep -Seconds ([Math]::Min(5, 2 * $i))
    }
    Write-Err "多次探测失败，请检查网络/代理/地区支持：https://anthropic.com/supported-countries"
    return $false
}

if (-not (Test-AnthropicConnectivity -TimeoutSec $TimeoutSec)) {
    Write-Err "基础网络探测失败，终止。"
    exit 1
}

if (-not $SkipApiProbe) {
    $apiOk = Probe-AnthropicApi -TimeoutSec $TimeoutSec -Retries 3
    if (-not $apiOk) {
        Write-Warn "API 探测未通过。你仍可尝试直接启动 Claude Code 使用 OAuth 登录。"
    }
} else {
    Write-Warn "已跳过 API 探测（-SkipApiProbe）"
}

# --- 启动 Claude Code ---
Write-Info "尝试启动 Claude Code..."
$claudeCmd = "claude.cmd"
$claudeCmdFull = Join-Path $env:APPDATA "npm\claude.cmd"

$exe = $null
if (Get-Command $claudeCmd -ErrorAction SilentlyContinue) {
    $exe = $claudeCmd
} elseif (Test-Path $claudeCmdFull) {
    $exe = $claudeCmdFull
} else {
    Write-Err "未找到 claude.cmd，请确认已安装：npm i -g @anthropic-ai/claude-code"
    exit 1
}

try {
    Write-Ok "启动命令：$exe"
    Start-Process -FilePath $exe -WorkingDirectory (Get-Location) -NoNewWindow
} catch {
    Write-Err "启动失败：$($_.Exception.Message)"
    exit 1
}
