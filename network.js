'use strict';

/**
 * Interactive Network Background
 * Renders floating nodes connected by lines, reacting to mouse proximity.
 */
class NetworkBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];

        // Configuration
        this.config = {
            // Density: 1 node per X pixels squared (e.g. 15000)
            density: 15000,
            connectionDistance: 150,
            mouseDistance: 200,
            nodeSpeed: 0.3,
            nodeColor: 'rgba(97, 106, 158, 0.4)',
            lineColor: 'rgba(53, 67, 146, 0.15)',
            mouseLineColor: 'rgba(53, 67, 146, 0.3)',
            dotSize: 1.5,
            lineWidth: 1
        };

        this.mouse = { x: null, y: null };

        this.init();
    }

    init() {
        this.resize();
        this.addEventListeners();
        this.animate();
    }

    resize() {
        // Adjust canvas dimensions to viewport size
        this.canvas.width = document.documentElement.clientWidth;
        this.canvas.height = window.innerHeight;
        // Re-create nodes on resize to match new density
        this.createNodes();
    }

    createNodes() {
        this.nodes = [];
        const area = this.canvas.width * this.canvas.height;
        const nodeCount = Math.floor(area / this.config.density);

        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.nodeSpeed,
                vy: (Math.random() - 0.5) * this.config.nodeSpeed
            });
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateNodes();
        this.drawConnections();
        this.drawNodes();

        requestAnimationFrame(() => this.animate());
    }

    updateNodes() {
        this.nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off edges
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;
        });
    }

    drawNodes() {
        this.ctx.fillStyle = this.config.nodeColor;
        this.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.config.dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawConnections() {
        this.ctx.lineWidth = this.config.lineWidth;

        // Connect nodes to each other
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    // Calculate opacity based on distance
                    const opacity = 1 - (distance / this.config.connectionDistance);
                    this.ctx.strokeStyle = this.config.lineColor.replace('0.15)', `${0.15 * opacity})`);

                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                }
            }
        }

        // Connect nodes to mouse
        if (this.mouse.x != null) {
            this.nodes.forEach(node => {
                const dx = node.x - this.mouse.x;
                const dy = node.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.mouseDistance) {
                    const opacity = 1 - (distance / this.config.mouseDistance);
                    // Adjust opacity for mouse interaction
                    this.ctx.strokeStyle = this.config.mouseLineColor.replace('0.3)', `${0.3 * opacity})`);

                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            });
        }
    }
}
