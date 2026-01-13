import { SnappingManager } from './SnappingManager.js';

export class InteractionManager {
    constructor(canvasManager, scene) {
        this.canvas = canvasManager.canvas;
        this.scene = scene;
        this.snappingManager = new SnappingManager();

        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.selectedObject = null;
        this.initialObjectPosition = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Account for high-DPI (if the canvas context is scaled, we might need to adjust, 
        // but the object coordinates usually match the logical pixel size if we handled scale in draw only.
        // However, in CanvasManager, we scaled SCALE, but the width/height style is logical.
        // So usually plain clientX - rect.left is the logical coordinate space we want.
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onWheel(e) {
        if (!this.selectedObject) return;
        e.preventDefault();

        // Ctrl + Wheel = Scale
        if (e.ctrlKey || e.metaKey) {
            const zoomIntensity = 0.001;
            const delta = -e.deltaY * zoomIntensity;
            // Clamp scale 0.1 to 5
            const newScale = Math.min(Math.max(0.1, this.selectedObject.scale + delta), 5);
            this.selectedObject.scale = newScale;
        }
        // Wheel = Rotate
        else {
            const rotateIntensity = 0.002;
            this.selectedObject.rotation += e.deltaY * rotateIntensity;
        }
    }

    onMouseDown(e) {
        const { x, y } = this.getMousePos(e);

        // Hit Test
        const clickedObject = this.scene.hitTest(x, y);

        // Deselect previous
        if (this.selectedObject && this.selectedObject !== clickedObject) {
            this.selectedObject.selected = false;
        }

        if (clickedObject) {
            this.selectedObject = clickedObject;
            this.selectedObject.selected = true;
            this.isDragging = true;
            this.dragStart = { x, y };
            this.initialObjectPosition = { x: clickedObject.x, y: clickedObject.y };

            // Move to top of stack (optional, but standard behavior)
            this.scene.moveToTop(clickedObject);
        } else {
            this.selectedObject = null;
        }
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.selectedObject) return;

        const { x, y } = this.getMousePos(e);
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        // Raw new position
        let targetX = this.initialObjectPosition.x + dx;
        let targetY = this.initialObjectPosition.y + dy;

        // Apply Snapping
        // Temporarily update object to test snap (or pass proposed coords)
        // Here we pass a dummy object or just update the current one and snap it
        this.selectedObject.x = targetX;
        this.selectedObject.y = targetY;

        const snapped = this.snappingManager.snap(this.selectedObject, this.scene.objects);

        this.selectedObject.x = snapped.x;
        this.selectedObject.y = snapped.y;
    }

    onMouseUp(e) {
        this.isDragging = false;
    }
}
