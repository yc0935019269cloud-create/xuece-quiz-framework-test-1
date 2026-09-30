# 把 peglin/mod-src 編譯進 Peglin 執行資料夾（預設 E:\PeglinQuiz）。編譯前先關掉 Peglin（DLL 會被鎖）。
# 用 Windows 內建 csc（C# 5）：原始碼不能用字串插值、?.、out var 等新語法。
param([string]$Runtime = 'E:\PeglinQuiz', [switch]$PluginOnly)
$ErrorActionPreference = 'Stop'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$source = Join-Path $PSScriptRoot 'mod-src'
$game = Join-Path $Runtime 'Peglin'
$managed = Join-Path $game 'Peglin_Data\Managed'
$core = Join-Path $game 'BepInEx\core'
if (-not (Test-Path (Join-Path $core 'BepInEx.dll'))) { throw "找不到 $core\BepInEx.dll：請先在 $game 安裝 BepInEx 5（x64）" }
New-Item -ItemType Directory -Path (Join-Path $game 'BepInEx\patchers'), (Join-Path $game 'BepInEx\plugins\Quiz') -Force | Out-Null
& $compiler /nologo /target:library "/out:$game\BepInEx\patchers\QuizIsolation.dll" "/r:$core\Mono.Cecil.dll" "/r:$core\Mono.Cecil.Rocks.dll" "$source\QuizIsolation.cs"
if ($LASTEXITCODE -ne 0) { throw '存檔隔離模組編譯失敗' }
if (-not $PluginOnly) {
    & $compiler /nologo /target:winexe "/out:$Runtime\Start-PeglinQuiz.exe" /r:System.Web.Extensions.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll "$source\QuizBridge.cs"
    if ($LASTEXITCODE -ne 0) { throw '啟動器編譯失敗（若營地服務正在執行，請先從系統匣結束）' }
}
$refs = @('mscorlib','System','System.Core','netstandard','UnityEngine','UnityEngine.CoreModule','UnityEngine.UIModule','UnityEngine.UI','Unity.TextMeshPro','UnityEngine.IMGUIModule','UnityEngine.TextRenderingModule','UnityEngine.ImageConversionModule','UnityEngine.InputLegacyModule','Assembly-CSharp','Assembly-CSharp-firstpass','Newtonsoft.Json') | ForEach-Object { '/r:' + (Join-Path $managed ($_ + '.dll')) }
& $compiler /nologo /noconfig /nostdlib /nowarn:1701 /target:library "/out:$game\BepInEx\plugins\Quiz\QuizPlugin.dll" "/r:$core\BepInEx.dll" "/r:$core\0Harmony.dll" @refs "$source\QuizPlugin.cs" "$source\QuizCanvas.cs"
if ($LASTEXITCODE -ne 0) { throw '刷題模組編譯失敗' }
Write-Output "編譯完成 → $game"
