#!/bin/bash

# Image Optimization Script for Portfolio Website
# This script converts large images to WebP format and creates multiple sizes

echo "🚀 Starting image optimization process..."

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install webp
    else
        echo "❌ Homebrew not found. Please install WebP tools manually:"
        echo "   brew install webp"
        exit 1
    fi
fi

# Create optimized directory if it doesn't exist
mkdir -p images/optimized

# Function to optimize a single image
optimize_image() {
    local input_file="$1"
    local output_dir="$2"
    local base_name=$(basename "$input_file" | sed 's/\.[^.]*$//')
    local extension="${input_file##*.}"
    
    echo "📸 Processing: $input_file"
    
    # Skip if already optimized
    if [[ -f "$output_dir/${base_name}.webp" ]]; then
        echo "   ⏭️  Already optimized, skipping..."
        return
    fi
    
    # Get image dimensions
    if command -v identify &> /dev/null; then
        dimensions=$(identify -format "%wx%h" "$input_file" 2>/dev/null)
        width=$(echo $dimensions | cut -d'x' -f1)
        height=$(echo $dimensions | cut -d'x' -f2)
        
        echo "   📏 Original size: ${width}x${height}"
    else
        width=1200
        height=800
        echo "   📏 ImageMagick not found, using default dimensions"
    fi
    
    # Convert to WebP with high quality
    echo "   🔄 Converting to WebP..."
    cwebp -q 85 -m 6 "$input_file" -o "$output_dir/${base_name}.webp"
    
    # Create responsive versions if image is large
    if [[ $width -gt 1200 ]]; then
        echo "   📱 Creating responsive versions..."
        
        # Large version (1200px max width)
        cwebp -q 85 -m 6 -resize 1200 0 "$input_file" -o "$output_dir/${base_name}_large.webp"
        
        # Medium version (800px max width)
        cwebp -q 80 -m 6 -resize 800 0 "$input_file" -o "$output_dir/${base_name}_medium.webp"
        
        # Small version (400px max width)
        cwebp -q 75 -m 6 -resize 400 0 "$input_file" -o "$output_dir/${base_name}_small.webp"
        
        echo "   ✅ Created responsive versions"
    fi
    
    # Get file sizes for comparison
    original_size=$(du -h "$input_file" | cut -f1)
    webp_size=$(du -h "$output_dir/${base_name}.webp" | cut -f1)
    
    echo "   💾 Size comparison: $original_size → $webp_size"
}

# Find and optimize large images (>1MB)
echo "🔍 Finding large images to optimize..."

# Process images in main directory
find images -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r file; do
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    size_mb=$((size / 1024 / 1024))
    
    if [[ $size_mb -gt 1 ]]; then
        echo "📦 Large file found: $file (${size_mb}MB)"
        optimize_image "$file" "images/optimized"
    fi
done

# Create a summary report
echo ""
echo "📊 Optimization Summary:"
echo "======================="

original_total=0
optimized_total=0

for webp_file in images/optimized/*.webp; do
    if [[ -f "$webp_file" ]]; then
        base_name=$(basename "$webp_file" .webp)
        
        # Find corresponding original file
        original_file=""
        for ext in png jpg jpeg; do
            if [[ -f "images/${base_name}.${ext}" ]]; then
                original_file="images/${base_name}.${ext}"
                break
            fi
        done
        
        if [[ -n "$original_file" ]]; then
            orig_size=$(stat -f%z "$original_file" 2>/dev/null || stat -c%s "$original_file" 2>/dev/null)
            webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
            
            original_total=$((original_total + orig_size))
            optimized_total=$((optimized_total + webp_size))
            
            reduction=$((100 - (webp_size * 100 / orig_size)))
            echo "✅ ${base_name}: ${reduction}% reduction"
        fi
    fi
done

if [[ $original_total -gt 0 ]]; then
    total_reduction=$((100 - (optimized_total * 100 / original_total)))
    original_mb=$((original_total / 1024 / 1024))
    optimized_mb=$((optimized_total / 1024 / 1024))
    
    echo ""
    echo "🎉 Total savings: ${original_mb}MB → ${optimized_mb}MB (${total_reduction}% reduction)"
else
    echo "ℹ️  No large images found to optimize"
fi

echo ""
echo "✅ Image optimization complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update HTML files to use WebP images with fallbacks"
echo "2. Test the lazy loading system"
echo "3. Monitor loading performance"
