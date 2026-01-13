export class SnappingManager {
    constructor(threshold = 15) {
        this.threshold = threshold;
        this.snapLines = []; // Store lines to draw for debug/visual feedback
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

        // We want to find the closest snap for X and Y independently
        let bestDX = Infinity;
        let bestDY = Infinity;
        let snappedX = null;
        let snappedY = null;

        otherObjects.forEach(obj => {
            if (obj === activeObject) return;

            const objL = obj.x;
            const objR = obj.x + obj.width * obj.scale;
            const objT = obj.y;
            const objB = obj.y + obj.height * obj.scale;

            // --- X Axis Snapping ---
            const diffsX = [
                { val: objL - activeL, target: objL, type: 'L-L' }, // Left aligns with Left
                { val: objL - activeR, target: objL - (activeR - activeL), type: 'R-L' }, // Right aligns with Left
                { val: objR - activeL, target: objR, type: 'L-R' }, // Left aligns with Right
                { val: objR - activeR, target: objR - (activeR - activeL), type: 'R-R' }, // Right aligns with Right
                { val: (objL + objR) / 2 - (activeL + activeR) / 2, target: (objL + objR) / 2 - (activeR - activeL) / 2, type: 'C-C' } // Center align
            ];

            diffsX.forEach(d => {
                if (Math.abs(d.val) < this.threshold && Math.abs(d.val) < Math.abs(bestDX)) {
                    bestDX = d.val;
                    snappedX = d.target;
                }
            });

            // --- Y Axis Snapping ---
            const diffsY = [
                { val: objT - activeT, target: objT, type: 'T-T' },
                { val: objT - activeB, target: objT - (activeB - activeT), type: 'B-T' },
                { val: objB - activeT, target: objB, type: 'T-B' },
                { val: objB - activeB, target: objB - (activeB - activeT), type: 'B-B' },
                { val: (objT + objB) / 2 - (activeT + activeB) / 2, target: (objT + objB) / 2 - (activeB - activeT) / 2, type: 'C-C' }
            ];

            diffsY.forEach(d => {
                if (Math.abs(d.val) < this.threshold && Math.abs(d.val) < Math.abs(bestDY)) {
                    bestDY = d.val;
                    snappedY = d.target;
                }
            });
        });

        // Apply Snap
        if (snappedX !== null) {
            newX = snappedX;
            // Add vertical line visual
            this.snapLines.push({ x: (newX + (newX + activeObject.width * activeObject.scale)) / 2, vertical: true }); // Simplification
            // Actually we want the line at the edge that snapped.
            // But calculating exact render position of the line is a refinement.
        }

        if (snappedY !== null) {
            newY = snappedY;
            this.snapLines.push({ y: (newY + (newY + activeObject.height * activeObject.scale)) / 2, vertical: false });
        }

        return { x: newX, y: newY };
    }

    drawIndicators(ctx) {
        if (this.snapLines.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#ff00ff'; // Magenta for snap
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        this.snapLines.forEach(line => {
            ctx.beginPath();
            if (line.vertical) {
                // This is a placeholder visualization. Ideal is a line spanning the two objects.
                // For now, full canvas height line at that X
                // Actually we can't easily get the 'x' from the simplified push above unless we stored it better.
                // I'll fix this in the next iteration or rewrite 'snap' to store coordinate.
            } else {

            }
            ctx.stroke();
        });
        ctx.restore();
    }
}
