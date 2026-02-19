
# Auto-Convert All Videos to Mobile-Friendly 1080p
# Requires: FFmpeg installed and in PATH
# Usage: ./scripts/convert-videos-for-mobile.ps1

$videoDir = "public/media/videos"
$outputDir = "public/media/videos_mobile"

# Create output directory if not exists
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Cyan
}

# Check for FFmpeg
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "Error: FFmpeg is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install FFmpeg (e.g., 'winget install ffmpeg') and try again." -ForegroundColor Yellow
    exit 1
}

# Process each video file
$videos = Get-ChildItem -Path $videoDir -Include *.mp4, *.mov, *.mkv -Recurse

foreach ($video in $videos) {
    if ($video.Name -like "*_mobile.mp4") { continue }
    
    $inputPath = $video.FullName
    $outputPath = Join-Path $outputDir ($video.BaseName + "_mobile.mp4")

    # Check if already converted
    if (Test-Path $outputPath) {
        Write-Host "Skipping $inputPath (already exists)" -ForegroundColor Gray
        continue
    }

    Write-Host "Converting: $($video.Name) -> 1080p H.264..." -ForegroundColor Green
    
    # FFmpeg Command Explain:
    # -vf scale=-2:1080 -> Scale height to 1080p, maintain aspect ratio
    # -c:v libx264      -> Use standard H.264 codec (universal mobile support)
    # -profile:v high   -> High profile for quality
    # -level:v 4.2      -> Compatibility level
    # -crf 23           -> Quality factor (18-28 is good range, lower is better quality)
    # -preset fast      -> Encode speed
    # -c:a aac          -> Audio codec standard
    # -b:a 128k         -> Audio bitrate
    # -movflags faststart -> Optimize for web streaming (starts playing faster)

    ffmpeg -i "$inputPath" `
        -vf "scale=-2:1080" `
        -c:v libx264 -profile:v high -level:v 4.2 -crf 23 -preset fast `
        -c:a aac -b:a 128k `
        -movflags +faststart `
        "$outputPath"
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: $outputPath" -ForegroundColor Cyan
    }
    else {
        Write-Host "Failed to convert $($video.Name)" -ForegroundColor Red
    }
}
