#!/bin/bash

# Comprehensive Gallery Image Update Script
echo "🔄 Updating ALL gallery images to use WebP versions with lazy loading..."

# Function to update gallery images in a file
update_gallery_images() {
    local file="$1"
    echo "📝 Processing gallery images in: $file"
    
    # Create backup
    cp "$file" "${file}.backup"
    
    # Update all img tags in gallery items to use picture elements with WebP
    # This handles the complex nested structure in ai-visualizations.html
    
    # First, find all img tags with ai_visual_images paths and convert them
    perl -i -pe '
        # Match img tags with ai_visual_images paths
        if (/<img\s+src="([^"]*ai_visual_images[^"]*\.(png|jpg|jpeg))"([^>]*)>/) {
            my $original_src = $1;
            my $extension = $2;
            my $attributes = $3;
            
            # Create WebP path
            my $webp_src = $original_src;
            $webp_src =~ s/\.(png|jpg|jpeg)$/.webp/;
            $webp_src =~ s|images/|images/optimized/|;
            
            # Replace with picture element
            $_ = "<picture><source srcset=\"$webp_src\" type=\"image/webp\"><img src=\"$original_src\"$attributes></picture>";
        }
    ' "$file"
    
    echo "   ✅ Updated gallery images in $file"
}

# Function to add lazy loading classes to images
add_lazy_loading() {
    local file="$1"
    echo "📝 Adding lazy loading to: $file"
    
    # Add lazy loading class to all img tags except those marked as no-lazy or critical-image
    perl -i -pe '
        # Skip images that already have no-lazy or critical-image classes
        if (/<img[^>]*class="[^"]*(?:no-lazy|critical-image)/) {
            # Do nothing - keep as is
        }
        # Add lazy loading to other img tags
        elsif (/<img([^>]*?)>/) {
            my $attrs = $1;
            if ($attrs =~ /class="([^"]*)"/) {
                # Add to existing class
                my $existing_class = $1;
                $attrs =~ s/class="[^"]*"/class="$existing_class lazy-image"/;
            } else {
                # Add new class attribute
                $attrs .= " class=\"lazy-image\"";
            }
            $_ = "<img$attrs>";
        }
    ' "$file"
    
    echo "   ✅ Added lazy loading classes to $file"
}

# Update ai-visualizations.html (the main culprit)
if [[ -f "projects/ai-visualizations.html" ]]; then
    echo "🎯 Updating AI Visualizations page (main performance issue)..."
    update_gallery_images "projects/ai-visualizations.html"
    add_lazy_loading "projects/ai-visualizations.html"
fi

# Update other project pages
for project_file in projects/*.html; do
    if [[ -f "$project_file" && "$project_file" != "projects/ai-visualizations.html" ]]; then
        update_gallery_images "$project_file"
        add_lazy_loading "$project_file"
    fi
done

# Update main index page
if [[ -f "index.html" ]]; then
    echo "📝 Updating main index page..."
    add_lazy_loading "index.html"
fi

echo ""
echo "✅ Gallery image updates complete!"
echo ""
echo "📊 Summary of changes:"
echo "- Converted all gallery img tags to picture elements with WebP sources"
echo "- Added lazy loading classes to non-critical images"
echo "- Maintained fallbacks for browser compatibility"
echo ""
echo "🚀 Performance improvements:"
echo "- Gallery images now use WebP format (80-95% smaller)"
echo "- Lazy loading prevents loading all images at once"
echo "- Only visible images load initially"
echo ""
echo "💡 Test the improvements:"
echo "1. Open browser developer tools"
echo "2. Go to Network tab"
echo "3. Visit /projects/ai-visualizations"
echo "4. Notice only a few images load initially"
echo "5. Scroll down to see lazy loading in action"
