export class Exporter {
    constructor(canvasManager) {
        this.canvas = canvasManager.canvas;
    }

    download(format = 'png', quality = 1.0, scene) {
        // 1. Calculate Bounding Box of the entire Scene (in World Space)
        if (scene.objects.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        scene.objects.forEach(obj => {
            const corners = [
                { x: 0, y: 0 },
                { x: obj.width * obj.scale, y: 0 },
                { x: obj.width * obj.scale, y: obj.height * obj.scale },
                { x: 0, y: obj.height * obj.scale }
            ];

            const cos = Math.cos(obj.rotation);
            const sin = Math.sin(obj.rotation);

            // Center for rotation
            const cx = obj.x + (obj.width * obj.scale) / 2;
            const cy = obj.y + (obj.height * obj.scale) / 2;

            corners.forEach(p => {
                // Point relative to center (unrotated)
                const px = (obj.x + p.x) - cx;
                const py = (obj.y + p.y) - cy;

                // Rotate
                const rx = px * cos - py * sin;
                const ry = px * sin + py * cos;

                // World coords
                const wx = rx + cx;
                const wy = ry + cy;

                minX = Math.min(minX, wx);
                minY = Math.min(minY, wy);
                maxX = Math.max(maxX, wx);
                maxY = Math.max(maxY, wy);
            });
        });

        // Safety check for empty or invalid bounds
        if (!isFinite(minX) || !isFinite(maxX)) return;

        const padding = 50;
        const width = Math.ceil(maxX - minX + padding * 2);
        const height = Math.ceil(maxY - minY + padding * 2);

        // 2. Create Off-screen Canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');

        // 3. Render
        // Background for JPEG
        if (format === 'jpeg' || format === 'jpg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }

        // Translate so minX, minY is at padding, padding
        ctx.translate(-minX + padding, -minY + padding);

        // Draw all objects
        scene.objects.forEach(obj => {
            // Temporarily disable selection outline for export
            const wasSelected = obj.selected;
            obj.selected = false;

            obj.draw(ctx);

            obj.selected = wasSelected;
        });

        // 4. Download
        const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
        const link = document.createElement('a');
        link.download = `canvas-export-${Date.now()}.${format}`;
        link.href = exportCanvas.toDataURL(mimeType, quality);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
