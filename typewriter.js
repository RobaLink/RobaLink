'use strict';

/**
 * Code Typewriter Effect
 * Simulates a typing effect for code snippets in the mini-editor.
 */
class CodeTypewriter {
    constructor(elementId, initialCode = '') {
        this.element = document.getElementById(elementId);
        this.code = initialCode;
        this.index = 0;
        this.baseSpeed = 100;
        this.timeoutId = null;

        if (this.element && this.code) {
            this.type();
        }
    }

    /**
     * Executes the typing animation
     */
    type() {
        if (this.index < this.code.length) {
            this.element.textContent += this.code.charAt(this.index);
            this.index++;

            // Slight speed variation for a natural rhythm
            const randomSpeed = this.baseSpeed * (0.5 + Math.random());
            this.timeoutId = setTimeout(() => this.type(), randomSpeed);
        } else {
            // Wait before restarting the loop
            this.timeoutId = setTimeout(() => {
                this.element.textContent = '';
                this.index = 0;
                this.type();
            }, 3000);
        }
    }

    /**
     * Updates the code snippet and restarts the animation
     * @param {string} newCode - The new code string to type
     */
    updateCode(newCode) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.code = newCode;
        this.index = 0;

        if (this.element) {
            this.element.textContent = '';
            this.timeoutId = setTimeout(() => this.type(), this.baseSpeed);
        }
    }
}
