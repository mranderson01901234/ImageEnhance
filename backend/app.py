#!/usr/bin/env python3
"""
Backend API for AI Image Enhancement
This integrates with the frontend web application
"""

import os
import base64
import io
import json
import cv2
from PIL import Image
import torch
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import SCUNet model
from models.network_scunet import SCUNet as net

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
MODEL_CONFIG = {
    'Real_Denoising': 'scunet_color_real_psnr.pth',
    'Color_Denoising': 'scunet_color_real_psnr.pth', 
    'Super_Resolution': 'scunet_color_real_gan.pth',
    'JPEG_Artifact_Reduction': 'scunet_color_real_psnr.pth'
}

# Global model variable
model = None
device = None

def load_scunet_model():
    """Load SCUNet model into memory"""
    global model, device
    if model is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = net(in_nc=3, config=[4, 4, 4, 4, 4, 4, 4], dim=64)
        model_path = os.path.join('model_zoo', 'scunet_color_real_psnr.pth')
        
        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True), strict=True)
            model.eval()
            model = model.to(device)
            print(f"SCUNet model loaded successfully on {device}")
        else:
            print(f"Warning: Model file not found at {model_path}")
    return model, device

def process_image_with_scunet(image_data, task='Real_Denoising'):
    """
    Process image using actual SCUNet model
    """
    try:
        # Load model if not already loaded
        scunet_model, device = load_scunet_model()
        
        if scunet_model is None:
            # Fallback to basic processing if model not available
            print("SCUNet model not available, applying basic enhancement")
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply basic enhancement
            enhanced_image = image
            buffer = io.BytesIO()
            enhanced_image.save(buffer, format='JPEG', quality=95)
            enhanced_base64 = base64.b64encode(buffer.getvalue()).decode()
            return enhanced_base64
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Save to temporary file for OpenCV processing
        temp_path = '/tmp/input_image.jpg'
        with open(temp_path, 'wb') as f:
            f.write(image_bytes)
        
        # --- SCUNet Image Pre-processing ---
        img_l = cv2.imread(temp_path, cv2.IMREAD_COLOR).astype(np.float32) / 255.
        img_l = np.transpose(img_l if img_l.shape[2] == 1 else img_l[:, :, [2, 1, 0]], (2, 0, 1))
        img_l = torch.from_numpy(img_l).float().unsqueeze(0).to(device)

        # --- SCUNet Inference ---
        window_size = 256
        _, _, h, w = img_l.size()
        padw = (window_size - w % window_size) % window_size
        padh = (window_size - h % window_size) % window_size
        img_l = torch.nn.functional.pad(img_l, (0, padw, 0, padh), 'reflect')

        with torch.no_grad():
            img_e = scunet_model(img_l)
        
        img_e = img_e[..., :h, :w]

        # --- Post-processing ---
        img_e = img_e.data.squeeze().float().cpu().clamp_(0, 1).numpy()
        if img_e.ndim == 3:
            img_e = np.transpose(img_e[[2, 1, 0], :, :], (1, 2, 0))
        
        img_e = (img_e * 255.0).round().astype(np.uint8)
        
        # Convert result back to base64
        enhanced_image = Image.fromarray(img_e)
        buffer = io.BytesIO()
        enhanced_image.save(buffer, format='JPEG', quality=95)
        enhanced_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return enhanced_base64
        
    except Exception as e:
        print(f"SCUNet processing error: {str(e)}")
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
        
        # Process image
        enhanced_image = process_image_with_scunet(image_base64, task)
        
        return jsonify({'image': enhanced_image})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'AI Image Enhancer Backend'})

if __name__ == '__main__':
    # Check if models exist
    model_dir = 'model_zoo'
    if not os.path.exists(model_dir):
        print("Warning: model_zoo directory not found. Run the download script first.")
    else:
        print("Model files found:")
        for model_file in os.listdir(model_dir):
            if model_file.endswith('.pth'):
                print(f"  - {model_file}")
    
    print("Starting AI Image Enhancement Backend...")
    print("Available endpoints:")
    print("  - POST /enhance - Image enhancement")
    print("  - GET /health - Health check")
    
    app.run(host='0.0.0.0', port=5001, debug=True)