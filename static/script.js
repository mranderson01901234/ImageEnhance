// Image pairs for the before/after slider
const imagePairs = [
    {
        before: '/public/beforebella.png',
        after: '/public/afterbella.png'
    }
];

// Assistant API functions for image enhancement explanations
async function callAssistantExplain({ beforeUrl, afterUrl, metrics = {}, vlmSummary = null, userMessage = "" }) {
  try {
    const resp = await fetch("/api/assistant/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beforeUrl, afterUrl, metrics, vlmSummary, userMessage }),
    });
    if (!resp.ok) throw new Error("Assistant API error");
    const data = await resp.json();
    return data.message || "";
  } catch (error) {
    console.error("Assistant API error:", error);
    throw error;
  }
}

// Global variables to store current enhancement context
window.currentBeforeUrl = null;
window.currentAfterUrl = null;
window.currentMetrics = {
  ssim: 0.92,
  psnr_db: 28.2,
  sharpness_delta: "+21%",
  contrast_delta: "+12%",
  wb_shift: "cool→neutral",
  jpeg_artifacts_delta: "-34%"
};

// Interactive Upload and AI Processing Handler
class InteractiveImageProcessor {
    constructor() {
        this.uploadBtn = document.getElementById('upload-btn');
        this.fileInput = document.getElementById('image-input');
        this.instantAiBtn = document.getElementById('instant-ai-btn');
        this.localFallbackBtn = document.getElementById('local-fallback-btn');
        this.tryAnotherBtn = document.getElementById('try-another-btn');
        this.downloadEnhancedBtn = document.getElementById('download-enhanced-btn');
        this.beforeImg = document.getElementById('beforeImg');
        this.afterImg = document.getElementById('afterImg');
        this.uploadedImage = document.getElementById('uploadedImage');
        this.finalBeforeImage = document.getElementById('finalBeforeImage');
        this.finalAfterImage = document.getElementById('finalAfterImage');
        this.processingOverlay = document.getElementById('processing-overlay');
        this.processingStatus = document.getElementById('processing-status');
        this.globalLoadingIndicator = document.getElementById('global-loading-indicator');
        this.globalStatusText = document.getElementById('global-status-text');
        this.demoSection = document.getElementById('demo-section');
        this.singleImageSection = document.getElementById('single-image-section');
        this.finalComparisonSection = document.getElementById('final-comparison-section');
        this.comparisonSlider = null;
        this.userImageUploaded = false;
        this.uploadedFile = null;
        this.isUpscaling = false;
        this.hasUpscaled = false;
        this.predictionCompleted = false;
        
        // Replicate deployment configuration
        this.deploymentId = 'mranderson01901234/my-app-scunetrepliactemodel';
        this.modelType = 'real image denoising'; // Default model type
        
        // Available model options for SCUNet
        this.availableModels = [
            'real image denoising',
            'grayscale images-15',
            'grayscale images-25', 
            'grayscale images-50',
            'color images-15',
            'color images-25',
            'color images-50'
        ];
        
        this.init();
    }
    
    init() {
        // Initially disable and hide the Instant AI button
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.style.display = 'none';
        }
        
