export class SnappingManager {
    constructor(threshold = 30) { // More aggressive threshold
        this.threshold = threshold;
        this.snapLines = [];
    }

    // Returns correct position and updates internal snapLines state
    snap(activeObject, otherObjects) {
        this.snapLines = [];
        let newX = activeObject.x;
        let newY = activeObject.y;

        // Edges of the active object
        const activeL = activeObject.x;
        const activeR = activeObject.x + activeObject.width * activeObject.scale;
        const activeT = activeObject.y;
        const activeB = activeObject.y + activeObject.height * activeObject.scale;

        const activeCX = (activeL + activeR) / 2;
        const activeCY = (activeT + activeB) / 2;

        // We want to find the closest snap for X and Y independently
        let bestDX = Infinity;
        let bestDY = Infinity;
        let snappedX = null;
        let snappedY = null;
        let snapLineX = null;
        let snapLineY = null;

        otherObjects.forEach(obj => {
            if (obj === activeObject) return;

            const objL = obj.x;
            const objR = obj.x + obj.width * obj.scale;
            const objT = obj.y;
            const objB = obj.y + obj.height * obj.scale;
            const objCX = (objL + objR) / 2;
            const objCY = (objT + objB) / 2;

            // --- X Axis Snapping ---
            const diffsX = [
                { val: objL - activeL, target: objL, line: objL }, // Left to Left
                { val: objL - activeR, target: objL - (activeR - activeL), line: objL }, // Right to Left
                { val: objR - activeL, target: objR, line: objR }, // Left to Right
                { val: objR - activeR, target: objR - (activeR - activeL), line: objR }, // Right to Right
                { val: objCX - activeCX, target: objCX - (activeR - activeL) / 2, line: objCX } // Center to Center
            ];

            diffsX.forEach(d => {
                if (Math.abs(d.val) < this.threshold && Math.abs(d.val) < Math.abs(bestDX)) {
                    bestDX = d.val;
                    snappedX = d.target;
                    snapLineX = d.line;
                }
            });

            // --- Y Axis Snapping ---
            const diffsY = [
                { val: objT - activeT, target: objT, line: objT }, // Top to Top
                { val: objT - activeB, target: objT - (activeB - activeT), line: objT }, // Bottom to Top
                { val: objB - activeT, target: objB, line: objB }, // Top to Bottom
                { val: objB - activeB, target: objB - (activeB - activeT), line: objB }, // Bottom to Bottom
                { val: objCY - activeCY, target: objCY - (activeB - activeT) / 2, line: objCY } // Center to Center
            ];

            diffsY.forEach(d => {
                if (Math.abs(d.val) < this.threshold && Math.abs(d.val) < Math.abs(bestDY)) {
                    bestDY = d.val;
                    snappedY = d.target;
                    snapLineY = d.line;
                }
            });
        });

        // Apply Snap
        if (snappedX !== null) {
            newX = snappedX;
            this.snapLines.push({ x: snapLineX, vertical: true });
        }

        if (snappedY !== null) {
            newY = snappedY;
            this.snapLines.push({ y: snapLineY, vertical: false });
        }

        return { x: newX, y: newY };
    }

    drawIndicators(ctx) {
        if (this.snapLines.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#00f7ff'; // Cyan/Electric Blue for high visibility
        ctx.lineWidth = 1.5;
        // ctx.setLineDash([4, 4]); // Solid line feels more "magnetic"

        // Get canvas bounds (conceptually infinite, but we draw huge lines)
        const huge = 50000;

        this.snapLines.forEach(line => {
            ctx.beginPath();
            if (line.vertical) {
                ctx.moveTo(line.x, -huge);
                ctx.lineTo(line.x, huge);
            } else {
                ctx.moveTo(-huge, line.y);
                ctx.lineTo(huge, line.y);
            }
            ctx.stroke();
        });
        ctx.restore();
    }
}
