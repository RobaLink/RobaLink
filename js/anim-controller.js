'use strict';

/**
 * Pauses animation when the tab is hidden or a target element leaves the viewport.
 */
class VisibilityPause {
    constructor(options = {}) {
        this.pauseReasons = new Set();
        this.onPause = options.onPause || (() => {});
        this.onResume = options.onResume || (() => {});
        this.observeSelector = options.observeSelector || null;
        this._observer = null;
    }

    start() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this._pause('hidden');
            else this._resume('hidden');
        });

        if (this.observeSelector) {
            const el = document.querySelector(this.observeSelector);
            if (el) {
                this._observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) this._resume('viewport');
                    else this._pause('viewport');
                }, { threshold: 0 });
                this._observer.observe(el);
            }
        }

        if (document.hidden) this._pause('hidden');
    }

    isPaused() {
        return this.pauseReasons.size > 0;
    }

    _pause(reason) {
        const wasPaused = this.isPaused();
        this.pauseReasons.add(reason);
        if (!wasPaused) this.onPause();
    }

    _resume(reason) {
        this.pauseReasons.delete(reason);
        if (!this.isPaused()) this.onResume();
    }
}
