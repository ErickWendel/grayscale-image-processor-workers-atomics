/**
 * WorkerCoordinator - Responsible for managing web workers and thread coordination
 * Follows Single Responsibility Principle by handling only worker coordination
 */
export class WorkerCoordinator {
    /**
     * Creates a WorkerCoordinator
     * @param {number} numWorkers - Number of workers to create
     * @param {Function} onProgressUpdate - Callback for progress updates
     * @param {Function} onComplete - Callback for completion
     */
    constructor(numWorkers, onProgressUpdate, onComplete) {
        this.numWorkers = numWorkers;
        this.workers = [];
        this.pixelsPerWorker = [];
        this.onProgressUpdate = onProgressUpdate || (() => { });
        this.onComplete = onComplete || (() => { });
        this.progressMonitor = null;
    }

    /**
     * Creates web workers to process image data
     * @param {SharedArrayBuffer} imageBuffer - The image data buffer
     * @param {SharedArrayBuffer} controlBuffer - The control data buffer
     * @param {Uint8ClampedArray} imageData - Original image data
     * @returns {Array} Array of created workers
     */
    createWorkers(imageBuffer, controlBuffer, imageData) {
        const data = imageData.data;
        const chunkSize = Math.floor(data.length / this.numWorkers);
        const control = new Int32Array(controlBuffer);

        // Initialize all control values to 0
        for (let i = 0; i < control.length; i++) {
            Atomics.store(control, i, 0);
        }

        for (let i = 0; i < this.numWorkers; i++) {
            const worker = new Worker('/src/workers/imageWorker.js');
            this.workers.push(worker);

            const start = i * chunkSize;
            const end = i === this.numWorkers - 1 ? data.length : start + chunkSize;
            const pixelCount = (end - start) / 4; // Each pixel is RGBA (4 values)
            this.pixelsPerWorker[i] = pixelCount;

            // Send just this chunk to the worker
            worker.postMessage({
                imageBuffer,
                controlBuffer,
                start,
                end,
                workerId: i,
                workerIndex: i + 8, // Control array index for this worker's progress
                totalPixels: pixelCount,
                numWorkers: this.numWorkers
            });

            // Set up message handler for debugging
            worker.onmessage = (event) => {
                if (event.data && event.data.type === 'debug') {
                    console.log(`Worker ${i} debug:`, event.data.message);
                }
            };
        }

        return this.workers;
    }

    /**
     * Creates and starts a progress monitor worker
     * @param {SharedArrayBuffer} controlBuffer - The control data buffer
     */
    startProgressMonitor(controlBuffer) {
        // Create a worker using a dedicated file instead of inline code
        this.progressMonitor = new Worker('/src/workers/progressMonitorWorker.js');

        // Set up progress monitor message handler
        this.progressMonitor.onmessage = (event) => {
            if (event.data.type === 'progress') {
                // Update individual worker progress
                const { workerId, percent } = event.data;
                this.onProgressUpdate('worker', workerId, percent);
            }
            else if (event.data.type === 'totalProgress') {
                // Update total progress
                const { percent } = event.data;
                this.onProgressUpdate('total', null, percent);
            }
            else if (event.data.type === 'completed') {
                // All workers completed
                console.log("WorkerCoordinator received completion message:", event.data.message || '');

                // Ensure this only runs once by checking the completion state
                if (this.onComplete) {
                    const callback = this.onComplete;
                    // Clear the callback immediately to prevent double execution
                    this.onComplete = null;
                    // Execute the callback
                    callback();
                }
            }
        };

        // Start progress monitor
        this.progressMonitor.postMessage({
            controlBuffer,
            numWorkers: this.numWorkers,
            pixelsPerWorker: this.pixelsPerWorker
        });
    }

    /**
     * Terminates all workers and the progress monitor
     */
    terminateWorkers() {
        // Terminate all worker threads
        this.workers.forEach(worker => {
            if (worker) {
                worker.terminate();
            }
        });

        // Terminate progress monitor
        if (this.progressMonitor) {
            this.progressMonitor.terminate();
        }
    }
}
