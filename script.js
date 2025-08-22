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
        this.globalLoadingIndicator = document.getElementById('global-loading-indicator');
        this.globalStatusText = document.getElementById('global-status-text');
        this.demoSection = document.getElementById('demo-section');
        this.singleImageSection = document.getElementById('single-image-section');
        this.finalComparisonSection = document.getElementById('final-comparison-section');
        this.comparisonSlider = null;
        this.userImageUploaded = false;
        this.uploadedFile = null;
        
        // Replicate deployment configuration
        this.replicateApiToken = process.env.REPLICATE_API_TOKEN || '';
        this.deploymentId = 'mranderson01901234/my-scunet2point0';
        this.modelType = 'real image denoising (FP16 Optimized)'; // Default model type
        
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
        
        console.log('Interactive Image Processor initialized with Replicate SCUNet API (FP16)');
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
            
            // Update both before and after images with user's upload
            this.beforeImg.src = imageDataUrl;
            this.afterImg.src = imageDataUrl;
            
            // Remove any existing filters
            this.beforeImg.style.filter = '';
            this.afterImg.style.filter = '';
            
            // Mark that user has uploaded an image and store the file
            this.userImageUploaded = true;
            this.uploadedFile = file;
            
            // Enable the Instant AI button
            if (this.instantAiBtn) {
                this.instantAiBtn.classList.remove('disabled');
                this.instantAiBtn.classList.add('active');
                this.instantAiBtn.style.display = 'block';
            }
            
            // Update upload button text
            this.uploadBtn.textContent = 'Change Image';
            
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
    
    // Handle Instant AI button click - start Replicate SCUNet processing
    handleInstantAiClick() {
        // Only proceed if user has uploaded an image and button is active
        if (!this.userImageUploaded || this.instantAiBtn.classList.contains('disabled')) {
            console.log('AI processing blocked - no image uploaded or button disabled');
            return;
        }
        
        console.log('Starting SCUNet enhancement process with Replicate...');
        
        // Show loading indicator with initial status
        this.loadingIndicator.classList.add('show');
        this.statusText.textContent = 'Processing with SCUNet (FP16)...';
        
        // Disable the button during processing
        this.instantAiBtn.classList.add('disabled');
        this.instantAiBtn.classList.remove('active');
        
        // Store processing start time for analytics
        this.processingStartTime = Date.now();
        
        // Start the Replicate SCUNet enhancement
        this.startReplicateEnhancement();
        
        // Track AI processing start
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('ai_enhancement_started');
        }
    }
    
    // Process image with Replicate SCUNet API
    async startReplicateEnhancement() {
        try {
            if (!this.uploadedFile) {
                throw new Error('No file available for processing');
            }
            
            console.log('🚀 Sending image to Replicate SCUNet API...');
            this.statusText.textContent = 'Processing with SCUNet (FP16)...';
            
            // Convert image to base64 for Replicate API
            const base64Image = await this.fileToBase64(this.uploadedFile);
            
            // Make prediction request to Replicate
            const prediction = await this.createPrediction(base64Image);
            
            // Poll for completion
            const result = await this.waitForPrediction(prediction.id);
            
            console.log('✅ SCUNet enhancement completed successfully!');
            this.statusText.textContent = 'Enhancement complete! Loading result...';
            
            // Load the enhanced image from Replicate
            this.afterImg.onload = () => {
                console.log('✅ Enhanced image loaded successfully');
                this.statusText.textContent = 'Enhancement complete!';
                
                // Remove any temporary CSS filters
                this.afterImg.style.filter = '';
                
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
            
            this.afterImg.onerror = () => {
                throw new Error('Failed to load enhanced image');
            };
            
            // Set the source to trigger loading
            this.afterImg.src = result;
            
        } catch (error) {
            console.error('💥 Error during SCUNet enhancement:', error);
            this.handleEnhancementError(error);
        }
    }
    
    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    // Create prediction on Replicate
    async createPrediction(base64Image) {
        const response = await fetch('/api/replicate/predictions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deploymentId: this.deploymentId,
                input: {
                    image: `data:image/jpeg;base64,${base64Image}`
                }
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create prediction: ${error.error || response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Wait for prediction to complete
    async waitForPrediction(predictionId) {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const response = await fetch(`/api/replicate/predictions/${predictionId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to check prediction status: ${response.statusText}`);
            }
            
            const prediction = await response.json();
            
            if (prediction.status === 'succeeded') {
                return prediction.output;
            } else if (prediction.status === 'failed') {
                throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
            }
            
            // Wait 5 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
            
            // Update status
            this.statusText.textContent = `Processing... (${attempts * 5}s)`;
        }
        
        throw new Error('Prediction timed out after 5 minutes');
    }
    
    // Handle enhancement errors
    handleEnhancementError(error) {
        console.error('💥 Enhancement error:', error);
        
        // Update status for error state
        this.statusText.textContent = 'Enhancement failed, applying backup filter...';
        
        // Fallback: Apply CSS filter enhancement if backend fails
        this.afterImg.style.filter = 'saturate(1.5) brightness(1.1) contrast(1.15)';
        
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
        } else if (error.message.includes('Prediction failed')) {
            userMessage = 'AI processing failed. Applied basic enhancement instead.';
        } else if (error.message.includes('timed out')) {
            userMessage = 'Processing took too long. Applied basic enhancement instead.';
        }
        
        alert(userMessage);
        
        // Clean up UI state
        this.cleanupAfterProcessing();
    }
    
    // Clean up UI state after processing (success or failure)
    cleanupAfterProcessing() {
        console.log('🏁 Cleaning up UI state...');
        
        // Always hide loading indicator
        this.loadingIndicator.classList.remove('show');
        
        // Re-enable the button (allow multiple enhancements)
        this.instantAiBtn.classList.remove('disabled');
        this.instantAiBtn.classList.add('active');
    }
    
    // Reset to demo view
    resetToDemoView() {
        console.log('🔄 Resetting to demo view...');
        
        // Reset user state
        this.userImageUploaded = false;
        this.uploadedFile = null;
        
        // Reset button states
        this.uploadBtn.textContent = 'Upload Image';
        if (this.instantAiBtn) {
            this.instantAiBtn.classList.add('disabled');
            this.instantAiBtn.classList.remove('active');
            this.instantAiBtn.style.display = 'none';
        }
        
        // Reset images to demo
        this.beforeImg.src = imagePairs[0].before;
        this.afterImg.src = imagePairs[0].after;
        
        // Remove any filters
        this.beforeImg.style.filter = '';
        this.afterImg.style.filter = '';
        
        // Restart carousel if available
        if (this.comparisonSlider) {
            this.comparisonSlider.startAutoRotation();
        }
        
        // Track reset event
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('reset_to_demo');
        }
    }
    
    // Download enhanced image
    downloadEnhancedImage() {
        if (!this.afterImg.src || this.afterImg.src === this.beforeImg.src) {
            alert('No enhanced image available to download.');
            return;
        }
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = this.afterImg.src;
        link.download = 'enhanced-image.png';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Track download event
        if (typeof AnalyticsTracker !== 'undefined') {
            AnalyticsTracker.trackEvent('image_downloaded');
        }
    }
}

