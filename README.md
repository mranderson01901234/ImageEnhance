# ImageEnhance - AI-Powered Image Enhancement Tool

A modern, interactive web application that enhances images using the SCUNet AI model. Built with a responsive frontend and a Python backend powered by PyTorch.

## ✨ Features

- **AI-Powered Enhancement**: Uses SCUNet (Supervised Contrastive Unpaired Network) for professional image enhancement
- **Interactive Before/After Comparison**: Drag-and-drop slider to compare original vs enhanced images
- **Real-time Processing**: Local backend processing for fast and secure image enhancement
- **Modern UI/UX**: Premium dark theme with responsive design built using Tailwind CSS
- **Multiple Model Support**: Choose between GAN and PSNR optimization models
- **File Upload Support**: Drag and drop or click to upload your own images
- **Auto-rotation Gallery**: Showcase of enhancement examples with automatic transitions

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- PyTorch
- OpenCV
- Flask

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ImageEnhance.git
   cd ImageEnhance
   ```

2. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   # or using uv (recommended)
   uv sync
   ```

3. **Download pre-trained models**
   ```bash
   python main_download_pretrained_models.py
   ```

4. **Start the backend server**
   ```bash
   python app.py
   ```

5. **Open the frontend**
   - Open `index.html` in your browser
   - Or serve it using a local server: `python -m http.server 8000`

## 🏗️ Project Structure

```
ImageEnhance/
├── backend/                 # Python backend
│   ├── app.py              # Flask server
│   ├── predict.py          # SCUNet prediction logic
│   ├── models/             # Neural network models
│   ├── model_zoo/          # Pre-trained model weights
│   └── utils/              # Utility functions
├── index.html              # Main application page
├── script.js               # Frontend JavaScript logic
├── style.css               # Styling and animations
└── README.md               # This file
```

## 🎯 Usage

1. **Upload an Image**: Click the upload button or drag and drop an image file
2. **Choose Enhancement**: Select your preferred model type (GAN or PSNR)
3. **Process**: Click "Instant AI" to enhance your image
4. **Compare**: Use the interactive slider to compare before and after results
5. **Download**: Save your enhanced image

## 🔧 Configuration

### Backend Settings

The backend can be configured in `backend/config.py`:

- **Port**: Default is 5001
- **Replicate API**: Configure your Replicate API token
- **Model Type**: Choose between different SCUNet configurations
- **Image Processing**: Adjust quality and optimization parameters

### Replicate Integration

The application now supports Replicate deployment for enhanced AI processing:

1. **Set Environment Variable**: 
   ```bash
   export REPLICATE_API_TOKEN="your_replicate_token_here"
   ```

2. **Start Backend**: 
   ```bash
   ./start_backend.sh
   ```

3. **Model Version**: Currently configured to use `mranderson01901234/my-scunet2point0`

### Frontend Customization

### Frontend Customization

- **Theme**: Modify colors in `style.css`
- **Animations**: Adjust transition timings and effects
- **Layout**: Customize responsive breakpoints

## 🧠 AI Model Details

**SCUNet (Supervised Contrastive Unpaired Network)** is a state-of-the-art image enhancement model that:

- Improves image quality without requiring paired training data
- Uses contrastive learning for better feature representation
- Supports both GAN and PSNR optimization objectives
- Processes images in real-time on modern hardware

## 🛠️ Development

### Adding New Features

1. **Backend**: Extend `app.py` with new endpoints
2. **Frontend**: Add new UI components in `script.js`
3. **Styling**: Update `style.css` for new visual elements

### Testing

```bash
# Run backend tests
cd backend
python -m pytest

# Frontend testing
# Open browser dev tools and check console for errors
```

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SCUNet**: The core AI model for image enhancement
- **PyTorch**: Deep learning framework
- **Tailwind CSS**: Utility-first CSS framework
- **Flask**: Python web framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/ImageEnhance/issues) page
2. Create a new issue with detailed information
3. Include system details and error messages

---

**Made with ❤️ for the AI and image processing community** 