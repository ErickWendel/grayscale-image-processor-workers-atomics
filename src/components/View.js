export class View {
    constructor() {
        this.originalCanvas = document.getElementById('original');
        // Set willReadFrequently to true for better performance when calling getImageData frequently
        this.originalCtx = this.originalCanvas.getContext('2d', { willReadFrequently: true });

        this.processedCanvas = document.getElementById('processed');
        this.processedCtx = this.processedCanvas.getContext('2d', { willReadFrequently: true });
    }

    /**
     * Display the original image and return its image data
     * @param {HTMLImageElement} img - The image to display
     * @returns {ImageData} The image data from the canvas
     */
    displayOriginalImage(img) {
        // Set canvas dimensions to match image
        this.originalCanvas.width = img.width;
        this.originalCanvas.height = img.height;

        // Draw image on the canvas
        this.originalCtx.drawImage(img, 0, 0);

        // Get image data (optimized with willReadFrequently: true)
        return this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
    }

    /**
     * Display the processed image on the processed canvas
     * @param {ImageData} imageData - The processed image data to display
     */
    displayProcessedImage(imageData) {
        // Set canvas dimensions
        this.processedCanvas.width = imageData.width;
        this.processedCanvas.height = imageData.height;

        // Draw processed image on canvas
        this.processedCtx.putImageData(imageData, 0, 0);
    }

    /**
     * Get the image data from the original canvas
     * This benefits from the willReadFrequently context option set in the constructor
     * @returns {ImageData} The image data from the canvas
     */
    getImageData() {
        return this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
    }
}
