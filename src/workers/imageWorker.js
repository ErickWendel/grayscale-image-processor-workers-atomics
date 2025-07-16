self.onmessage = function (event) {
    const { buffer, start, end } = event.data;
    const pixels = new Uint8ClampedArray(buffer, 0, event.data.imageDataLength);
    const done = new Int32Array(buffer, event.data.imageDataLength, 1);

    console.log("Worker processing:", start, end);

    // Convert to grayscale
    for (let i = start; i < end; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const avg = (r + g + b) / 3;
        pixels[i] = avg;     // Red
        pixels[i + 1] = avg; // Green
        pixels[i + 2] = avg; // Blue
    }

    Atomics.add(done, 0, 1);
    console.log("Worker completed:", start, end, "Counter:", Atomics.load(done, 0));
};
