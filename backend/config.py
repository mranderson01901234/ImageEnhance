#!/usr/bin/env python3
"""
Configuration file for the AI Image Enhancement Backend
"""

import os

# Replicate API Configuration
REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN', '')
REPLICATE_API_URL = 'https://api.replicate.com/v1'

# Server Configuration
PORT = int(os.getenv('PORT', 5001))
HOST = os.getenv('HOST', '0.0.0.0')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Model Configuration
MODEL_CONFIG = {
    'Real_Denoising': 'scunet_color_real_psnr.pth',
    'Color_Denoising': 'scunet_color_real_psnr.pth', 
    'Super_Resolution': 'scunet_color_real_gan.pth',
    'JPEG_Artifact_Reduction': 'scunet_color_real_psnr.pth'
}

# Default model type
DEFAULT_MODEL_TYPE = 'real image denoising' 