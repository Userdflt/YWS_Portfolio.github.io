#!/usr/bin/env python3

import re

# Read the current file
with open('projects/ai-visualizations.html', 'r') as f:
    content = f.read()

# Read the fixed gallery content
with open('temp_gallery_fix.html', 'r') as f:
    fixed_gallery = f.read()

# Find the start and end of the gallery section
start_pattern = r'<!-- Gallery Grid -->\s*<div class="gallery-grid" id="galleryGrid">'
end_pattern = r'</div>\s*</div>\s*</section>\s*<!-- Lightbox Modal -->'

# Find the positions
start_match = re.search(start_pattern, content)
end_match = re.search(end_pattern, content)

if start_match and end_match:
    # Extract everything before the gallery
    before_gallery = content[:start_match.start()]
    
    # Extract everything after the gallery (from the closing section tag)
    after_gallery_start = content.find('</div>', end_match.start()) 
    after_gallery_start = content.find('</section>', after_gallery_start)
    after_gallery = content[after_gallery_start:]
    
    # Combine with fixed gallery
    new_content = before_gallery + fixed_gallery + '\n        ' + after_gallery
    
    # Write the fixed file
    with open('projects/ai-visualizations.html', 'w') as f:
        f.write(new_content)
    
    print("✅ Gallery section completely fixed!")
else:
    print("❌ Could not find gallery section boundaries")
