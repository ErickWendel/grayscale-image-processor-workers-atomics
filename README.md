# **Grayscale Image Processor with JS Atomics**

![demo](./demo.png)

This project demonstrates how to process an image in the browser using **Web Workers** and the **Atomics API** with a **SharedArrayBuffer**. The application applies a grayscale filter to an image, utilizing parallel processing for improved performance and efficient memory handling.

## **Features**
- Processes images in parallel using multiple **Web Workers**.
- Demonstrates the use of **SharedArrayBuffer** for sharing memory between threads.
- Uses the **Atomics API** to synchronize worker progress.
- Displays the original image and the processed grayscale image side-by-side in a clean, centered layout.

---

## **Why This Project?**
This project is a practical example of modern web development techniques that leverage multithreading in JavaScript. By utilizing **SharedArrayBuffer** and **Atomics**, it showcases:
1. **Efficient Parallel Processing**:
   - Web Workers process different chunks of the image simultaneously, reducing processing time.
2. **Memory Optimization**:
   - Shared memory (via `SharedArrayBuffer`) eliminates the need to copy data between threads.
3. **Thread-Safe Synchronization**:
   - The `Atomics` API ensures the progress of each worker is tracked safely without race conditions.

This approach is particularly useful for computationally intensive tasks like image manipulation, video processing, or simulations that can benefit from parallel execution.

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone https://github.com/erickwendel/grayscale-image-processor-workers-atomics.git
cd grayscale-image-processor-workers-atomics
```

### **2. Install Dependencies**
Ensure you have Node.js installed, then run:
```bash
npm install
```

### **3. Start the Application**
This project uses **browser-sync** to serve the files and enable the required headers for `SharedArrayBuffer`.

To start the application:
```bash
npm start
```

This will:
- Serve the app at `http://localhost:3000`.
- Enable the necessary HTTP headers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`

### **4. Open the App**
Visit `http://localhost:3000` in a modern browser (e.g., Chrome, Edge) that supports `SharedArrayBuffer` and the required security policies.

---
## **How It Works**

1. **Image Loading**:
   - Users upload an image or a default image is loaded.
   - The image is drawn on a `<canvas>`.

2. **Shared Memory**:
   - A `SharedArrayBuffer` is created to store pixel data and a `done` counter for synchronization.

3. **Parallel Processing**:
   - The image is divided into chunks, and each chunk is processed by a separate **Web Worker**.
   - Workers use the `Atomics` API to update the shared `done` counter safely.

4. **Canvas Update**:
   - Once all workers finish, the processed grayscale image is drawn on a separate `<canvas>`.

---

## **Technologies Used**
- **JavaScript**: For client-side logic and multithreading with Web Workers.
- **Atomics API**: For thread-safe synchronization.
- **SharedArrayBuffer**: For efficient shared memory.
- **browser-sync**: To serve the app with proper security headers.

---

## **NPM Scripts**
- **`npm start`**: Starts the app using browser-sync with headers enabled.

---

## **Example Usage**

1. Start the app:
   ```bash
   npm start
   ```
2. Upload an image or view the default image.
3. Watch as the grayscale filter is applied in real-time using parallel processing.

---

## **Browser Compatibility**
This project requires a browser that supports:
- **SharedArrayBuffer**
- Proper security policies:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`

Recommended Browsers:
- Google Chrome
