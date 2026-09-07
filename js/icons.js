'use strict';

/** viewBox per symbol (must match index.html sprite). */
const ICON_VIEWBOX = {
    moon: '0 0 384 512',
    sun: '0 0 512 512',
    'chevron-down': '0 0 512 512',
    bars: '0 0 448 512',
    pencil: '0 0 512 512',
    envelope: '0 0 512 512',
    user: '0 0 448 512',
    linkedin: '0 0 448 512',
    youtube: '0 0 576 512',
    github: '0 0 496 512',
    instagram: '0 0 448 512',
    tiktok: '0 0 448 512',
};

/** Inline SVG sprite reference (symbols live in index.html). */
function iconHtml(name) {
    const viewBox = ICON_VIEWBOX[name] || '0 0 512 512';
    return `<svg class="icon" viewBox="${viewBox}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}
