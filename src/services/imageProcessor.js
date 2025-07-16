export class ImageProcessor {
    constructor(numWorkers = 4) {
        this.numWorkers = numWorkers;
    }

    async processImage(imageData) {
        return new Promise((resolve) => {
            const { data, width, height } = imageData;

            // Update status
            const statusEl = document.getElementById('status');
            statusEl.textContent = 'Preparing image data...';

            // Create SharedArrayBuffer with space for the 'done' counter
            const bufferLength = data.length + Int32Array.BYTES_PER_ELEMENT;
            const sharedBuffer = new SharedArrayBuffer(bufferLength);
            const sharedPixels = new Uint8ClampedArray(sharedBuffer, 0, data.length);
            const done = new Int32Array(sharedBuffer, data.length, 1);

            // Copy image data to shared buffer
            sharedPixels.set(data);

            // Create workers
            const workers = [];
            const chunkSize = Math.floor(sharedPixels.length / this.numWorkers);

            // Update status to show we're starting workers
            statusEl.textContent = `Starting ${this.numWorkers} workers...`;

            for (let i = 0; i < this.numWorkers; i++) {
                const worker = new Worker('/src/workers/imageWorker.js');
                workers.push(worker);

                const start = i * chunkSize;
                const end = i === this.numWorkers - 1 ? sharedPixels.length : start + chunkSize;

                // Send data to the worker
                worker.postMessage({
                    buffer: sharedBuffer,
                    start,
                    end,
                    imageDataLength: data.length
                });
            }

            // Update status
            statusEl.textContent = `Processing with ${this.numWorkers} workers...`;

            // Monitor worker completion
            const checkCompletion = () => {
                const completed = Atomics.load(done, 0);
                console.log("Number of workers finished:", completed);

                // Update status with progress
                statusEl.textContent = `Processing: ${completed}/${this.numWorkers} workers complete`;

                if (completed === this.numWorkers) {
                    // Create new ImageData with processed pixels
                    const processedData = new ImageData(
                        new Uint8ClampedArray(sharedPixels),
                        width,
                        height
                    );

                    // Terminate workers
                    workers.forEach(worker => worker.terminate());

                    statusEl.textContent = 'Finalizing image...';
                    resolve(processedData);
                    console.log("Processing complete!");
                } else {
                    setTimeout(checkCompletion, 50);
                }
            };

            checkCompletion();
        });
    }
}
