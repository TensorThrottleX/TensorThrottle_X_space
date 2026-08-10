#!/bin/bash
# compress_videos.sh
# Finds all mp4 files in the anime video directory and compresses them.

VIDEO_DIR="public/media/universe/anime/video"

find "$VIDEO_DIR" -type f -name "*.mp4" | while read -r file; do
    echo "Compressing: $file"
    
    # Get file size in MB
    size=$(du -m "$file" | cut -f1)
    
    # Only compress if larger than 20MB
    if [ "$size" -gt 20 ]; then
        temp_file="${file%.mp4}_temp.mp4"
        
        # Compress using libx264, scaling down to 1080p if larger, with high quality (CRF 26)
        # -nostdin prevents ffmpeg from eating the while loop's input
        ffmpeg -nostdin -y -i "$file" -vcodec libx264 -crf 26 -preset fast -vf "scale='min(1920,iw)':-2" -acodec aac -b:a 128k "$temp_file"
        
        # If compression succeeded, replace the original file
        if [ $? -eq 0 ]; then
            mv "$temp_file" "$file"
            echo "Successfully compressed: $file"
        else
            echo "Failed to compress: $file"
            rm -f "$temp_file"
        fi
    else
        echo "Skipping $file (Size: ${size}MB is already small enough)"
    fi
done
