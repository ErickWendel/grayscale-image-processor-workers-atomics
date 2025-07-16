/**
 * ProgressView - Responsible for managing and updating progress UI elements
 * Follows Single Responsibility Principle by handling only UI concerns
 * Uses existing HTML elements rather than creating them dynamically
 */
export class ProgressView {
    /**
     * Initialize the progress view by capturing references to DOM elements
     */
    constructor() {
        // Cache DOM elements to improve performance and readability
        this.elements = {
            // Main containers
            progressContainer: document.getElementById('progress-container'),
            workerContainer: document.getElementById('worker-progress-container'),
            status: document.getElementById('status'),

            // Total progress elements
            totalFill: document.getElementById('total-progress-fill'),
            totalText: document.getElementById('total-progress-text'),

            // Worker progress elements are cached on-demand
            workerFills: {},
            workerTexts: {}
        };

        // Validate essential elements exist
        if (!this.elements.progressContainer) {
            console.error('Progress container not found in DOM');
        }

        if (!this.elements.status) {
            console.error('Status element not found in DOM');
        }
    }

    /**
     * Prepares the UI for displaying worker progress
     * @param {number} numWorkers - Number of workers to show progress for
     */
    createProgressUI(numWorkers) {
        // Reset all progress values to 0%
        this.resetProgress(numWorkers);

        // Show/hide worker rows based on number of workers
        const workerRows = this.elements.workerContainer.querySelectorAll('.worker-progress');

        // Show/hide worker rows as needed
        workerRows.forEach((row, index) => {
            row.style.display = index < numWorkers ? 'flex' : 'none';
        });

        // Display the progress container
        if (this.elements.progressContainer) {
            this.elements.progressContainer.style.display = 'block';
        }

        return this.elements.progressContainer;
    }

    /**
     * Reset all progress indicators to 0%
     * @param {number} numWorkers - Number of workers
     */
    resetProgress(numWorkers) {
        // Reset total progress
        if (this.elements.totalFill) {
            this.elements.totalFill.style.width = '0%';
        }

        if (this.elements.totalText) {
            this.elements.totalText.textContent = '0%';
        }

        // Reset individual worker progress
        for (let i = 0; i < numWorkers; i++) {
            this.updateWorkerProgress(i, 0);
        }
    }

    /**
     * Get a reference to a worker's progress fill element (with caching)
     * @param {number} workerId - Worker ID (0-based)
     * @returns {HTMLElement} The fill element
     */
    getWorkerFill(workerId) {
        if (!this.elements.workerFills[workerId]) {
            this.elements.workerFills[workerId] = document.getElementById(`progress-fill-${workerId}`);
        }
        return this.elements.workerFills[workerId];
    }

    /**
     * Get a reference to a worker's progress text element (with caching)
     * @param {number} workerId - Worker ID (0-based)
     * @returns {HTMLElement} The text element
     */
    getWorkerText(workerId) {
        if (!this.elements.workerTexts[workerId]) {
            this.elements.workerTexts[workerId] = document.getElementById(`progress-text-${workerId}`);
        }
        return this.elements.workerTexts[workerId];
    }

    /**
     * Updates the progress bar for a specific worker
     * @param {number} workerId - Worker ID (0-based)
     * @param {number} percent - Progress percentage (0-100)
     */
    updateWorkerProgress(workerId, percent) {
        const fill = this.getWorkerFill(workerId);
        const text = this.getWorkerText(workerId);

        const percentStr = `${percent}%`;

        if (fill) {
            fill.style.width = percentStr;
        }

        if (text) {
            text.textContent = percentStr;
        }
    }

    /**
     * Updates the total progress bar
     * @param {number} percent - Progress percentage (0-100)
     */
    updateTotalProgress(percent) {
        const percentStr = `${percent}%`;

        if (this.elements.totalFill) {
            this.elements.totalFill.style.width = percentStr;
        }

        if (this.elements.totalText) {
            this.elements.totalText.textContent = percentStr;
        }
    }

    /**
     * Updates the status text
     * @param {string} message - Status message
     */
    updateStatus(message) {
        if (this.elements.status) {
            this.elements.status.textContent = message;
        }
    }

    /**
     * Hide the progress container - used when processing is complete
     */
    hideProgress() {
        if (this.elements.progressContainer) {
            this.elements.progressContainer.style.display = 'none';
        }
    }
}
