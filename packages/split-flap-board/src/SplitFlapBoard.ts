import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SplitFlapSpool } from './spools/SplitFlapSpool';
import type { TSpool } from './types';

@customElement('split-flap-board')
export class SplitFlapBoard extends LitElement {
	static readonly styles = css`
		:host {
			display: inline-flex;
			position: relative;
			flex-direction: column;
			box-sizing: border-box;
			/* Inset shadows for side rails; render below all children so frame bars
			 * appear at the same visual level. */
			box-shadow:
				inset 14px 0 18px rgba(0, 0, 0, 0.55),
				inset -14px 0 18px rgba(0, 0, 0, 0.55);
			border-radius: var(--sfb-board-radius, 8px);
			background: var(--sfb-board-bg, #1c1c1c);
			padding: var(--sfb-board-padding, 10px);
		}

		/* Absolute overlay so the outer frame ring adds no layout space. */
		:host::after {
			position: absolute;
			z-index: 10000;
			inset: 0;
			border: 10px solid var(--sfb-board-bg, #1c1c1c);
			border-radius: var(--sfb-board-radius, 8px);
			pointer-events: none;
			content: '';
		}

		/* Frame bar caps the top padding of each row. z-index increases per row in
		 * render() so each bar sits above the drum content of the row above it. */
		.board-row {
			display: flex;
			position: relative;
			gap: var(--sfb-gap, 3px);
			padding-block: 12px;
		}

		.board-row::before {
			position: absolute;
			z-index: 1;
			inset: 0 0 auto 0;
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.65);
			background: var(--sfb-board-bg, #1c1c1c);
			height: 10px;
			content: '';
		}
	`;

	/** 2-D grid of spool configs; defines what each position can show. Row-major order. */
	@property({ type: Array })
	public spools: TSpool[][] = [];

	/** 2-D grid of target keys; defines what each position currently shows. Row-major order. */
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

		if (changed.has('spools') || changed.has('grid')) {
			this._pendingSettle = true;
			// Defer one microtask so child spools have run their own `updated()` and
			// set their animation state before we check whether they are already settled.
			void Promise.resolve().then(() => this._checkAllSettled());
		}
	}

	private _getSpoolEls(): SplitFlapSpool[] {
		return Array.from(
			this.renderRoot.querySelectorAll<SplitFlapSpool>('split-flap-spool')
		);
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

	private _dispatchBoardSettled(els: SplitFlapSpool[]): void {
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
			${this.spools.map(
				(row, r) => html`
					<div class="board-row" style="z-index: ${r + 1}">
						${row.map(
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
						)}
					</div>
				`
			)}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'split-flap-board': SplitFlapBoard;
	}
}
