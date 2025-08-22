// Image pairs for the before/after slider
const imagePairs = [
    {
        before: 'https://pixabay.com/get/ged88903415ce469496de8dab35730d5804e04e91b449cfc415447bd78319ce29d51dd4c33838d0906ce785533a9be3df9c0d2acf6ffc28b450e69d3cfee32898_1280.jpg',
        after: 'https://pixabay.com/get/ged88903415ce469496de8dab35730d5804e04e91b449cfc415447bd78319ce29d51dd4c33838d0906ce785533a9be3df9c0d2acf6ffc28b450e69d3cfee32898_1280.jpg'
    },
    {
        before: 'https://pixabay.com/get/g185c82ef2c9e4214e9f9de6a302bee5a626c5eebf3a0ac263d4751f29a0a469264a8edc15b700af7aacf632387ba48155c343e01f12b4e7a89b37aa2f2a7f8d0_1280.jpg',
        after: 'https://pixabay.com/get/g185c82ef2c9e4214e9f9de6a302bee5a626c5eebf3a0ac263d4751f29a0a469264a8edc15b700af7aacf632387ba48155c343e01f12b4e7a89b37aa2f2a7f8d0_1280.jpg'
    },
    {
        before: 'https://pixabay.com/get/gd43cd67f9386e88384991b815d88c4c727e59e0fd66aaf7ac656834adbf33f96baa4db860d3c970b08848b0e6f54b60d582e4685330bb5bd50e82a21f065fab3_1280.jpg',
        after: 'https://pixabay.com/get/gd43cd67f9386e88384991b815d88c4c727e59e0fd66aaf7ac656834adbf33f96baa4db860d3c970b08848b0e6f54b60d582e4685330bb5bd50e82a21f065fab3_1280.jpg'
    },
    {
        before: 'https://pixabay.com/get/g596c5d38a2a00290ea5a21907431cf8e293ea701ce846e1472f2caff3be58557ea781c95fc3fb3ffe07ab6d226fe470fd66ffc83a7e8bab7cf08e5d2d4f948d6_1280.jpg',
        after: 'https://pixabay.com/get/g596c5d38a2a00290ea5a21907431cf8e293ea701ce846e1472f2caff3be58557ea781c95fc3fb3ffe07ab6d226fe470fd66ffc83a7e8bab7cf08e5d2d4f948d6_1280.jpg'
    }
];

// Interactive Upload and AI Processing Handler
class InteractiveImageProcessor {
    constructor() {
        this.uploadBtn = document.getElementById('upload-btn');
        this.fileInput = document.getElementById('image-input');
        this.instantAiBtn = document.getElementById('instant-ai-btn');
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
        
        // Replicate deployment configuration
        this.replicateApiToken = ''; // Will be loaded from environment/server
        this.deploymentId = 'mranderson01901234/my-scunet2point0';
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
        
        // Ensure processing overlay is hidden on initialization
        this.forceHideProcessingOverlay();
    }
    
    init() {
        // Initially disable and hide the Instant AI button
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.style.display = 'none';
        }
        
        // Set up event listeners
        this.uploadBtn.addEventListener('click', this.handleUploadClick.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        if (this.instantAiBtn) {
            this.instantAiBtn.addEventListener('click', this.handleInstantAiClick.bind(this));
        }
        if (this.tryAnotherBtn) {
            this.tryAnotherBtn.addEventListener('click', this.resetToDemoView.bind(this));
        }
        if (this.downloadEnhancedBtn) {
            this.downloadEnhancedBtn.addEventListener('click', this.downloadEnhancedImage.bind(this));
        }
        
        console.log('Interactive Image Processor initialized with Replicate deployment');
    }
    
    setComparisonSlider(sliderInstance) {
        this.comparisonSlider = sliderInstance;
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
        
        // Reset button states
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.classList.remove('active');
            this.instantAiBtn.style.display = 'none';
        }
        this.uploadBtn.textContent = 'Upload Image';
        
        // Clear file input
        this.fileInput.value = '';
        
        // Remove enhanced label if it exists
        this.removeEnhancedLabel();
        
        // Show demo section
        this.demoSection.style.display = 'flex';
        
        // Hide other sections
        this.singleImageSection.style.display = 'none';
        this.finalComparisonSection.style.display = 'none';
        
        // Restart auto rotation if slider exists
        if (this.comparisonSlider) {
            this.comparisonSlider.startAutoRotation();
        }
        
