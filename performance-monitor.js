// Performance Monitoring Script for Portfolio Website
// Add this to any page to monitor image loading performance

(function() {
    'use strict';
    
    console.log('📊 Performance Monitor Starting...');
    
    // Track image loading performance
    const imageMetrics = {
        total: 0,
        loaded: 0,
        failed: 0,
        webpSupported: 0,
        webpUsed: 0,
        totalSize: 0,
        loadTimes: []
    };
    
    // Check WebP support
    function checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    const webpSupported = checkWebPSupport();
    console.log(`🖼️ WebP Support: ${webpSupported ? '✅ Yes' : '❌ No'}`);
    
    // Monitor image loading
    function monitorImages() {
        const images = document.querySelectorAll('img');
        imageMetrics.total = images.length;
        
        images.forEach((img, index) => {
            const startTime = performance.now();
            
            // Track if WebP is being used
            if (img.src.includes('.webp')) {
                imageMetrics.webpUsed++;
            }
            
            img.addEventListener('load', function() {
                const loadTime = performance.now() - startTime;
                imageMetrics.loaded++;
                imageMetrics.loadTimes.push(loadTime);
                
                // Estimate file size (approximate)
                if (this.naturalWidth && this.naturalHeight) {
                    const estimatedSize = this.naturalWidth * this.naturalHeight * 0.5; // rough estimate
                    imageMetrics.totalSize += estimatedSize;
                }
                
                console.log(`🖼️ Image loaded: ${this.src.split('/').pop()} (${Math.round(loadTime)}ms)`);
                
                // Report when all images are loaded
                if (imageMetrics.loaded === imageMetrics.total) {
                    reportPerformance();
                }
            });
            
            img.addEventListener('error', function() {
                imageMetrics.failed++;
                console.warn(`❌ Image failed: ${this.src}`);
                
                if (imageMetrics.loaded + imageMetrics.failed === imageMetrics.total) {
                    reportPerformance();
                }
            });
        });
    }
    
    // Report performance metrics
    function reportPerformance() {
        const avgLoadTime = imageMetrics.loadTimes.reduce((a, b) => a + b, 0) / imageMetrics.loadTimes.length;
        const maxLoadTime = Math.max(...imageMetrics.loadTimes);
        
        console.log('\n📊 IMAGE PERFORMANCE REPORT');
        console.log('============================');
        console.log(`📸 Total Images: ${imageMetrics.total}`);
        console.log(`✅ Successfully Loaded: ${imageMetrics.loaded}`);
        console.log(`❌ Failed to Load: ${imageMetrics.failed}`);
        console.log(`🚀 WebP Images Used: ${imageMetrics.webpUsed}`);
        console.log(`⏱️ Average Load Time: ${Math.round(avgLoadTime)}ms`);
        console.log(`⏱️ Slowest Image: ${Math.round(maxLoadTime)}ms`);
        console.log(`💾 Estimated Total Size: ${Math.round(imageMetrics.totalSize / 1024)}KB`);
        
        // Performance recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (imageMetrics.webpUsed < imageMetrics.total * 0.5) {
            console.log('- Consider converting more images to WebP format');
        }
        if (avgLoadTime > 500) {
            console.log('- Images are loading slowly, consider further optimization');
        }
        if (imageMetrics.failed > 0) {
            console.log('- Some images failed to load, check file paths');
        }
        
        // Lazy loading effectiveness
        const lazyImages = document.querySelectorAll('.lazy-loading, .lazy-loaded');
        if (lazyImages.length > 0) {
            console.log(`🔄 Lazy Loading Active: ${lazyImages.length} images`);
        }
    }
    
    // Monitor Core Web Vitals
    function monitorCoreWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log(`🎯 LCP (Largest Contentful Paint): ${Math.round(lastEntry.startTime)}ms`);
        }).observe({entryTypes: ['largest-contentful-paint']});
        
        // First Input Delay
        new PerformanceObserver((entryList) => {
            const firstInput = entryList.getEntries()[0];
            console.log(`⚡ FID (First Input Delay): ${Math.round(firstInput.processingStart - firstInput.startTime)}ms`);
        }).observe({entryTypes: ['first-input']});
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            console.log(`📐 CLS (Cumulative Layout Shift): ${clsValue.toFixed(4)}`);
        }).observe({entryTypes: ['layout-shift']});
    }
    
    // Page load timing
    window.addEventListener('load', function() {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            console.log('\n⏱️ PAGE LOAD TIMING');
            console.log('===================');
            console.log(`🚀 DOM Content Loaded: ${Math.round(navigation.domContentLoadedEventEnd)}ms`);
            console.log(`✅ Page Fully Loaded: ${Math.round(navigation.loadEventEnd)}ms`);
            console.log(`🌐 DNS Lookup: ${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`);
            console.log(`🔗 Connection: ${Math.round(navigation.connectEnd - navigation.connectStart)}ms`);
            
            monitorImages();
        }, 100);
    });
    
    // Start monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorCoreWebVitals);
    } else {
        monitorCoreWebVitals();
    }
    
    console.log('📊 Performance Monitor Active');
})();