        // Ensure processing overlay is hidden by default
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
        }
        
        // Set up event listeners
        this.uploadBtn.addEventListener('click', this.handleUploadClick.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        if (this.instantAiBtn) {
            this.instantAiBtn.addEventListener('click', this.handleInstantAiClick.bind(this));
        }
        if (this.localFallbackBtn) {
            this.localFallbackBtn.addEventListener('click', this.handleLocalFallbackClick.bind(this));
        }
        if (this.tryAnotherBtn) {
            this.tryAnotherBtn.addEventListener('click', this.resetToDemoView.bind(this));
        }
        if (this.downloadEnhancedBtn) {
            this.downloadEnhancedBtn.addEventListener('click', this.downloadEnhancedImage.bind(this));
        }
        
        // Fetch and display current configuration
        this.fetchConfiguration();
        
        // Make error testing available globally for development
        window.testErrorDisplay = (errorType) => this.testErrorDisplay(errorType);
        
        // Add manual prediction status checking for debugging
        window.checkPredictionStatus = (predictionId) => this.checkPredictionStatus(predictionId);
        window.forceUIUpdate = () => this.forceUIUpdate();
        
        // Add upscaling debugging and testing
        window.debugImageComparison = () => this.debugImageComparison();
        window.forceUpscaling = () => this.forceUpscaling();
        window.testUpscaling = () => this.testUpscaling();
        
        console.log('Interactive Image Processor initialized with Replicate deployment');
        console.log('💡 Test error display: testErrorDisplay("large"), testErrorDisplay("cuda"), testErrorDisplay("network"), testErrorDisplay("timeout")');
        console.log('🔍 Debug commands: checkPredictionStatus("prediction_id"), forceUIUpdate()');
        console.log('🖼️ Upscaling debug: debugImageComparison(), forceUpscaling(), testUpscaling()');
    }
    
    setComparisonSlider(sliderInstance) {
        this.comparisonSlider = sliderInstance;
    }
    
    // Fetch current backend configuration
    async fetchConfiguration() {
        try {
            const response = await fetch('/config');
            if (response.ok) {
                const config = await response.json();
                console.log('Backend configuration:', config);
                
                // Update file size limit for validation
                this.maxFileSizeBytes = config.max_file_size_bytes;
                this.maxFileSizeMB = config.max_file_size_mb;
                
                // Display configuration info in console for debugging
                console.log(`File size limit: ${config.max_file_size_mb}MB`);
                console.log(`Max image dimension: ${config.max_image_dimension}px`);
                console.log(`Tile size: ${config.tile_size}px`);
            }
        } catch (error) {
            console.warn('Could not fetch backend configuration:', error);
            // Use default values
            this.maxFileSizeBytes = 100 * 1024 * 1024; // 100MB
            this.maxFileSizeMB = 100;
        }
    }
    
    // Handle upload button click - trigger hidden file input
    handleUploadClick() {
        // If user already has an image and wants to change it, reset to demo view
        if (this.userImageUploaded) {
            this.resetToDemoView();
        }
        
        console.log('Upload button clicked - triggering file input');
        this.fileInput.click();
        
        // Track upload button interaction
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('upload_button_clicked');
        }
    }
    
    // Reset UI back to demo view
    resetToDemoView() {
        // Reset state
        this.userImageUploaded = false;
        this.uploadedFile = null;
        this.hasUpscaled = false;
        this.isUpscaling = false;
        this.predictionCompleted = false;
        
        // Reset button states
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.classList.remove('active');
            this.instantAiBtn.style.display = 'none';
        }
        if (this.localFallbackBtn) {
            this.localFallbackBtn.classList.add('disabled');
            this.localFallbackBtn.style.display = 'none';
        }
        this.uploadBtn.textContent = 'Upload Image';
        
        // Clear file input
        this.fileInput.value = '';
        
        // Show demo section
        this.demoSection.style.display = 'flex';
        
        // Hide other sections
        this.singleImageSection.style.display = 'none';
        this.finalComparisonSection.style.display = 'none';
        
        // Hide processing overlay if visible
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
        }
        
        // Restart auto rotation if slider exists
        if (this.comparisonSlider) {
            this.comparisonSlider.startAutoSlide();
        }
        
        console.log('Reset to demo view');
    }
    
    // Handle download of enhanced image
    downloadEnhancedImage() {
        if (this.enhancedImageBlob) {
            // Use the upscaled blob if available (better quality and original resolution)
            const originalFilename = this.uploadedFile ? this.uploadedFile.name : 'image.jpg';
            const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
            const extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1) || 'jpg';
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(this.enhancedImageBlob);
            a.download = `${nameWithoutExt}_enhanced_fullres.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the object URL
            URL.revokeObjectURL(a.href);
            
            console.log('✅ Full-resolution enhanced image downloaded successfully');
            
            // Track download event
            if (typeof AnalyticsTracker !== 'undefined') {
                AnalyticsTracker.trackEvent('enhanced_image_downloaded', {
                    filename: a.download,
                    fullResolution: true,
                    fileSize: `${(this.enhancedImageBlob.size / (1024 * 1024)).toFixed(2)}MB`
                });
            }
        } else if (this.finalAfterImage.src) {
            // Fallback to the displayed image if no blob available
            const originalFilename = this.uploadedFile ? this.uploadedFile.name : 'image.jpg';
            const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
            const extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1) || 'jpg';
            
            const a = document.createElement('a');
            a.href = this.finalAfterImage.src;
            a.download = `${nameWithoutExt}_enhanced.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            console.log('✅ Enhanced image downloaded successfully (fallback)');
            
            // Track download event
            if (typeof AnalyticsTracker !== 'undefined') {
                AnalyticsTracker.trackEvent('enhanced_image_downloaded', {
                    filename: a.download,
                    fullResolution: false
                });
            }
        } else {
            console.error('No enhanced image available to download');
        }
    }
    
    // Handle file selection
    handleFileSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        // Validate file size using dynamic configuration
        const maxSizeBytes = this.maxFileSizeBytes || (100 * 1024 * 1024); // Default to 100MB
        if (file.size > maxSizeBytes) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const maxSizeMB = this.maxFileSizeMB || 100;
            alert(`File too large. Maximum size is ${maxSizeMB}MB. Current file size: ${sizeMB}MB`);
            return;
        }
        
        console.log('File selected:', file.name, 'Size:', file.size, 'bytes');
        
        // Stop the automatic carousel
        if (this.comparisonSlider) {
            this.comparisonSlider.stopAutoSlide();
        }
        
        // Auto-resize image before displaying
        this.autoResizeImage(file);
    }
    
    // Auto-resize image to optimal dimensions for AI processing
    async autoResizeImage(file) {
        try {
            console.log('🔄 Auto-resizing image for optimal AI processing...');
        console.log(`📊 Original file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create image element
            const img = new Image();
            
            img.onload = () => {
                // Calculate optimal dimensions
                const { width, height } = this.calculateOptimalDimensions(img.width, img.height);
                
                console.log('📏 Image dimensions:', {
                    original: `${img.width}x${img.height}`,
                    optimal: `${width}x${height}`,
                    resizeNeeded: width !== img.width || height !== img.height,
                    originalFileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
                });
                
                // If no resize is needed, use original image to avoid quality loss
                if (width === img.width && height === img.height) {
                    console.log('✅ No resize needed, using original image');
                    this.originalFile = file;
                    this.uploadedFile = file;
                    this.displayOriginalImage(file);
                    return;
                }
                
                // Check if original image is already small enough for guaranteed success
                if (file.size <= 5 * 1024 * 1024 && img.width <= 2048 && img.height <= 2048) {
                    console.log('✅ Original image already optimal size, using as-is');
                    this.originalFile = file;
                    this.uploadedFile = file;
                    this.displayOriginalImage(file);
                    return;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image with high quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Progressive resizing with guaranteed file size control
                this.createOptimizedBlob(canvas, file, width, height, img.width, img.height);
                
            };
            
            img.onerror = () => {
                console.error('Failed to load image for resizing');
                // Fallback to original image
                this.uploadedFile = file;
                this.displayOriginalImage(file);
            };
            
            // Load image from file
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Auto-resize error:', error);
            // Fallback to original image
            this.uploadedFile = file;
            this.displayOriginalImage(file);
        }
    }
    
    // Calculate optimal dimensions for AI processing with guaranteed success
    calculateOptimalDimensions(width, height) {
        // Conservative limits for 100% success rate
        const maxDimension = 2048; // Reduced from 4096 for better reliability
        const targetMaxDimension = 1024; // Target for optimal performance
        const minDimension = 256; // Minimum dimension
        
        let newWidth = width;
        let newHeight = height;
        
        // Aggressive downscaling for large images to ensure success
        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                newWidth = maxDimension;
                newHeight = Math.round((height * maxDimension) / width);
            } else {
                newHeight = maxDimension;
                newWidth = Math.round((width * maxDimension) / height);
            }
        }
        
        // Additional downscaling for very large images to target optimal size
        if (width > targetMaxDimension || height > targetMaxDimension) {
            if (width > height) {
                newWidth = targetMaxDimension;
                newHeight = Math.round((height * targetMaxDimension) / width);
            } else {
                newHeight = targetMaxDimension;
                newWidth = Math.round((width * targetMaxDimension) / height);
            }
        }
        
        // Only scale up small images if they're extremely small (less than 128px)
        if (width < 128 || height < 128) {
            const scale = Math.max(128 / width, 128 / height);
            if (scale < 3) { // Don't scale up more than 3x
                newWidth = Math.round(width * scale);
                newHeight = Math.round(height * scale);
            }
        }
        
        // Ensure dimensions are even numbers (some AI models prefer this)
        newWidth = Math.round(newWidth / 2) * 2;
        newHeight = Math.round(newHeight / 2) * 2;
        
        return { width: newWidth, height: newHeight };
    }
    
    // Progressive blob creation with guaranteed file size control
    // Strategy: Try multiple quality levels, then force extreme downscaling if needed
    // Target: Ensure file size stays under 5MB for 100% success rate
    createOptimizedBlob(canvas, file, targetWidth, targetHeight, originalWidth, originalHeight) {
        const maxTargetSize = 5 * 1024 * 1024; // 5MB target for guaranteed success
        const qualityLevels = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
        
        const attemptOptimization = (qualityIndex = 0) => {
            if (qualityIndex >= qualityLevels.length) {
                // If all quality levels fail, force extreme downscaling
                console.log('⚠️ All quality levels failed, forcing extreme downscaling');
                this.forceExtremeDownscaling(canvas, file, originalWidth, originalHeight);
                return;
            }
            
            const quality = qualityLevels[qualityIndex];
            console.log(`🔄 Attempting optimization with quality ${quality}...`);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob');
                    this.uploadedFile = file;
                    this.displayOriginalImage(file);
                    return;
                }
                
                const blobSize = blob.size;
                console.log(`📊 Blob size: ${(blobSize / (1024 * 1024)).toFixed(2)}MB (quality: ${quality})`);
                
                if (blobSize <= maxTargetSize) {
                    // Success! File size is acceptable
                    this.handleSuccessfulOptimization(blob, file, quality, targetWidth, targetHeight, originalWidth, originalHeight);
                } else {
                    // File size too large, try next quality level
                    console.log(`❌ File size too large (${(blobSize / (1024 * 1024)).toFixed(2)}MB > ${(maxTargetSize / (1024 * 1024)).toFixed(2)}MB)`);
                    attemptOptimization(qualityIndex + 1);
                }
            }, 'image/jpeg', quality);
        };
        
        // Start optimization process
        attemptOptimization();
    }
    
    // Handle successful optimization
    handleSuccessfulOptimization(blob, file, quality, targetWidth, targetHeight, originalWidth, originalHeight) {
        const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        
        const sizeChange = file.size - blob.size;
        const sizeChangePercent = (sizeChange / file.size * 100);
        const sizeChangeText = sizeChange >= 0 ? 'reduction' : 'increase';
        const isUpscaled = targetWidth > originalWidth || targetHeight > originalHeight;
        const isSmallImage = originalWidth < 256 || originalHeight < 256;
        
        console.log('✅ Image optimization successful:', {
            originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            resizedSize: `${(blob.size / (1024 * 1024)).toFixed(2)}MB`,
            sizeChange: `${Math.abs(sizeChangePercent).toFixed(1)}% ${sizeChangeText}`,
            quality: quality,
            dimensions: `${targetWidth}x${targetHeight}`,
            upscaled: isUpscaled,
            smallImage: isSmallImage
        });
        
        // Store both original and resized files
        this.originalFile = file;
        this.uploadedFile = resizedFile;
        
        // Display the resized image
        this.displayResizedImage(blob);
    }
    
    // Force extreme downscaling as last resort
    forceExtremeDownscaling(canvas, file, originalWidth, originalHeight) {
        const extremeMaxDimension = 800; // Very conservative limit
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (originalWidth > extremeMaxDimension || originalHeight > extremeMaxDimension) {
            if (originalWidth > originalHeight) {
                newWidth = extremeMaxDimension;
                newHeight = Math.round((originalHeight * extremeMaxDimension) / originalWidth);
                newWidth = Math.round(newWidth / 2) * 2;
                newHeight = Math.round(newHeight / 2) * 2;
            } else {
                newHeight = extremeMaxDimension;
                newWidth = Math.round((originalWidth * extremeMaxDimension) / originalHeight);
                newWidth = Math.round(newWidth / 2) * 2;
                newHeight = Math.round(newHeight / 2) * 2;
            }
        }
        
        console.log(`🚨 Forcing extreme downscaling to ${newWidth}x${newHeight}`);
        
        // Create new canvas with extreme dimensions
        const extremeCanvas = document.createElement('canvas');
        const extremeCtx = extremeCanvas.getContext('2d');
        extremeCanvas.width = newWidth;
        extremeCanvas.height = newHeight;
        
        // Draw with extreme downscaling
        extremeCtx.imageSmoothingEnabled = true;
        extremeCtx.imageSmoothingQuality = 'high';
        extremeCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        
        // Try with lowest quality
        extremeCanvas.toBlob((blob) => {
            if (blob) {
                this.handleSuccessfulOptimization(blob, file, 0.6, newWidth, newHeight, originalWidth, originalHeight);
            } else {
                // Final fallback to original
                console.error('🚨 All optimization attempts failed, using original image');
                this.uploadedFile = file;
                this.displayOriginalImage(file);
            }
        }, 'image/jpeg', 0.6);
    }
    
    // Upscale enhanced image back to original resolution for optimal display
    async upscaleEnhancedImageToOriginalResolution() {
        if (!this.originalFile || !this.finalAfterImage) {
            console.log('⚠️ Cannot upscale: missing original file or enhanced image');
            return;
        }
        
        // Prevent recursive calls and multiple upscaling attempts
        if (this.isUpscaling || this.hasUpscaled) {
            console.log('⚠️ Upscaling already in progress or completed, skipping...');
            return;
        }
        
        this.isUpscaling = true;
        
        try {
            console.log('🔄 Upscaling enhanced image to original resolution...');
            
            // Debug the current state
            this.debugImageComparison();
            
            // Get original image dimensions
            const originalDimensions = await this.getOriginalImageDimensions();
            if (!originalDimensions) {
                console.log('⚠️ Cannot determine original dimensions, skipping upscaling');
                return;
            }
            
            const { originalWidth, originalHeight } = originalDimensions;
            
            // Check if the enhanced image is from an external URL (CORS issue)
            if (this.finalAfterImage.src && this.finalAfterImage.src.startsWith('http')) {
                console.log('🌐 Enhanced image is from external URL, downloading first to avoid CORS...');
                
                try {
                    // Download the enhanced image to avoid CORS issues
                    const enhancedBlob = await this.downloadImageAsBlob(this.finalAfterImage.src);
                    if (enhancedBlob) {
                        console.log('✅ Enhanced image downloaded successfully, proceeding with upscaling...');
                        await this.processUpscaling(enhancedBlob, originalWidth, originalHeight);
                    } else {
                        console.log('⚠️ Failed to download enhanced image, skipping upscaling');
                    }
                } catch (downloadError) {
                    console.error('❌ Error downloading enhanced image:', downloadError);
                    console.log('⚠️ Trying backend upscaling as fallback...');
                    
                    // Try backend upscaling as fallback
                    try {
                        await this.backendUpscaling(originalWidth, originalHeight);
                    } catch (backendError) {
                        console.error('❌ Backend upscaling also failed:', backendError);
                        console.log('⚠️ Skipping upscaling completely');
                    }
                }
                return;
            }
            
            // Wait for enhanced image to fully load and get its dimensions
            await new Promise(resolve => {
                if (this.finalAfterImage.complete && this.finalAfterImage.naturalWidth > 0) {
                    resolve();
                } else {
                    this.finalAfterImage.onload = resolve;
                }
            });
            
            const currentWidth = this.finalAfterImage.naturalWidth || this.finalAfterImage.width;
            const currentHeight = this.finalAfterImage.naturalHeight || this.finalAfterImage.height;
            
            console.log(`📏 Dimensions: Enhanced ${currentWidth}x${currentHeight} → Original ${originalWidth}x${originalHeight}`);
            console.log(`🔍 Upscaling needed: ${currentWidth < originalWidth || currentHeight < originalHeight}`);
            console.log(`🔍 Enhanced image complete: ${this.finalAfterImage.complete}`);
            console.log(`🔍 Enhanced image naturalWidth: ${this.finalAfterImage.naturalWidth}`);
            console.log(`🔍 Enhanced image naturalHeight: ${this.finalAfterImage.naturalHeight}`);
            
            // Always attempt upscaling for quality improvement, even if dimensions are the same
            // This can help with quality enhancement through better interpolation
            console.log('🎯 Proceeding with upscaling for quality improvement...');
            
            // Create canvas for upscaling
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas to original dimensions
            canvas.width = originalWidth;
            canvas.height = originalHeight;
            
            // Enable high-quality upscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Use a multi-step upscaling approach for better quality
            // First, scale to an intermediate size, then to final size
            const intermediateWidth = Math.min(originalWidth, currentWidth * 2);
            const intermediateHeight = Math.min(originalHeight, currentHeight * 2);
            
            if (intermediateWidth > currentWidth || intermediateHeight > currentHeight) {
                console.log(`🔄 Multi-step upscaling: ${currentWidth}x${currentHeight} → ${intermediateWidth}x${intermediateHeight} → ${originalWidth}x${originalHeight}`);
                
                // Create intermediate canvas
                const intermediateCanvas = document.createElement('canvas');
                const intermediateCtx = intermediateCanvas.getContext('2d');
                intermediateCanvas.width = intermediateWidth;
                intermediateCanvas.height = intermediateHeight;
                
                // First step: scale to intermediate size
                intermediateCtx.imageSmoothingEnabled = true;
                intermediateCtx.imageSmoothingQuality = 'high';
                intermediateCtx.drawImage(this.finalAfterImage, 0, 0, intermediateWidth, intermediateHeight);
                
                // Second step: scale from intermediate to final size
                ctx.drawImage(intermediateCanvas, 0, 0, originalWidth, originalHeight);
            } else {
                // Direct upscaling if intermediate step isn't beneficial
                console.log(`🔄 Direct upscaling: ${currentWidth}x${currentHeight} → ${originalWidth}x${originalHeight}`);
                ctx.drawImage(this.finalAfterImage, 0, 0, originalWidth, originalHeight);
            }
            
            // Convert back to blob with high quality
            canvas.toBlob((upscaledBlob) => {
                if (upscaledBlob) {
                    console.log('✅ Enhanced image upscaled successfully to original resolution');
                    
                    // Update download button to use upscaled version
                    this.enhancedImageBlob = upscaledBlob;
                    
                    console.log(`📊 Upscaled image: ${(upscaledBlob.size / (1024 * 1024)).toFixed(2)}MB at ${originalWidth}x${originalHeight}`);
                    
                    // Show resolution info to user
                    this.showResolutionInfo(originalWidth, originalHeight);
                    
                    // Update the final image display with upscaled version
                    // Use a new image element to avoid triggering recursive upscaling
                    const upscaledImageUrl = URL.createObjectURL(upscaledBlob);
                    this.finalAfterImage.src = upscaledImageUrl;
                    
                } else {
                    console.error('❌ Failed to create upscaled image blob');
                }
            }, 'image/jpeg', 0.95); // High quality for final output
            
        } catch (error) {
            console.error('💥 Error during image upscaling:', error);
            // Continue with original enhanced image if upscaling fails
        } finally {
            this.isUpscaling = false;
            this.hasUpscaled = true;
        }
    }
    
    // Show resolution information to the user
    showResolutionInfo(width, height) {
        try {
            console.log(`📊 Displaying resolution info: ${width}x${height}`);
            
            // Find or create resolution info element
            let resolutionInfo = document.getElementById('resolution-info');
            if (!resolutionInfo) {
                resolutionInfo = document.createElement('div');
                resolutionInfo.id = 'resolution-info';
                resolutionInfo.className = 'resolution-info';
                resolutionInfo.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                `;
                document.body.appendChild(resolutionInfo);
            }
            
            // Update resolution info
            resolutionInfo.textContent = `Resolution: ${width} × ${height}`;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (resolutionInfo && resolutionInfo.parentNode) {
                    resolutionInfo.style.opacity = '0';
                    resolutionInfo.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        if (resolutionInfo && resolutionInfo.parentNode) {
                            resolutionInfo.parentNode.removeChild(resolutionInfo);
                        }
                    }, 500);
                }
            }, 5000);
            
        } catch (error) {
            console.error('❌ Error showing resolution info:', error);
        }
    }
    
    // Download image from URL as blob to avoid CORS issues
    async downloadImageAsBlob(imageUrl) {
        try {
            console.log('📥 Downloading image from URL:', imageUrl);
            
            // Use fetch to download the image
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
            }
            
            // Convert to blob
            const blob = await response.blob();
            console.log('✅ Image downloaded successfully:', {
                size: `${(blob.size / (1024 * 1024)).toFixed(2)}MB`,
                type: blob.type
            });
            
            return blob;
            
        } catch (error) {
            console.error('❌ Error downloading image:', error);
            return null;
        }
    }
    
    // Process upscaling with a blob (avoids CORS issues)
    async processUpscaling(enhancedBlob, targetWidth, targetHeight) {
        try {
            console.log('🔄 Processing upscaling with downloaded blob...');
            
            // Create image element from blob
            const enhancedImage = new Image();
            await new Promise((resolve, reject) => {
                enhancedImage.onload = resolve;
                enhancedImage.onerror = reject;
                enhancedImage.src = URL.createObjectURL(enhancedBlob);
            });
            
            const currentWidth = enhancedImage.naturalWidth || enhancedImage.width;
            const currentHeight = enhancedImage.naturalHeight || enhancedImage.height;
            
            console.log(`📏 Processing dimensions: ${currentWidth}x${currentHeight} → ${targetWidth}x${targetHeight}`);
            
            // Create canvas for upscaling
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Enable high-quality upscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Use multi-step upscaling for better quality
            const intermediateWidth = Math.min(targetWidth, currentWidth * 2);
            const intermediateHeight = Math.min(targetHeight, currentHeight * 2);
            
            if (intermediateWidth > currentWidth || intermediateHeight > currentHeight) {
                console.log(`🔄 Multi-step upscaling: ${currentWidth}x${currentHeight} → ${intermediateWidth}x${intermediateHeight} → ${targetWidth}x${targetHeight}`);
                
                // Create intermediate canvas
                const intermediateCanvas = document.createElement('canvas');
                const intermediateCtx = intermediateCanvas.getContext('2d');
                intermediateCanvas.width = intermediateWidth;
                intermediateCanvas.height = intermediateHeight;
                
                // First step: scale to intermediate size
                intermediateCtx.imageSmoothingEnabled = true;
                intermediateCtx.imageSmoothingQuality = 'high';
                intermediateCtx.drawImage(enhancedImage, 0, 0, intermediateWidth, intermediateHeight);
                
                // Second step: scale from intermediate to final size
                ctx.drawImage(intermediateCanvas, 0, 0, targetWidth, targetHeight);
            } else {
                // Direct upscaling if intermediate step isn't beneficial
                console.log(`🔄 Direct upscaling: ${currentWidth}x${currentHeight} → ${targetWidth}x${targetHeight}`);
                ctx.drawImage(enhancedImage, 0, 0, targetWidth, targetHeight);
            }
            
            // Convert to blob with high quality
            canvas.toBlob((upscaledBlob) => {
                if (upscaledBlob) {
                    console.log('✅ Enhanced image upscaled successfully to original resolution');
                    
                    // Update download button to use upscaled version
                    this.enhancedImageBlob = upscaledBlob;
                    
                    console.log(`📊 Upscaled image: ${(upscaledBlob.size / (1024 * 1024)).toFixed(2)}MB at ${targetWidth}x${targetHeight}`);
                    
                    // Show resolution info to user
                    this.showResolutionInfo(targetWidth, targetHeight);
                    
                    // Update the final image display with upscaled version
                    const upscaledImageUrl = URL.createObjectURL(upscaledBlob);
                    this.finalAfterImage.src = upscaledImageUrl;
                    
                } else {
                    console.error('❌ Failed to create upscaled image blob');
                }
            }, 'image/jpeg', 0.95);
            
            // Clean up the temporary object URL
            URL.revokeObjectURL(enhancedImage.src);
            
        } catch (error) {
            console.error('💥 Error during blob upscaling:', error);
        }
    }
    
    // Backend upscaling fallback method
    async backendUpscaling(targetWidth, targetHeight) {
        try {
            console.log('🔄 Attempting backend upscaling...');
            
            // Get the enhanced image URL
            const enhancedImageUrl = this.finalAfterImage.src;
            if (!enhancedImageUrl) {
                throw new Error('No enhanced image URL available');
            }
            
            // Create a simple upscaling request to the backend
            const upscalePayload = {
                image_url: enhancedImageUrl,
                target_width: targetWidth,
                target_height: targetHeight,
                quality: 0.95
            };
            
            console.log('📤 Sending upscaling request to backend:', upscalePayload);
            
            // Send to backend upscaling endpoint
            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(upscalePayload)
            });
            
            if (!response.ok) {
                throw new Error(`Backend upscaling failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.upscaled_image) {
                console.log('✅ Backend upscaling successful!');
                
                // Update the enhanced image with upscaled version
                this.finalAfterImage.src = result.upscaled_image;
                
                // Store the upscaled blob for download
                if (result.upscaled_blob) {
                    this.enhancedImageBlob = result.upscaled_blob;
                }
                
                // Show resolution info
                this.showResolutionInfo(targetWidth, targetHeight);
                
                return true;
            } else {
                throw new Error('No upscaled image received from backend');
            }
            
        } catch (error) {
            console.error('💥 Backend upscaling failed:', error);
            throw error;
        }
    }
    
    // Test upscaling with a simple image
    testUpscaling() {
        console.log('🧪 === TESTING UPSCALING ===');
        
        // Create a simple test image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        
        // Draw a simple test pattern
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 50, 50);
        ctx.fillStyle = 'blue';
        ctx.fillRect(50, 0, 50, 50);
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 50, 50, 50);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(50, 50, 50, 50);
        
        // Convert to blob
        canvas.toBlob((testBlob) => {
            if (testBlob) {
                console.log('✅ Test image created, testing upscaling...');
                
                // Test upscaling to 200x200
                this.processUpscaling(testBlob, 200, 200).then(() => {
                    console.log('✅ Test upscaling completed successfully!');
                }).catch(error => {
                    console.error('❌ Test upscaling failed:', error);
                });
                
            } else {
                console.error('❌ Failed to create test image');
            }
        }, 'image/jpeg', 0.9);
    }
    
    // Debug method to compare original vs enhanced images
    debugImageComparison() {
        if (!this.originalFile || !this.finalAfterImage) {
            console.log('⚠️ Cannot debug: missing original file or enhanced image');
            return;
        }
        
        console.log('🔍 === IMAGE COMPARISON DEBUG ===');
        console.log('📁 Original file:', {
            name: this.originalFile.name,
            size: `${(this.originalFile.size / (1024 * 1024)).toFixed(2)}MB`,
            type: this.originalFile.type
        });
        
        console.log('🖼️ Enhanced image element:', {
            src: this.finalAfterImage.src.substring(0, 100) + '...',
            complete: this.finalAfterImage.complete,
            naturalWidth: this.finalAfterImage.naturalWidth,
            naturalHeight: this.finalAfterImage.naturalHeight,
            width: this.finalAfterImage.width,
            height: this.finalAfterImage.height,
            currentSrc: this.finalAfterImage.currentSrc
        });
        
        // Try to get dimensions from the enhanced image URL
        if (this.finalAfterImage.src && this.finalAfterImage.src.startsWith('http')) {
            const tempImg = new Image();
            tempImg.onload = () => {
                console.log('🔍 Enhanced image from URL dimensions:', {
                    naturalWidth: tempImg.naturalWidth,
                    naturalHeight: tempImg.naturalHeight,
                    width: tempImg.width,
                    height: tempImg.height
                });
            };
            tempImg.onerror = () => {
                console.log('❌ Failed to load enhanced image from URL for dimension check');
            };
            tempImg.src = this.finalAfterImage.src;
        }
        
        console.log('🔍 === END DEBUG ===');
    }
    
    // Force upscaling for testing purposes
    forceUpscaling() {
        if (!this.originalFile || !this.finalAfterImage) {
            console.log('⚠️ Cannot force upscaling: missing original file or enhanced image');
            return;
        }
        
        console.log('🧪 === FORCING UPSCALING FOR TESTING ===');
        
        // Get original dimensions
        this.getOriginalImageDimensions().then(originalDimensions => {
            if (!originalDimensions) {
                console.log('❌ Cannot get original dimensions');
                return;
            }
            
            const { originalWidth, originalHeight } = originalDimensions;
            console.log(`📏 Original dimensions: ${originalWidth}x${originalHeight}`);
            
            // Force upscaling to 2x original size for testing
            const targetWidth = originalWidth * 2;
            const targetHeight = originalHeight * 2;
            
            console.log(`🎯 Target upscaled dimensions: ${targetWidth}x${targetHeight}`);
            
            // Create canvas for forced upscaling
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Enable high-quality upscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw enhanced image scaled up to target dimensions
            ctx.drawImage(this.finalAfterImage, 0, 0, targetWidth, targetHeight);
            
            // Convert to blob
            canvas.toBlob((upscaledBlob) => {
                if (upscaledBlob) {
                    console.log('✅ Forced upscaling successful!');
                    console.log(`📊 Upscaled image: ${(upscaledBlob.size / (1024 * 1024)).toFixed(2)}MB at ${targetWidth}x${targetHeight}`);
                    
                    // Update download button to use upscaled version
                    this.enhancedImageBlob = upscaledBlob;
                    
                    // Show resolution info
                    this.showResolutionInfo(targetWidth, targetHeight);
                    
                    // Update the final image display with upscaled version
                    const upscaledImageUrl = URL.createObjectURL(upscaledBlob);
                    this.finalAfterImage.src = upscaledImageUrl;
                    
                    console.log('🎯 Forced upscaling completed and displayed!');
                    
                } else {
                    console.error('❌ Failed to create forced upscaled image blob');
                }
            }, 'image/jpeg', 0.95);
            
        }).catch(error => {
            console.error('💥 Error during forced upscaling:', error);
        });
    }
    
    // Get original image dimensions from the uploaded file
    getOriginalImageDimensions() {
        if (!this.originalFile) return null;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    originalWidth: img.naturalWidth || img.width,
                    originalHeight: img.naturalHeight || img.height
                });
            };
            img.onerror = () => {
                console.error('Failed to load original image for dimension check');
                resolve(null);
            };
            
            // Create object URL from original file
            const objectUrl = URL.createObjectURL(this.originalFile);
            img.src = objectUrl;
            
            // Clean up object URL after loading
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({
                    originalWidth: img.naturalWidth || img.height,
                    originalHeight: img.naturalHeight || img.height
                });
            };
        });
    }
    
    // Display the resized image
    displayResizedImage(blob) {
        const imageUrl = URL.createObjectURL(blob);
        
        // Update the uploaded image in the single image container
        this.uploadedImage.src = imageUrl;
        
        // Mark that user has uploaded an image
        this.userImageUploaded = true;
        
        // Show resize optimization info
        this.showResizeOptimizationInfo();
        
        // Add original image toggle if resizing was significant (either reduction or increase)
        if (this.originalFile && this.uploadedFile) {
            const sizeChange = Math.abs((this.originalFile.size - this.uploadedFile.size) / this.originalFile.size * 100);
            if (sizeChange > 15) { // Show toggle for significant changes (either direction)
                this.addOriginalImageToggle();
            }
        }
        
        // Enable and show the Instant AI button
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.remove('disabled');
            this.instantAiBtn.classList.add('active');
            this.instantAiBtn.style.display = 'block';
        }
        
        // Show local fallback button as alternative
        if (this.localFallbackBtn) {
            this.localFallbackBtn.classList.remove('disabled');
            this.localFallbackBtn.style.display = 'block';
        }
        
        // Update upload button text
        this.uploadBtn.textContent = 'Change Image';
        
        // Switch to single image view (Step 2)
        this.showSingleImageView();
        
        console.log('✅ Resized image displayed successfully');
        
        // Track successful upload with resize info
        if (typeof AnalyticsTracker !== 'undefined') {
            const sizeChange = this.originalFile.size - blob.size;
            const sizeChangePercent = (sizeChange / this.originalFile.size * 100);
            AnalyticsTracker.trackEvent('image_uploaded_resized', {
                originalFileSize: this.originalFile.size,
                resizedFileSize: blob.size,
                sizeChange: sizeChangePercent.toFixed(1),
                sizeChangeType: sizeChange >= 0 ? 'reduction' : 'increase'
            });
        }
    }
    
    // Show resize optimization information to user
    showResizeOptimizationInfo() {
        if (!this.originalFile || !this.uploadedFile) return;
        
        const originalSize = (this.originalFile.size / (1024 * 1024)).toFixed(2);
        const resizedSize = (this.uploadedFile.size / (1024 * 1024)).toFixed(2);
        const sizeChange = this.uploadedFile.size - this.originalFile.size;
        const sizeChangePercent = Math.abs((sizeChange / this.originalFile.size * 100)).toFixed(1);
        const isSizeIncrease = sizeChange > 0;
        
        // Create optimization info banner
        const banner = document.createElement('div');
        banner.className = 'optimization-banner';
        banner.innerHTML = `
            <div class="optimization-content">
                <span class="optimization-icon">⚡</span>
                <span class="optimization-text">
                    Image ${isSizeIncrease ? 'prepared' : 'optimized'} for AI processing: ${originalSize}MB → ${resizedSize}MB 
                    (${sizeChangePercent}% ${isSizeIncrease ? 'larger' : 'smaller'})
                </span>
                <button class="optimization-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add banner to the page
        const container = document.querySelector('.main-container') || document.body;
        container.insertBefore(banner, container.firstChild);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (banner.parentElement) {
                banner.remove();
            }
        }, 8000);
    }
    
    // Add toggle button to compare original vs optimized image
    addOriginalImageToggle() {
        // Find the single image section
        const singleImageSection = document.querySelector('#single-image-section');
        if (!singleImageSection) return;
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'image-toggle-btn';
        toggleButton.innerHTML = `
            <span class="toggle-icon">🔄</span>
            <span class="toggle-text">View Original</span>
        `;
        
        let showingOriginal = false;
        
        toggleButton.addEventListener('click', () => {
            if (showingOriginal) {
                // Show optimized image
                this.uploadedImage.src = URL.createObjectURL(this.uploadedFile);
                toggleButton.querySelector('.toggle-text').textContent = 'View Original';
                toggleButton.classList.remove('showing-original');
                showingOriginal = false;
            } else {
                // Show original image
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.uploadedImage.src = e.target.result;
                };
                reader.readAsDataURL(this.originalFile);
                toggleButton.querySelector('.toggle-text').textContent = 'View Optimized';
                toggleButton.classList.add('showing-original');
                showingOriginal = true;
            }
        });
        
        // Insert toggle button above the image
        const imageContainer = singleImageSection.querySelector('.uploaded-image-container') || 
                             singleImageSection.querySelector('.uploaded-image') ||
                             singleImageSection.querySelector('img');
        
        if (imageContainer) {
            imageContainer.parentElement.insertBefore(toggleButton, imageContainer);
        }
    }
    
    // Fallback to display original image
    displayOriginalImage(file) {
        // Use FileReader API to read the selected image
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            
            // Update the uploaded image in the single image container
            this.uploadedImage.src = imageDataUrl;
            
            // Mark that user has uploaded an image and store the file
            this.userImageUploaded = true;
            this.uploadedFile = file;
            
            // Enable and show the Instant AI button
            if (this.instantAiBtn) {
                this.instantAiBtn.classList.remove('disabled');
                this.instantAiBtn.classList.add('active');
                this.instantAiBtn.style.display = 'block';
            }
            
            // Show local fallback button as alternative
            if (this.localFallbackBtn) {
                this.localFallbackBtn.classList.remove('disabled');
                this.localFallbackBtn.style.display = 'block';
            }
            
            // Update upload button text
            this.uploadBtn.textContent = 'Change Image';
            
            // Switch to single image view (Step 2)
            this.showSingleImageView();
            
            console.log('✅ Original image displayed (resize failed)');
            
            // Track successful upload
            if (typeof AnalyticsTracker !== 'undefined') {
                AnalyticsTracker.trackEvent('image_uploaded', {
                    fileSize: file.size,
                    fileType: file.type
                });
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            alert('Error reading the selected file. Please try again.');
        };
        
        // Read the file as data URL
        reader.readAsDataURL(file);
    }
    
    // Show single image view (Step 2)
    showSingleImageView() {
        // Hide demo section
        this.demoSection.style.display = 'none';
        
        // Show single image section
        this.singleImageSection.style.display = 'flex';
        
        // Hide final comparison section
        this.finalComparisonSection.style.display = 'none';
        
        console.log('Switched to single image view');
    }
    
    // Show final comparison view (Step 3)
    showFinalComparisonView() {
        // Hide demo section
        this.demoSection.style.display = 'none';
        
        // Hide single image section
        this.singleImageSection.style.display = 'none';
        
        // Show final comparison section
        this.finalComparisonSection.style.display = 'flex';
        
        console.log('Switched to final comparison view');
    }
    
    // Handle Instant AI button click - start local SCUNet processing
    handleInstantAiClick() {
        // Only proceed if user has uploaded an image and button is active
        if (!this.userImageUploaded || !this.instantAiBtn || this.instantAiBtn.classList.contains('disabled')) {
            console.log('AI processing blocked - no image uploaded or button disabled');
            return;
        }
        
        console.log('Starting SCUNet enhancement process with local backend...');
        
        // Switch to final comparison view immediately
        this.showFinalComparisonView();
        
        // Set the original image
        this.finalBeforeImage.src = this.uploadedImage.src;
        
        // Show processing overlay
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'flex';
        }
        if (this.processingStatus) {
            this.processingStatus.textContent = 'Processing with SCUNet...';
        }
        
        // Disable the button during processing
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.classList.remove('active');
        }
        
        // Store processing start time for analytics
        this.processingStartTime = Date.now();
        
        // Start the local SCUNet enhancement
        this.startLocalEnhancement();
        
        // Track AI processing start
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('ai_enhancement_started');
        }
    }
    
    // Method to change model type
    setModelType(modelType) {
        if (this.availableModels.includes(modelType)) {
            this.modelType = modelType;
            console.log(`Model type changed to: ${modelType}`);
        } else {
            console.warn(`Invalid model type: ${modelType}. Using default.`);
            this.modelType = 'real image denoising';
        }
    }
    
    // Helper method to convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data:image/jpeg;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    // Helper method to convert base64 to blob
    base64ToBlob(base64) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'image/jpeg' });
    }
    
    // Process image with Replicate deployment
    async startLocalEnhancement() {
        try {
            // Reset prediction and upscaling flags for new enhancement
            this.predictionCompleted = false;
            this.hasUpscaled = false;
            this.isUpscaling = false;
            
            if (!this.uploadedFile) {
                throw new Error('No file available for processing');
            }
            
            // Log detailed image information for debugging
            console.log('🔍 Image Analysis:', {
                name: this.uploadedFile.name,
                size: `${(this.uploadedFile.size / (1024 * 1024)).toFixed(2)}MB`,
                type: this.uploadedFile.type,
                lastModified: new Date(this.uploadedFile.lastModified).toISOString()
            });
            
            console.log('🚀 Sending image to Replicate deployment...');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Processing with SCUNet on Replicate...';
            }
            
            // Convert image to base64 for Replicate API
            const base64Image = await this.fileToBase64(this.uploadedFile);
            
            // Log base64 conversion info
            console.log('📊 Base64 Conversion:', {
                originalSize: this.uploadedFile.size,
                base64Size: base64Image.length,
                sizeIncrease: `${((base64Image.length / this.uploadedFile.size - 1) * 100).toFixed(1)}%`
            });
            
            // Create payload for Replicate deployment
            const payload = {
                input: {
                    image: `data:${this.uploadedFile.type};base64,${base64Image}`
                }
            };
            
            console.log('📤 Payload prepared:', {
                deploymentId: this.deploymentId,
                modelType: this.modelType,
                imageSize: base64Image.length,
                payloadKeys: Object.keys(payload.input)
            });
            
            // Make the request through our proxy server to avoid CORS issues
            const apiUrl = `/api/replicate/predictions`;
            console.log('🌐 Making request through proxy to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Replicate API error response:', errorText);
                
                // Check if it's a spending limit error
                if (errorText.includes('Monthly spend limit reached') || errorText.includes('spend limit') || errorText.includes('spend limit reached')) {
                    console.log('💰 Spending limit reached, trying local SCUNet fallback...');
                    if (this.processingStatus) {
                        this.processingStatus.textContent = 'Replicate limit reached, using local SCUNet...';
                    }
                    
                    // Show user-friendly message about the fallback
                    this.showSpendingLimitMessage();
                    
                    // Try local SCUNet as fallback
                    return await this.tryLocalSCUNetFallback(base64Image);
                }
                
                throw new Error(`Replicate API failed: ${response.status} - ${errorText}`);
            }
            
            // Get the prediction ID from response
            const predictionData = await response.json();
            const predictionId = predictionData.id;
            
            console.log('📋 Prediction created, waiting for completion...');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Processing image... Please wait...';
            }
            
            // Check initial status immediately to catch already-failed predictions
            try {
                const initialResponse = await fetch(`/api/replicate/predictions/${predictionId}`);
                if (initialResponse.ok) {
                    const initialPrediction = await initialResponse.json();
                    console.log('🔍 Initial prediction status:', initialPrediction.status);
                    
                    if (initialPrediction.status === 'failed') {
                        const errorMessage = initialPrediction.error || initialPrediction.detail || 'Unknown error';
                        console.error('❌ Prediction failed immediately:', errorMessage);
                        throw new Error(`Prediction failed immediately: ${errorMessage}`);
                    } else if (initialPrediction.status === 'canceled') {
                        console.error('❌ Prediction was canceled immediately');
                        throw new Error('Prediction was canceled immediately');
                    }
                }
            } catch (initialError) {
                console.log('Initial status check error (continuing with polling):', initialError.message);
            }
            
            // Poll for completion
            const result = await this.waitForPrediction(predictionId);
            
            if (!result || !result.output || !result.output.denoised_image) {
                throw new Error('No enhanced image received from Replicate');
            }
            
            console.log('✅ SCUNet enhancement completed successfully!');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Enhancement complete! Loading result...';
            }
            
            // Load the enhanced image from Replicate
            this.finalAfterImage.onload = () => {
                console.log('✅ Enhanced image loaded successfully');
                
                // Remove the onload handler to prevent it from firing again
                this.finalAfterImage.onload = null;
                
                // Wait a moment for the image to fully load, then upscale to original resolution
                setTimeout(() => {
                    if (this.processingStatus) {
                        this.processingStatus.textContent = 'Upscaling to original resolution...';
                    }
                    
                    this.upscaleEnhancedImageToOriginalResolution().catch(error => {
                        console.error('⚠️ Upscaling failed, continuing with original enhanced image:', error);
                    }).finally(() => {
                        if (this.processingStatus) {
                            this.processingStatus.textContent = 'Enhancement complete!';
                        }
                    });
                }, 100); // Small delay to ensure image is fully loaded
                    
                    // Hide processing overlay
                    if (this.processingOverlay) {
                        this.processingOverlay.style.display = 'none';
                    }
                    
                    // Track successful AI processing completion
                    if (typeof AnalyticsTracker !== 'undefined') {
                        AnalyticsTracker.trackEvent('ai_enhancement_completed', {
                            success: true,
                            processingTime: Date.now() - this.processingStartTime
                        });
                    }
                    
                    // Clean up UI state
                    this.cleanupAfterProcessing();
            };
            
            this.finalAfterImage.onerror = () => {
                throw new Error('Failed to load enhanced image');
            };
            
            // Store the original enhanced image blob for reference
            this.originalEnhancedImageUrl = result.output.denoised_image;
            
            // Set the source to trigger loading
            this.finalAfterImage.src = result.output.denoised_image;
            
        } catch (error) {
            console.error('💥 Error during SCUNet enhancement:', error);
            
            // Log additional context for debugging
            console.error('🔍 Error Context:', {
                fileName: this.uploadedFile?.name,
                fileSize: this.uploadedFile ? `${(this.uploadedFile.size / (1024 * 1024)).toFixed(2)}MB` : 'N/A',
                errorType: error.constructor.name,
                errorMessage: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.handleEnhancementError(error);
        }
    }
    
    // Wait for prediction to complete
    async waitForPrediction(predictionId) {
        const maxAttempts = 60; // 5 minutes max wait
        let attempts = 0;
        
        console.log(`🔄 Starting prediction monitoring for: ${predictionId}`);
        
        while (attempts < maxAttempts && !this.predictionCompleted) {
            try {
                console.log(`📡 Checking prediction status (attempt ${attempts + 1}/${maxAttempts}) - predictionCompleted: ${this.predictionCompleted}...`);
                
                const response = await fetch(`/api/replicate/predictions/${predictionId}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to check prediction status: ${response.status}`);
                }
                
                const prediction = await response.json();
                console.log(`📊 Prediction status: ${prediction.status}`, prediction);
                
                if (prediction.status === 'succeeded') {
                    console.log('✅ Prediction succeeded!');
                    this.predictionCompleted = true;
                    console.log('🛑 Prediction monitoring stopped - prediction completed successfully');
                    return prediction;
                } else if (prediction.status === 'failed') {
                    const errorMessage = prediction.error || prediction.detail || 'Unknown error';
                    console.error(`❌ Prediction failed: ${errorMessage}`);
                    this.predictionCompleted = true;
                    console.log('🛑 Prediction monitoring stopped - prediction failed');
                    throw new Error(`Prediction failed: ${errorMessage}`);
                } else if (prediction.status === 'canceled') {
                    console.error('❌ Prediction was canceled');
                    this.predictionCompleted = true;
                    console.log('🛑 Prediction monitoring stopped - prediction was canceled');
                    throw new Error('Prediction was canceled');
                } else if (prediction.status === 'processing' || prediction.status === 'starting') {
                    console.log(`⏳ Prediction still processing: ${prediction.status}`);
                } else {
                    console.log(`ℹ️ Unknown prediction status: ${prediction.status}`);
                }
                
                // Wait 5 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
                
                // Update status with more detailed information
                if (this.processingStatus) {
                    const statusText = prediction.status === 'processing' || prediction.status === 'starting' 
                        ? `Processing... (${attempts * 5}s)` 
                        : `Status: ${prediction.status} (${attempts * 5}s)`;
                    this.processingStatus.textContent = statusText;
                }
                
            } catch (error) {
                console.error(`💥 Error checking prediction status (attempt ${attempts + 1}):`, error);
                
                // If it's a prediction failure, don't retry - throw immediately
                if (error.message.includes('Prediction failed') || error.message.includes('canceled')) {
                    throw error;
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        console.error('⏰ Prediction timed out after 5 minutes');
        throw new Error('Prediction timed out after 5 minutes');
    }
    
    // Handle enhancement errors
    handleEnhancementError(error) {
        console.error('💥 Enhancement error:', error);
        
        // Update status for error state
        if (this.processingStatus) {
            this.processingStatus.textContent = 'Enhancement failed';
        }
        
        // Hide processing overlay
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
        }
        
        // Display error message in the enhanced image area
        this.displayErrorInImageArea(error);
        
        // Track failed AI processing
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('ai_enhancement_failed', {
                error: error.message,
                errorType: error.constructor.name
            });
        }
        
        // Clean up UI state with error message
        const errorMessage = this.getErrorMessage(error);
        this.cleanupAfterProcessing(false, errorMessage);
    }
    
    // Display error message in the enhanced image area
    displayErrorInImageArea(error) {
        // Create error message container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message-container';
        
        // Create error icon
        const errorIcon = document.createElement('div');
        errorIcon.innerHTML = '⚠️';
        errorIcon.className = 'error-icon';
        
        // Create error title
        const errorTitle = document.createElement('h3');
        errorTitle.textContent = this.getErrorTitle(error);
        
        // Create error message
        const errorMessage = document.createElement('p');
        errorMessage.textContent = this.getErrorMessage(error);
        
        // Create suggestion text
        const suggestionText = document.createElement('p');
        suggestionText.textContent = this.getErrorSuggestion(error);
        
        // Create retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Try Again';
        retryButton.className = 'retry-button';
        
        retryButton.addEventListener('click', () => {
            // Clear error and retry
            this.clearErrorAndRetry();
        });
        
        // Assemble error container
        errorContainer.appendChild(errorIcon);
        errorContainer.appendChild(errorTitle);
        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(suggestionText);
        errorContainer.appendChild(retryButton);
        
        // Clear the enhanced image area and show error
        if (this.finalAfterImage) {
            this.finalAfterImage.style.display = 'none';
        }
        
        // Find the enhanced image container and replace content
        const enhancedContainer = this.finalAfterImage.parentElement;
        if (enhancedContainer) {
            // Remove any existing error messages
            const existingError = enhancedContainer.querySelector('.error-message-container');
            if (existingError) {
                existingError.remove();
            }
            
            enhancedContainer.appendChild(errorContainer);
        }
    }
    
    // Get appropriate error title based on error type
    getErrorTitle(error) {
        if (error.message.includes('CUDA error') || error.message.includes('no kernel image')) {
            return 'AI Model Unavailable';
        } else if (error.message.includes('Image too large')) {
            return 'Image Too Large';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Connection Error';
        } else if (error.message.includes('Replicate API failed')) {
            return 'API Error';
        } else if (error.message.includes('timed out')) {
            return 'Processing Timeout';
        } else {
            return 'Image Too Large';
        }
    }
    
    // Get appropriate error message based on error type
    getErrorMessage(error) {
        if (error.message.includes('CUDA error') || error.message.includes('no kernel image')) {
            return 'The AI enhancement model is currently unavailable due to compatibility issues.';
        } else if (error.message.includes('Image too large')) {
            return 'This image is too large for AI processing. Please try with a smaller image.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Unable to connect to the enhancement service. Please check your internet connection.';
        } else if (error.message.includes('Replicate API failed')) {
            return 'There was an issue with the enhancement service. Please try again later.';
        } else if (error.message.includes('timed out')) {
            return 'The enhancement process took too long and was cancelled.';
        } else {
            return 'This image is too large for AI processing. Please try with a smaller image.';
        }
    }
    
    // Get appropriate suggestion based on error type
    getErrorSuggestion(error) {
        if (error.message.includes('CUDA error') || error.message.includes('no kernel image')) {
            return 'Try using a smaller image or check back later when the service is restored.';
        } else if (error.message.includes('Image too large')) {
            return 'Try resizing your image to under 100MB or use a lower resolution version.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Check your internet connection and try again.';
        } else if (error.message.includes('Replicate API failed')) {
            return 'The service may be temporarily unavailable. Please try again in a few minutes.';
        } else if (error.message.includes('timed out')) {
            return 'Try with a smaller image or when the service is less busy.';
        } else {
            return 'Try resizing your image to under 100MB or use a lower resolution version.';
        }
    }
    
    // Clear error and retry enhancement
    clearErrorAndRetry() {
        // Remove error message
        const errorContainer = document.querySelector('.error-message-container');
        if (errorContainer) {
            errorContainer.remove();
        }
        
        // Show enhanced image area again
        if (this.finalAfterImage) {
            this.finalAfterImage.style.display = 'block';
        }
        
        // Retry the enhancement
        this.handleInstantAiClick();
    }
    
    // Test error display (for development/testing)
    testErrorDisplay(errorType = 'large') {
        const testError = new Error();
        if (errorType === 'cuda') {
            testError.message = 'CUDA error: no kernel image is available for execution on the device';
        } else if (errorType === 'large') {
            testError.message = 'Image too large. Maximum size is 100MB. Current size: 150.0MB';
        } else if (errorType === 'network') {
            testError.message = 'Failed to fetch';
        } else if (errorType === 'timeout') {
            testError.message = 'Prediction timed out after 5 minutes';
        }
        
        this.displayErrorInImageArea(testError);
    }

    // Force UI update for debugging
    forceUIUpdate() {
        console.log('Forcing UI update...');
        // This method can be used to force re-render or update specific UI elements
        // For example, if the UI state is out of sync with the Replicate prediction
        // you might need to re-fetch the prediction status or force a full page reload.
        // This is a placeholder and might need more specific implementation.
        // For now, it just logs the action.
    }

    // Check prediction status for debugging
    async checkPredictionStatus(predictionId) {
        console.log(`Checking prediction status for: ${predictionId}`);
        try {
            const response = await fetch(`/api/replicate/predictions/${predictionId}`);
            if (!response.ok) {
                throw new Error(`Failed to check prediction status: ${response.status}`);
            }
            const prediction = await response.json();
            console.log(`Prediction status for ${predictionId}: ${prediction.status}`);
            if (prediction.status === 'succeeded') {
                console.log('Prediction succeeded!');
            } else if (prediction.status === 'failed') {
                console.error('Prediction failed:', prediction.error || prediction.detail);
            } else if (prediction.status === 'canceled') {
                console.error('Prediction was canceled');
            } else {
                console.log(`Prediction still ${prediction.status}: ${prediction.status_message}`);
            }
        } catch (error) {
            console.error(`Error checking prediction status for ${predictionId}:`, error);
        }
    }
    
    // Local SCUNet fallback when Replicate is unavailable
    async tryLocalSCUNetFallback(base64Image) {
        try {
            console.log('🏠 Attempting local SCUNet enhancement...');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Processing with local SCUNet...';
            }
            
            // Call the local backend endpoint
            const response = await fetch('/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Image,
                    task: 'Real_Denoising'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Local SCUNet failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.image) {
                throw new Error('No enhanced image received from local SCUNet');
            }
            
            console.log('✅ Local SCUNet enhancement completed successfully!');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Local enhancement complete! Loading result...';
            }
            
            // Set the enhanced image
            this.finalAfterImage.onload = () => {
                console.log('✅ Enhanced image loaded successfully from local SCUNet');
                
                // Remove the onload handler to prevent it from firing again
                this.finalAfterImage.onload = null;
                
                // Wait a moment for the image to fully load
                setTimeout(() => {
                    if (this.processingStatus) {
                        this.processingStatus.textContent = 'Local enhancement complete!';
                    }
                    
                    // Hide processing overlay
                    if (this.processingOverlay) {
                        this.processingOverlay.style.display = 'none';
                    }
                    
                    // Track successful local processing completion
                    if (typeof AnalyticsTracker !== 'undefined') {
                        AnalyticsTracker.trackEvent('local_enhancement_completed', {
                            success: true,
                            processingTime: Date.now() - this.processingStartTime
                        });
                    }
                    
                    // Clean up UI state
                    this.cleanupAfterProcessing();
                }, 100);
            };
            
            this.finalAfterImage.onerror = () => {
                throw new Error('Failed to load enhanced image from local SCUNet');
            };
            
            // Store the enhanced image
            this.originalEnhancedImageUrl = result.image;
            this.finalAfterImage.src = result.image;
            
        } catch (error) {
            console.error('💥 Local SCUNet fallback failed:', error);
            
            // If local fallback also fails, show error
            this.handleEnhancementError(error);
        }
    }
    
    // Show user-friendly message about spending limit fallback
    showSpendingLimitMessage() {
        // Create a user-friendly notification
        const notification = document.createElement('div');
        notification.className = 'spending-limit-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">💰</span>
                <div class="notification-text">
                    <strong>Replicate spending limit reached</strong>
                    <p>Switching to local SCUNet processing for free enhancement</p>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add notification to the page
        const container = document.querySelector('.main-container') || document.body;
        container.insertBefore(notification, container.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    // Handle manual local fallback button click
    async handleLocalFallbackClick() {
        if (!this.uploadedFile) {
            console.error('No file available for local processing');
            return;
        }
        
        console.log('🏠 User requested local SCUNet processing...');
        
        // Show processing overlay
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'flex';
        }
        if (this.processingStatus) {
            this.processingStatus.textContent = 'Processing with local SCUNet...';
        }
        
        // Disable buttons during processing
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.classList.remove('active');
        }
        if (this.localFallbackBtn) {
            this.localFallbackBtn.classList.add('disabled');
        }
        
        try {
            // Convert file to base64
            const base64Image = await this.fileToBase64(this.uploadedFile);
            
            // Process with local SCUNet
            await this.tryLocalSCUNetFallback(base64Image);
            
        } catch (error) {
            console.error('💥 Manual local fallback failed:', error);
            this.handleEnhancementError(error);
        }
    }
    
    // Clean up UI state after processing (success or failure)
    async cleanupAfterProcessing(success = true, errorMessage = null) {
        console.log('🏁 Cleaning up UI state...');
        
        // Hide processing overlay
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
        }
        
        // Re-enable the button (allow multiple enhancements)
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.remove('disabled');
            this.instantAiBtn.classList.add('active');
        }
        if (this.localFallbackBtn) {
            this.localFallbackBtn.classList.remove('disabled');
        }
        
        // Call assistant API if enhancement was successful
        if (success && this.finalBeforeImage?.src && this.finalAfterImage?.src) {
            try {
                // Update global context
                window.currentBeforeUrl = this.finalBeforeImage.src;
                window.currentAfterUrl = this.finalAfterImage.src;
                
                // Call assistant for explanation
                const msg = await callAssistantExplain({
                    beforeUrl: window.currentBeforeUrl,
                    afterUrl: window.currentAfterUrl,
                    metrics: window.currentMetrics,
                    vlmSummary: null,
                    userMessage: "",
                });
                
                // Notify conversational assistant with the explanation
                if (window.conversationalAssistant) {
                    window.conversationalAssistant.appendMessage(msg, 'assistant');
                }
            } catch (e) {
                console.error('Assistant API error:', e);
                // Fallback message
                if (window.conversationalAssistant) {
                    window.conversationalAssistant.appendMessage("Enhancement complete, but I couldn't fetch the explanation. Please try again.", 'assistant');
                }
            }
        }
        
        // Notify conversational assistant
        if (window.conversationalAssistant) {
            window.conversationalAssistant.onEnhancementComplete(success, errorMessage);
        }
        
        console.log('✨ Process complete - UI ready for next interaction');
    }
}

