/**
 * Advanced image processing worker using comprehensive Atomics API
 *
 * This worker demonstrates advanced thread synchronization using Atomics:
 * 1. Direct operation on SharedArrayBuffer for zero-copy processing
 * 2. Thread-safe progress reporting using Atomics.store and Atomics.add
 * 3. Lock-free coordination with main thread
 * 4. Barrier synchronization for coordinated processing
 * 5. Atomic wait/notify mechanism for efficient thread sleeping
 */
self.onmessage = function (event) {
    const { imageBuffer, controlBuffer, start, end, workerId, workerIndex, totalPixels } = event.data;

    // Access the shared control buffer for coordination
    // - Index 0: Number of completed workers
    // - Index 1: Main thread notification flag
    // - Index 2: Barrier synchronization counter
    // - Index workerIndex: Progress counter for this worker
    const control = new Int32Array(controlBuffer);

    // Access the shared image buffer
    const pixels = new Uint8ClampedArray(imageBuffer);

    // Log starting information
    console.log(`Worker ${workerId} starting: pixels ${start} to ${end} (${totalPixels} pixels)`);

    // Report debug info to main thread
    postMessage({
        type: 'debug',
        message: `Starting to process ${totalPixels} pixels from ${start} to ${end}`
    });

    // Initialize progress to zero atomically
    Atomics.store(control, workerIndex, 0);

    // Wait for all workers to start (optional barrier synchronization)
    // This ensures all workers start processing at approximately the same time
    Atomics.add(control, 2, 1);  // Increment barrier counter
    const startBarrierValue = Atomics.load(control, 2);

    // If not all workers have reached the barrier yet, wait
    if (startBarrierValue < event.data.numWorkers) {
        postMessage({
            type: 'debug',
            message: `Worker ${workerId} waiting at start barrier (${startBarrierValue} arrived)`
        });

        // Use Atomics.wait with a timeout to avoid deadlocks
        // In a real app, you might implement a more robust barrier with Atomics.notify
        let waitingAt = startBarrierValue;
        while (waitingAt < event.data.numWorkers) {
            // Short timeout to prevent blocking indefinitely
            Atomics.wait(control, 2, waitingAt, 100);
            waitingAt = Atomics.load(control, 2);
        }
    }

    // All workers have started - begin processing
    postMessage({
        type: 'debug',
        message: `Worker ${workerId} passed barrier, beginning processing`
    });

    // Process the pixels in smaller chunks for more frequent progress updates
    // This provides smoother progress indication
    const updateInterval = Math.max(100, Math.floor(totalPixels / 100)); // Update progress every 1%
    let pixelsProcessed = 0;

    // Process pixels in RGBA format (4 values per pixel)
    for (let i = start; i < end; i += 4) {
        // Simple grayscale conversion
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const avg = (r + g + b) / 3;

        // Write results directly to shared buffer
        // Note: No locks needed as workers operate on separate regions
        pixels[i] = avg;     // Red
        pixels[i + 1] = avg; // Green
        pixels[i + 2] = avg; // Blue
        // Alpha channel (pixels[i + 3]) remains unchanged

        // Update progress atomically after each block
        pixelsProcessed++;
        if (pixelsProcessed % updateInterval === 0 || i + 4 >= end) {
            // Update progress atomically - safe for monitoring from other threads
            Atomics.store(control, workerIndex, pixelsProcessed);
        }
    }

    // Ensure final progress is recorded
    Atomics.store(control, workerIndex, pixelsProcessed);

    // Signal that this worker has completed
    // This is an atomic operation, ensuring the counter is incremented safely
    const completedWorkers = Atomics.add(control, 0, 1) + 1;

    console.log(`Worker ${workerId} completed. Processed ${pixelsProcessed} pixels.`);
    console.log(`Total workers completed: ${completedWorkers} of ${event.data.numWorkers}`);

    // Send completion message back to main thread (for debugging)
    postMessage({
        type: 'debug',
        message: `Worker ${workerId} completed. Total: ${completedWorkers} of ${event.data.numWorkers}`
    });

    // If this is the last worker to complete, notify any waiting threads
    if (completedWorkers === event.data.numWorkers) {
        console.log(`Last worker (${workerId}) completed - notifying waiting threads`);

        // Set notification flag and wake waiting threads
        Atomics.store(control, 1, 1);
        Atomics.notify(control, 1);
    }
};