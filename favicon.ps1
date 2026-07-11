# favicon.ps1 ¡ª favicon background and text colors from .logo in index.html
# - Background: derived from .logo background (first color stop or var(--accent))
# - Text color: derived from .logo color (supports hex, rgb(), or var(--...))
# - Bold text with good Windows font fallbacks

Add-Type -AssemblyName System.Drawing

function Convert-HexToColor($hex) {
    $hex = ($hex -replace '[^0-9A-Fa-f#]', '').Trim()
    if ($hex.StartsWith('#')) { $hex = $hex.Substring(1) }
    switch ($hex.Length) {
        3 { $r=[Convert]::ToInt32(($hex.Substring(0,1)*2),16); $g=[Convert]::ToInt32(($hex.Substring(1,1)*2),16); $b=[Convert]::ToInt32(($hex.Substring(2,1)*2),16); return [System.Drawing.Color]::FromArgb($r,$g,$b) }
        6 { $r=[Convert]::ToInt32($hex.Substring(0,2),16); $g=[Convert]::ToInt32($hex.Substring(2,2),16); $b=[Convert]::ToInt32($hex.Substring(4,2),16); return [System.Drawing.Color]::FromArgb($r,$g,$b) }
        8 { $a=[Convert]::ToInt32($hex.Substring(0,2),16); $r=[Convert]::ToInt32($hex.Substring(2,2),16); $g=[Convert]::ToInt32($hex.Substring(4,2),16); $b=[Convert]::ToInt32($hex.Substring(6,2),16); return [System.Drawing.Color]::FromArgb($a,$r,$g,$b) }
        default { throw "Unsupported color hex: $hex" }
    }
}

function TryParseCssColor($s) {
    $s = $s.Trim()
    if ($s -match '^#') { return Convert-HexToColor $s }
    if ($s -match '^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$') {
        return [System.Drawing.Color]::FromArgb([int]$matches[1],[int]$matches[2],[int]$matches[3])
    }
    if ($s -match '#[0-9A-Fa-f]{6,8}') { return Convert-HexToColor $matches[0] }
    return $null
}

# Parse :root { --var: value; } into a hashtable
function Get-CssVarsFromRoot([string]$htmlPath) {
    $vars = @{}
    if (-not (Test-Path $htmlPath)) { return $vars }
    $html = Get-Content -Raw -Path $htmlPath

    $idx = $html.IndexOf(':root')
    if ($idx -lt 0) { return $vars }
    $after = $html.Substring($idx)
    $braceStart = $after.IndexOf('{')
    if ($braceStart -lt 0) { return $vars }
    $rest = $after.Substring($braceStart + 1)
    $braceEnd = $rest.IndexOf('}')
    if ($braceEnd -lt 0) { $braceEnd = $rest.Length - 1 }
    $block = $rest.Substring(0, $braceEnd)

    $lines = $block -split ';'
    foreach ($ln in $lines) {
        if (-not $ln) { continue }
        $p = $ln.IndexOf(':')
        if ($p -gt 2) {
            $name = $ln.Substring(0,$p).Trim()
            $val  = $ln.Substring($p+1).Trim()
            if ($name -like '--*' -and $val) { $vars[$name] = $val }
        }
    }
    return $vars
}

# Extract the .logo CSS block as a string
function Get-LogoBlock([string]$htmlPath) {
    if (-not (Test-Path $htmlPath)) { return $null }
    $html = Get-Content -Raw -Path $htmlPath
    $idx = $html.IndexOf('.logo')
    if ($idx -lt 0) { return $null }
    $after = $html.Substring($idx)
    $braceStart = $after.IndexOf('{')
    if ($braceStart -lt 0) { return $null }
    $rest = $after.Substring($braceStart + 1)
    $braceEnd = $rest.IndexOf('}')
    if ($braceEnd -lt 0) { return $null }
    return $rest.Substring(0, $braceEnd)
}

# Get first color token from a linear-gradient or a flat background value
function Get-FirstColorTokenFromBackgroundValue($value) {
    $value = $value.Trim()
    if ($value -like 'linear-gradient(*') {
        $open = $value.IndexOf('(')
        $close = $value.LastIndexOf(')')
        if ($open -ge 0 -and $close -gt $open) {
            $inside = $value.Substring($open+1, $close-$open-1)
            $parts = $inside.Split(',') | ForEach-Object { $_.Trim() }
            foreach ($p in $parts) {
                if ($p -match '^\d' -or $p -like 'to *') { continue } # skip angles/directions
                $first = ($p -split '\s+')[0] # color stop may be "color 0%"
                if ($first) { return $first }
            }
        }
        return $null
    } else {
        return ($value -split '\s+')[0]
    }
}

# Resolve a token that might be var(--x) or an actual color
function Resolve-ColorToken($token, $varMap) {
    if (-not $token) { return $null }
    $t = $token.Trim()
    if ($t -like 'var(*') {
        $open = $t.IndexOf('(')
        $close = $t.IndexOf(')')
        if ($open -ge 0 -and $close -gt $open) {
            $varName = $t.Substring($open+1, $close-$open-1).Trim()
            $varName = ($varName -split ',')[0].Trim()
            if ($varMap.ContainsKey($varName)) {
                return TryParseCssColor $varMap[$varName]
            }
        }
    } else {
        return TryParseCssColor $t
    }
    return $null
}

