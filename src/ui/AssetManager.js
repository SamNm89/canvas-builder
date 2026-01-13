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

        // Drag Events
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('imageSrc', src);
            e.dataTransfer.setData('offsetX', e.offsetX);
            e.dataTransfer.setData('offsetY', e.offsetY);
        });
    }
}
