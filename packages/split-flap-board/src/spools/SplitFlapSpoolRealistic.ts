import { css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getRenderedFlaps } from '../lib/spool-layout';
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
	/**
	 * Limits how many flaps are rendered on each side of the drum.
	 * Negative values use the full visible half. This property is ignored by
	 * the `minimal` variant because it only renders the active card.
	 */
	@property({ type: Number })
	public visibleSideCount = -1;

	private readonly _slotRef = createRef<HTMLDivElement>();
	private _wrapResetTimer: ReturnType<typeof setTimeout> | null = null;
	private _skipNextIndexAnimation = false;

	static readonly styles = css`
		:host {
			display: inline-block;
			perspective: var(--sfb-perspective, 400px);
			font-size: var(--sfb-font-size, 1.5rem);
			font-family: var(--sfb-font-family, monospace);
		}

		.slot {
			display: grid;
			place-content: center;
			/* Lets the outside rotate the slot while staying inside the host's own
			   perspective context — an outer rotateY would flatten the 3D drum. */
			transform: var(--sfb-view-transform, none);
			transform-style: preserve-3d;
			transition: transform 0.5s cubic-bezier(0.25, 0, 0.3, 1);
		}

		/*
		 * All characters stack in the same grid cell (grid-area: 1/1).
		 * Each is positioned around the drum via --a / --a2, computed purely
		 * in CSS from --index relative to --current-character-index.
		 *
		 * --drum-a: unwrapped drum position angle (no backside-flip term).
		 *   Used to place the character's fold hinge on the cylinder surface
		 *   via translateZ/translateY when --sfb-drum-radius > 0.
		 *
		 * --a / --a2: full fold angles (include +past*0.5turn wrapping so
		 *   flaps behind the drum are placed correctly for backface-visibility).
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
			--is-previous: clamp(0, calc(1 - max(var(--offset) + 1, (var(--offset) + 1) * -1) * 1000), 1);
			--is-next: clamp(0, calc(1 - max(var(--offset) - 1, (var(--offset) - 1) * -1) * 1000), 1);
			--natural-angle: calc((0.5 / var(--total0)) * 1turn);
			/* Optional visual cap for small spools. Defaults to uncapped. */
			--angle: min(var(--natural-angle), var(--sfb-max-step-angle, 1turn));
			/* Unwrapped drum position — places fold hinge on the cylinder. */
			--drum-a: calc(var(--abs-offset) * var(--direction) * var(--angle));
			/* top-half angle on the drum (includes backside wrap) */
			--a: calc(var(--abs-offset) * var(--direction) * var(--angle) + var(--past) * 0.5turn);
			/* bottom-half angle on the drum */
			--a2: calc(
				max(var(--abs-offset) - 1, 0) * var(--direction) * var(--angle) + var(--future) * 0.5turn
			);

			display: flex;
			position: relative;
			grid-area: 1 / 1;
			flex-direction: column;
			gap: var(--sfb-crease, 1px);
			/*
			 * Place the fold hinge on the cylinder surface via --drum-a.
			 * With --sfb-drum-radius: 0 (default) both transforms are no-ops.
			 *   Z: current flap (drum-a=0) pushed toward viewer; back flaps recede.
			 *   Y: next char rises above center; previous sinks below.
			 * transition mirrors --_flip-dur so the snap phase (0ms) is instant
			 * and the transition phase smoothly rotates the drum with the flip.
			 */
			transform: translateZ(calc(var(--sfb-drum-radius, 0px) * cos(var(--drum-a))))
				translateY(calc(var(--sfb-drum-radius, 0px) * sin(var(--drum-a)) * -1));
			transform-style: preserve-3d;
			z-index: calc(var(--is-current) * 2 + var(--is-previous) + var(--is-next));
			transition: transform var(--_flip-dur, 0ms) cubic-bezier(0.25, 0, 0.5, 1);
			pointer-events: none;
		}

		/* ── half-flap cards ───────────────────────────────────────────── */
		.flap {
			display: flex;
			position: relative;
			place-content: center;
			transform-style: preserve-3d;
			backface-visibility: hidden;
			transition: transform var(--_flip-dur, 0ms) cubic-bezier(0.25, 0, 0.5, 1);
			will-change: transform;
			box-sizing: content-box;
			border-radius: var(--sfb-spool-radius, 3px);
			background: var(--sfb-bg, #111);
			width: 1em;
			height: 0.5em;
			overflow: hidden;
			color: var(--sfb-color, #f5f0e0);
			line-height: 1;
		}

		/* Top flap — padding centres the character at the fold line.
		   translateZ(0.1px) on current char keeps it in front of past flaps. */
		.flap:first-child {
			align-items: flex-start;
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--a));
			transform-origin: center calc(100% + var(--sfb-crease, 1px) * 0.5);
			padding-top: 0.25em;
		}

		/* Nudge content away from the crease gap */
		.flap:first-child > * {
			translate: 0 calc(var(--sfb-crease, 1px) * 0.5);
		}

		/* Bottom flap */
		.flap:last-child {
			align-items: flex-end;
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--a2));
			transform-origin: center calc(var(--sfb-crease, 1px) * -0.5);
			padding-bottom: 0.25em;
		}

		.flap:last-child > * {
			translate: 0 calc(var(--sfb-crease, 1px) * -0.5);
		}

		/* ── flap content ─────────────────────────────────────────────── */
		.char-inner {
			font-weight: bold;
		}

		.color-fill {
			width: 100%;
			height: 100%;
		}

		.image-fill {
			position: absolute;
			left: 0;
			width: 100%;
			height: 200%;
			object-fit: cover;
			object-position: center center;
		}

		.flap:first-child .image-fill {
			top: 0;
		}

		.flap:last-child .image-fill {
			bottom: 0;
		}

		.custom-fill {
			width: 100%;
			height: 100%;
			overflow: hidden;
		}
	`;

	override firstUpdated(): void {
		this._syncSlotState();
	}

	override updated(changed: Map<string, unknown>): void {
		const previousCurrentIndex = this._currentIndex;
		const previousPrevIndex = this._prevIndex;
		super.updated(changed);

		if (changed.has('flaps')) {
			if (this._wrapResetTimer != null) {
				clearTimeout(this._wrapResetTimer);
				this._wrapResetTimer = null;
			}

			this._skipNextIndexAnimation =
				this._currentIndex !== previousCurrentIndex || this._prevIndex !== previousPrevIndex;
			this._syncSlotState();
		}

		if (changed.has('_currentIndex')) {
			if (this._skipNextIndexAnimation) {
				this._skipNextIndexAnimation = false;
				this._syncSlotState();
				return;
			}

			const prevIdx = (changed.get('_currentIndex') as number) ?? 0;
			void this._animateStep(prevIdx, this._currentIndex);
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this._wrapResetTimer != null) {
			clearTimeout(this._wrapResetTimer);
			this._wrapResetTimer = null;
		}
	}

	private _syncSlotState(): void {
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
		if (this._wrapResetTimer != null) {
			clearTimeout(this._wrapResetTimer);
			this._wrapResetTimer = null;
		}

		el.style.setProperty('--_flip-dur', '0ms');
		el.style.setProperty('--current-character-index', String(prevIdx));

		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => {
				requestAnimationFrame(() => resolve());
			})
		);

		const wrapForward = prevIdx === this.flaps.length - 1 && nextIdx === 0;
		const nextDisplayIdx = wrapForward ? this.flaps.length : nextIdx;

		el.style.setProperty('--_flip-dur', `${this._animDur}ms`);
		el.style.setProperty('--current-character-index', String(nextDisplayIdx));

		if (wrapForward) {
			this._wrapResetTimer = setTimeout(() => {
				el.style.setProperty('--_flip-dur', '0ms');
				el.style.setProperty('--current-character-index', '0');
				this._wrapResetTimer = null;
				this.requestUpdate();
			}, this._animDur);
		}
	}

	private _getRenderCenter(): number {
		const isWrapForward =
			this.flaps.length > 0 &&
			this._prevIndex === this.flaps.length - 1 &&
			this._currentIndex === 0;

		if (isWrapForward && (this._stepping || this._wrapResetTimer != null)) {
			return this.flaps.length;
		}

		return this._currentIndex;
	}

	override render(): TemplateResult {
		const renderCenter = this._getRenderCenter();
		const renderedFlaps = getRenderedFlaps(this.flaps, this._currentIndex, {
			visibleSideCount: this.visibleSideCount,
			renderCenter
		});

		return html`
			<div
				${ref(this._slotRef)}
				class="slot"
				style=${styleMap({ '--total': String(this.flaps.length) })}
			>
				${renderedFlaps.map(
					({ flap, actualIndex, renderedIndex }) => html`
						<div class="character" style="--index: ${renderedIndex}" data-index=${actualIndex}>
							<div class="flap">${this._renderHalf(flap, 'top')}</div>
							<div class="flap" aria-hidden="true">${this._renderHalf(flap, 'bottom')}</div>
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