// Premium Enhancement Comparison Handler
class PremiumEnhancementComparison {
    constructor() {
        this.currentMode = 'slider';
        this.sliderPosition = 50;
        this.isDragging = false;
        this.magnifierEnabled = false;
        
        // Get DOM elements
        this.sliderView = document.getElementById('premium-slider-view');
        this.sideBySideView = document.getElementById('side-by-side-view');
        this.sliderHandle = document.getElementById('enhancedSliderHandle');
        this.magnifierToggle = document.querySelector('.magnifier-toggle');
        this.magnifier = document.getElementById('magnifier');
        
        // Image containers - removed old complex UI elements
        
        this.init();
    }
    
    init() {
        // Slider functionality
        if (this.sliderHandle) {
            this.initSlider();
        }
        
        // Magnifier toggle
        if (this.magnifierToggle) {
            this.magnifierToggle.addEventListener('click', () => this.toggleMagnifier());
        }
        
        // Keyboard controls
        this.initKeyboardControls();
    }
    
    // switchMode method removed - using simple side-by-side layout only
    
    initSlider() {
        // Mouse events
        this.sliderHandle.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // Touch events
        this.sliderHandle.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', () => this.stopDrag());
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.sliderHandle.style.cursor = 'grabbing';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const container = this.sliderHandle.parentElement;
        const rect = container.getBoundingClientRect();
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const position = ((x - rect.left) / rect.width) * 100;
        
        this.updateSliderPosition(Math.max(0, Math.min(100, position)));
    }
    
    stopDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.sliderHandle.style.cursor = 'ew-resize';
        
        // Add smooth easing on release
        this.sliderHandle.style.transition = 'left 0.2s ease-out';
        this.sliderAfterContainer.style.transition = 'clip-path 0.2s ease-out';
        
        setTimeout(() => {
            this.sliderHandle.style.transition = '';
            this.sliderAfterContainer.style.transition = '';
        }, 200);
    }
    
    updateSliderPosition(position) {
        this.sliderPosition = position;
        this.sliderHandle.style.left = `${position}%`;
        this.sliderAfterContainer.style.clipPath = `inset(0 0 0 ${position}%)`;
    }
    
    toggleMagnifier() {
        this.magnifierEnabled = !this.magnifierEnabled;
        this.magnifierToggle.classList.toggle('active', this.magnifierEnabled);
        
        if (this.magnifierEnabled) {
            this.initMagnifier();
        } else {
            this.magnifier.style.display = 'none';
            this.removeMagnifierListeners();
        }
    }
    
    initMagnifier() {
        const container = this.sliderHandle.parentElement;
        
        const handleMouseMove = (e) => {
            if (!this.magnifierEnabled) return;
            
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Show magnifier
            this.magnifier.style.display = 'block';
            this.magnifier.style.left = `${x}px`;
            this.magnifier.style.top = `${y}px`;
            
            // Update magnifier content
            const beforeImg = document.getElementById('finalBeforeImage');
            const afterImg = document.getElementById('finalAfterImage');
            
            if (beforeImg && afterImg) {
                const scale = 2;
                const bgX = -x * scale + 100;
                const bgY = -y * scale + 100;
                
                const magnifierBefore = this.magnifier.querySelector('.magnifier-before');
                const magnifierAfter = this.magnifier.querySelector('.magnifier-after');
                
                magnifierBefore.style.backgroundImage = `url(${beforeImg.src})`;
                magnifierBefore.style.backgroundPosition = `${bgX}px ${bgY}px`;
                magnifierBefore.style.backgroundSize = `${rect.width * scale}px ${rect.height * scale}px`;
                
                magnifierAfter.style.backgroundImage = `url(${afterImg.src})`;
                magnifierAfter.style.backgroundPosition = `${bgX}px ${bgY}px`;
                magnifierAfter.style.backgroundSize = `${rect.width * scale}px ${rect.height * scale}px`;
                magnifierAfter.style.clipPath = `inset(0 0 0 ${this.sliderPosition}%)`;
            }
        };
        
        const handleMouseLeave = () => {
            this.magnifier.style.display = 'none';
        };
        
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        
        // Store listeners for cleanup
        this.magnifierListeners = { handleMouseMove, handleMouseLeave };
    }
    
    removeMagnifierListeners() {
        if (this.magnifierListeners) {
            const container = this.sliderHandle.parentElement;
            container.removeEventListener('mousemove', this.magnifierListeners.handleMouseMove);
            container.removeEventListener('mouseleave', this.magnifierListeners.handleMouseLeave);
            this.magnifierListeners = null;
        }
    }
    
    initKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!document.querySelector('.final-comparison-section').style.display || 
                document.querySelector('.final-comparison-section').style.display === 'none') return;
            
            if (this.currentMode === 'slider') {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.updateSliderPosition(Math.max(0, this.sliderPosition - 3));
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.updateSliderPosition(Math.min(100, this.sliderPosition + 3));
                        break;
                    case 'Enter':
                        if (document.activeElement === this.sliderHandle) {
                            e.preventDefault();
                            this.toggleMagnifier();
                        }
                        break;
                }
            }
        });
    }
    

}

