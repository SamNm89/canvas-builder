export class CanvasObject {
    constructor(image, x, y) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = image.width;
        this.height = image.height;
        this.rotation = 0; // Radians
        this.scale = 1;
        this.selected = false;
    }

    draw(ctx) {
        ctx.save();

        // Move to center of object for rotation/scaling
        const centerX = this.x + (this.width * this.scale) / 2;
        const centerY = this.y + (this.height * this.scale) / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Draw Image (centered at origin)
        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        // Draw Selection Outline
        if (this.selected) {
            ctx.strokeStyle = '#007acc'; // Brand blue
            ctx.lineWidth = 2;
            ctx.strokeRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        }

        ctx.restore();
    }

    containsPoint(px, py) {
        // For now, AABB (Axis Aligned Bounding Box) for simplicity
        // TODO: Implement OBB (Oriented Bounding Box) for rotated hit testing
        const w = this.width * this.scale;
        const h = this.height * this.scale;
        return (
            px >= this.x &&
            px <= this.x + w &&
            py >= this.y &&
            py <= this.y + h
        );
    }
}
