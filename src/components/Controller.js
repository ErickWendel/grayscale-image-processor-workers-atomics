import { View } from './View.js';
import { ImageProcessor } from '../services/imageProcessor.js';

// Detect system capabilities for optimal worker count
const getOptimalWorkerCount = () => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    // Use slightly fewer workers than available cores for best performance
    // Keeping 1-2 cores free for the UI thread and other tasks
    return Math.max(2, Math.floor(hardwareConcurrency * 0.75));
};

export class Controller {
    constructor() {
        this.view = new View();

        // Use optimal worker count based on system capabilities
        const workerCount = getOptimalWorkerCount();
        console.log(`Using ${workerCount} workers based on system capabilities`);
        this.imageProcessor = new ImageProcessor(workerCount);

        // Set up event listeners
        document.getElementById('upload').addEventListener('change', this.handleFileUpload.bind(this));

        // Update status with information about parallelism
        document.getElementById('status').textContent =
            `Ready - Using ${workerCount} parallel workers for processing`;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        this.loadAndProcessImage(imageUrl);
    }

    loadAndProcessImage(src) {
        // Update status immediately
        document.getElementById('status').textContent = 'Loading image...';

        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS issues
        img.src = src;

        img.onload = async () => {
            document.getElementById('status').textContent = 'Image loaded, preparing for processing...';

            try {
                // Check if SharedArrayBuffer and Atomics are available
                if (typeof SharedArrayBuffer === 'undefined' || typeof Atomics === 'undefined') {
                    throw new Error('SharedArrayBuffer or Atomics not available. Make sure your browser supports these features.');
                }

                // Display original image and get its image data
                const imageData = this.view.displayOriginalImage(img);

                // Remove any existing progress container before starting new processing
                const existingProgress = document.getElementById('progress-container');
                if (existingProgress) {
                    existingProgress.remove();
                }

                // Show dimensions in status
                document.getElementById('status').textContent =
                    `Preparing image (${img.width}x${img.height}) for parallel processing...`;

                // Process the image with our Atomics-based parallel system
                console.time('imageProcessing');
                const processedData = await this.imageProcessor.processImage(imageData);
                console.timeEnd('imageProcessing');

                // Display the processed image
                this.view.displayProcessedImage(processedData);

                // Update final status with performance metrics
                const workerCount = this.imageProcessor.numWorkers;
                document.getElementById('status').textContent =
                    `Processing complete! Used ${workerCount} workers with SharedArrayBuffer and Atomics API`;
            } catch (error) {
                console.error('Processing error:', error);
                document.getElementById('status').textContent = `Error: ${error.message}`;
            }
        };

        // Handle load errors
        img.onerror = () => {
            document.getElementById('status').textContent = 'Error loading image. Please try another file.';
        };
    }
}
