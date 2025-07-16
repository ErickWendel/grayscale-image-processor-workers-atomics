export class View {
    constructor() {
        this.originalCanvas = document.getElementById('original');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.processedCanvas = document.getElementById('processed');
        this.processedCtx = this.processedCanvas.getContext('2d');
    }

    displayOriginalImage(img) {
        // Set canvas dimensions to match image
        this.originalCanvas.width = img.width;
        this.originalCanvas.height = img.height;

        // Draw image on the canvas
        this.originalCtx.drawImage(img, 0, 0);
        return this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
    }

    displayProcessedImage(imageData) {
        // Set canvas dimensions
        this.processedCanvas.width = imageData.width;
        this.processedCanvas.height = imageData.height;

        // Draw processed image on canvas
        this.processedCtx.putImageData(imageData, 0, 0);
    }

    getImageData() {
        return this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
    }
}
