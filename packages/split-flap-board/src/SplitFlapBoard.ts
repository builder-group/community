import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SplitFlapSpoolBase } from './spools/SplitFlapSpoolBase';
import './spools/SplitFlapSpool';
import type { TSpool } from './types';

@customElement('split-flap-board')
export class SplitFlapBoard extends LitElement {
	static readonly styles = css`
		:host {
			display: inline-grid;
			gap: var(--sfb-gap, 2px);
			box-sizing: border-box;
		}
	`;

	/** 2-D grid of spool configs — defines what each position can show. Row-major order. */
	@property({ type: Array })
	public spools: TSpool[][] = [];

	/** 2-D grid of target keys — defines what each position currently shows. Row-major order. */
	@property({ type: Array })
	public grid: string[][] = [];

	/** Flip speed in ms, forwarded to every child spool. */
	@property({ type: Number })
	public speed = 60;

	/** Visual variant forwarded to every child spool. */
	@property({ type: String })
	public variant: 'minimal' | 'realistic' = 'minimal';

	/** Number of visible drum sides forwarded to every child spool (-1 = default). */
	@property({ type: Number })
	public visibleSideCount = -1;

	/** True while at least one spool is still animating toward its target. */
	private _pendingSettle = false;

	override updated(changed: Map<string, unknown>): void {
		super.updated(changed);

		const cols = this.spools[0]?.length ?? 0;
		this.style.gridTemplateColumns = cols > 0 ? `repeat(${cols}, auto)` : '';

		if (changed.has('spools') || changed.has('grid')) {
			this._pendingSettle = true;
			// Defer one microtask so child spools have run their own `updated()` and
			// set their animation state before we check whether they are already settled.
			void Promise.resolve().then(() => this._checkAllSettled());
		}
	}

	private _getSpoolEls(): SplitFlapSpoolBase[] {
		return Array.from(
			this.renderRoot.querySelectorAll('split-flap-spool')
		) as unknown as SplitFlapSpoolBase[];
	}

	private _checkAllSettled(): void {
		if (!this._pendingSettle) return;
		const els = this._getSpoolEls();
		if (els.length === 0) return;
		if (els.every((el) => el.isSettled)) {
			this._pendingSettle = false;
			this._dispatchBoardSettled(els);
		}
	}

	private _dispatchBoardSettled(els: SplitFlapSpoolBase[]): void {
		let idx = 0;
		const grid = this.spools.map((row) => row.map(() => els[idx++]?.currentValue ?? ''));
		this.dispatchEvent(
			new CustomEvent('board-settled', {
				detail: { grid },
				bubbles: true,
				composed: true
			})
		);
	}

	override render(): TemplateResult {
		return html`
			${this.spools.flatMap((row, r) =>
				row.map(
					(spool, c) => html`
						<split-flap-spool
							.flaps=${spool}
							.value=${this.grid[r]?.[c] ?? ''}
							.speed=${this.speed}
							.variant=${this.variant}
							.visibleSideCount=${this.visibleSideCount}
							@settled=${() => this._checkAllSettled()}
						></split-flap-spool>
					`
				)
			)}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-board': SplitFlapBoard;
	}
}
