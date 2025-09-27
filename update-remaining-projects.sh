#!/bin/bash

# E-ink Portfolio - Batch Update Script for Remaining Project Pages
# This script updates the remaining project pages with e-ink styling

echo "📖 Updating remaining project pages to e-ink style..."

# List of project files to update
projects=(
    "projects/ai-detection.html"
    "projects/cv.html"
    "projects/llm.html"
    "projects/n8n_rag.html"
    "projects/nasa-outgassing.html"
    "projects/notion_mcp.html"
    "projects/stablediffusion.html"
    "projects/vision_model.html"
    "projects/wind-energy.html"
    "projects/youtube-analytics.html"
)

# Backup original files
mkdir -p backups
for project in "${projects[@]}"; do
    if [ -f "$project" ]; then
        cp "$project" "backups/$(basename $project).backup"
        echo "📚 Backed up $project"
    fi
done

# Update each project file
for project in "${projects[@]}"; do
    if [ -f "$project" ]; then
        echo "📄 Updating $project..."
        
        # Update fonts to technical monospace
        sed -i '' 's|Inter:wght@300;400;500;600;700;800|JetBrains+Mono:wght@300;400;500;600;700\&family=Space+Mono:wght@400;700\&family=Roboto+Mono:wght@300;400;500;600;700\&family=Fira+Code:wght@300;400;500;600;700|g' "$project"
        
        # Remove AOS library
        sed -i '' '/AOS Animation Library/d' "$project"
        sed -i '' '/aos@2.3.1/d' "$project"
        
        # Add e-ink styles comment
        sed -i '' 's|<!-- Fonts -->|<!-- E-ink Fonts -->|g' "$project"
        
        # Add main-styles.css if not present
        if ! grep -q "main-styles.css" "$project"; then
            sed -i '' 's|<link rel="stylesheet" href="../css/project-styles.css">|<link rel="stylesheet" href="../css/main-styles.css">\
    <link rel="stylesheet" href="../css/project-styles.css">|g' "$project"
        fi
        
        # Update script section
        sed -i '' 's|<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>||g' "$project"
        sed -i '' '/AOS.init/,/});/d' "$project"
        
        echo "✅ Updated $project"
    else
        echo "⚠️  File not found: $project"
    fi
done

echo "📖 E-ink update complete!"
echo "📚 Original files backed up to ./backups/"
echo "🎨 All project pages now use e-ink styling"
