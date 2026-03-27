import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TSpool } from '../types';
import { charSpool } from './presets';
// Side-effect imports ensure both variants are registered when using <split-flap-spool>
import './SplitFlapSpoolMinimal';
import './SplitFlapSpoolRealistic';

@customElement('split-flap-spool')
export class SplitFlapSpool extends LitElement {
	static readonly styles = css`
		:host {
			display: contents;
		}
	`;

	@property({ type: String })
	public variant: 'minimal' | 'realistic' = 'minimal';

	@property({ type: String })
	public value = ' ';

	@property({ type: Array })
	public flaps: TSpool = charSpool;

	@property({ type: Number })
	public speed = 60;

	@property({ type: Number })
	public visibleSideCount = -1;

	override render(): TemplateResult {
		if (this.variant === 'realistic') {
			return html`
				<split-flap-spool-realistic
					.value=${this.value}
					.flaps=${this.flaps}
					.speed=${this.speed}
					.visibleSideCount=${this.visibleSideCount}
				></split-flap-spool-realistic>
			`;
		}
		return html`
			<split-flap-spool-minimal
				.value=${this.value}
				.flaps=${this.flaps}
				.speed=${this.speed}
			></split-flap-spool-minimal>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-spool': SplitFlapSpool;
	}
}