# From .logo, get background color token and text color value
function Get-LogoColors([string]$htmlPath) {
    $vars = Get-CssVarsFromRoot -htmlPath $htmlPath
    $block = Get-LogoBlock -htmlPath $htmlPath
    $bgColor = $null
    $fgColor = $null

    if ($block) {
        # Extract background declaration
        $bgIdx = $block.IndexOf('background')
        if ($bgIdx -ge 0) {
            $bgDecl = $block.Substring($bgIdx)
            $semi = $bgDecl.IndexOf(';')
            if ($semi -gt 0) { $bgDecl = $bgDecl.Substring(0, $semi) }
            $colon = $bgDecl.IndexOf(':')
            if ($colon -ge 0) {
                $bgVal = $bgDecl.Substring($colon + 1).Trim()
                $bgTok = Get-FirstColorTokenFromBackgroundValue $bgVal
                # Prefer --accent directly if present in :root
                if ($vars.ContainsKey('--accent')) {
                    $cAcc = TryParseCssColor $vars['--accent']
                    if ($cAcc) { $bgColor = $cAcc }
                }
                if (-not $bgColor) {
                    $resolved = Resolve-ColorToken $bgTok $vars
                    if ($resolved) { $bgColor = $resolved }
                }
                if (-not $bgColor -and $vars.ContainsKey('--accent-2')) {
                    $cAcc2 = TryParseCssColor $vars['--accent-2']
                    if ($cAcc2) { $bgColor = $cAcc2 }
                }
            }
        }

        # Extract color (text) declaration
        $colIdx = $block.IndexOf('color')
        if ($colIdx -ge 0) {
            $colDecl = $block.Substring($colIdx)
            $semi2 = $colDecl.IndexOf(';')
            if ($semi2 -gt 0) { $colDecl = $colDecl.Substring(0, $semi2) }
            $colon2 = $colDecl.IndexOf(':')
            if ($colon2 -ge 0) {
                $colVal = $colDecl.Substring($colon2 + 1).Trim()
                $fgColor = Resolve-ColorToken $colVal $vars
            }
        }
    }

    # Fallbacks
    if (-not $bgColor) {
        if ($vars.ContainsKey('--accent')) {
            $bgColor = TryParseCssColor $vars['--accent']
        } elseif ($vars.ContainsKey('--accent-2')) {
            $bgColor = TryParseCssColor $vars['--accent-2']
        }
    }
    if (-not $bgColor) { $bgColor = Convert-HexToColor "#0B1320" }

    if (-not $fgColor) {
        # If logo color not found, default to dark-on-light heuristic:
        # since bg is accent (bright/cyan), default to dark text like your .logo uses
        $fgColor = Convert-HexToColor "#0B1320"
    }

    return @($bgColor, $fgColor)
}

# Settings
$size   = 32
$text   = "PW"
$ptSize = 13

# Resolve colors from .logo
$colors = Get-LogoColors -htmlPath "index.html"
$bgColor = $colors[0]
$fgColor = $colors[1]

# Create canvas
$bmp  = New-Object System.Drawing.Bitmap $size, $size
$g    = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Flat background from logo background
$g.Clear($bgColor)

# Font selection (bold) with good fallbacks
$prefFamilies = @(
  "Segoe UI Semibold",
  "Segoe UI Display",
  "Segoe UI",
  "Arial"
)
$font = $null
$emSize = [single]$ptSize
$style  = [System.Drawing.FontStyle]::Bold
$unit   = [System.Drawing.GraphicsUnit]::Pixel

foreach ($fam in $prefFamilies) {
  try {
    $f = New-Object System.Drawing.Font($fam, $emSize, $style, $unit)
    if ($f -and -not $f.Name.Equals("Microsoft Sans Serif")) { $font = $f; break }
  } catch {}
}
if (-not $font) {
  $genericFamily = New-Object System.Drawing.Text.GenericFontFamilies "SansSerif"
  $font = New-Object System.Drawing.Font($genericFamily, $emSize, $style, $unit)
}

# Draw centered bold text (shadow only if foreground is very light)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment     = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center

# Compute relative luminance to decide on shadow
$lumFg = (0.2126 * $fgColor.R + 0.7152 * $fgColor.G + 0.0722 * $fgColor.B) / 255.0
if ($lumFg -gt 0.7) {
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
    $g.DrawString($text, $font, $shadowBrush, ($size/2)+0.5, ($size/2)+0.0, $fmt)
    $shadowBrush.Dispose()
}

$fgBrush = New-Object System.Drawing.SolidBrush $fgColor
$g.DrawString($text, $font, $fgBrush, ($size/2)-0.5, ($size/2)-1.0, $fmt)
$fgBrush.Dispose()

$font.Dispose()
$g.Dispose()

# Encode to PNG and wrap in ICO container
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()

$fs = [System.IO.File]::Open("favicon.ico",[System.IO.FileMode]::Create,[System.IO.FileAccess]::Write)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)   # reserved
$bw.Write([UInt16]1)   # type = icon
$bw.Write([UInt16]1)   # count = 1
$bw.Write([Byte]$size) # width
$bw.Write([Byte]$size) # height
$bw.Write([Byte]0)     # colors
$bw.Write([Byte]0)     # reserved
$bw.Write([UInt16]0)   # planes
$bw.Write([UInt16]32)  # bpp
$bw.Write([UInt32]$pngBytes.Length) # size
$bw.Write([UInt32]22)  # offset
$bw.Write($pngBytes)
$bw.Flush(); $bw.Close(); $fs.Close()

Write-Host ("favicon.ico generated. Logo BG RGB({0},{1},{2}); Logo FG RGB({3},{4},{5}); font: {6}" -f $bgColor.R,$bgColor.G,$bgColor.B,$fgColor.R,$fgColor.G,$fgColor.B,$font.Name)