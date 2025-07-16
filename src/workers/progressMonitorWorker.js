/**
 * Progress Monitor Worker
 *
 * Responsible for tracking progress across all image processing workers
 * and reporting progress back to the main thread.
 *
 * Uses Atomics API for safe cross-thread communication.
 */

self.onmessage = function (e) {
    const { controlBuffer, numWorkers, pixelsPerWorker } = e.data;
    const control = new Int32Array(controlBuffer);

    function updateProgress() {
        // Check individual worker progress
        let totalProcessed = 0;
        let totalPixels = 0;

        for (let i = 0; i < numWorkers; i++) {
            const workerIndex = i + 8; // Worker progress starts at index 8
            const processed = Atomics.load(control, workerIndex);
            const total = pixelsPerWorker[i];
            totalProcessed += processed;
            totalPixels += total;

            // Calculate and report individual progress
            const percent = Math.floor((processed / total) * 100);
            self.postMessage({
                type: 'progress',
                workerId: i,
                percent
            });
        }

        // Calculate and report total progress
        const totalPercent = Math.floor((totalProcessed / totalPixels) * 100);
        self.postMessage({
            type: 'totalProgress',
            percent: totalPercent
        });

        // Check if all workers are done
        const completed = Atomics.load(control, 0);

        if (completed < numWorkers) {
            // Continue monitoring
            setTimeout(updateProgress, 30);
        } else {
            // All workers completed, notify main thread immediately with a message
            // This is the primary notification mechanism and should be reliable
            self.postMessage({
                type: 'completed',
                message: 'All workers have finished processing'
            });

            // We'll also set the notification flag in the shared buffer
            // as a secondary notification mechanism
            Atomics.store(control, 1, 1);

            // Use Atomics.notify as a tertiary notification mechanism
            // This is mainly useful for waking other workers that might be waiting
            // Note: This isn't used by the main thread anymore since we rely on postMessage
            Atomics.notify(control, 1);

            // Log for debugging purposes
            console.log('Progress monitor detected completion, notified main thread');
        }
    }

    updateProgress();
};
