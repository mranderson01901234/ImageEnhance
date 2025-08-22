#!/usr/bin/env python3
"""
Simplified Backend API for AI Image Enhancement
Uses basic image processing for demonstration purposes
"""

import os
import base64
import io
from PIL import Image, ImageEnhance, ImageFilter
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def enhance_image_basic(image_data, task='Real_Denoising'):
    """
    Apply basic image enhancements using PIL
    This serves as a working backend while SCUNet setup is being resolved
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Apply enhancement based on task
        if task in ['Real_Denoising', 'Color_Denoising']:
            # Apply noise reduction via subtle blur and sharpening
            enhanced = image.filter(ImageFilter.GaussianBlur(radius=0.5))
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.2)
            
        elif task == 'Super_Resolution':
            # Resize and sharpen for super resolution effect
            w, h = image.size
            enhanced = image.resize((int(w*1.25), int(h*1.25)), Image.Resampling.LANCZOS)
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.3)
            
        elif task == 'JPEG_Artifact_Reduction':
            # Apply gentle blur to reduce artifacts
            enhanced = image.filter(ImageFilter.GaussianBlur(radius=0.3))
            
        else:
            enhanced = image
        
        # Apply general enhancements
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = enhancer.enhance(1.1)
        
        # Enhance color saturation
        enhancer = ImageEnhance.Color(enhanced)
        enhanced = enhancer.enhance(1.15)
        
        # Enhance brightness slightly
        enhancer = ImageEnhance.Brightness(enhanced)
        enhanced = enhancer.enhance(1.05)
        
        # Convert back to base64
        buffer = io.BytesIO()
        enhanced.save(buffer, format='JPEG', quality=95, optimize=True)
        enhanced_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return enhanced_base64
        
    except Exception as e:
        raise Exception(f"Image processing failed: {str(e)}")

@app.route('/enhance', methods=['POST'])
def enhance_image():
    """
    Endpoint for image enhancement
    Compatible with RunPod format
    """
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data or 'input' not in data:
            return jsonify({'error': 'Missing input data'}), 400
        
        job_input = data['input']
        
        # Validate required fields
        if 'image' not in job_input:
            return jsonify({'error': 'No image provided in the job input.'}), 400
        
        image_base64 = job_input['image']
        task = job_input.get('task', 'Real_Denoising')
        
        print(f"Processing image enhancement - Task: {task}")
        
        # Process image
        enhanced_image = enhance_image_basic(image_base64, task)
        
        return jsonify({'image': enhanced_image})
        
    except Exception as e:
        print(f"Enhancement error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Simplified AI Image Enhancer Backend'})

if __name__ == '__main__':
    print("Starting Simplified AI Image Enhancement Backend...")
    print("Available endpoints:")
    print("  - POST /enhance - Image enhancement (basic PIL processing)")
    print("  - GET /health - Health check")
    
    app.run(host='0.0.0.0', port=5001, debug=True)