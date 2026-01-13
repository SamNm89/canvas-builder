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

    draw(ctx, zoom = 1) {
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

        // Draw Selection Outline & UI
        if (this.selected) {
            ctx.strokeStyle = '#007acc'; // Brand blue
            ctx.lineWidth = 2 / this.scale; // Keep outline constant width relative to object? or screen?
            // Actually, for outline, usually we want it consistent relative to object or screen.
            // Let's keep it simple for outline.

            ctx.strokeRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            // Draw Delete Button (Top Right)
            // Goal: Constant Screen Size ~24px
            // The context is currently scaled by `this.scale`.
            // The camera zoom is handled outside (passed as `zoom`).
            // Total scale acting on drawing commands is `this.scale * zoom`.
            // To get 24px screen size, we need to draw with radius:
            // R_local = (24 / 2) / (this.scale * zoom)

            const screenBtnSize = 24;
            const propertiesScale = this.scale * zoom;
            const localRadius = (screenBtnSize / 2) / propertiesScale;

            this.currentButtonRadius = localRadius; // Store for hit test

            const x = this.width / 2;
            const y = -this.height / 2;

            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(x, y, localRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / propertiesScale; // Constant screen line width for X

            // X icon size (approx 60% of button)
            const iconOffset = localRadius * 0.4;

            ctx.beginPath();
            ctx.moveTo(x - iconOffset, y - iconOffset);
            ctx.lineTo(x + iconOffset, y + iconOffset);
            ctx.moveTo(x + iconOffset, y - iconOffset);
            ctx.lineTo(x - iconOffset, y + iconOffset);
            ctx.stroke();
        }

        ctx.restore();
    }

    isDeleteButtonHit(wx, wy, zoom = 1) {
        if (!this.selected) return false;

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

        const btnX = this.width / 2;
        const btnY = -this.height / 2;

        const dist = Math.sqrt(Math.pow(lx - btnX, 2) + Math.pow(ly - btnY, 2));

        // Use the same radius calculation
        const screenBtnSize = 24;
        const propertiesScale = this.scale * zoom;
        const hitRadius = (screenBtnSize / 2) / propertiesScale;

        // Add small tolerance padding? Or exact? 
        // User complained hit area is not same. Let's make it exact or slightly generous.
        return dist < (hitRadius * 1.2);
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
