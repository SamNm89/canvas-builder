# Canvas Builder

A web-based image composition tool designed for stitching and arranging images with high precision. Built with Vanilla JavaScript and Vite.

## Features

### Core Functionality
- **Infinite Canvas**: Pan and zoom freely to manage large compositions.
- **Smart Snapping**: Images magnetically align to each other's edges for perfect stitching.
- **High-Fidelity Export**: Generates exports at the original resolution of the source images, regardless of screen zoom level. Supports PNG (lossless) and JPEG.

### Interaction Controls
- **Drag & Drop**: Upload images by dragging them directly onto the interface or using the sidebar.
- **Manipulation**:
    - **Move**: Click and drag images.
    - **Rotate**: Toggle rotation mode (Press 'R'), then scroll the mouse wheel over an image.
    - **Scale**: Hold Ctrl + Scroll mouse wheel over an image.
    - **Delete**: Select an image and click the visual 'X' button or press Delete (feature in progress).
- **Auto-Layout**: "Smart Arrange" button automatically packs images into a compact grid.

## Development

### Prerequisites
- Node.js installed.

### Setup
1. Clone the repository:
   git clone https://github.com/SamNm89/canvas-builder.git
2. Navigate to the project directory:
   cd canvas-builder
3. Install dependencies:
   npm install

### Running Locally
Start the development server:
npm run dev

The application will be available at http://localhost:5173 (or the port shown in the terminal).

### Building for Production
Build the project for deployment:
npm run build

The output will be in the 'dist' directory.

## Project Structure
- src/core: Game-loop logic (CanvasManager, Scene, Camera, Interaction).
- src/ui: DOM-based UI handlers.
- src/styles: CSS styling.
- src/main.js: Application entry point.

## License
MIT License
