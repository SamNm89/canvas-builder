export class Scene {
    constructor() {
        this.objects = [];
    }

    add(object) {
        this.objects.push(object);
        // Sort by z-index if we add that property later
    }

    remove(object) {
        this.objects = this.objects.filter(obj => obj !== object);
    }

    moveToTop(object) {
        this.remove(object);
        this.add(object);
    }

    draw(ctx) {
        // Determine render order? For now, insertion order (Painter's algorithm)
        this.objects.forEach(obj => {
            if (obj.draw) {
                obj.draw(ctx);
            }
        });
    }

    // Hit testing for selection
    hitTest(x, y) {
        // Iterate in reverse to select top-most object first
        for (let i = this.objects.length - 1; i >= 0; i--) {
            if (this.objects[i].containsPoint(x, y)) {
                return this.objects[i];
            }
        }
        return null;
    }
}
