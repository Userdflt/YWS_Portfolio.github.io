#!/bin/bash

# Enhanced Image Optimization Script - Converts ALL images for maximum performance
echo "🚀 Starting comprehensive image optimization..."

# Create optimized directory structure
mkdir -p images/optimized/ai_visual_images/{plan_to_render,sketch_to_render,model_to_render,masterplan_render,ComfyUI_workflow,bg_add_render,text_to_render}
mkdir -p images/optimized/ai_visual_images/plan_to_render/plan_render_to_interior_render
mkdir -p images/optimized/ai_visual_images/sketch_to_render/{sketch_1,sketch_2,sketch_3,sketch_4}
mkdir -p images/optimized/ai_visual_images/bg_add_render/related_interior_renders

# Function to optimize any image
optimize_any_image() {
    local input_file="$1"
    local relative_path="${input_file#images/}"
    local output_file="images/optimized/${relative_path%.*}.webp"
    local output_dir=$(dirname "$output_file")
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Skip if already optimized
    if [[ -f "$output_file" ]]; then
        echo "   ⏭️  Already optimized: $(basename "$input_file")"
        return
    fi
    
    echo "📸 Converting: $input_file"
    
    # Get file size
    size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    size_mb=$((size / 1024 / 1024))
    
    # Adjust quality based on file size and type
    if [[ $size_mb -gt 5 ]]; then
        quality=75  # Lower quality for very large files
    elif [[ $size_mb -gt 2 ]]; then
        quality=80  # Medium quality for large files
    else
        quality=85  # High quality for smaller files
    fi
    
    # Convert to WebP
    if cwebp -q $quality -m 6 "$input_file" -o "$output_file" 2>/dev/null; then
        # Get sizes for comparison
        original_size=$(du -h "$input_file" | cut -f1)
        webp_size=$(du -h "$output_file" | cut -f1)
        echo "   ✅ $original_size → $webp_size (quality: ${quality}%)"
    else
        echo "   ❌ Failed to convert $input_file"
    fi
}

# Convert all images in ai_visual_images
echo "🔍 Finding all images in ai_visual_images folder..."
find images/ai_visual_images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read -r file; do
    optimize_any_image "$file"
done

# Convert remaining main images
echo "🔍 Converting remaining main images..."
for ext in png jpg jpeg; do
    for img in images/*.$ext; do
        if [[ -f "$img" ]]; then
            optimize_any_image "$img"
        fi
    done
done

echo ""
echo "📊 Optimization Complete!"
echo "======================="

# Count optimized files
webp_count=$(find images/optimized -name "*.webp" | wc -l)
echo "✅ Total WebP files created: $webp_count"

# Calculate total savings
original_total=0
optimized_total=0

for webp_file in $(find images/optimized -name "*.webp"); do
    # Find corresponding original
    relative_path="${webp_file#images/optimized/}"
    base_name="${relative_path%.*}"
    
    original_file=""
    for ext in png jpg jpeg; do
        test_file="images/${base_name}.${ext}"
        if [[ -f "$test_file" ]]; then
            original_file="$test_file"
            break
        fi
    done
    
    if [[ -n "$original_file" ]]; then
        orig_size=$(stat -f%z "$original_file" 2>/dev/null || stat -c%s "$original_file" 2>/dev/null)
        webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
        
        original_total=$((original_total + orig_size))
        optimized_total=$((optimized_total + webp_size))
    fi
done

if [[ $original_total -gt 0 ]]; then
    original_mb=$((original_total / 1024 / 1024))
    optimized_mb=$((optimized_total / 1024 / 1024))
    reduction=$((100 - (optimized_total * 100 / original_total)))
    
    echo "💾 Total size reduction: ${original_mb}MB → ${optimized_mb}MB"
    echo "🎉 Overall savings: ${reduction}% reduction"
else
    echo "ℹ️  No size comparison available"
fi

echo ""
echo "🚀 Next: Update HTML files to use optimized images"
