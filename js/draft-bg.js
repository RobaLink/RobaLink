'use strict';

/**
 * High-performance generative tech topographic field.
 * Border/HUD overlay lives in draft-overlay.js.
 */
class DraftBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.targetMouse = { x: -1, y: -1 };
        this.mouse = { x: -1, y: -1 };
        this.scrollY = 0;
        this.scrollOffset = 0;
        this.time = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.config = {
            cellSize: 48,
            levels: 20,
            lineWidthMin: 1.0,
            lineWidthMax: 1.5,
            opacityMin: 0.15,
            opacityMax: 0.35,
            timeSpeed: 0.0018,
            mouseInfluence: 0.015,
            mouseRadius: 110,
            mouseLerp: 0.2,
            scrollFactor: 0.25,
            scrollLerp: 0.1,
            dotStep: 24,
            dotRadius: 0.85,
            dotColor: 'rgba(53, 67, 146, 0.11)'
        };

        this.applyThemeColors();
        this.init();
    }

    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    applyThemeColors() {
        if (this.isDarkTheme()) {
            this.config.dotColor = 'rgba(140, 170, 230, 0.12)';
            this.config.opacityMin = 0.12;
            this.config.opacityMax = 0.32;
            this._lineRgb = { r0: 90, g0: 120, b0: 190, r1: 150, g1: 185, b1: 240 };
        } else {
            this.config.dotColor = 'rgba(53, 67, 146, 0.11)';
            this.config.opacityMin = 0.15;
            this.config.opacityMax = 0.35;
            this._lineRgb = { r0: 53, g0: 58, b0: 130, r1: 74, g1: 106, b1: 158 };
        }
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = e.clientX;
            this.targetMouse.y = e.clientY;
        });
        document.addEventListener('mouseleave', () => {
            this.targetMouse.x = -1;
            this.targetMouse.y = -1;
        });
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
        }, { passive: true });

        document.addEventListener('themechange', () => {
            this.applyThemeColors();
            if (this.reducedMotion) this.draw();
        });

        if (this.reducedMotion) {
            this.draw();
        } else {
            this.animate();
        }
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.dpr = dpr;
        this.w = document.documentElement.clientWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cs = this.config.cellSize;
        this.cols = Math.max(40, Math.round(this.w / cs) + 1);
        this.rows = Math.max(28, Math.round(this.h / cs) + 1);

        if (this.reducedMotion) this.draw();
    }

    animate() {
        this.time += this.config.timeSpeed;
        if (this.reducedMotion) {
            this.scrollOffset = this.scrollY;
            this.mouse.x = this.targetMouse.x;
            this.mouse.y = this.targetMouse.y;
        } else {
            this.scrollOffset += (this.scrollY - this.scrollOffset) * this.config.scrollLerp;
            
            if (this.targetMouse.x < 0) {
                this.mouse.x = -1;
                this.mouse.y = -1;
            } else if (this.mouse.x < 0) {
                this.mouse.x = this.targetMouse.x;
                this.mouse.y = this.targetMouse.y;
            } else {
                this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.config.mouseLerp;
                this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.config.mouseLerp;
            }
        }
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    getElevation(x, y, t) {
        const scale1 = 0.0005;
        const scale2 = 0.001;
        const sy = y + this.scrollOffset * this.config.scrollFactor;

        let e = this.simplex2D(x * scale1, sy * scale1 + t * 0.05) * 0.7;
        e += this.simplex2D(x * scale2, sy * scale2 - t * 0.02) * 0.3;

        if (this.mouse.x >= 0) {
            const dx = x - this.mouse.x;
            const dy = y - this.mouse.y;
            const d2 = dx * dx + dy * dy;
            const r = this.config.mouseRadius;
            e += this.config.mouseInfluence * Math.exp(-d2 / (r * r));
        }

        return (e + 1) * 0.5;
    }

    contourStyle(level, total) {
        const t = level / total;
        const isIndexLine = level % 5 === 0;
        const eased = t * t * (3 - 2 * t);
        const wave = 0.8 + 0.2 * Math.sin(t * Math.PI * 2.4);
        const { opacityMin, opacityMax, lineWidthMin, lineWidthMax } = this.config;

        let opacity = (opacityMin + (opacityMax - opacityMin) * eased) * wave;
        let width = lineWidthMin + (lineWidthMax - lineWidthMin) * eased;

        if (isIndexLine) {
            opacity = Math.min(1.0, opacity * 1.5);
            width *= 1.4;
        }

        const rgb = this._lineRgb || { r0: 45, g0: 58, b0: 130, r1: 97, g1: 106, b1: 158 };
        const r = Math.round(rgb.r0 + (rgb.r1 - rgb.r0) * eased);
        const g = Math.round(rgb.g0 + (rgb.g1 - rgb.g0) * eased);
        const b = Math.round(rgb.b0 + (rgb.b1 - rgb.b0) * eased);

        return {
            color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
            width: width,
            isIndexLine: isIndexLine
        };
    }

    drawDotMatrix() {
        const { ctx, w, h } = this;
        const { dotStep, dotRadius, dotColor } = this.config;
        const offset = dotStep * 0.5;

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        for (let x = offset; x < w; x += dotStep) {
            for (let y = offset; y < h; y += dotStep) {
                ctx.moveTo(x + dotRadius, y);
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            }
        }
        ctx.fill();
    }

    draw() {
        const { ctx, w, h } = this;
        ctx.clearRect(0, 0, w, h);

        this.drawDotMatrix();

        const { grid, cellW, cellH } = this.buildGrid(this.time);
        const { levels } = this.config;

        for (let lev = 1; lev <= levels; lev++) {
            const threshold = lev / (levels + 1);
            const style = this.contourStyle(lev, levels);

            ctx.beginPath();
            ctx.strokeStyle = style.color;
            ctx.lineWidth = style.width;
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';

            if (style.isIndexLine) {
                ctx.setLineDash([12, 4, 2, 4]);
            } else if (lev % 3 === 0) {
                ctx.setLineDash([4, 6]);
            } else {
                ctx.setLineDash([]);
            }

            for (let r = 0; r < this.rows - 1; r++) {
                for (let c = 0; c < this.cols - 1; c++) {
                    this.marchCell(
                        ctx,
                        c * cellW,
                        r * cellH,
                        cellW,
                        cellH,
                        grid[r][c],
                        grid[r][c + 1],
                        grid[r + 1][c + 1],
                        grid[r + 1][c],
                        threshold
                    );
                }
            }

            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    buildGrid(t) {
        const { cols, rows, w, h } = this;
        const cellW = w / (cols - 1);
        const cellH = h / (rows - 1);
        const grid = [];

        for (let r = 0; r < rows; r++) {
            grid[r] = new Float32Array(cols);
            for (let c = 0; c < cols; c++) {
                grid[r][c] = this.getElevation(c * cellW, r * cellH, t);
            }
        }

        return { grid, cellW, cellH };
    }

    marchCell(ctx, x, y, cellW, cellH, v0, v1, v2, v3, threshold) {
        let cellIndex = 0;
        if (v0 >= threshold) cellIndex |= 1;
        if (v1 >= threshold) cellIndex |= 2;
        if (v2 >= threshold) cellIndex |= 4;
        if (v3 >= threshold) cellIndex |= 8;

        if (cellIndex === 0 || cellIndex === 15) return;

        const top = [x + cellW * ((threshold - v0) / (v1 - v0 || 1)), y];
        const right = [x + cellW, y + cellH * ((threshold - v1) / (v2 - v1 || 1))];
        const bottom = [x + cellW * ((threshold - v3) / (v2 - v3 || 1)), y + cellH];
        const left = [x, y + cellH * ((threshold - v0) / (v3 - v0 || 1))];

        switch (cellIndex) {
            case 1:
            case 14:
                ctx.moveTo(left[0], left[1]); ctx.lineTo(top[0], top[1]);
                break;
            case 2:
            case 13:
                ctx.moveTo(top[0], top[1]); ctx.lineTo(right[0], right[1]);
                break;
            case 3:
            case 12:
                ctx.moveTo(left[0], left[1]); ctx.lineTo(right[0], right[1]);
                break;
            case 4:
            case 11:
                ctx.moveTo(right[0], right[1]); ctx.lineTo(bottom[0], bottom[1]);
                break;
            case 5:
                ctx.moveTo(left[0], left[1]); ctx.lineTo(top[0], top[1]);
                ctx.moveTo(right[0], right[1]); ctx.lineTo(bottom[0], bottom[1]);
                break;
            case 6:
            case 9:
                ctx.moveTo(top[0], top[1]); ctx.lineTo(bottom[0], bottom[1]);
                break;
            case 7:
            case 8:
                ctx.moveTo(left[0], left[1]); ctx.lineTo(bottom[0], bottom[1]);
                break;
            case 10:
                ctx.moveTo(top[0], top[1]); ctx.lineTo(right[0], right[1]);
                ctx.moveTo(left[0], left[1]); ctx.lineTo(bottom[0], bottom[1]);
                break;
            default:
                break;
        }
    }

    simplex2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const x0 = x - (i - t);
        const y0 = y - (j - t);
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const grad = this.grad2D;
        const perm = this.perm;

        let n0 = 0;
        let n1 = 0;
        let n2 = 0;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            t0 *= t0;
            const g = grad[perm[ii + perm[jj]] % 12];
            n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
        }
        t0 = 0.5 - x1 * x1 - y1 * y1;
        if (t0 >= 0) {
            t0 *= t0;
            const g = grad[perm[ii + i1 + perm[jj + j1]] % 12];
            n1 = t0 * t0 * (g[0] * x1 + g[1] * y1);
        }
        t0 = 0.5 - x2 * x2 - y2 * y2;
        if (t0 >= 0) {
            t0 *= t0;
            const g = grad[perm[ii + 1 + perm[jj + 1]] % 12];
            n2 = t0 * t0 * (g[0] * x2 + g[1] * y2);
        }
        return 70 * (n0 + n1 + n2);
    }

    get perm() {
        if (!this._perm) {
            const src = [
                151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
                140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
                247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
                57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
                74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
                60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
                65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
                200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
                52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
                207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
                119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
                129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
                218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
                81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
                184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
                222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
            ];
            const p = new Uint8Array(512);
            for (let i = 0; i < 512; i++) p[i] = src[i & 255];
            this._perm = p;
        }
        return this._perm;
    }

    get grad2D() {
        if (!this._grad2D) {
            this._grad2D = [
                [1, 1], [-1, 1], [1, -1], [-1, -1],
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [-1, 1], [0, -1], [0, 1]
            ];
        }
        return this._grad2D;
    }
}
