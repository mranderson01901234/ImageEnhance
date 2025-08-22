#!/usr/bin/env python3
"""
Download script for SCUNet pretrained models
This script downloads the required models for image enhancement
"""

import os
import requests
import argparse
from urllib.parse import urlparse

# SCUNet model URLs
MODEL_URLS = {
    "SCUNet": {
        "scunet_color_real_psnr.pth": "https://github.com/cszn/KAIR/releases/download/v1.0/scunet_color_real_psnr.pth",
        "scunet_color_real_gan.pth": "https://github.com/cszn/KAIR/releases/download/v1.0/scunet_color_real_gan.pth"
    }
}

def download_file(url, filepath):
    """Download a file from URL to filepath"""
    print(f"Downloading {os.path.basename(filepath)}...")
    
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"Downloaded: {filepath}")

def main():
    parser = argparse.ArgumentParser(description='Download SCUNet pretrained models')
    parser.add_argument('--models', default='SCUNet', help='Models to download')
    parser.add_argument('--model_dir', default='model_zoo', help='Directory to save models')
    
    args = parser.parse_args()
    
    model_dir = args.model_dir
    
    if args.models == "SCUNet":
        for model_name, url in MODEL_URLS["SCUNet"].items():
            filepath = os.path.join(model_dir, model_name)
            try:
                download_file(url, filepath)
            except Exception as e:
                print(f"Failed to download {model_name}: {e}")
    
    print("Model download completed!")

if __name__ == "__main__":
    main()