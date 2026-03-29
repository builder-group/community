import { css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getRenderedFlaps } from '../lib';
import { SplitFlapSpoolBase } from './SplitFlapSpoolBase';

/**
 * Realistic split-flap spool using a 3D drum.
 *
 * Each flap hinge is positioned around a cylinder. The top and bottom halves
 * share that slot position, then add fold deltas for the outgoing and incoming
 * flap during a step.
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
			font-size: 2rem;
			font-family: monospace;
		}

		.slot {
			display: grid;
			place-content: center;
			/* Keep board tilt on the inner slot so the drum stays inside host perspective. */
			transform: var(--sfb-view-transform, none);
			transform-style: preserve-3d;
			transition: transform 0.5s cubic-bezier(0.25, 0, 0.3, 1);
		}

		/* Use one slot angle so drum placement and fold state stay in sync. */
		.character {
			--offset: calc(var(--index) - var(--current-character-index));
			--abs-offset: max(var(--offset), calc(var(--offset) * -1));
			/* Treat exact offsets as booleans so CSS can select the active neighbors. */
			--is-current: clamp(0, calc(1 - var(--abs-offset) * 1000), 1);
			--is-previous: clamp(0, calc(1 - max(var(--offset) + 1, (var(--offset) + 1) * -1) * 1000), 1);
			--is-next: clamp(0, calc(1 - max(var(--offset) - 1, (var(--offset) - 1) * -1) * 1000), 1);
			--is-future: clamp(0, calc(max(0, var(--offset)) * 1000), 1);
			--is-past: clamp(0, calc(max(0, calc(var(--offset) * -1)) * 1000), 1);
			--show-top: max(var(--is-current), max(var(--is-future), var(--is-previous)));
			--show-bottom: max(var(--is-current), max(var(--is-past), var(--is-next)));
			/*
			 * Keep the outer visible odd-count flap inside the silhouette so it does not
			 * disappear at the +/-90deg edge.
			 */
			--natural-angle: calc((0.5 / var(--total)) * 1turn);
			/* Cap the step angle so small spools still read as a tight drum. */
			--angle: min(var(--natural-angle), var(--sfb-max-step-angle, 1turn));
			--slot-angle: calc(var(--offset) * var(--angle));
			--top-angle: calc(var(--slot-angle) - var(--is-previous) * 90deg);
			--bottom-angle: calc(var(--slot-angle) + var(--is-next) * 90deg);

			display: flex;
			grid-area: 1 / 1;
			flex-direction: column;
			gap: var(--sfb-crease, 1px);
			/* Move the shared hinge onto the drum surface. */
			transform: translateZ(calc(var(--sfb-drum-radius, 0px) * cos(var(--slot-angle))))
				translateY(calc(var(--sfb-drum-radius, 0px) * sin(var(--slot-angle)) * -1));
			transform-style: preserve-3d;
			z-index: calc(var(--is-current) * 2 + var(--is-previous) + var(--is-next));
			transition: transform var(--_flip-dur, 0ms) cubic-bezier(0.25, 0, 0.5, 1);
			pointer-events: none;
		}

		.flap {
			position: relative;
			transform-style: preserve-3d;
			backface-visibility: hidden;
			transition:
				transform var(--_flip-dur, 0ms) cubic-bezier(0.25, 0, 0.5, 1),
				opacity var(--_flip-dur, 0ms) linear;
			will-change: transform;
			box-sizing: border-box;
			border-radius: var(--sfb-spool-radius, 3px);
			background: var(--sfb-bg, #111);
			width: var(--sfb-spool-width, 1em);
			height: calc(var(--sfb-spool-height, 2em) / 2);
			overflow: hidden;
			color: var(--sfb-color, #f5f0e0);
			line-height: 1;
		}

		/* Keep top halves on the upper arc and the outgoing flap. */
		.flap:first-child {
			opacity: var(--show-top);
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--top-angle));
			transform-origin: center calc(100% + var(--sfb-crease, 1px) * 0.5);
		}

		/* Keep bottom halves on the lower arc and the incoming flap. */
		.flap:last-child {
			opacity: var(--show-bottom);
			transform: translateZ(calc(var(--is-current) * 0.1px)) rotateX(var(--bottom-angle));
			transform-origin: center calc(var(--sfb-crease, 1px) * -0.5);
		}

		/* Use 200% fills so each half can crop the same flap content at the fold. */
		.char-inner,
		.image-fill,
		.custom-fill {
			position: absolute;
			left: 0;
			width: 100%;
			height: 200%;
		}

		.flap:first-child .char-inner,
		.flap:first-child .image-fill,
		.flap:first-child .custom-fill {
			top: 0;
		}

		.flap:last-child .char-inner,
		.flap:last-child .image-fill,
		.flap:last-child .custom-fill {
			bottom: 0;
		}

		.char-inner {
			display: flex;
			justify-content: center;
			align-items: center;
			font-weight: bold;
		}

		.color-fill {
			position: absolute;
			inset: 0;
		}

		.image-fill {
			object-fit: cover;
			object-position: center center;
		}

		.custom-fill {
			display: flex;
			justify-content: center;
			align-items: center;
		}
	`;

	override firstUpdated(): void {
		this._syncSlotState();
	}

	override updated(changed: Map<string, unknown>): void {
		// Read indices before super.updated(); it may remap them when flaps change.
		const previousCurrentIndex = this._currentIndex;
		const previousPrevIndex = this._prevIndex;
		super.updated(changed);

		if (changed.has('flaps')) {
			this._clearWrapTimer();

			// Snap when the same flap keys move to new indices in the updated spool.
			const indicesRemapped =
				this._currentIndex !== previousCurrentIndex || this._prevIndex !== previousPrevIndex;
			this._skipNextIndexAnimation = indicesRemapped;
			this._syncSlotState();
		}

		if (changed.has('_currentIndex')) {
			if (this._skipNextIndexAnimation) {
				// Skip the flip when the index changed because the spool changed.
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
		this._clearWrapTimer();
	}

	private _clearWrapTimer(): void {
		if (this._wrapResetTimer != null) {
			clearTimeout(this._wrapResetTimer);
			this._wrapResetTimer = null;
		}
	}

	private _syncSlotState(): void {
		const el = this._slotRef.value;
		if (el == null) return;
		el.style.setProperty('--current-character-index', String(this._currentIndex));
		el.style.setProperty('--_flip-dur', '0ms');
	}

	/**
	 * Snap back to prevIdx (instant), then transition to nextIdx.
	 * For forward-only adjacent steps the drum advances by exactly one --angle.
	 */
	private async _animateStep(prevIdx: number, nextIdx: number): Promise<void> {
		const el = this._slotRef.value;
		if (el == null) return;
		this._clearWrapTimer();

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
