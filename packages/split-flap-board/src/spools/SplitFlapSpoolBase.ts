import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getFlapKey } from '../lib';
import type { TFlap, TSpool } from '../types';
import { charSpool } from './presets';

/**
 * Base class for all spool variants. Contains stepping logic and HTML helpers,
 * but leaves styling and element registration to subclasses.
 *
 * Extend this to build a custom spool variant:
 *   export class MySpool extends SplitFlapSpoolBase {
 *     static readonly styles = css`...`;
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
	private _animEndsAt = 0;

	protected get _animDur(): number {
		return Math.max(Math.floor(this.speed * 0.85), 1);
	}

	override updated(changed: Map<string, unknown>): void {
		super.updated(changed);

		if (changed.has('flaps')) {
			this._syncIndicesToFlaps(changed.get('flaps') as TSpool | undefined);
		}

		if (changed.has('value') || changed.has('flaps')) {
			this._startStepping();
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._clearTimers();
	}

	/** The flap currently shown; falls back to index 0 when out of range. */
	public get currentFlap(): TFlap | undefined {
		return this.flaps[this._currentIndex] ?? this.flaps[0];
	}

	/** Key of the currently shown flap, or undefined when flaps is empty. */
	public get currentValue(): string | undefined {
		return this.currentFlap != null ? getFlapKey(this.currentFlap) : undefined;
	}

	/** True when the spool is idle: no animation running and no pending target. */
	public get isSettled(): boolean {
		return (
			!this._stepping &&
			this._targetIndex === -1 &&
			this._stepTimer == null &&
			this._animTimer == null
		);
	}

	/** Returns true when the given key exists in the currently loaded flaps. */
	public hasKey(value: string): boolean {
		return this.flaps.some((flap) => getFlapKey(flap) === value);
	}

	private _startStepping(): void {
		if (!this.flaps.length) {
			this._resetForEmptyFlaps();
			return;
		}

		const targetIndex = this.flaps.findIndex((f) => getFlapKey(f) === this.value);
		const isAnimating = this._stepping || this._stepTimer != null;

		if (targetIndex === -1) {
			this._targetIndex = -1;
			if (isAnimating) {
				this._scheduleAdvanceOrSettle(this._getRemainingAnimTime());
			}
			return;
		}

		this._targetIndex = targetIndex;
		if (this._currentIndex === this._targetIndex) {
			if (isAnimating) {
				this._scheduleAdvanceOrSettle(this._getRemainingAnimTime());
			} else {
				this._targetIndex = -1;
			}
			return;
		}

		// Let the current loop finish and retarget instead of restarting mid-flip.
		if (isAnimating) return;

		this._doStep();
	}

	private _doStep(): void {
		if (!this.flaps.length) {
			this._resetForEmptyFlaps();
			return;
		}

		const nextIndex = (this._currentIndex + 1) % this.flaps.length;
		this._prevIndex = this._currentIndex;
		this._currentIndex = nextIndex;
		this._stepping = true;
		this._animEndsAt = Date.now() + this._animDur;

		if (this._animTimer != null) clearTimeout(this._animTimer);
		this._animTimer = setTimeout(() => {
			this._stepping = false;
			this._animTimer = null;
			this._animEndsAt = 0;
		}, this._animDur);

		const delay =
			this._currentIndex !== this._targetIndex ? this.speed : this._getRemainingAnimTime();
		this._scheduleAdvanceOrSettle(delay);
	}

	private _scheduleAdvanceOrSettle(delay: number): void {
		if (this._stepTimer != null) {
			clearTimeout(this._stepTimer);
		}

		this._stepTimer = setTimeout(
			() => {
				this._stepTimer = null;
				if (this._targetIndex !== -1 && this._currentIndex !== this._targetIndex) {
					this._doStep();
					return;
				}

				this._finishSettling();
			},
			Math.max(delay, 0)
		);
	}

	private _finishSettling(): void {
		if (this._stepping) {
			this._scheduleAdvanceOrSettle(this._getRemainingAnimTime());
			return;
		}

		this._targetIndex = -1;
		const settledValue = this.currentValue;
		if (settledValue == null) return;

		this.dispatchEvent(
			new CustomEvent('settled', {
				detail: { value: settledValue },
				bubbles: true,
				composed: true
			})
		);
	}

	private _getRemainingAnimTime(): number {
		if (!this._stepping) return 0;
		return Math.max(this._animEndsAt - Date.now(), 1);
	}

	private _resetForEmptyFlaps(): void {
		this._clearTimers();
		this._targetIndex = -1;
		this._currentIndex = 0;
		this._prevIndex = 0;
		this._stepping = false;
	}

	// Preserve the visible flap when the spool array is replaced: look up the
	// same key in the new spool so the display doesn't jump to index 0.
	private _syncIndicesToFlaps(previousFlaps?: TSpool): void {
		if (!this.flaps.length) {
			this._resetForEmptyFlaps();
			return;
		}

		if (previousFlaps == null || !previousFlaps.length) {
			this._currentIndex = 0;
			this._prevIndex = 0;
			this._targetIndex = -1;
			this._clearTimers();
			this._stepping = false;
			return;
		}

		const previousCurrent = previousFlaps[this._currentIndex] ?? previousFlaps[0];
		const previousPrev = previousFlaps[this._prevIndex] ?? previousCurrent;
		const currentKey = previousCurrent != null ? getFlapKey(previousCurrent) : undefined;
		const prevKey = previousPrev != null ? getFlapKey(previousPrev) : currentKey;

		this._clearTimers();
		this._stepping = false;
		this._targetIndex = -1;

		const nextCurrentIndex =
			currentKey != null ? this.flaps.findIndex((flap) => getFlapKey(flap) === currentKey) : -1;
		const nextPrevIndex =
			prevKey != null ? this.flaps.findIndex((flap) => getFlapKey(flap) === prevKey) : -1;

		this._currentIndex = nextCurrentIndex >= 0 ? nextCurrentIndex : 0;
		this._prevIndex = nextPrevIndex >= 0 ? nextPrevIndex : this._currentIndex;
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
		this._animEndsAt = 0;
	}

	/** Renders one flap half. Subclass stylesheets must define `.char-inner`, `.color-fill`, `.image-fill`, `.custom-fill`. */
	protected _renderHalf(flap: TFlap, half: 'top' | 'bottom'): TemplateResult {
		switch (flap.type) {
			case 'char':
				return html`
					<div
						class="char-inner"
						style=${styleMap({
							...(flap.color != null ? { color: flap.color } : {}),
							...(flap.bg != null ? { background: flap.bg } : {}),
							...(flap.fontSize != null ? { fontSize: flap.fontSize } : {}),
							...(flap.fontFamily != null ? { fontFamily: flap.fontFamily } : {}),
							...(flap.fontWeight != null ? { fontWeight: flap.fontWeight } : {})
						})}
					>
						${flap.value}
					</div>
				`;
			case 'color':
				return html`<div class="color-fill" style="background: ${flap.value}"></div>`;
			case 'image':
				return html`<img class="image-fill" src=${flap.src} alt=${flap.alt ?? ''} />`;
			case 'custom':
				return html`<div class="custom-fill">${flap[half]}</div>`;
		}
	}

	/** Returns current and previous flap for render. Null when flaps is empty. */
	protected _getFlaps(): { current: TFlap; prev: TFlap } | null {
		const current = this.currentFlap;
		if (current == null) return null;

		return {
			current,
			prev: (this.flaps[this._prevIndex] ?? current) as TFlap
		};
	}

	/** Renders the two card halves. Wrap this in a `.spool` with `--_anim-dur` set. */
	protected _renderCard(): TemplateResult | typeof nothing {
		const flaps = this._getFlaps();
		if (flaps == null) return nothing;

		const { current, prev } = flaps;
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
