export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;

        // Store view center for reset
        this.initialX = canvasWidth / 2;
        this.initialY = canvasHeight / 2;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.x) / this.zoom,
            y: (screenY - this.y) / this.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.x,
            y: worldY * this.zoom + this.y
        };
    }

    pan(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    zoomAt(factor, screenX, screenY) {
        const worldBefore = this.screenToWorld(screenX, screenY);

        this.zoom = Math.min(Math.max(this.zoom * factor, this.minZoom), this.maxZoom);

        // Adjust x/y so worldBefore is still under screenX/screenY
        // screenX = worldBefore.x * newZoom + newX
        // newX = screenX - worldBefore.x * newZoom

        this.x = screenX - worldBefore.x * this.zoom;
        this.y = screenY - worldBefore.y * this.zoom;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }
}