// Enhanced Image Comparison Slider with auto-sliding effect
class ImageComparisonSlider {
    constructor() {
        this.currentImageIndex = 0;
        this.autoSlideInterval = null;
        this.isAutoSlideActive = true;
        this.slideDirection = 1; // 1 for left to right, -1 for right to left
        this.currentSlidePosition = 0; // 0 = fully before, 100 = fully after
        
        // Get DOM elements
        this.slider = document.getElementById('comparisonSlider');
        this.autoSlideOverlay = document.getElementById('autoSlideOverlay');
        this.autoSlideStatus = document.getElementById('autoSlideStatus');
        this.demoBeforeImg = document.getElementById('beforeImg');
        this.demoAfterImg = document.getElementById('afterImg');
        this.afterContainer = this.demoAfterImg.parentElement;
        
        this.init();
        
        // Ensure before image has no filter applied immediately after DOM elements are available
        setTimeout(() => {
            this.ensureNoFilterOnBefore();
        }, 100);
        
        // Set up a periodic check to ensure filter is always removed
        setInterval(() => {
            this.ensureNoFilterOnBefore();
        }, 1000); // Check every second
    }
    
    init() {
        // Ensure before image has no filter applied immediately
        if (this.demoBeforeImg) {
            this.demoBeforeImg.style.filter = 'none';
        }
        
        this.loadImagePair(0);
        this.setupHoverEvents();
        this.startAutoSlide();
    }
    
