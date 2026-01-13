export class Exporter {
    constructor(canvasManager) {
        this.canvas = canvasManager.canvas;
    }

    download(format = 'png', quality = 1.0) {
        // Determine MIME type
        const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';

        // Create a temporary link
        const link = document.createElement('a');
        link.download = `canvas-export-${Date.now()}.${format}`;

        // Get Data URL
        // quality argument only affects image/jpeg and image/webp
        const dataUrl = this.canvas.toDataURL(mimeType, quality);

        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
