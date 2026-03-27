import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('split-flap-board')
export class SplitFlapBoard extends LitElement {
	static readonly styles = css`
		:host {
			display: inline-block;
			font-family: monospace;
		}

		.board {
			border-radius: 4px;
			background: #111;
			padding: 1rem 1.5rem;
			color: red;
			font-weight: bold;
			font-size: 2rem;
			letter-spacing: 0.1em;
		}
	`;

	@property({ type: String })
	public text = 'Hello World';

	public render() {
		return html`<div class="board">${this.text}</div>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-board': SplitFlapBoard;
	}
}