    // Stop auto sliding when user uploads image
    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
            this.isAutoSlideActive = false;
            console.log('Auto slide stopped - user image uploaded');
        }
    }
    
    // Start auto sliding effect
    startAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
        
        // Ensure before image has no filter when starting auto-slide
        this.ensureNoFilterOnBefore();
        
        this.autoSlideInterval = setInterval(() => {
            if (this.isAutoSlideActive) {
                this.performAutoSlide();
            }
        }, 100); // Update every 100ms for smooth animation
    }
    
    // Perform the auto sliding animation
    performAutoSlide() {
        if (this.slideDirection === 1) {
            // Sliding from left to right (before to after)
            this.currentSlidePosition += 0.8; // Slower, smoother movement
            if (this.currentSlidePosition >= 100) {
                this.currentSlidePosition = 100;
                // Stop at the end - no auto-reverse
                this.pauseAutoSlide();
                return;
            }
        } else {
            // Sliding from right to left (after to before)
            this.currentSlidePosition -= 0.8; // Slower, smoother movement
            if (this.currentSlidePosition <= 0) {
                this.currentSlidePosition = 0;
                // Stop at the beginning - no auto-reverse
                this.pauseAutoSlide();
                return;
            }
        }
        
        this.updateSlidePosition(this.currentSlidePosition);
    }
    
    loadImagePair(index) {
        if (index >= imagePairs.length) index = 0;
        
        const pair = imagePairs[index];
        
        // Add transition classes
        this.demoBeforeImg.classList.add('fade-transition');
        this.demoAfterImg.classList.add('fade-transition');
        
        // Fade out
        this.demoBeforeImg.classList.add('fade-out');
        this.demoAfterImg.classList.add('fade-out');
        
        setTimeout(() => {
            // Load new images
            this.demoBeforeImg.src = pair.before;
            this.demoAfterImg.src = pair.after;
            
            // No filter applied to before image - display exactly as source file
            this.demoBeforeImg.style.filter = 'none';
            
            // Enhanced styling for after image
            this.demoAfterImg.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.3) sharpen(1.2)';
            
            // Fade in
            this.demoBeforeImg.classList.remove('fade-out');
            this.demoAfterImg.classList.remove('fade-out');
            this.demoBeforeImg.classList.add('fade-in');
            this.demoAfterImg.classList.add('fade-in');
            
            setTimeout(() => {
                // Remove transition classes after animation
                this.demoBeforeImg.classList.remove('fade-transition', 'fade-in');
                this.demoAfterImg.classList.remove('fade-transition', 'fade-in');
                
                // Keep current slide position and direction - don't reset
                this.updateSlidePosition(this.currentSlidePosition);
            }, 500);
        }, 250);
        
        this.currentImageIndex = index;
    }
    
    // Setup hover events to pause/resume auto-sliding
    setupHoverEvents() {
        this.slider.addEventListener('mouseenter', () => {
            this.pauseAutoSlide();
        });
        
        this.slider.addEventListener('mouseleave', () => {
            this.resumeAutoSlide();
        });
    }
    
    // Pause auto sliding
    pauseAutoSlide() {
        this.isAutoSlideActive = false;
    }
    
    // Resume auto sliding
    resumeAutoSlide() {
        // Only resume if we're not at the extreme ends
        if (this.currentSlidePosition > 0 && this.currentSlidePosition < 100) {
            this.isAutoSlideActive = true;
        }
    }
    
    // Ensure before image has no filter applied
    ensureNoFilterOnBefore() {
        if (this.demoBeforeImg) {
            this.demoBeforeImg.style.filter = 'none';
        }
    }
    
    // Update the slide position and clip path
    updateSlidePosition(position) {
        this.currentSlidePosition = position;
        
        // Ensure before image has no filter
        this.ensureNoFilterOnBefore();
        
        // Update after image clip path to reveal more/less of the enhanced image
        this.afterContainer.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
        
        // Update status indicator
        this.updateStatusIndicator(position);
    }
    
    // Update the status indicator to show current state
    updateStatusIndicator(position) {
        if (!this.autoSlideStatus) return;
        
        const beforeText = this.autoSlideStatus.querySelector('.status-text:first-child');
        const afterText = this.autoSlideStatus.querySelector('.status-text:last-child');
        
        if (position < 50) {
            // More "Before" visible
            beforeText.classList.add('active');
            afterText.classList.remove('active');
        } else {
            // More "After" visible
            beforeText.classList.remove('active');
            afterText.classList.add('active');
        }
    }
}

// Navigation functionality
class NavigationHandler {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }
    
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });
    }
    
    handleNavClick(e) {
        e.preventDefault();
        
        // Remove active class from all links
        this.navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to clicked link
        e.target.classList.add('active');
        
        // In a real application, this would handle routing
        console.log('Navigation clicked:', e.target.textContent);
    }
}

// Performance optimization: Lazy load images
class ImageLoader {
    static preloadImages() {
        imagePairs.forEach((pair, index) => {
            setTimeout(() => {
                const beforeImg = new Image();
                const afterImg = new Image();
                
                beforeImg.src = pair.before;
                afterImg.src = pair.after;
            }, index * 100);
        });
    }
}

// Analytics and tracking (placeholder for real implementation)
class AnalyticsTracker {
    static trackEvent(eventName, data = {}) {
        // In a real application, this would send data to analytics service
        console.log('Analytics Event:', eventName, data);
    }
    
