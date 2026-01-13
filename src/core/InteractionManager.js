import { SnappingManager } from './SnappingManager.js';
import { eventBus } from './EventBus.js';

export class InteractionManager {
    constructor(canvasManager, scene, camera) {
        this.canvas = canvasManager.canvas;
        this.scene = scene;
        this.camera = camera;
        this.snappingManager = new SnappingManager();

        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.selectedObject = null;
        this.mode = 'idle'; // idle, dragObject, panCamera

        // Rotation Control
        this.rotationMode = false;
        this.initialObjectPosition = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Global Key Listener for Rotation Toggle
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') {
                this.toggleRotationMode();
            }
        });

        // Listen for events from UI
        eventBus.on('toggleRotation', () => this.toggleRotationMode());
        eventBus.on('resetView', () => this.camera.reset());
        eventBus.on('autoGroup', () => this.autoGroup());

        // Touch Listeners (Mobile Zoom/Pan/Drag)
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            // Emulate Mouse Down
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseDown(mouseEvent);
        } else if (e.touches.length === 2) {
            // Pinch Start
            const t1 = e.touches[0];
            const t2 = e.touches[1];

            // Calculate distance
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);

            // Calculate center
            const cx = (t1.clientX + t2.clientX) / 2;
            const cy = (t1.clientY + t2.clientY) / 2;
            const rect = this.canvas.getBoundingClientRect();
            this.lastPinchCenter = { x: cx - rect.left, y: cy - rect.top };

            this.mode = 'pinchZoom';
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (this.mode === 'pinchZoom' && e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];

            // 1. Zoom
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (this.lastPinchDistance) {
                const zoomFactor = dist / this.lastPinchDistance;
                this.camera.zoomAt(zoomFactor, this.lastPinchCenter.x, this.lastPinchCenter.y);
            }
            this.lastPinchDistance = dist;

            // 2. Pan (Move Center)
            const cx = (t1.clientX + t2.clientX) / 2;
            const cy = (t1.clientY + t2.clientY) / 2;
            const rect = this.canvas.getBoundingClientRect();
            const currentCenter = { x: cx - rect.left, y: cy - rect.top };

            const panX = currentCenter.x - this.lastPinchCenter.x;
            const panY = currentCenter.y - this.lastPinchCenter.y;

            this.camera.pan(panX, panY);

            this.lastPinchCenter = currentCenter;

        } else if (e.touches.length === 1) {
            // Emulate Mouse Move
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseMove(mouseEvent);
        }
    }

    onTouchEnd(e) {
        if (e.touches.length < 2 && this.mode === 'pinchZoom') {
            this.mode = 'idle';
        }

        // Emulate Mouse Up
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const mouseEvent = new MouseEvent('mouseup', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseUp(mouseEvent);
        }
    }

    toggleRotationMode() {
        this.rotationMode = !this.rotationMode;
        // Emit for UI button status update if we add one
        eventBus.emit('rotationModeChanged', this.rotationMode);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onWheel(e) {
        e.preventDefault();
        const screenPos = this.getMousePos(e);
        const worldPos = this.camera.screenToWorld(screenPos.x, screenPos.y);
        const hitObject = this.scene.hitTest(worldPos.x, worldPos.y);

        // If Rotation Mode ON and hovering object -> Rotate
        if (this.rotationMode && hitObject) {
            const rotateIntensity = 0.002;
            hitObject.rotation += e.deltaY * rotateIntensity;
            return;
        }

        // Ctrl + Wheel on Object -> Scale
        if ((e.ctrlKey || e.metaKey) && hitObject) {
            const zoomIntensity = 0.001;
            const delta = -e.deltaY * zoomIntensity;
            hitObject.scale = Math.min(Math.max(0.1, hitObject.scale + delta), 5);
            return;
        }

        // Default: Zoom Camera
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoomAt(zoomFactor, screenPos.x, screenPos.y);
    }

    onMouseDown(e) {
        const screenPos = this.getMousePos(e);
        const worldPos = this.camera.screenToWorld(screenPos.x, screenPos.y);

        // Check Delete Button First (if object selected)
        if (this.selectedObject && this.checkDeleteClick(this.selectedObject, worldPos)) {
            this.scene.remove(this.selectedObject);
            this.selectedObject = null;
            return;
        }

        // Hit Test
        const clickedObject = this.scene.hitTest(worldPos.x, worldPos.y);

        if (clickedObject) {
            // Already checked delete above

            this.selectedObject = clickedObject;
            this.selectedObject.selected = true;
            this.scene.moveToTop(clickedObject);

            this.isDragging = true;
            this.mode = 'dragObject';
            this.dragStart = worldPos;
            this.initialObjectPosition = { x: clickedObject.x, y: clickedObject.y };

        } else {
            // Clicked Background -> Pan Mode
            this.selectedObject = null;
            this.scene.objects.forEach(o => o.selected = false);

            this.isDragging = true;
            this.mode = 'panCamera';
            this.dragStart = screenPos; // Drag start in Screen Coords for panning
        }
    }

    checkDeleteClick(object, worldPoint) {
        return object.isDeleteButtonHit(worldPoint.x, worldPoint.y, this.camera.zoom);
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const screenPos = this.getMousePos(e);
        const worldPos = this.camera.screenToWorld(screenPos.x, screenPos.y);

        if (this.mode === 'dragObject' && this.selectedObject) {
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;

            let targetX = this.initialObjectPosition.x + dx;
            let targetY = this.initialObjectPosition.y + dy;

            this.selectedObject.x = targetX;
            this.selectedObject.y = targetY;

            // Snap
            const snapped = this.snappingManager.snap(this.selectedObject, this.scene.objects);
            this.selectedObject.x = snapped.x;
            this.selectedObject.y = snapped.y;

        } else if (this.mode === 'panCamera') {
            const dx = screenPos.x - this.dragStart.x;
            const dy = screenPos.y - this.dragStart.y;
            this.camera.pan(dx, dy);
            this.dragStart = screenPos;
        }
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.mode = 'idle';
    }

    autoGroup() {
        const objects = this.scene.objects;
        if (objects.length === 0) return;

        // Settings
        const padding = 10;

        // Calculate total area to estimate grid width
        let totalArea = 0;
        objects.forEach(obj => {
            totalArea += (obj.width * obj.scale + padding) * (obj.height * obj.scale + padding);
        });

        const targetWidth = Math.sqrt(totalArea) * 1.5; // Slightly wider than square

        // Sort by height (descending) for better packing
        const sorted = [...objects].sort((a, b) => (b.height * b.scale) - (a.height * a.scale));

        let currentX = 0;
        let currentY = 0;
        let rowHeight = 0;

        // Layout Logic
        // We calculate positions relative to a group origin (0,0) and then center it later

        sorted.forEach(obj => {
            const w = obj.width * obj.scale;
            const h = obj.height * obj.scale;

            if (currentX + w > targetWidth) {
                // New Row
                currentX = 0;
                currentY += rowHeight + padding;
                rowHeight = 0;
            }

            obj.x = currentX;
            obj.y = currentY;
            obj.rotation = 0; // Reset rotation for clean layout

            currentX += w + padding;
            rowHeight = Math.max(rowHeight, h);
        });

        // Center the group
        // 1. Calculate bounding box of group
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
            const w = obj.width * obj.scale;
            const h = obj.height * obj.scale;
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + w);
            maxY = Math.max(maxY, obj.y + h);
        });

        const groupWidth = maxX - minX;
        const groupHeight = maxY - minY;

        // Target Center (World Space 0,0 is usually center if camera is at 0,0?)
        // Wait, Camera resets to 0,0. World starts at 0,0 top-left typically?
        // Our camera pan logic: screenToWorld((w/2), (h/2)) gives center in world.

        // Let's verify where standard view is.
        // Reset view sets camera x=0, y=0.
        // screenToWorld: (screenX - 0)/1 = screenX.
        // So World (0,0) is top-left of screen.
        // We want to center the group in the middle of the "Canvas" (which is infinite, but let's say viewport).

        const centerX = this.canvas.width / 2; // Screen Center X (approx World Center X at reset)
        const centerY = this.canvas.height / 2;

        // Offset objects to center them around centerX, centerY
        const offsetX = centerX - groupWidth / 2;
        const offsetY = centerY - groupHeight / 2;

        objects.forEach(obj => {
            obj.x += offsetX;
            obj.y += offsetY;
        });

        // Reset Camera to standard
        this.camera.reset();
    }
}
