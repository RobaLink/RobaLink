'use strict';

/** Inline SVG sprite reference (symbols live in index.html). */
function iconHtml(name) {
    return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}
