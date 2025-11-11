#!/bin/bash

# Fix Gallery Structure Script
echo "🔧 Fixing broken gallery structure in ai-visualizations.html..."

# Create a backup
cp projects/ai-visualizations.html projects/ai-visualizations.html.broken-backup

# Fix the broken HTML structure
cat > temp_gallery_fix.html << 'EOF'
            <!-- Gallery Grid -->
            <div class="gallery-grid" id="galleryGrid">
                <!-- ComfyUI Workflow Images -->
                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/ComfyUI_workflow/Cabin_sample_model.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/Cabin_sample_model.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/Cabin_sample_model.png" alt="Cabin Sample Model" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Cabin Sample Model</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/ComfyUI_workflow/Cabin_render_highq.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/Cabin_render_highq.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/Cabin_render_highq.jpg" alt="Cabin High Quality Render" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Cabin High Quality Render</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/interior_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/interior_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/interior_render_1.png" alt="Interior Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Interior Render 1</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/AI_interior_render_1.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/AI_interior_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/AI_interior_render_1.jpg" alt="AI Interior Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">AI Interior Render 1</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/interior_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/interior_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/interior_render_2.png" alt="Interior Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Interior Render 2</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/AI_interior_render_2.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/AI_interior_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/AI_interior_render_2.jpg" alt="AI Interior Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">AI Interior Render 2</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <!-- ComfyUI Workflow Images -->
                <div class="gallery-item" data-category="comfyui_workflow" data-src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00013_.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/ComfyUI_00013_.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00013_.png" alt="ComfyUI Workflow Output 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">ComfyUI Workflow Output 1</h3>
                        <p class="gallery-item-category">ComfyUI Workflow</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="comfyui_workflow" data-src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00014_.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/ComfyUI_00014_.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00014_.png" alt="ComfyUI Workflow Output 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">ComfyUI Workflow Output 2</h3>
                        <p class="gallery-item-category">ComfyUI Workflow</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="comfyui_workflow" data-src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00018_.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/ComfyUI_00018_.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00018_.png" alt="ComfyUI Workflow Output 3" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">ComfyUI Workflow Output 3</h3>
                        <p class="gallery-item-category">ComfyUI Workflow</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="comfyui_workflow" data-src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00022_.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/ComfyUI_workflow/ComfyUI_00022_.webp" type="image/webp">
                        <img src="../images/ai_visual_images/ComfyUI_workflow/ComfyUI_00022_.png" alt="ComfyUI Workflow Output 4" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">ComfyUI Workflow Output 4</h3>
                        <p class="gallery-item-category">ComfyUI Workflow</p>
                    </div>
                </div>

                <!-- Sketch to Render Images -->
                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_4/20220705_175328.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_4/20220705_175328.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_4/20220705_175328.jpg" alt="Sketch 4 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 4 - Original</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_4/2025-11-09_10-23.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_4/2025-11-09_10-23.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_4/2025-11-09_10-23.png" alt="Sketch 4 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 4 - Render 1</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_1/sketch_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1.jpg" alt="Sketch 1 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 1 - Original</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_2.png" alt="Sketch 1 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 1 - Render 2</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_3.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_3.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_3.png" alt="Sketch 1 Render 3" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 1 - Render 3</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_4.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_4.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_4.png" alt="Sketch 1 Render 4" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 1 - Render 4</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_5.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_5.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_1/sketch_1_render_5.png" alt="Sketch 1 Render 5" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 1 - Render 5</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-1 (3).png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-1 (3).webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-1 (3).png" alt="Sketch 2 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 2 - Render 1</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-22.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-22.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_2/nano-banana-image-22.png" alt="Sketch 2 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 2 - Render 2</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3.jpg">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_3/sketch_3.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3.jpg" alt="Sketch 3 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 3 - Original</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_1.png" alt="Sketch 3 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 3 - Render 1</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_2.png" alt="Sketch 3 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 3 - Render 2</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="sketch_to_render" data-src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_3.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_3.webp" type="image/webp">
                        <img src="../images/ai_visual_images/sketch_to_render/sketch_3/sketch_3_render_3.png" alt="Sketch 3 Render 3" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Sketch 3 - Render 3</h3>
                        <p class="gallery-item-category">Sketch to Render</p>
                    </div>
                </div>

                <!-- Model to Render Images -->
                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1.png" alt="Model 1 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Original</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_1.png" alt="Model 1 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 1</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_1_night.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_1_night.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_1_night.png" alt="Model 1 Render 1 Night" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 1 Night</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_2.png" alt="Model 1 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 2</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_2_night.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_2_night.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_2_night.png" alt="Model 1 Render 2 Night" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 2 Night</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_3.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_3.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_3.png" alt="Model 1 Render 3" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 3</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="model_to_render" data-src="../images/ai_visual_images/model_to_render/model_1_render_3_night.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/model_to_render/model_1_render_3_night.webp" type="image/webp">
                        <img src="../images/ai_visual_images/model_to_render/model_1_render_3_night.png" alt="Model 1 Render 3 Night" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Model 1 - Render 3 Night</h3>
                        <p class="gallery-item-category">Model to Render</p>
                    </div>
                </div>

                <!-- Plan to Render Images -->
                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_1.png" alt="Plan 1 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 1 - Original</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_1_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_1_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_1_render_1.png" alt="Plan 1 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 1 - Render 1</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_1_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_1_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_1_render_2.png" alt="Plan 1 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 1 - Render 2</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_2.png" alt="Plan 2 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 2 - Original</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_2_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_2_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_2_render_1.png" alt="Plan 2 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 2 - Render 1</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_2_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_2_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_2_render_2.png" alt="Plan 2 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 2 - Render 2</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_3.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_3.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_3.png" alt="Plan 3 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 3 - Original</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_3_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_3_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_3_render_1.png" alt="Plan 3 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 3 - Render 1</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="plan_to_render" data-src="../images/ai_visual_images/plan_to_render/plan_3_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/plan_to_render/plan_3_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/plan_to_render/plan_3_render_2.png" alt="Plan 3 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Plan 3 - Render 2</h3>
                        <p class="gallery-item-category">Plan to Render</p>
                    </div>
                </div>

                <!-- Text to Render Images -->
                <div class="gallery-item" data-category="text_to_render" data-src="../images/ai_visual_images/text_to_render/render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/text_to_render/render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/text_to_render/render_1.png" alt="Text to Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Text to Render 1</h3>
                        <p class="gallery-item-category">Text to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="text_to_render" data-src="../images/ai_visual_images/text_to_render/render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/text_to_render/render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/text_to_render/render_2.png" alt="Text to Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Text to Render 2</h3>
                        <p class="gallery-item-category">Text to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="text_to_render" data-src="../images/ai_visual_images/text_to_render/interior_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/text_to_render/interior_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/text_to_render/interior_render_1.png" alt="Interior Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Interior Render 1</h3>
                        <p class="gallery-item-category">Text to Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="text_to_render" data-src="../images/ai_visual_images/text_to_render/interior_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/text_to_render/interior_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/text_to_render/interior_render_2.png" alt="Interior Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Interior Render 2</h3>
                        <p class="gallery-item-category">Text to Render</p>
                    </div>
                </div>

                <!-- Masterplan Render Images -->
                <div class="gallery-item" data-category="masterplan_render" data-src="../images/ai_visual_images/masterplan_render/masterplan_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/masterplan_render/masterplan_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/masterplan_render/masterplan_1.png" alt="Masterplan 1 Original" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Masterplan 1 - Original</h3>
                        <p class="gallery-item-category">Masterplan Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="masterplan_render" data-src="../images/ai_visual_images/masterplan_render/masterplan_1_render_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/masterplan_render/masterplan_1_render_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/masterplan_render/masterplan_1_render_1.png" alt="Masterplan 1 Render 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Masterplan 1 - Render 1</h3>
                        <p class="gallery-item-category">Masterplan Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="masterplan_render" data-src="../images/ai_visual_images/masterplan_render/masterplan_1_render_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/masterplan_render/masterplan_1_render_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/masterplan_render/masterplan_1_render_2.png" alt="Masterplan 1 Render 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Masterplan 1 - Render 2</h3>
                        <p class="gallery-item-category">Masterplan Render</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="masterplan_render" data-src="../images/ai_visual_images/masterplan_render/masterplan_1_render_4.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/masterplan_render/masterplan_1_render_4.webp" type="image/webp">
                        <img src="../images/ai_visual_images/masterplan_render/masterplan_1_render_4.png" alt="Masterplan 1 Render 4" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Masterplan 1 - Render 4</h3>
                        <p class="gallery-item-category">Masterplan Render</p>
                    </div>
                </div>

                <!-- Background & Context Images -->
                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/bg.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/bg.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/bg.png" alt="Background" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Background Original</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/first_concept.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/first_concept.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/first_concept.png" alt="First Concept" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">First Concept</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/first_concept_w_ppl.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/first_concept_w_ppl.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/first_concept_w_ppl.png" alt="First Concept with People" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">First Concept with People</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/first_concept_modified.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/first_concept_modified.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/first_concept_modified.png" alt="First Concept Modified" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">First Concept Modified</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/concept_1.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/concept_1.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/concept_1.png" alt="Concept 1" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Concept 1</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/concept_2.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/concept_2.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/concept_2.png" alt="Concept 2" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Concept 2</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>

                <div class="gallery-item" data-category="bg_add_render" data-src="../images/ai_visual_images/bg_add_render/concept_2_w_ppl.png">
                    <picture>
                        <source srcset="../images/optimized/ai_visual_images/bg_add_render/concept_2_w_ppl.webp" type="image/webp">
                        <img src="../images/ai_visual_images/bg_add_render/concept_2_w_ppl.png" alt="Concept 2 with People" class="lazy-image">
                    </picture>
                    <div class="gallery-item-overlay">
                        <h3 class="gallery-item-title">Concept 2 with People</h3>
                        <p class="gallery-item-category">Background & Context</p>
                    </div>
                </div>
            </div>
EOF

echo "✅ Fixed gallery structure created"