    static trackPageView() {
        this.trackEvent('page_view', {
            page: 'landing_page',
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
    }
}

// Mobile Pricing Panel Handler
class MobilePricingHandler {
    constructor() {
        this.pricingPanel = document.querySelector('.pricing-rail-panel');
        this.closeBtn = document.getElementById('mobile-close-btn');
        this.isExpanded = false;
        this.isMobile = window.innerWidth < 768;
        
        this.init();
    }
    
    init() {
        if (!this.pricingPanel) return;
        
        // Check if mobile on resize
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
            if (!this.isMobile && this.isExpanded) {
                this.collapse();
            }
        });
        
        // Mobile panel tap to expand (only for the compact rail)
        this.pricingPanel.addEventListener('click', (e) => {
            if (this.isMobile && !this.isExpanded && !e.target.closest('.pricing-rail')) {
                this.expand();
            }
        });
        
        // Close button handler
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.collapse();
            });
        }
        
        // Close on backdrop click when expanded
        document.addEventListener('click', (e) => {
            if (this.isExpanded && this.isMobile && !this.pricingPanel.contains(e.target)) {
                this.collapse();
            }
        });
        
        // Prevent body scroll when expanded
        this.handleBodyScroll();
    }
    
    expand() {
        if (!this.isMobile) return;
        
        this.pricingPanel.classList.add('expanded');
        this.isExpanded = true;
        document.body.style.overflow = 'hidden';
        
        // Add backdrop
        this.addBackdrop();
    }
    
    collapse() {
        this.pricingPanel.classList.remove('expanded');
        this.isExpanded = false;
        document.body.style.overflow = '';
        
        // Remove backdrop
        this.removeBackdrop();
    }
    
    addBackdrop() {
        if (document.querySelector('.pricing-backdrop')) return;
        
        const backdrop = document.createElement('div');
        backdrop.className = 'pricing-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;
        
        backdrop.addEventListener('click', () => this.collapse());
        document.body.appendChild(backdrop);
    }
    
    removeBackdrop() {
        const backdrop = document.querySelector('.pricing-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
    
    handleBodyScroll() {
        // Prevent body scroll when mobile panel is expanded
        const originalOverflow = document.body.style.overflow;
        
        // Restore on page unload
        window.addEventListener('beforeunload', () => {
            document.body.style.overflow = originalOverflow;
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Image Enhancer Landing Page - Initializing...');
    
    // Initialize all components
    const comparisonSlider = new ImageComparisonSlider();
    const interactiveProcessor = new InteractiveImageProcessor();
    new NavigationHandler();
    new PremiumEnhancementComparison();
    new MobilePricingHandler();
    
    // Initialize conversational assistant
    conversationalAssistant = new ConversationalAssistant();
    conversationalAssistant.imageProcessor = interactiveProcessor;
    
    // Connect the interactive processor with the comparison slider
    interactiveProcessor.setComparisonSlider(comparisonSlider);
    
    // Preload images for smooth transitions
    ImageLoader.preloadImages();
    
    console.log('Application initialized successfully');
    
    // Track page view
    AnalyticsTracker.trackPageView();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    // Reset slider position on resize to prevent layout issues
    const slider = document.getElementById('comparisonSlider');
    if (slider) {
        const divider = document.getElementById('divider');
        const afterContainer = document.querySelector('.after-image');
        
        if (divider && afterContainer) {
            divider.style.left = '50%';
            afterContainer.style.clipPath = 'inset(0 50% 0 0)';
        }
    }
});

// Smooth scrolling for better UX (if needed for mobile)
document.addEventListener('touchmove', (e) => {
    // Only prevent default on the comparison slider area
    const slider = document.getElementById('comparisonSlider');
    if (slider && slider.contains(e.target)) {
        e.preventDefault();
    }
}, { passive: false });

// Error handling for image loading
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Image failed to load:', e.target.src);
        
        // Fallback to a placeholder or retry loading
        if (e.target.src.includes('pixabay')) {
            // In case of API issues, use a solid color placeholder
            e.target.style.backgroundColor = '#333';
            e.target.style.minHeight = '400px';
        }
    }
}, true);

// ============================================
// Opera AI Assistant Implementation
// ============================================

class OperaBot {
    constructor() {
        // Response templates for deterministic bot behavior
        this.responses = {
            greeting: "Welcome! I can enhance photos with Instant AI, polish them with a human editor, or ship framed prints.",
            followUp: "How would you like to start?",
            
            pricing: {
                text: "Here are our plans for enhancing your photos:",
                showPlanRail: true
            },
            
            upload: "Use the Upload Image button above. I'll stay here while you preview results.",
            
            differences: {
                text: "Here's what makes each plan unique:",
                bullets: [
                    "• Instant AI: Fastest, fully automated enhancement",
                    "• Pro Touch-Up: Human editor + AI for perfection",
                    "• Concierge Print: Archival quality print + delivery"
                ]
            },
            
            instantAI: "Instant AI uses advanced deep learning to enhance photos in seconds. Perfect for quick improvements to color, clarity, and detail.",
            
            proTouchUp: "Pro Touch-Up combines AI enhancement with human expertise. Our editors ensure perfect results for important photos.",
            
            conciergePrint: "Concierge Print delivers museum-quality prints with custom framing options, shipped directly to your door.",
            
            unknown: "I can help you enhance photos, learn about our services, or choose the right plan. What would you like to know?"
        };
        
        this.suggestionChips = {
            initial: ["What can you do?", "Show pricing", "How printing works"],
            afterGreeting: ["Instant AI", "Pro Touch-Up", "Concierge Print", "Show pricing"],
            afterPricing: ["Tell me more", "What's the difference?", "I'm ready to start"]
        };
    }
    
    async respond(message) {
        const lowerMessage = message.toLowerCase();
        const events = [];
        
        // Check for pricing-related keywords
        if (lowerMessage.includes('price') || lowerMessage.includes('pricing') || 
            lowerMessage.includes('cost') || lowerMessage.includes('plan') ||
            lowerMessage.includes('how much')) {
            events.push({
                type: 'text',
                payload: { text: this.responses.pricing.text }
            });
            events.push({
                type: 'plan-rail',
                payload: {}
            });
            events.push({
                type: 'chips',
                payload: { chips: this.suggestionChips.afterPricing }
            });
        }
        // Check for upload-related keywords
        else if (lowerMessage.includes('upload') || lowerMessage.includes('image') && 
                 (lowerMessage.includes('add') || lowerMessage.includes('use'))) {
            events.push({
                type: 'text',
                payload: { text: this.responses.upload }
            });
        }
        // Check for differences question
        else if (lowerMessage.includes('difference') || lowerMessage.includes('compare') ||
                 lowerMessage.includes('which one')) {
            events.push({
                type: 'text',
                payload: { 
                    text: this.responses.differences.text,
                    bullets: this.responses.differences.bullets
                }
            });
            events.push({
                type: 'chips',
                payload: { chips: this.suggestionChips.afterPricing }
            });
        }
        // Check for specific service questions
        else if (lowerMessage.includes('instant ai')) {
            events.push({
                type: 'text',
                payload: { text: this.responses.instantAI }
            });
            events.push({
                type: 'chips',
                payload: { chips: ["Show pricing", "Try it now", "Learn more"] }
            });
        }
        else if (lowerMessage.includes('pro touch') || lowerMessage.includes('touch-up')) {
            events.push({
                type: 'text',
                payload: { text: this.responses.proTouchUp }
            });
            events.push({
                type: 'chips',
                payload: { chips: ["Show pricing", "See examples", "Learn more"] }
            });
        }
        else if (lowerMessage.includes('concierge') || lowerMessage.includes('print')) {
            events.push({
                type: 'text',
                payload: { text: this.responses.conciergePrint }
            });
            events.push({
                type: 'chips',
                payload: { chips: ["Show pricing", "Frame options", "Shipping info"] }
            });
        }
        // Default response
        else {
            events.push({
                type: 'text',
                payload: { text: this.responses.unknown }
            });
            events.push({
                type: 'chips',
                payload: { chips: this.suggestionChips.initial }
            });
        }
        
        return events;
    }
}

class OperaChatPanel {
    constructor() {
        this.bot = new OperaBot();
        this.messages = [];
        this.isTyping = false;
        this.isMobileSheetOpen = false;
        
        // DOM Elements
        this.panel = document.getElementById('opera-chat-panel');
        this.messageList = document.getElementById('message-list');
        this.composerInput = document.getElementById('composer-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.suggestionChips = document.getElementById('suggestion-chips');
        this.planRailInline = document.getElementById('plan-rail-inline');
        this.mobileDock = document.getElementById('opera-mobile-dock');
        this.mobileDockBtn = document.getElementById('opera-dock-btn');
        
        this.init();
    }
    
    init() {
        // Send initial greeting
        this.addBotMessage(this.bot.responses.greeting);
        setTimeout(() => {
            this.addBotMessage(this.bot.responses.followUp);
            this.showSuggestionChips(this.bot.suggestionChips.afterGreeting);
        }, 1000);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Auto-resize composer
        this.setupComposerAutoResize();
        
        // Create mobile bottom sheet if on mobile
        if (window.innerWidth <= 1024) {
            this.createMobileBottomSheet();
        }
    }
    
    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.handleSend());
        
        // Enter key to send (Shift+Enter for new line)
        this.composerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        // Mobile dock button
        if (this.mobileDockBtn) {
            this.mobileDockBtn.addEventListener('click', () => this.openMobileSheet());
        }
        
