
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfill for roundRect if not available, crucial for drawing UI elements like disaster chips.
// This is a widely used polyfill to ensure compatibility.
if (!CanvasRenderingContext2D.prototype.roundRect) {
  (CanvasRenderingContext2D.prototype as any).roundRect = function (
    this: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number | null | undefined | { tl?: number, tr?: number, br?: number, bl?: number }
  ) {
    // FIX: Add isFinite checks for all coordinates and dimensions to prevent NaN
    // values from crashing the browser's native Canvas API. This is a critical
    // fix for rendering stability.
    if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h) || w < 0 || h < 0) {
      return;
    }
    
    let radii: { tl: number; tr: number; br: number; bl: number; };

    if (r === null || r === undefined) {
      r = 0;
    }

    if (typeof r === 'number') {
      // FIX: Sanitize the radius to prevent NaN values from crashing the canvas API.
      const radius = isFinite(r) ? Math.max(0, r) : 0;
      radii = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      // FIX: Sanitize each corner radius individually for the same reason.
      const sanitize = (val: any) => (typeof val === 'number' && isFinite(val) ? Math.max(0, val) : 0);
      radii = {
        tl: sanitize(r.tl),
        tr: sanitize(r.tr),
        br: sanitize(r.br),
        bl: sanitize(r.bl),
      };
    }

    // Clamp radii to prevent visual glitches and potential errors if the
    // radius is larger than half the rectangle's width or height.
    const minWH = Math.min(w, h);
    radii.tl = Math.min(radii.tl, minWH / 2);
    radii.tr = Math.min(radii.tr, minWH / 2);
    radii.br = Math.min(radii.br, minWH / 2);
    radii.bl = Math.min(radii.bl, minWH / 2);

    this.beginPath();
    this.moveTo(x + radii.tl, y);
    this.lineTo(x + w - radii.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radii.tr);
    this.lineTo(x + w, y + h - radii.br);
    this.quadraticCurveTo(x + w, y + h, x + w - radii.br, y + h);
    this.lineTo(x + radii.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radii.bl);
    this.lineTo(x, y + radii.tl);
    this.quadraticCurveTo(x, y, x + radii.tl, y);
    this.closePath();
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);