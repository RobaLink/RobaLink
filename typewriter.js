/**
 * Code Typewriter Effect
 * Types out code snippets in the mini-editor.
 */
class CodeTypewriter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.code = `function create() {\n  return "Solution";\n}`;
        this.index = 0;
        this.speed = 100;

        if (this.element) this.type();
    }

    type() {
        if (this.index < this.code.length) {
            this.element.textContent += this.code.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        } else {
            // Finished
            setTimeout(() => {
                this.element.textContent = '';
                this.index = 0;
                this.type();
            }, 3000);
        }
    }
}
