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

            // Draw Delete Button (Top Right)
            const btnSize = 20;
            const x = this.width / 2;
            const y = -this.height / 2;

            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(x, y, btnSize / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 5);
            ctx.lineTo(x + 5, y + 5);
            ctx.moveTo(x + 5, y - 5);
            ctx.lineTo(x - 5, y + 5);
            ctx.stroke();
        }

        ctx.restore();
    }

    isDeleteButtonHit(wx, wy) {
        if (!this.selected) return false;

        // Transform world point to local point
        // Inverse Translate -> Rotate -> Scale is complex manually.
        // Simplifying: Check distance in world space is risky if rotated.
        // Let's do a simple check: transform point into object space

        // We can't easily inverse transform without a matrix lib or math.
        // ALTERNATIVE: InteractionManager passes 'local' coords? No.

        // Let's implement a rudimentary inverse transform for this specific hit test
        const centerX = this.x + (this.width * this.scale) / 2;
        const centerY = this.y + (this.height * this.scale) / 2;

        const dx = wx - centerX;
        const dy = wy - centerY;

        // Undo Rotation
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;

        // Undo Scale
        const lx = rx / this.scale;
        const ly = ry / this.scale;

        // Now we are in local space relative to center. 
        // Top right corner is: width/2, -height/2
        const btnX = this.width / 2;
        const btnY = -this.height / 2;

        const dist = Math.sqrt(Math.pow(lx - btnX, 2) + Math.pow(ly - btnY, 2));

        // Button radius 10 / Scale (since we are in unscaled space? No, scale affects visual size)
        // Actually we unscaled the mouse, so we compare to unscaled button pos.
        // But the button is drawn with fixed pixel size usually?
        // Wait, in draw(), we drew AFTER scale() call. So the button size scales with object!
        // That means `btnSize = 20` is 20 *units* in local space.
        // So distance check against 10 is correct.

        return dist < 15; // 15 tolerance
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
