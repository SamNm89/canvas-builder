import { eventBus } from './EventBus.js';

export class CanvasManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Append canvas to container
        this.container.appendChild(this.canvas);

        // Initial resize
        this.resizeCallback = this.resize.bind(this);
        window.addEventListener('resize', this.resizeCallback);
        this.resize();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);

        eventBus.emit('canvasResized', { width: this.width, height: this.height });
    }

    get context() {
        return this.ctx;
    }

    get dimensions() {
        return { width: this.width, height: this.height };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}
