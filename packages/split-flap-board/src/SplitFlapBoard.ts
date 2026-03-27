import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('split-flap-board')
export class SplitFlapBoard extends LitElement {
	static readonly styles = css`
		:host {
			display: inline-block;
			box-sizing: border-box;
		}
	`;

	override render(): TemplateResult {
		return html`<slot></slot>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-board': SplitFlapBoard;
	}
}
