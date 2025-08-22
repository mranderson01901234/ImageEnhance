# predict.py
from cog import BasePredictor, Input, Path
import torch
import cv2
import numpy as np
from PIL import Image
import os

# This assumes you have the 'models' and 'utils' directories from the SCUNet
# repository in the same directory as this script.
from models.network_scunet import SCUNet as net

class Predictor(BasePredictor):
    def setup(self):
        """Loads the model into memory to make running multiple predictions efficient"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = net(in_nc=3, config=[4, 4, 4, 4, 4, 4, 4], dim=64)
        model_path = 'model_zoo/scunet_color_real_psnr.pth'
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}.")

        # Use weights_only=True for added security
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True), strict=True)
        self.model.eval()
        self.model = self.model.to(self.device)
        print("Model loaded successfully.")

    def predict(self, image: Path = Input(description="Input image")) -> Path:
        """Runs a single prediction on the model"""
        # --- Image Pre-processing ---
        img_l = cv2.imread(str(image), cv2.IMREAD_COLOR).astype(np.float32) / 255.
        img_l = np.transpose(img_l if img_l.shape[2] == 1 else img_l[:, :, [2, 1, 0]], (2, 0, 1))
        img_l = torch.from_numpy(img_l).float().unsqueeze(0).to(self.device)

        # --- Inference ---
        window_size = 256
        _, _, h, w = img_l.size()
        padw = (window_size - w % window_size) % window_size
        padh = (window_size - h % window_size) % window_size
        img_l = torch.nn.functional.pad(img_l, (0, padw, 0, padh), 'reflect')

        with torch.no_grad():
            img_e = self.model(img_l)
        
        img_e = img_e[..., :h, :w]

        # --- Post-processing ---
        img_e = img_e.data.squeeze().float().cpu().clamp_(0, 1).numpy()
        if img_e.ndim == 3:
            img_e = np.transpose(img_e[[2, 1, 0], :, :], (1, 2, 0))
        
        img_e = (img_e * 255.0).round().astype(np.uint8)
        
        # Save the output image
        output_image = Image.fromarray(img_e)
        output_path = Path("/tmp/output.png")
        output_image.save(output_path)
        
        return output_path