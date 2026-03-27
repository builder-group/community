import { css, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { SplitFlapSpoolBase } from './SplitFlapSpoolBase';

/**
 * Realistic split-flap spool — 3D drum approach.
 *
 * Every flap in the spool is a real DOM element positioned around a cylinder
 * with rotateX. Stepping advances the drum so you can see it rotate when the
 * display is tilted (--sfb-view-transform: rotateY(-30deg)).
 *
 * CSS approach adapted from Emil Kowalski's split-flap implementation.
 */
@customElement('split-flap-spool-realistic')
export class SplitFlapSpoolRealistic extends SplitFlapSpoolBase {
	private _mounted = false;
	private readonly _slotRef = createRef<HTMLDivElement>();

	static readonly styles = css`
		:host {
			display: inline-block;
			font-family: var(--sfb-font-family, monospace);
			font-size: var(--sfb-font-size, 1.5rem);
			perspective: var(--sfb-perspective, 400px);
		}

		.slot {
			display: grid;
			place-content: center;
			transform-style: preserve-3d;
			/* Lets the outside rotate the slot while staying inside the host's own
			   perspective context — an outer rotateY would flatten the 3D drum. */
			transform: var(--sfb-view-transform, none);
			transition: transform 0.5s cubic-bezier(0.25, 0, 0.3, 1);
		}

		/*
		 * All characters stack in the same grid cell (grid-area: 1/1).
		 * Each is positioned around the drum via --a / --a2, computed purely
		 * in CSS from --index relative to --current-character-index.
		 */
		.character {
			--total0: calc(var(--total) - 1);
			--offset: calc(var(--index) - var(--current-character-index));
			--abs-offset: max(var(--offset), calc(var(--offset) * -1));
			--safe-abs-offset: max(var(--abs-offset), 0.001);
			--direction: calc(var(--offset) / var(--safe-abs-offset));
			--past: min(0, var(--direction));
			--future: max(0, var(--direction));
			--is-current: clamp(0, calc(1 - var(--abs-offset) * 1000), 1);
			--is-previous: clamp(
				0,
				calc(1 - max(var(--offset) + 1, (var(--offset) + 1) * -1) * 1000),
				1
			);
			--is-next: clamp(
				0,
				calc(1 - max(var(--offset) - 1, (var(--offset) - 1) * -1) * 1000),
				1
			);
			--angle: calc((0.5 / var(--total0)) * 1turn);
			/* top-half angle on the drum */
			--a: calc(
				var(--abs-offset) * var(--direction) * var(--angle) + var(--past) * 0.5turn
			);
			/* bottom-half angle on the drum */
			--a2: calc(
				max(var(--abs-offset) - 1, 0) * var(--direction) * var(--angle) +
					var(--future) * 0.5turn
			);

			display: flex;
			flex-direction: column;
			gap: var(--sfb-crease, 1px);
			grid-area: 1 / 1;
			pointer-events: none;
			position: relative;
			transform-style: preserve-3d;
			z-index: calc(var(--is-current) * 2 + var(--is-previous) + var(--is-next));
		}

		/* Fills the crease gap at the fold line */
		.character::after {
			background: var(--sfb-fold-color, #0a0a0a);
			content: '';
			display: block;
			height: var(--sfb-crease, 1px);
			left: 0;
			position: absolute;
			right: 0;
			top: 50%;
			transform: translateY(-50%);
		}

		/* ── half-flap cards ───────────────────────────────────────────── */
		.flap {
			backface-visibility: hidden;
			background: var(--sfb-bg, #111);
			border-radius: var(--sfb-spool-radius, 3px);
			box-sizing: content-box;
			color: var(--sfb-color, #f5f0e0);
			display: flex;
			height: 0.5em;
			line-height: 1;
			overflow: hidden;
			place-content: center;
			position: relative;
			transform-style: preserve-3d;
			transition: transform var(--_flip-dur, 0ms) cubic-bezier(0.25, 0, 0.5, 1);
			width: 1em;
			will-change: transform;
		}

		/* Top flap — padding centres the character at the fold line.
		   translateZ(0.1px) on current char keeps it in front of past flaps. */
		.flap:first-child {
			align-items: flex-start;
			padding-top: 0.25em;
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--a));
			transform-origin: center calc(100% + var(--sfb-crease, 1px) * 0.5);
		}

		/* Nudge content away from the crease gap */
		.flap:first-child > * {
			translate: 0 calc(var(--sfb-crease, 1px) * 0.5);
		}

		/* Bottom flap */
		.flap:last-child {
			align-items: flex-end;
			padding-bottom: 0.25em;
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--a2));
			transform-origin: center calc(var(--sfb-crease, 1px) * -0.5);
		}

		.flap:last-child > * {
			translate: 0 calc(var(--sfb-crease, 1px) * -0.5);
		}

		/* ── flap content ─────────────────────────────────────────────── */
		.char-inner {
			font-weight: bold;
		}

		.color-fill {
			height: 100%;
			width: 100%;
		}

		.image-fill {
			height: 200%;
			left: 0;
			object-fit: cover;
			object-position: center center;
			position: absolute;
			width: 100%;
		}

		.flap:first-child .image-fill {
			top: 0;
		}

		.flap:last-child .image-fill {
			bottom: 0;
		}

		.custom-fill {
			height: 100%;
			overflow: hidden;
			width: 100%;
		}
	`;

	override updated(changed: Map<string, unknown>): void {
		super.updated(changed);

		if (!this._mounted) {
			this._mounted = true;
			this._initSlot();
			return;
		}

		if (changed.has('_currentIndex')) {
			const prevIdx = (changed.get('_currentIndex') as number) ?? 0;
			void this._animateStep(prevIdx, this._currentIndex);
		}
	}

	private _initSlot(): void {
		const el = this._slotRef.value;
		if (!el) return;
		el.style.setProperty('--current-character-index', String(this._currentIndex));
		el.style.setProperty('--_flip-dur', '0ms');
	}

	/**
	 * Snap back to prevIdx (instant), then transition to nextIdx.
	 * For forward-only adjacent steps the drum advances by exactly one --angle.
	 */
	private async _animateStep(prevIdx: number, nextIdx: number): Promise<void> {
		const el = this._slotRef.value;
		if (!el) return;

		el.style.setProperty('--_flip-dur', '0ms');
		el.style.setProperty('--current-character-index', String(prevIdx));

		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => {
				requestAnimationFrame(() => resolve());
			})
		);

		el.style.setProperty('--_flip-dur', `${this._animDur}ms`);
		el.style.setProperty('--current-character-index', String(nextIdx));
	}

	override render(): TemplateResult {
		return html`
			<div
				${ref(this._slotRef)}
				class="slot"
				style=${styleMap({ '--total': String(this.flaps.length) })}
			>
				${this.flaps.map(
					(flap, i) => html`
						<div class="character" style="--index: ${i}">
							<div class="flap">${this._renderHalf(flap, 'top')}</div>
							<div class="flap" aria-hidden="true">
								${this._renderHalf(flap, 'bottom')}
							</div>
						</div>
					`
				)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-spool-realistic': SplitFlapSpoolRealistic;
	}
}