// Analytics Tracker
class AnalyticsTracker {
    static trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            timestamp: Date.now(),
            ...properties
        };
        
        console.log('Analytics Event:', eventName, event);
        
        // Here you would typically send to your analytics service
        // For now, we'll just log to console
    }
}

// Comparison Slider functionality
class ComparisonSlider {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.beforeImage = this.container.querySelector('.before-image img');
        this.afterImage = this.container.querySelector('.after-image img');
        this.divider = this.container.querySelector('.divider');
        this.isDragging = false;
        this.autoRotationInterval = null;
        this.currentImageIndex = 0;
        
        this.init();
    }
    
    init() {
        // Set initial images
        this.updateImages(0);
        
        // Set up event listeners
        this.divider.addEventListener('mousedown', this.startDragging.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDragging.bind(this));
        
        // Touch events for mobile
        this.divider.addEventListener('touchstart', this.startDragging.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.stopDragging.bind(this));
        
        // Start auto-rotation
        this.startAutoRotation();
        
        console.log('Comparison Slider initialized');
    }
    
    startDragging(e) {
        this.isDragging = true;
        e.preventDefault();
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const rect = this.container.getBoundingClientRect();
        const x = (e.type === 'mousemove' ? e.clientX : e.touches[0].clientX) - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        this.divider.style.left = percentage + '%';
        this.afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    }
    
    stopDragging() {
        this.isDragging = false;
    }
    
    updateImages(index) {
        const pair = imagePairs[index];
        this.beforeImage.src = pair.before;
        this.afterImage.src = pair.after;
        this.currentImageIndex = index;
    }
    
    startAutoRotation() {
        this.autoRotationInterval = setInterval(() => {
            this.currentImageIndex = (this.currentImageIndex + 1) % imagePairs.length;
            this.updateImages(this.currentImageIndex);
        }, 5000); // Change every 5 seconds
    }
    
    stopAutoRotation() {
        if (this.autoRotationInterval) {
            clearInterval(this.autoRotationInterval);
            this.autoRotationInterval = null;
            console.log('Auto rotation stopped - user image uploaded');
        }
    }
    
    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % imagePairs.length;
        this.updateImages(this.currentImageIndex);
    }
    
    previousImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + imagePairs.length) % imagePairs.length;
        this.updateImages(this.currentImageIndex);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Image Enhancer Landing Page - Initializing...');
    
    // Initialize comparison slider
    const slider = new ComparisonSlider('comparisonSlider');
    
    // Initialize interactive image processor
    const processor = new InteractiveImageProcessor();
    
    // Connect the slider to the processor
    processor.setComparisonSlider(slider);
    
    console.log('Application initialized successfully');
    
    // Track page view
    AnalyticsTracker.trackEvent('page_view', {
        page: 'landing_page',
        timestamp: Date.now(),
        userAgent: navigator.userAgent
    });
});