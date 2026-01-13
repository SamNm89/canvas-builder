import './styles/main.css'
import { CanvasManager } from './core/CanvasManager.js';
import { Scene } from './core/Scene.js';
import { CanvasObject } from './core/CanvasObject.js';
import { AssetManager } from './ui/AssetManager.js';
import { Exporter } from './core/Exporter.js';

// Setup Layout
document.querySelector('#app').innerHTML = `
  <div id="canvas-container"></div>
  <aside id="toolbar">
    <h2>Assets</h2>
    <label class="btn" style="margin-bottom: 1rem;">
      <span>+ Upload Image</span>
      <input type="file" id="image-upload" accept="image/*" multiple hidden>
    </label>
    <div id="asset-grid" class="asset-grid"></div>
    
    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--color-border);">
        <button id="btn-export-png" class="btn" style="width: 100%; margin-bottom: 0.5rem;">Export PNG</button>
        <button id="btn-export-jpg" class="btn" style="width: 100%; background-color: #444;">Export JPEG</button>
    </div>
  </aside>
`

import { InteractionManager } from './core/InteractionManager.js';

// Core Systems
const canvasManager = new CanvasManager('canvas-container');
const scene = new Scene();
const assetManager = new AssetManager();
const interactionManager = new InteractionManager(canvasManager, scene);
const exporter = new Exporter(canvasManager);

// Export Buttons
document.getElementById('btn-export-png').addEventListener('click', () => {
  // Deselect before export to hide selection box
  scene.objects.forEach(o => o.selected = false);
  // Redraw once to clear selection lines
  canvasManager.clear();
  scene.draw(canvasManager.context);

  exporter.download('png');
});

document.getElementById('btn-export-jpg').addEventListener('click', () => {
  scene.objects.forEach(o => o.selected = false);
  canvasManager.clear();
  // Fill white background for JPEG (transparency becomes black otherwise)
  const ctx = canvasManager.context;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasManager.width, canvasManager.height);
  ctx.restore();

  scene.draw(canvasManager.context);
  exporter.download('jpeg', 0.85); // 85% quality fixed
});

// Drag & Drop to Canvas
const container = document.getElementById('canvas-container');

container.addEventListener('dragover', (e) => {
  e.preventDefault(); // allow drop
});

container.addEventListener('drop', (e) => {
  e.preventDefault();
  const src = e.dataTransfer.getData('imageSrc');
  if (!src) return;

  // Load image object
  const img = new Image();
  img.src = src;
  img.onload = () => {
    // Convert client coordinates to canvas coordinates (roughly)
    // Precise conversion usually requires subtracting canvas offset
    const rect = canvasManager.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale down if huge
    let scale = 1;
    if (img.width > 500) scale = 500 / img.width;

    const obj = new CanvasObject(img, x - (img.width * scale) / 2, y - (img.height * scale) / 2);
    obj.scale = scale;
    scene.add(obj);
  };
});


// Render Loop
function animate() {
  requestAnimationFrame(animate);

  const ctx = canvasManager.context;

  canvasManager.clear();

  // Draw Background Grid locally (better than CSS for export? No, export is just canvas content)
  // If we want grid in export, draw it here. If not, keeping it CSS is fine.
  // User asked for "Render the final composition", usually implies just the content.

  scene.draw(ctx);

  // Draw Snap Indicators (Overlay)
  interactionManager.snappingManager.drawIndicators(ctx);
}

animate();

console.log('Canvas Builder Initialized');
