# Opera - AI Image Enhancement Landing Page

## Overview

Opera is a modern AI image enhancement landing page featuring an interactive before-and-after image comparison slider with full upload and AI processing capabilities. The application showcases AI-powered image enhancement capabilities through both automated rotating gallery demonstrations and user-uploaded image processing. Users can upload their own images, stop the automatic carousel, and simulate AI enhancement processing with visual feedback. The design emphasizes visual appeal with a clean, professional interface optimized for showcasing image enhancement results.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a vanilla JavaScript approach with a single-page architecture:

**HTML Structure**: Standard HTML5 semantic structure with a fixed navigation header and main content area containing the image comparison slider and promotional content.

**CSS Styling**: Custom CSS with modern design principles including:
- CSS Grid and Flexbox for responsive layouts
- CSS custom properties for consistent theming
- Backdrop filters and transitions for modern visual effects
- Mobile-first responsive design approach

**JavaScript Architecture**: Object-oriented design with multiple classes:
- `ImageComparisonSlider`: Handles image rotation logic, interactive drag functionality, smooth transitions, and auto-rotation management
- `InteractiveImageProcessor`: Manages file upload functionality, FileReader API integration, dual backend support (local + RunPod fallback)
- `NavigationHandler`: Handles navigation menu interactions
- `ImageLoader`: Preloads images for performance optimization

### Backend Architecture
**Local Backend**: Flask-based Python server running on port 5001:
- Simplified image enhancement using PIL (Pillow) with noise reduction, sharpening, contrast, and color enhancement
- Compatible API format with RunPod for seamless fallback
- SCUNet models downloaded (`scunet_color_real_psnr.pth` and `scunet_color_real_gan.pth`) for future integration
- Endpoints: `/enhance` (POST) for processing, `/health` (GET) for status
- Task support: Real_Denoising, Color_Denoising, Super_Resolution, JPEG_Artifact_Reduction

**Dual Backend System**: Frontend automatically tries local backend first, falls back to RunPod if local fails

**Note**: Full SCUNet integration requires additional dependencies (einops, timm, thop) that have platform compatibility issues. The current simplified backend provides working image enhancement while maintaining API compatibility.

### Layout System
**Desktop Layout**: Two-column layout with the image slider occupying 50-60% of viewport width on the left, and promotional content on the right.

**Mobile Layout**: Vertical stacking with the slider positioned above the text content for optimal mobile viewing.

### Interactive Components
**Image Comparison Slider**: Core feature implementing a draggable divider system that allows users to compare before and after images by sliding a vertical divider left and right.

**Auto-Rotation System**: Automated cycling through multiple image pairs every 5-6 seconds to showcase different enhancement examples. Automatically stops when user uploads an image.

**File Upload System**: Hidden file input triggered by "Upload Image" button using FileReader API to process user-selected images. Validates file types and provides error handling.

**AI Processing Integration**: Interactive "Instant AI" button that becomes active after image upload, shows loading indicator, and makes real API calls to RunPod serverless endpoint for actual AI image enhancement. Includes fallback CSS filter enhancement if API is unavailable.

**Loading Indicator**: Animated spinner with backdrop blur effect that appears during AI processing simulation.

## External Dependencies

### Fonts
- **Google Fonts**: Rethink Sans (primary headings) and Inter (body text) imported via CDN
- Font weights: 300, 400, 500, 600, 700 for typography hierarchy

### Image Assets
- **Pixabay CDN**: External image hosting service providing high-quality placeholder images for the before/after demonstration
- Multiple image pairs stored in JavaScript array for rotation functionality

### Browser APIs
- **DOM Manipulation**: Native browser APIs for element selection and event handling
- **CSS Transitions**: Browser-native animation capabilities for smooth visual effects
- **Touch/Mouse Events**: Cross-device interaction support for the draggable slider functionality

### Backend Services
- **Local Backend**: Flask server (port 5001) with SCUNet models for local AI processing
- **RunPod Serverless API**: Fallback cloud processing via `https://h926ogbmilgvql.api.runpod.ai/runsync`
- **Dual Backend Logic**: Automatic failover from local to cloud processing
- **Error Handling**: Comprehensive try-catch-finally blocks with intelligent fallback
- **API Integration**: Unified JSON payload format for both backends
- **Status Feedback**: Progressive status updates with backend switching notifications

The application now supports both local AI processing and cloud fallback, providing optimal performance and reliability.