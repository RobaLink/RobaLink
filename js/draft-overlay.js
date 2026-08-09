'use strict';

/**
 * HUD border overlay sized to the visible background region (default: #hero).
 * Kept separate from DraftBackground so framing can match visible content area.
 */
class DraftOverlay {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.boundsSelector = options.boundsSelector || '#hero';
        this.boundsEl = document.querySelector(this.boundsSelector);
        this.layerEl = this.canvas.closest('#draft-bg-layer')
            || document.getElementById('draft-bg-layer');
        this.headerEl = document.getElementById('main-header') || document.querySelector('header');
        this.scrollY = 0;
        this.scrollOffset = 0;
        this.w = 0;
        this.h = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.config = {
            scrollLerp: 0.1,
            uiColor: 'rgba(53, 67, 146, 0.35)',
            textColor: 'rgba(53, 67, 146, 0.45)'
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
        }, { passive: true });

        if (this.reducedMotion) {
            this.draw();
        } else {
            this.animate();
        }
    }

    updateBounds() {
        if (!this.boundsEl || !this.layerEl) return false;

        const rect = this.boundsEl.getBoundingClientRect();
        const layerRect = this.layerEl.getBoundingClientRect();
        const headerBottom = this.headerEl
            ? this.headerEl.getBoundingClientRect().bottom
            : 0;

        const visTop = Math.max(headerBottom, rect.top);
        const visLeft = Math.max(0, rect.left);
        const visRight = Math.min(window.innerWidth, rect.right);
        const visBottom = Math.min(window.innerHeight, rect.bottom);

        const w = Math.round(visRight - visLeft);
        const h = Math.round(visBottom - visTop);

        if (w <= 0 || h <= 0) {
            this.canvas.style.visibility = 'hidden';
            return false;
        }

        this.canvas.style.visibility = 'visible';
        this.canvas.style.top = `${visTop - layerRect.top}px`;
        this.canvas.style.left = `${visLeft - layerRect.left}px`;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;

        if (w !== this.w || h !== this.h) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.dpr = dpr;
            this.w = w;
            this.h = h;
            this.canvas.width = w * dpr;
            this.canvas.height = h * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        return true;
    }

    resize() {
        this.updateBounds();
        if (this.reducedMotion) this.draw();
    }

    animate() {
        if (this.reducedMotion) {
            this.scrollOffset = this.scrollY;
        } else {
            this.scrollOffset += (this.scrollY - this.scrollOffset) * this.config.scrollLerp;
        }

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    drawEdgeTicks() {
        const { ctx, w, h } = this;
        const step = 60;

        ctx.strokeStyle = 'rgba(53, 67, 146, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < w; x += step) {
            ctx.moveTo(x, 0); ctx.lineTo(x, 6);
            ctx.moveTo(x, h); ctx.lineTo(x, h - 6);
        }
        for (let y = 0; y < h; y += step) {
            ctx.moveTo(0, y); ctx.lineTo(6, y);
            ctx.moveTo(w, y); ctx.lineTo(w - 6, y);
        }
        ctx.stroke();
    }

    drawScaleRuler(ox, oy) {
        const { ctx } = this;
        const { uiColor, textColor } = this.config;
        const divisions = 4;
        const segW = 22;
        const totalW = divisions * segW;
        const tickDown = 4;

        ctx.strokeStyle = uiColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox, oy + tickDown);
        ctx.lineTo(ox, oy);
        ctx.lineTo(ox + totalW, oy);
        ctx.lineTo(ox + totalW, oy + tickDown);
        for (let i = 1; i < divisions; i++) {
            const x = ox + i * segW;
            ctx.moveTo(x, oy);
            ctx.lineTo(x, oy + tickDown);
        }
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        const labelY = oy + tickDown + 11;
        ctx.fillText('0', ox, labelY);
        ctx.fillText('40m', ox + segW * 2 - 8, labelY);
        ctx.textAlign = 'right';
        ctx.fillText('80m', ox + totalW, labelY);
        ctx.textAlign = 'left';
    }

    drawStaticHUD() {
        const { ctx, w, h } = this;
        const { uiColor, textColor } = this.config;
        const pad = 24;

        ctx.strokeStyle = uiColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();

        const len = 12;
        ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
        ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len);
        ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad);
        ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        const scrollVal = Math.round(this.scrollOffset).toString().padStart(4, '0');
        const offsetText = `OFFSET: +${scrollVal}`;
        const sideInset = pad + 20;

        this.drawScaleRuler(sideInset, pad + 4);

        ctx.textAlign = 'right';
        ctx.fillText(offsetText, w - sideInset, pad + 14);
        ctx.textAlign = 'left';
    }

    draw() {
        if (!this.updateBounds()) return;

        const { ctx, w, h } = this;
        ctx.clearRect(0, 0, w, h);
        this.drawEdgeTicks();
        this.drawStaticHUD();
    }
}
