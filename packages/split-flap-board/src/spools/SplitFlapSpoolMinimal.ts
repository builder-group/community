import { css, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SplitFlapSpoolBase } from './SplitFlapSpoolBase';

@customElement('split-flap-spool-minimal')
export class SplitFlapSpoolMinimal extends SplitFlapSpoolBase {
	static readonly styles = css`
		:host {
			display: inline-block;
			font-size: var(--sfb-font-size, 1.5rem);
			font-family: var(--sfb-font-family, monospace);
		}

		.spool {
			position: relative;
			perspective: 300px;
			perspective-origin: center center;
			width: var(--sfb-spool-width, 1.2em);
			height: var(--sfb-spool-height, 2em);
		}

		.half {
			position: absolute;
			right: 0;
			left: 0;
			background: var(--sfb-bg, #111);
			height: 50%;
			overflow: hidden;
			color: var(--sfb-color, #f5f0e0);
		}

		.half.top {
			top: 0;
			border-bottom: 1px solid var(--sfb-fold-color, #0a0a0a);
			border-top-right-radius: var(--sfb-spool-radius, 4px);
			border-top-left-radius: var(--sfb-spool-radius, 4px);
		}

		.half.bottom {
			bottom: 0;
			border-bottom-right-radius: var(--sfb-spool-radius, 4px);
			border-bottom-left-radius: var(--sfb-spool-radius, 4px);
		}

		.half.flipping {
			z-index: 1;
			backface-visibility: hidden;
		}

		.half.top.flipping {
			transform-origin: bottom center;
			animation: fold-top var(--_anim-dur) linear forwards;
		}

		.half.bottom.flipping {
			transform-origin: top center;
			animation: fold-bottom var(--_anim-dur) linear forwards;
		}

		@keyframes fold-top {
			from {
				transform: rotateX(0deg);
			}
			to {
				transform: rotateX(90deg);
			}
		}

		@keyframes fold-bottom {
			from {
				transform: rotateX(-90deg);
			}
			to {
				transform: rotateX(0deg);
			}
		}

		.char-inner {
			display: flex;
			position: absolute;
			right: 0;
			left: 0;
			justify-content: center;
			align-items: center;
			height: 200%;
			font-weight: var(--sfb-font-weight, bold);
			letter-spacing: 0;
		}

		.half.top .char-inner {
			top: 0;
		}

		.half.bottom .char-inner {
			bottom: 0;
		}

		.color-fill {
			position: absolute;
			inset: 0;
		}

		.image-fill {
			position: absolute;
			left: 0;
			width: 100%;
			height: 200%;
			object-fit: cover;
			object-position: center center;
		}

		.half.top .image-fill {
			top: 0;
		}

		.half.bottom .image-fill {
			bottom: 0;
		}

		.custom-fill {
			position: absolute;
			inset: 0;
			overflow: hidden;
		}
	`;

	override render(): TemplateResult {
		return html`
			<div class="spool" style="--_anim-dur: ${this._animDur}ms">${this._renderCard()}</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-spool-minimal': SplitFlapSpoolMinimal;
	}
}
