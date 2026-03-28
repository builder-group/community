import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getFlapKey } from '../lib';
import type { TSpool } from '../types';
import { charSpool } from './presets';
import type { SplitFlapSpoolBase } from './SplitFlapSpoolBase';
// Register both variants so <split-flap-spool> can render either one.
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

	/** Key currently shown by the active variant; falls back to the first flap key before the variant mounts. */
	public get currentValue(): string | undefined {
		return (
			this._getActiveSpool()?.currentValue ??
			(this.flaps[0] != null ? getFlapKey(this.flaps[0]) : undefined)
		);
	}

	/** True when the active variant is idle with no pending target. */
	public get isSettled(): boolean {
		return this._getActiveSpool()?.isSettled ?? true;
	}

	/** Returns true when the given key exists in the loaded flaps. */
	public hasKey(value: string): boolean {
		return (
			this._getActiveSpool()?.hasKey(value) ?? this.flaps.some((flap) => getFlapKey(flap) === value)
		);
	}

	private _getActiveSpool(): SplitFlapSpoolBase | null {
		return this.renderRoot.querySelector(
			'split-flap-spool-minimal, split-flap-spool-realistic'
		) as SplitFlapSpoolBase | null;
	}

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
