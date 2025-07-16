import { WorkerCoordinator } from './WorkerCoordinator.js';
import { ProgressView } from '../components/ProgressView.js';

/**
 * ImageProcessor - Refactored implementation using SharedArrayBuffer and Atomics API
 *
 * This implementation follows the Single Responsibility Principle:
 * - ImageProcessor: Handles the high-level image processing workflow
 * - WorkerCoordinator: Manages workers and thread synchronization
 * - ProgressView: Handles UI updates and progress visualization
 */
export class ImageProcessor {
    constructor(numWorkers = 4) {
        this.numWorkers = numWorkers;
        this.progressView = new ProgressView();
    }

    async processImage(imageData) {
        return new Promise((resolve) => {
            const { data, width, height } = imageData;

            // Update status
            this.progressView.updateStatus('Preparing image data...');

            // Create progress UI
            this.progressView.createProgressUI(this.numWorkers);

            // Create a single SharedArrayBuffer for the entire image
            // This avoids unnecessary memory copying between main thread and workers
            const imageBufferSize = data.length;
            const sharedImageBuffer = new SharedArrayBuffer(imageBufferSize);
            const sharedPixels = new Uint8ClampedArray(sharedImageBuffer);

            // Copy the original image data to the shared buffer (one-time copy)
            sharedPixels.set(data);

            // Create a SharedArrayBuffer for coordination and synchronization
            // Index 0: Total completed workers counter
            // Index 1: Main thread notification flag
            // Index 2: Barrier synchronization counter
            // Index 3-7: Reserved for future use
            // Index 8+: Individual worker progress (one slot per worker)
            const controlBufferSize = 8 + this.numWorkers;
            const controlBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * controlBufferSize);
            const control = new Int32Array(controlBuffer);

            // Create a worker coordinator to manage the workers
            const coordinator = new WorkerCoordinator(
                this.numWorkers,
                // Progress update callback
                (type, workerId, percent) => {
                    if (type === 'worker') {
                        this.progressView.updateWorkerProgress(workerId, percent);
                    } else if (type === 'total') {
                        this.progressView.updateTotalProgress(percent);
                        this.progressView.updateStatus(`Processing: ${percent}% complete`);
                    }
                },
                // Completion callback - mark as resolved to prevent fallback from running
                () => {
                    isResolved = true; // Prevent fallback from running
                    this.progressView.updateStatus('Creating final image...');

                    // Create the final ImageData directly from the shared buffer
                    const finalData = new ImageData(
                        new Uint8ClampedArray(sharedPixels),
                        width,
                        height
                    );

                    // Clean up
                    coordinator.terminateWorkers();

                    // Resolve with the processed image data
                    this.progressView.updateStatus('Processing complete!');
                    // Hide the progress bars when done
                    this.progressView.hideProgress();
                    resolve(finalData);
                    console.log("Processing complete via coordinator callback!");
                }
            );

            // Update status
            this.progressView.updateStatus(`Starting ${this.numWorkers} workers...`);

            // Create and start workers
            coordinator.createWorkers(sharedImageBuffer, controlBuffer, imageData);

            // Start the progress monitor
            coordinator.startProgressMonitor(controlBuffer);

            // Update status
            this.progressView.updateStatus(`Processing with ${this.numWorkers} workers...`);

            // Flag to track whether the completion has been handled
            // This prevents both the normal and fallback paths from executing
            let isResolved = false;
            const fallbackChecker = () => {
                if (isResolved) return;

                // Check if all workers are done
                const completed = Atomics.load(control, 0);

                if (completed === this.numWorkers) {
                    isResolved = true;
                    this.progressView.updateStatus('Creating final image (fallback)...');

                    // Create the final ImageData
                    const finalData = new ImageData(
                        new Uint8ClampedArray(sharedPixels),
                        width,
                        height
                    );

                    // Clean up
                    coordinator.terminateWorkers();

                    // Resolve with the processed image data
                    this.progressView.updateStatus('Processing complete! (fallback)');
                    // Hide the progress bars when done
                    this.progressView.hideProgress();
                    resolve(finalData);
                } else {
                    // Continue checking
                    setTimeout(fallbackChecker, 500);
                }
            };

            // Start fallback checker with a longer initial delay
            // to give the primary mechanism more time to work
            setTimeout(fallbackChecker, 2000);
        });
    }
}