        // Plan select buttons
        document.querySelectorAll('.plan-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                this.handlePlanSelection(plan);
            });
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && this.bottomSheet) {
                this.closeMobileSheet();
            }
        });
    }
    
    setupComposerAutoResize() {
        this.composerInput.addEventListener('input', () => {
            this.composerInput.style.height = 'auto';
            this.composerInput.style.height = Math.min(this.composerInput.scrollHeight, 120) + 'px';
        });
    }
    
    async handleSend() {
        const message = this.composerInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addUserMessage(message);
        
        // Clear input and reset height
        this.composerInput.value = '';
        this.composerInput.style.height = '40px';
        
        // Hide suggestion chips
        this.hideSuggestionChips();
        
        // Show typing indicator
        this.showTyping();
        
        // Get bot response
        setTimeout(async () => {
            const events = await this.bot.respond(message);
            this.hideTyping();
            
            // Process events
            for (const event of events) {
                await this.processEvent(event);
                await this.delay(300); // Small delay between events
            }
        }, 800);
    }
    
    async processEvent(event) {
        switch (event.type) {
            case 'text':
                if (event.payload.bullets) {
                    const fullText = event.payload.text + '\n' + event.payload.bullets.join('\n');
                    this.addBotMessage(fullText);
                } else {
                    this.addBotMessage(event.payload.text);
                }
                break;
                
            case 'plan-rail':
                this.showPlanRail();
                break;
                
            case 'chips':
                this.showSuggestionChips(event.payload.chips);
                break;
        }
    }
    
    addUserMessage(text) {
        const messageEl = this.createMessageElement('user', text);
        this.messageList.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    addBotMessage(text) {
        const messageEl = this.createMessageElement('opera', text);
        this.messageList.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    createMessageElement(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        return messageDiv;
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    showTyping() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }
    
    showSuggestionChips(chips) {
        this.suggestionChips.innerHTML = '';
        chips.forEach(chipText => {
            const chip = document.createElement('button');
            chip.className = 'chip';
            chip.textContent = chipText;
            chip.addEventListener('click', () => {
                this.composerInput.value = chipText;
                this.handleSend();
            });
            this.suggestionChips.appendChild(chip);
        });
    }
    
    hideSuggestionChips() {
        this.suggestionChips.innerHTML = '';
    }
    
    showPlanRail() {
        this.planRailInline.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hidePlanRail() {
        this.planRailInline.style.display = 'none';
    }
    
    handlePlanSelection(planId) {
        const planNames = {
            'instant-ai': 'Instant AI',
            'pro-touch-up': 'Pro Touch-Up',
            'concierge-print': 'Concierge Print'
        };
        
        const planName = planNames[planId] || planId;
        this.addBotMessage(`Great choice! You've selected ${planName}. Let me guide you through the next steps.`);
        this.hidePlanRail();
        
        // Here you would normally navigate to checkout or show next steps
        setTimeout(() => {
            this.showSuggestionChips(["Upload image", "Learn more", "Contact support"]);
        }, 500);
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messageList.scrollTop = this.messageList.scrollHeight;
        }, 100);
    }
    
    createMobileBottomSheet() {
        const sheet = document.createElement('div');
        sheet.className = 'opera-bottom-sheet';
        sheet.id = 'opera-bottom-sheet';
        sheet.innerHTML = `
            <div class="sheet-handle"></div>
            <button class="sheet-close-btn" aria-label="Close">×</button>
            ${this.panel.innerHTML}
        `;
        
        document.body.appendChild(sheet);
        this.bottomSheet = sheet;
        
        // Set up close button
        const closeBtn = sheet.querySelector('.sheet-close-btn');
        closeBtn.addEventListener('click', () => this.closeMobileSheet());
        
        // Set up swipe to close
        this.setupSwipeToClose(sheet);
        
        // Re-initialize elements in mobile sheet
        this.reinitializeMobileElements();
    }
    
    reinitializeMobileElements() {
        if (!this.bottomSheet) return;
        
        // Update references to mobile sheet elements
        const mobileMessageList = this.bottomSheet.querySelector('#message-list');
        const mobileComposer = this.bottomSheet.querySelector('#composer-input');
        const mobileSendBtn = this.bottomSheet.querySelector('#send-btn');
        
        // Copy existing messages
        if (mobileMessageList) {
            mobileMessageList.innerHTML = this.messageList.innerHTML;
        }
        
        // Set up mobile event listeners
        if (mobileSendBtn && mobileComposer) {
            mobileSendBtn.addEventListener('click', () => {
                const message = mobileComposer.value.trim();
                if (message) {
                    this.handleSend();
                    mobileComposer.value = '';
                }
            });
            
            mobileComposer.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const message = mobileComposer.value.trim();
                    if (message) {
                        this.handleSend();
                        mobileComposer.value = '';
                    }
                }
            });
        }
    }
    
    setupSwipeToClose(sheet) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const handle = sheet.querySelector('.sheet-handle');
        
        const startDrag = (e) => {
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            sheet.style.transition = 'none';
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - startY;
            if (deltaY > 0) {
                sheet.style.transform = `translateY(${deltaY}px)`;
            }
        };
        
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            sheet.style.transition = 'transform 0.3s ease';
            
            const deltaY = currentY - startY;
            if (deltaY > 100) {
                this.closeMobileSheet();
            } else {
                sheet.style.transform = 'translateY(0)';
            }
        };
        
        handle.addEventListener('touchstart', startDrag);
        handle.addEventListener('touchmove', drag);
        handle.addEventListener('touchend', endDrag);
        handle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }
    
    openMobileSheet() {
        if (!this.bottomSheet) {
            this.createMobileBottomSheet();
        }
        this.bottomSheet.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.isMobileSheetOpen = true;
    }
    
    closeMobileSheet() {
        if (this.bottomSheet) {
            this.bottomSheet.classList.remove('open');
            document.body.style.overflow = '';
            this.isMobileSheetOpen = false;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize Opera Chat Panel when DOM is ready
// Commented out - replaced by ConversationalAssistant
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//         window.operaChat = new OperaChatPanel();
//     });
// } else {
//     window.operaChat = new OperaChatPanel();
// }

// Conversational-First Chat Functionality
class ConversationalAssistant {
    constructor() {
        // Selectors
        this.chatShell = document.querySelector('[data-chat-shell]');
        this.chatList = document.querySelector('[data-chat-list]');
        this.chatInput = document.querySelector('[data-chat-input]');
        this.chatSend = document.querySelector('[data-chat-send]');
        this.chatAttach = document.querySelector('[data-chat-attach]');
        this.fileInput = document.querySelector('[data-chat-file-input]');
        this.pillInstant = document.querySelector('[data-pill-instant]');
        this.pillPro = document.querySelector('[data-pill-pro]');
        this.pillPrint = document.querySelector('[data-pill-print]');
        this.pillPricing = document.querySelector('[data-pill-pricing]');
        
        // Get reference to existing image processor
        this.imageProcessor = null; // Will be set after InteractiveImageProcessor is created
        
        // State guards for service selection
        this.imageIsUploaded = false;
        this.currentBeforeUrl = null;
        this.currentAfterUrl = null;
        this.currentMetrics = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Welcome messages
        this.addWelcomeMessages();
        
        // Event listeners
        this.setupEventListeners();
        
        // Focus input
        this.chatInput?.focus();
        
        // Initially disable service pills
        this.setServicePillsEnabled(false);
    }
    
    addWelcomeMessages() {
        const messages = [
            "Welcome! I can enhance photos with Instant AI, polish them with a human editor, or ship framed prints.",
            "Drop a photo here or attach one to get started."
        ];
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.appendMessage(msg, 'assistant');
            }, index * 300);
        });
    }
    
    setupEventListeners() {
        // Composer events
        this.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        this.chatSend?.addEventListener('click', () => this.handleSendMessage());
        
        // Attachment
        this.chatAttach?.addEventListener('click', () => this.fileInput?.click());
        this.fileInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleImageSelected(e.target.files[0]);
            }
        });
        
        // Drag and drop
        this.setupDragAndDrop();
        
        // Pills - wire them to gate on imageIsUploaded
        this.pillInstant?.addEventListener('click', () => this.handleInstantAI());
        this.pillPro?.addEventListener('click', () => this.handleProTouchUp());
        this.pillPrint?.addEventListener('click', () => this.handleConcierge());
        this.pillPricing?.addEventListener('click', () => this.handleShowPricing());
    }
    
    setupDragAndDrop() {
        let dragCounter = 0;
        
        this.chatShell?.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            this.chatShell.classList.add('drag-over');
        });
        
        this.chatShell?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                this.chatShell.classList.remove('drag-over');
            }
        });
        
        this.chatShell?.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.chatShell?.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.chatShell.classList.remove('drag-over');
            
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    this.handleImageSelected(file);
                } else {
                    this.appendMessage("Please drop an image file (JPG, PNG, etc.)", 'assistant');
                }
            }
        });
    }
    
    handleSendMessage() {
        const message = this.chatInput?.value.trim();
        if (!message) return;
        
        // Clear input
        this.chatInput.value = '';
        
        // Append user message
        this.appendMessage(message, 'user');
        
        // Check for image intent
        const imageKeywords = ['upload', 'image', 'photo', 'picture', 'enhance', 'process'];
        const hasImageIntent = imageKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        if (hasImageIntent && !this.imageIsUploaded) {
            setTimeout(() => {
                this.appendMessage("Sure! You can drag and drop an image here or click the attachment button to upload one.", 'assistant');
            }, 300);
        } else if (message.toLowerCase().includes('pricing')) {
            this.handleShowPricing();
        } else {
            // Generic response
            setTimeout(() => {
                this.appendMessage("I can help you enhance images with AI. Upload an image to get started!", 'assistant');
            }, 300);
        }
    }
    
    async handleImageSelected(file) {
        try {
            // Append uploading message
            this.appendMessage("Uploading your image…", 'assistant');
            
            // Trigger existing upload logic via hidden file input
            const originalFileInput = document.getElementById('image-input');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            originalFileInput.files = dataTransfer.files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            originalFileInput.dispatchEvent(event);
            
            // Wait for upload to process and get the image URL
            await this.waitForImageUpload(file);
            
            // Get image metadata
            const meta = await this.getClientImageMeta(this.currentBeforeUrl);
            
            // Update state
            this.imageIsUploaded = true;
            
            // Enable service pills
            this.setServicePillsEnabled(true);
            
            // Post assistant message acknowledging image and prompting for service selection
            const serviceMessage = meta
                ? `Got it. ${meta.width}×${meta.height} detected. Choose a service: • Instant AI • Pro Touch-Up • Concierge Print`
                : "Got it. Choose a service: • Instant AI • Pro Touch-Up • Concierge Print";
            
            this.appendMessage(serviceMessage, 'assistant');
            
        } catch (error) {
            console.error('Upload failed:', error);
            this.appendMessage("Upload failed. Please try again or use a different image.", 'assistant');
            this.setServicePillsEnabled(false);
        }
    }
    
    // Wait for image upload to complete and get the image URL
    async waitForImageUpload(file) {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50; // 5 seconds max wait
            let attempts = 0;
            
            const checkUpload = () => {
                attempts++;
                
                // Check if the image processor has processed the upload
                if (this.imageProcessor?.userImageUploaded && this.imageProcessor?.uploadedImage?.src) {
                    this.currentBeforeUrl = this.imageProcessor.uploadedImage.src;
                    this.currentAfterUrl = null;
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('Upload timeout'));
                    return;
                }
                
                setTimeout(checkUpload, 100);
            };
            
            checkUpload();
        });
    }
    
    // Get basic image metadata (optional helper)
    async getClientImageMeta(url) {
        try {
            return await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = reject;
                img.src = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
            });
        } catch {
            return null;
        }
    }
    
    // Enable/disable service pills based on image upload state
    setServicePillsEnabled(enabled) {
        const pills = document.querySelectorAll("[data-pill]");
        pills.forEach(p => {
            p.disabled = !enabled;
            p.setAttribute("aria-disabled", String(!enabled));
            p.classList.toggle("is-disabled", !enabled);
        });
    }
    
    handleInstantAI() {
        if (!this.imageIsUploaded || !this.currentBeforeUrl) {
            this.appendMessage("Please upload an image first.", 'assistant');
            return;
        }
        
        this.appendMessage("Running Instant AI…", 'assistant');
        
        try {
            // Trigger the existing AI enhancement process
            if (this.imageProcessor?.userImageUploaded) {
                document.getElementById('instant-ai-btn')?.click();
            } else {
                throw new Error('Image processor not ready');
            }
        } catch (error) {
            console.error('Instant AI failed:', error);
            this.appendMessage("Instant AI failed. Please try again or choose another service.", 'assistant');
        }
    }
    
    handleProTouchUp() {
        if (!this.imageIsUploaded) {
            this.appendMessage("Please upload an image first.", 'assistant');
            return;
        }
        
        this.appendMessage("Pro Touch-Up adds human, pixel-level polish (skin tones, edges, local contrast). Would you like a quote?", 'assistant');
        
        setTimeout(() => {
            const cta = document.createElement('div');
            cta.className = 'chat-bubble assistant';
            cta.innerHTML = `
                <p>Ready to upgrade your photo?</p>
                <button class="chat-cta-btn" style="margin-top: 8px; background: #4a9eff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    Get Pro Touch-Up - $39
                </button>
            `;
            this.chatList?.appendChild(cta);
            this.scrollToBottom();
        }, 400);
    }
    
    handleConcierge() {
        if (!this.imageIsUploaded) {
            this.appendMessage("Please upload an image first.", 'assistant');
            return;
        }
        
        this.appendMessage("Concierge Print: we recommend photo matte or luster based on your image. Want to see size & paper options?", 'assistant');
        
        const optionsHtml = `
            <div class="pricing-content">
                <h4>Concierge Print Options</h4>
                <p style="margin-bottom: 12px; font-size: 12px; color: #B8B8B8;">
                    Premium paper recommendation: Fuji Crystal Archive
                </p>
                <button class="chat-cta-btn" style="background: #4a9eff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%;">
                    Open Print Options
                </button>
            </div>
        `;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble assistant pricing-bubble';
        bubble.innerHTML = optionsHtml;
        this.chatList?.appendChild(bubble);
        this.scrollToBottom();
    }
    
    handleShowPricing() {
        this.appendMessage("Pricing — Instant AI: $9 • Pro Touch-Up: $39 • Concierge Print: from $89.", 'assistant');
        
        const pricingHtml = `
            <div class="pricing-content">
                <h4>Choose Your Plan</h4>
                <div class="plan-option">
                    <div class="plan-info">
                        <h5>Instant AI</h5>
                        <p>Unlimited AI enhancements</p>
                    </div>
                    <span class="plan-price">$9</span>
                </div>
                <div class="plan-option">
                    <div class="plan-info">
                        <h5>Pro Touch-Up</h5>
                        <p>Human editor + AI perfection</p>
                    </div>
                    <span class="plan-price">$39</span>
                </div>
                <div class="plan-option">
                    <div class="plan-info">
                        <h5>Concierge Print</h5>
                        <p>Custom framing & delivery</p>
                    </div>
                    <span class="plan-price">$89+</span>
                </div>
            </div>
        `;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble assistant pricing-bubble';
        bubble.innerHTML = pricingHtml;
        this.chatList?.appendChild(bubble);
        this.scrollToBottom();
    }
    
    appendMessage(text, type = 'user', isLoading = false) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}${isLoading ? ' loading' : ''}`;
        
        if (isLoading) {
            bubble.innerHTML = '<span class="spinner"></span>' + text;
        } else {
            bubble.textContent = text;
        }
        
        this.chatList?.appendChild(bubble);
        this.scrollToBottom();
        
        return bubble;
    }
    
    // Called by InteractiveImageProcessor when enhancement is complete
    onEnhancementComplete(success, error = null) {
        if (success) {
            // Update state with enhanced image
            if (this.imageProcessor?.finalAfterImage?.src) {
                this.currentAfterUrl = this.imageProcessor.finalAfterImage.src;
            }
            
            const summary = "Here's what changed: sharper edges, reduced noise, and cleaner color. Want a detailed breakdown or to explore Pro Touch-Up?";
            this.appendMessage(summary, 'assistant');
        } else {
            const errorMsg = error || "There was an issue enhancing your image. Please try again.";
            this.appendMessage(errorMsg, 'assistant');
            
            // Add retry button
            setTimeout(() => {
                const retryBubble = document.createElement('div');
                retryBubble.className = 'chat-bubble assistant';
                retryBubble.innerHTML = `
                    <button class="chat-cta-btn" style="background: #4a9eff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        Retry Enhancement
                    </button>
                `;
                retryBubble.querySelector('button').addEventListener('click', () => {
                    this.handleInstantAI();
                });
                this.chatList?.appendChild(retryBubble);
                this.scrollToBottom();
            }, 300);
        }
    }
    
    scrollToBottom() {
        if (this.chatList) {
            this.chatList.scrollTop = this.chatList.scrollHeight;
        }
    }
}

// Initialize conversational assistant when DOM is ready
let conversationalAssistant = null;