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
        this.beforeImg = document.getElementById('beforeImg');
        this.afterImg = document.getElementById('afterImg');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.statusText = document.getElementById('status-text');
        this.comparisonSlider = null;
        this.userImageUploaded = false;
        this.uploadedFile = null;
        
        // Local SCUNet backend configuration
        this.backendUrl = 'http://localhost:5000/enhance';
        this.modelType = 'gan'; // or 'psnr' based on your preference
        
        this.init();
    }
    
    init() {
        // Initially disable the Instant AI button
        this.instantAiBtn.classList.add('disabled');
        
        // Set up event listeners
        this.uploadBtn.addEventListener('click', this.handleUploadClick.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        this.instantAiBtn.addEventListener('click', this.handleInstantAiClick.bind(this));
        
        console.log('Interactive Image Processor initialized with local SCUNet backend');
    }
    
    setComparisonSlider(sliderInstance) {
        this.comparisonSlider = sliderInstance;
    }
    
    // Handle upload button click - trigger hidden file input
    handleUploadClick() {
        console.log('Upload button clicked - triggering file input');
        this.fileInput.click();
        
        // Track upload button interaction
        AnalyticsTracker.trackEvent('upload_button_clicked');
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
            this.instantAiBtn.classList.remove('disabled');
            this.instantAiBtn.classList.add('active');
            
            // Update upload button text
            this.uploadBtn.textContent = 'Change Image';
            
            console.log('User image loaded successfully');
            
            // Track successful upload
            AnalyticsTracker.trackEvent('image_uploaded', {
                fileSize: file.size,
                fileType: file.type
            });
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            alert('Error reading the selected file. Please try again.');
        };
        
        // Read the file as data URL
        reader.readAsDataURL(file);
    }
    
    // Handle Instant AI button click - start local SCUNet processing
    handleInstantAiClick() {
        // Only proceed if user has uploaded an image and button is active
        if (!this.userImageUploaded || this.instantAiBtn.classList.contains('disabled')) {
            console.log('AI processing blocked - no image uploaded or button disabled');
            return;
        }
        
        console.log('Starting SCUNet enhancement process with local backend...');
        
        // Show loading indicator with initial status
        this.loadingIndicator.classList.add('show');
        this.statusText.textContent = 'Processing with SCUNet...';
        
        // Disable the button during processing
        this.instantAiBtn.classList.add('disabled');
        this.instantAiBtn.classList.remove('active');
        
        // Store processing start time for analytics
        this.processingStartTime = Date.now();
        
        // Start the local SCUNet enhancement
        this.startLocalEnhancement();
        
        // Track AI processing start
        AnalyticsTracker.trackEvent('ai_enhancement_started');
    }
    
    // Process image with local SCUNet backend
    async startLocalEnhancement() {
        try {
            if (!this.uploadedFile) {
                throw new Error('No file available for processing');
            }
            
            console.log('🚀 Sending image to local SCUNet backend...');
            this.statusText.textContent = 'Processing with SCUNet...';
            
            // Create FormData to send the image file
            const formData = new FormData();
            formData.append('image', this.uploadedFile);
            formData.append('model_type', this.modelType);
            
            // Make the request to local backend
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend processing failed: ${response.status} - ${errorText}`);
            }
            
            // Get the enhanced image blob
            const enhancedImageBlob = await response.blob();
            
            console.log('✅ SCUNet enhancement completed successfully!');
            this.statusText.textContent = 'Enhancement complete! Loading result...';
            
            // Create object URL for the enhanced image
            const enhancedImageUrl = URL.createObjectURL(enhancedImageBlob);
            
            // Load the enhanced image into the "after" image element
            this.afterImg.onload = () => {
                console.log('✅ Enhanced image loaded successfully');
                this.statusText.textContent = 'Enhancement complete!';
                
                // Remove any temporary CSS filters
                this.afterImg.style.filter = '';
                
                // Track successful AI processing completion
                AnalyticsTracker.trackEvent('ai_enhancement_completed', {
                    success: true,
                    processingTime: Date.now() - this.processingStartTime
                });
                
                // Clean up UI state
                this.cleanupAfterProcessing();
                
                // Clean up the object URL
                URL.revokeObjectURL(enhancedImageUrl);
            };
            
            this.afterImg.onerror = () => {
                throw new Error('Failed to load enhanced image');
            };
            
            // Set the source to trigger loading
            this.afterImg.src = enhancedImageUrl;
            
        } catch (error) {
            console.error('💥 Error during SCUNet enhancement:', error);
            this.handleEnhancementError(error);
        }
    }
    
    // Handle enhancement errors
    handleEnhancementError(error) {
        console.error('💥 Enhancement error:', error);
        
        // Update status for error state
        this.statusText.textContent = 'Enhancement failed, applying backup filter...';
        
        // Fallback: Apply CSS filter enhancement if backend fails
        this.afterImg.style.filter = 'saturate(1.5) brightness(1.1) contrast(1.15)';
        
        // Track failed AI processing
        AnalyticsTracker.trackEvent('ai_enhancement_failed', {
            error: error.message,
            errorType: error.constructor.name
        });
        
        // Show user-friendly error message based on error type
        let userMessage = 'SCUNet enhancement temporarily unavailable. Applied basic enhancement instead.';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            userMessage = 'Cannot connect to backend server. Please ensure the SCUNet backend is running.';
        } else if (error.message.includes('Backend processing failed')) {
            userMessage = 'Backend processing error. Applied basic enhancement instead.';
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
        
        console.log('✨ Process complete - UI ready for next interaction');
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
        this.beforeImg = document.getElementById('beforeImg');
        this.afterImg = document.getElementById('afterImg');
        this.afterContainer = this.afterImg.parentElement;
        
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
        this.beforeImg.classList.add('fade-transition');
        this.afterImg.classList.add('fade-transition');
        
        // Fade out
        this.beforeImg.classList.add('fade-out');
        this.afterImg.classList.add('fade-out');
        
        setTimeout(() => {
            // Load new images
            this.beforeImg.src = pair.before;
            this.afterImg.src = pair.after;
            
            // Apply filter to before image to simulate original quality
            this.beforeImg.style.filter = 'brightness(0.8) contrast(0.9) saturate(0.7)';
            
            // Enhanced styling for after image
            this.afterImg.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.3) sharpen(1.2)';
            
            // Fade in
            this.beforeImg.classList.remove('fade-out');
            this.afterImg.classList.remove('fade-out');
            this.beforeImg.classList.add('fade-in');
            this.afterImg.classList.add('fade-in');
            
            setTimeout(() => {
                // Remove transition classes after animation
                this.beforeImg.classList.remove('fade-transition', 'fade-in');
                this.afterImg.classList.remove('fade-transition', 'fade-in');
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
        this.beforeImg.addEventListener('dragstart', (e) => e.preventDefault());
        this.afterImg.addEventListener('dragstart', (e) => e.preventDefault());
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Image Enhancer Landing Page - Initializing...');
    
    // Initialize all components
    const comparisonSlider = new ImageComparisonSlider();
    const interactiveProcessor = new InteractiveImageProcessor();
    new NavigationHandler();
    
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