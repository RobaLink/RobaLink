'use strict';

/**
 * Programmatic infinite laptop row — spawns designs in a cycle with equal spacing.
 */
class LaptopShowcase {
    constructor(sectionId, trackId) {
        this.section = document.getElementById(sectionId);
        this.track = document.getElementById(trackId);
        if (!this.section || !this.track) return;

        this.designs = ['analytics', 'invoice', 'controlpanel', 'broadcast'];
        this.patternWidth = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.scrollFactor = 0.4;
        this.resizeTimer = null;

        this.init();
    }

    init() {
        this.buildTrack();
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.buildTrack(), 150);
        });
        window.addEventListener('scroll', () => this.update(), { passive: true });
    }

    createLaptop(type) {
        const tpl = document.getElementById(`laptop-tpl-${type}`);
        if (!tpl) return null;
        return tpl.content.firstElementChild.cloneNode(true);
    }

    buildTrack() {
        const savedOffset = this.reducedMotion ? 0 : (window.scrollY * this.scrollFactor) % (this.patternWidth || 1);

        this.track.replaceChildren();

        const probe = this.createLaptop(this.designs[0]);
        if (!probe) return;

        this.track.appendChild(probe);
        const itemWidth = probe.offsetWidth;
        const itemStyle = getComputedStyle(probe);
        const itemMargin = parseFloat(itemStyle.marginLeft) + parseFloat(itemStyle.marginRight);
        const stride = itemWidth + itemMargin;
        this.track.removeChild(probe);

        const patternUnits = this.designs.length;
        this.patternWidth = patternUnits * stride;

        const minWidth = window.innerWidth * 2 + this.patternWidth;
        const count = Math.ceil(minWidth / stride) + patternUnits;

        for (let i = 0; i < count; i++) {
            const type = this.designs[i % patternUnits];
            const laptop = this.createLaptop(type);
            if (laptop) this.track.appendChild(laptop);
        }

        if (!this.reducedMotion && this.patternWidth > 0) {
            const offset = savedOffset % this.patternWidth;
            this.track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        } else {
            this.track.style.transform = 'translate3d(0, 0, 0)';
        }
    }

    update() {
        if (this.reducedMotion || !this.patternWidth) return;

        const offset = (window.scrollY * this.scrollFactor) % this.patternWidth;
        this.track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }
}
