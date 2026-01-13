import { eventBus } from '../core/EventBus.js';

export class AssetManager {
    constructor() {
        this.uploadInput = document.getElementById('image-upload');
        this.grid = document.getElementById('asset-grid');

        this.initListeners();
    }

    initListeners() {
        this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
    }

    handleUpload(event) {
        const files = Array.from(event.target.files);

        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.addAssetToGrid(e.target.result);
            };
            reader.readAsDataURL(file);
        });

        // Reset input so same file can be selected again if needed
        event.target.value = '';
    }

    addAssetToGrid(src) {
        const div = document.createElement('div');
        div.className = 'asset-item';
        div.draggable = true;

        const img = document.createElement('img');
        img.src = src;

        div.appendChild(img);
        this.grid.appendChild(div);

        // Drag Events (Desktop)
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('imageSrc', src);
            e.dataTransfer.setData('offsetX', e.offsetX);
            e.dataTransfer.setData('offsetY', e.offsetY);
        });

        // Touch Events (Mobile)
        div.addEventListener('touchstart', (e) => {
            // Prevent scrolling while dragging
            // But we might want to scroll gallery? 
            // Only prevent if we detect a drag intention? 
            // For simplicity, let's assume long press or just immediate drag.
            // Let's rely on standard touch behavior but track movement.

            const touch = e.touches[0];
            this.activeTouch = {
                src: src,
                element: div,
                startX: touch.clientX,
                startY: touch.clientY,
                ghost: null
            };
        }, { passive: false });

        div.addEventListener('touchmove', (e) => {
            if (!this.activeTouch) return;
            const touch = e.touches[0];
            const dx = touch.clientX - this.activeTouch.startX;
            const dy = touch.clientY - this.activeTouch.startY;

            // If moved enough, start dragging visually
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10 || this.activeTouch.ghost) {
                e.preventDefault(); // Stop scrolling

                if (!this.activeTouch.ghost) {
                    // Create ghost
                    const ghost = document.createElement('img');
                    ghost.src = src;
                    ghost.style.position = 'fixed';
                    ghost.style.width = '80px';
                    ghost.style.opacity = '0.7';
                    ghost.style.zIndex = '1000';
                    ghost.style.pointerEvents = 'none';
                    document.body.appendChild(ghost);
                    this.activeTouch.ghost = ghost;
                }

                this.activeTouch.ghost.style.left = `${touch.clientX - 40}px`;
                this.activeTouch.ghost.style.top = `${touch.clientY - 40}px`;
            }
        }, { passive: false });

        div.addEventListener('touchend', (e) => {
            if (!this.activeTouch) return;

            if (this.activeTouch.ghost) {
                // Check drop target
                const changedTouch = e.changedTouches[0];
                const target = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);

                // If dropped on canvas-container or its children
                if (target && target.closest('#canvas-container')) {
                    // Dispatch custom event to main.js
                    eventBus.emit('assetDropped', {
                        src: src,
                        clientX: changedTouch.clientX,
                        clientY: changedTouch.clientY
                    });
                }

                document.body.removeChild(this.activeTouch.ghost);
            }

            this.activeTouch = null;
        });
    }
}
