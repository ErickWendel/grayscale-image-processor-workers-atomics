import { View } from './View.js';
import { ImageProcessor } from '../services/imageProcessor.js';

export class Controller {
    constructor() {
        this.view = new View();
        this.imageProcessor = new ImageProcessor();

        // Set up event listeners
        document.getElementById('upload').addEventListener('change', this.handleFileUpload.bind(this));
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        this.loadAndProcessImage(imageUrl);
    }

    loadAndProcessImage(src) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS issues
        img.src = src;

        img.onload = async () => {
            // Display original image and get its image data
            const imageData = this.view.displayOriginalImage(img);

            // Process the image
            const processedData = await this.imageProcessor.processImage(imageData);

            // Display the processed image
            this.view.displayProcessedImage(processedData);

            // Update status
            document.getElementById('status').textContent = 'Processing complete!';
        };
    }
}
