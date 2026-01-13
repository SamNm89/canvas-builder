import './styles/main.css'
import { CanvasManager } from './core/CanvasManager.js';
import { Scene } from './core/Scene.js';
import { CanvasObject } from './core/CanvasObject.js';
import { AssetManager } from './ui/AssetManager.js';
import { Camera } from './core/Camera.js';
import { InteractionManager } from './core/InteractionManager.js';
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
    
    <!-- Navigation UI -->
    <div style="margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 1rem;">
       <button id="btn-reset-view" class="btn" style="width: 100%; margin-bottom: 0.5rem; background-color: #555;">Recenter View</button>
       <button id="btn-toggle-rot" class="btn" style="width: 100%; margin-bottom: 0.5rem; background-color: #555;">Toggle Rotation (R)</button>
       <button id="btn-auto-layout" class="btn" style="width: 100%; background-color: #555;">Smart Arrange</button>
    </div>

    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--color-border);">
        <button id="btn-export-png" class="btn" style="width: 100%; margin-bottom: 0.5rem;">Export PNG</button>
        <button id="btn-export-jpg" class="btn" style="width: 100%; background-color: #444;">Export JPEG</button>
    </div>
  </aside>
`

// Core Systems
const canvasManager = new CanvasManager('canvas-container');
const camera = new Camera(canvasManager.width, canvasManager.height);
const scene = new Scene();
const assetManager = new AssetManager();
const interactionManager = new InteractionManager(canvasManager, scene, camera);
const exporter = new Exporter(canvasManager); // Will need update for Camera support

// UI Bindings
document.getElementById('btn-reset-view').addEventListener('click', () => camera.reset());
document.getElementById('btn-toggle-rot').addEventListener('click', () => {
  interactionManager.toggleRotationMode();
  // Visual feedback?
});
document.getElementById('btn-auto-layout').addEventListener('click', () => interactionManager.autoGroup());

// Export Buttons (High Quality)
document.getElementById('btn-export-png').addEventListener('click', () => {
  // Visual feedback: deselect to be safe, though Exporter handles it now.
  scene.objects.forEach(o => o.selected = false);
  canvasManager.clear();
  // Redraw main canvas
  const ctx = canvasManager.context;
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  scene.draw(ctx);
  ctx.restore();

  // Call High Quality Export
  exporter.download('png', 1.0, scene);
});

document.getElementById('btn-export-jpg').addEventListener('click', () => {
  scene.objects.forEach(o => o.selected = false);
  canvasManager.clear();
  const ctx = canvasManager.context;

  // Normal redraw
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  scene.draw(ctx);
  ctx.restore();

  exporter.download('jpeg', 0.90, scene);
});

// Drag & Drop to Canvas
const container = document.getElementById('canvas-container');

container.addEventListener('dragover', (e) => {
  e.preventDefault();
});

container.addEventListener('drop', (e) => {
  e.preventDefault();
  const src = e.dataTransfer.getData('imageSrc');
  if (!src) return;

  const img = new Image();
  img.src = src;
  img.onload = () => {
    const rect = canvasManager.canvas.getBoundingClientRect();
    // Drop coordinates (Screen)
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to World
    const worldPos = camera.screenToWorld(screenX, screenY);

    let scale = 1;
    if (img.width > 500) scale = 500 / img.width;

    const obj = new CanvasObject(img, worldPos.x - (img.width * scale) / 2, worldPos.y - (img.height * scale) / 2);
    obj.scale = scale;
    scene.add(obj);
  };
});


// Render Loop
function animate() {
  requestAnimationFrame(animate);

  const ctx = canvasManager.context;
  canvasManager.clear();

  ctx.save();
  // Apply Camera Transform
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  scene.draw(ctx);

  // Draw Snap Indicators (World Space)
  interactionManager.snappingManager.drawIndicators(ctx);

  ctx.restore();
}

animate();

console.log('Canvas Builder Initialized');