        console.log('Reset to demo view');
    }
    
    // Handle download of enhanced image
    downloadEnhancedImage() {
        if (this.finalAfterImage.src) {
            // Extract filename from original upload or use default
            const originalFilename = this.uploadedFile ? this.uploadedFile.name : 'image.jpg';
            const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
            const extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1) || 'jpg';
            
            const a = document.createElement('a');
            a.href = this.finalAfterImage.src;
            a.download = `${nameWithoutExt}_enhanced.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            console.log('✅ Enhanced image downloaded successfully');
            
            // Track download event
            if (typeof AnalyticsTracker !== 'undefined') {
                AnalyticsTracker.trackEvent('enhanced_image_downloaded', {
                    filename: a.download
                });
            }
        } else {
            console.error('No enhanced image available to download');
        }
    }
    
    // Handle file selection from file dialog
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
        
        console.log('File selected:', file.name, 'Size:', file.size, 'bytes');
        
        // Stop the automatic carousel
        if (this.comparisonSlider) {
            this.comparisonSlider.stopAutoRotation();
        }
        
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
            
            // Update upload button text
            this.uploadBtn.textContent = 'Change Image';
            
            // Switch to single image view (Step 2)
            this.showSingleImageView();
            
            console.log('User image loaded successfully');
            
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
        
        // Check if enhanced image is already loaded and hide overlay if so
        if (this.finalAfterImage && this.finalAfterImage.src && this.finalAfterImage.src !== this.uploadedImage.src) {
            if (this.processingOverlay) {
                this.processingOverlay.style.display = 'none';
            }
        }
        
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
            if (!this.uploadedFile) {
                throw new Error('No file available for processing');
            }
            
            console.log('🚀 Sending image to Replicate deployment...');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Processing with SCUNet on Replicate...';
            }
            
            // Convert image to base64 for Replicate API
            const base64Image = await this.fileToBase64(this.uploadedFile);
            
            // Create payload for Replicate deployment
            const payload = {
                input: {
                    image: `data:${this.uploadedFile.type};base64,${base64Image}`,
                    model_name: this.modelType
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
                body: JSON.stringify({
                    deploymentId: this.deploymentId,
                    input: payload.input
                })
            });
            
            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Replicate API error response:', errorText);
                throw new Error(`Replicate API failed: ${response.status} - ${errorText}`);
            }
            
            // Get the prediction ID from response
            const predictionData = await response.json();
            const predictionId = predictionData.id;
            
            console.log('📋 Prediction created, waiting for completion...');
            if (this.processingStatus) {
                this.processingStatus.textContent = 'Processing image... Please wait...';
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
                
                // Hide processing overlay
                if (this.processingOverlay) {
                    this.processingOverlay.style.display = 'none';
                }
                
                // Add the "AI Enhanced" label after processing is complete
                this.addEnhancedLabel();
                
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
            
            // Set the source to trigger loading
            this.finalAfterImage.src = result.output.denoised_image;
            
            // Fallback: If image is already loaded (cached), hide overlay immediately
            if (this.finalAfterImage.complete) {
                console.log('✅ Enhanced image already loaded (cached)');
                if (this.processingOverlay) {
                    this.processingOverlay.style.display = 'none';
                }
                this.cleanupAfterProcessing();
            }
            
        } catch (error) {
            console.error('💥 Error during SCUNet enhancement:', error);
            this.handleEnhancementError(error);
        }
    }
    
    // Wait for prediction to complete
    async waitForPrediction(predictionId) {
        const maxAttempts = 60; // 5 minutes max wait
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`/api/replicate/predictions/${predictionId}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to check prediction status: ${response.status}`);
                }
                
                const prediction = await response.json();
                
                if (prediction.status === 'succeeded') {
                    return prediction;
                } else if (prediction.status === 'failed') {
                    throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
                } else if (prediction.status === 'canceled') {
                    throw new Error('Prediction was canceled');
                }
                
                // Wait 5 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
                
                // Update status
                if (this.processingStatus) {
                    this.processingStatus.textContent = `Processing... (${attempts * 5}s)`;
                }
                
            } catch (error) {
                console.error('Error checking prediction status:', error);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        throw new Error('Prediction timed out after 5 minutes');
    }
    
    // Handle enhancement errors
    handleEnhancementError(error) {
        console.error('💥 Enhancement error:', error);
        
        // Update status for error state
        if (this.processingStatus) {
            this.processingStatus.textContent = 'Enhancement failed, applying backup filter...';
        }
        
        // Show the original image as a fallback and hide processing overlay
        this.finalAfterImage.src = this.uploadedImage.src;
        this.finalAfterImage.style.filter = 'saturate(1.5) brightness(1.1) contrast(1.15)';
        
        // Hide processing overlay
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
        }
        
        // Track failed AI processing
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('ai_enhancement_failed', {
                error: error.message,
                errorType: error.constructor.name
            });
        }
        
        // Show user-friendly error message based on error type
        let userMessage = 'SCUNet enhancement temporarily unavailable. Applied basic enhancement instead.';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            userMessage = 'Cannot connect to Replicate API. Please check your internet connection.';
        } else if (error.message.includes('Replicate API failed')) {
            userMessage = 'Replicate API error. Please check your API token and deployment.';
        } else if (error.message.includes('Prediction failed')) {
            userMessage = 'Image processing failed on Replicate. Applied basic enhancement instead.';
        } else if (error.message.includes('timed out')) {
            userMessage = 'Processing timed out. Applied basic enhancement instead.';
        }
        
        alert(userMessage);
        
        // Clean up UI state
        this.cleanupAfterProcessing();
    }
    
    // Clean up UI state after processing (success or failure)
    cleanupAfterProcessing() {
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
        
        console.log('✨ Process complete - UI ready for next interaction');
    }
    
    // Force hide processing overlay (emergency cleanup)
    forceHideProcessingOverlay() {
        if (this.processingOverlay) {
            this.processingOverlay.style.display = 'none';
            console.log('🔧 Forced hide of processing overlay');
        }
    }
    
    // Add enhanced label after processing is complete
    addEnhancedLabel() {
        const enhancedSide = this.finalAfterImage.parentElement;
        if (enhancedSide && !enhancedSide.querySelector('.enhanced-label')) {
            const label = document.createElement('div');
            label.className = 'side-label enhanced-label';
            label.textContent = 'AI Enhanced';
            enhancedSide.appendChild(label);
        }
    }
    
    // Remove enhanced label when resetting
    removeEnhancedLabel() {
        const enhancedSide = this.finalAfterImage.parentElement;
        if (enhancedSide) {
            const existingLabel = enhancedSide.querySelector('.enhanced-label');
            if (existingLabel) {
                existingLabel.remove();
            }
        }
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

// Enhanced Image Comparison Slider with upload integration
class ImageComparisonSlider {
    constructor() {
        this.currentImageIndex = 0;
        this.isDragging = false;
        this.sliderPosition = 50; // percentage
        this.autoRotationInterval = null;
        this.isAutoRotationActive = true;
        
        // Get DOM elements
        this.slider = document.getElementById('comparisonSlider');
        this.divider = document.getElementById('divider');
        this.demoBeforeImg = document.getElementById('beforeImg');
        this.demoAfterImg = document.getElementById('afterImg');
        this.afterContainer = this.demoAfterImg.parentElement;
        
        this.init();
    }
    
    init() {
        this.loadImagePair(0);
        this.setupEventListeners();
        this.startAutoRotation();
    }
    
    // Stop auto rotation when user uploads image
    stopAutoRotation() {
        if (this.autoRotationInterval) {
            clearInterval(this.autoRotationInterval);
            this.autoRotationInterval = null;
            this.isAutoRotationActive = false;
            console.log('Auto rotation stopped - user image uploaded');
        }
    }
    
    // Restart auto rotation (if needed)
    startAutoRotation() {
        if (!this.isAutoRotationActive) return;
        
        // Auto-rotate images every 6 seconds
        this.autoRotationInterval = setInterval(() => {
            if (!this.isDragging && this.isAutoRotationActive) {
                const nextIndex = (this.currentImageIndex + 1) % imagePairs.length;
                this.loadImagePair(nextIndex);
            }
        }, 6000);
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
            
            // Apply filter to before image to simulate original quality
            this.demoBeforeImg.style.filter = 'brightness(0.8) contrast(0.9) saturate(0.7)';
            
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
            }, 500);
        }, 250);
        
        this.currentImageIndex = index;
    }
    
    setupEventListeners() {
        // Mouse events for dragging
        this.divider.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // Touch events for mobile
        this.divider.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
        document.addEventListener('touchend', this.endDrag.bind(this));
        
        // Click events on slider area
        this.slider.addEventListener('click', this.handleClick.bind(this));
        
        // Prevent image dragging
        this.demoBeforeImg.addEventListener('dragstart', (e) => e.preventDefault());
        this.demoAfterImg.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.slider.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const rect = this.slider.getBoundingClientRect();
        const position = ((clientX - rect.left) / rect.width) * 100;
        
        this.updateSliderPosition(Math.max(0, Math.min(100, position)));
    }
    
    endDrag() {
        this.isDragging = false;
        this.slider.style.cursor = 'grab';
        document.body.style.userSelect = '';
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        
        const rect = this.slider.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        this.updateSliderPosition(Math.max(0, Math.min(100, position)));
    }
    
    updateSliderPosition(position) {
        this.sliderPosition = position;
        
        // Update divider position
        this.divider.style.left = `${position}%`;
        
        // Update after image clip path
        this.afterContainer.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
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