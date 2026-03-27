import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getFlapKey } from '../lib';
import type { TFlap, TSpool } from '../types';
import { charSpool } from './presets';

/**
 * Base class for all spool variants. Contains only stepping logic and
 * HTML helpers — no styles, no element registration.
 *
 * Extend this to build a custom spool variant:
 *   export class MySpool extends SplitFlapSpoolBase {
 *     static readonly styles = css`...`; // fully yours
 *     override render() { ... }
 *   }
 */
export abstract class SplitFlapSpoolBase extends LitElement {
	@property({ type: String })
	public value = ' ';

	@property({ type: Array })
	public flaps: TSpool = charSpool;

	@property({ type: Number })
	public speed = 60;

	@state()
	protected _currentIndex = 0;

	@state()
	protected _prevIndex = 0;

	@state()
	protected _stepping = false;

	private _targetIndex = -1;
	private _stepTimer: ReturnType<typeof setTimeout> | null = null;
	private _animTimer: ReturnType<typeof setTimeout> | null = null;

	protected get _animDur(): number {
		return Math.max(Math.floor(this.speed * 0.85), 1);
	}

	override updated(changed: Map<string, unknown>): void {
		if (changed.has('value') || changed.has('flaps')) {
			this._startStepping();
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._clearTimers();
	}

	private _startStepping(): void {
		const targetIndex = this.flaps.findIndex((f) => getFlapKey(f) === this.value);
		if (targetIndex === -1) return;

		this._targetIndex = targetIndex;
		if (this._currentIndex === this._targetIndex) return;

		// If a flip is already in progress (animating or waiting between steps),
		// just update the target — the running loop will reach it without
		// interrupting the current animation.
		if (this._stepping || this._stepTimer != null) return;

		this._doStep();
	}

	private _doStep(): void {
		const nextIndex = (this._currentIndex + 1) % this.flaps.length;
		this._prevIndex = this._currentIndex;
		this._currentIndex = nextIndex;
		this._stepping = true;

		if (this._animTimer != null) clearTimeout(this._animTimer);
		this._animTimer = setTimeout(() => {
			this._stepping = false;
		}, this._animDur);

		if (this._currentIndex !== this._targetIndex) {
			this._stepTimer = setTimeout(() => {
				this._stepTimer = null;
				this._doStep();
			}, this.speed);
		} else {
			// Reached target — wait for the flip to finish, then settle.
			// If _targetIndex changed while waiting (new value arrived), keep going.
			this._stepTimer = setTimeout(() => {
				this._stepTimer = null;
				if (this._targetIndex !== -1 && this._currentIndex !== this._targetIndex) {
					this._doStep();
				} else {
					this._targetIndex = -1;
					this.dispatchEvent(
						new CustomEvent('settled', {
							detail: { value: this.value },
							bubbles: true,
							composed: true
						})
					);
				}
			}, this._animDur);
		}
	}

	private _clearTimers(): void {
		if (this._stepTimer != null) {
			clearTimeout(this._stepTimer);
			this._stepTimer = null;
		}
		if (this._animTimer != null) {
			clearTimeout(this._animTimer);
			this._animTimer = null;
		}
	}

	/** Renders the content of one flap half. Uses class names defined in sharedSpoolStyles. */
	protected _renderHalf(flap: TFlap, half: 'top' | 'bottom'): TemplateResult {
		switch (flap.type) {
			case 'char':
				return html`
					<div
						class="char-inner"
						style=${styleMap({
							...(flap.color != null ? { color: flap.color } : {}),
							...(flap.bg != null ? { background: flap.bg } : {})
						})}
					>
						${flap.value}
					</div>
				`;
			case 'color':
				return html`<div class="color-fill" style="background: ${flap.value}"></div>`;
			case 'image':
				return html`<img class="image-fill" src=${flap.src} alt=${flap.alt ?? ''} />`;
			case 'custom': {
				const content = flap[half];
				return html`<div class="custom-fill">
					${typeof content === 'function' ? content() : content}
				</div>`;
			}
		}
	}

	/** Returns current and previous flap for use in render. */
	protected _getFlaps(): { current: TFlap; prev: TFlap } {
		return {
			current: (this.flaps[this._currentIndex] ?? this.flaps[0]) as TFlap,
			prev: (this.flaps[this._prevIndex] ?? this.flaps[0]) as TFlap
		};
	}

	/**
	 * Renders the two card halves with fold animation.
	 * Wrap this in a `.spool` div with `--_anim-dur` set.
	 */
	protected _renderCard(): TemplateResult {
		const { current, prev } = this._getFlaps();
		const bottomStatic = this._stepping ? prev : current;

		return html`
			<div class="half top">${this._renderHalf(current, 'top')}</div>
			<div class="half bottom">${this._renderHalf(bottomStatic, 'bottom')}</div>

			${this._stepping
				? html`
						<div class="half top flipping">${this._renderHalf(prev, 'top')}</div>
						<div class="half bottom flipping">${this._renderHalf(current, 'bottom')}</div>
					`
				: nothing}
		`;
	}
}
