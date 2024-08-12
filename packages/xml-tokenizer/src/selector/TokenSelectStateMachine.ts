import { getQName } from '../get-q-name';
import { type TXmlToken } from '../tokenizer';
import { EToCacheNodeProps, ETokenMatchCriteria, TokenSelectState } from './TokenSelectState';
import { type TTokenSelectPath } from './types';

export class TokenSelectStateMachine {
	private _states: TokenSelectState[];

	// null (start state) -> index (x state)
	private _currentState: number | null = null;

	// Current state cache
	private _cachedNodeProps: TCachedNodeProps = {
		prefix: null,
		local: null,
		attributes: null,
		text: null
	};
	private _cachedTokens: TXmlToken[] = [];
	private _toRecordTokens: TXmlToken[] = [];

	constructor(tokenSelectPath: TTokenSelectPath) {
		this._states = tokenSelectPath.map((part) => new TokenSelectState(part));
	}

	public getNextState(): TokenSelectState | null {
		const nextIndex = this._currentState != null ? this._currentState + 1 : 0;
		if (nextIndex < this._states.length) {
			return this._states[nextIndex] ?? null;
		}
		return null;
	}

	public getCurrentState(): TokenSelectState | null {
		if (this._currentState != null && this._currentState < this._states.length) {
			return this._states[this._currentState] ?? null;
		}
		return null;
	}

	public record(token: TXmlToken): void {
		if (this.getOffsetToFinal() <= 1) {
			this._cachedTokens.push(token);
		}
	}

	public takeRecordedTokens(): TXmlToken[] | null {
		if (this._toRecordTokens.length > 0) {
			const recordedTokens = this._toRecordTokens;
			this._toRecordTokens = [];
			return recordedTokens;
		}
		return null;
	}

	public transitionIfNameMatch(local: string, prefix: string, depth: number): boolean {
		const nextState = this.getNextState();
		const currentState = this.getCurrentState();
		if (nextState == null) {
			return false;
		}

		// Cache name
		if (nextState.toCacheNodeProps & EToCacheNodeProps.Name) {
			this._cachedNodeProps.local = local;
			this._cachedNodeProps.prefix = prefix;
		}

		if (
			nextState.matchesName(local, prefix) &&
			nextState.matchesDepth(depth, currentState?.enteredDepth ?? 0) &&
			!(
				nextState.matchCriteria &
				(ETokenMatchCriteria.Attributes | ETokenMatchCriteria.Text | ETokenMatchCriteria.Node)
			)
		) {
			this.transitionForward(depth);
			return true;
		}

		return false;
	}

	public transitionIfAttributesMatch(
		local: string,
		prefix: string,
		value: string,
		depth: number
	): boolean {
		const nextState = this.getNextState();
		const currentState = this.getCurrentState();
		if (nextState == null) {
			return false;
		}

		const attributes = this._cachedNodeProps.attributes ?? {};
		attributes[getQName(local, prefix)] = value;

		// Cache attributes
		if (nextState.toCacheNodeProps & EToCacheNodeProps.Attributes) {
			this._cachedNodeProps.attributes = attributes;
		}

		if (
			nextState.matchesAttributes(attributes) &&
			nextState.matchesDepth(depth, currentState?.enteredDepth ?? 0) &&
			!(nextState.matchCriteria & (ETokenMatchCriteria.Text | ETokenMatchCriteria.Node))
		) {
			this.transitionForward(depth);
			return true;
		}

		return false;
	}

	public transitionIfTextMatch(text: string, depth: number): boolean {
		const nextState = this.getNextState();
		const currentState = this.getCurrentState();
		if (nextState == null) {
			return false;
		}

		// Cache text
		if (nextState.toCacheNodeProps & EToCacheNodeProps.Text) {
			this._cachedNodeProps.text = text;
		}

		if (
			nextState.matchesText(text) &&
			nextState.matchesDepth(depth, currentState?.enteredDepth ?? 0) &&
			!(nextState.matchCriteria & ETokenMatchCriteria.Node)
		) {
			this.transitionForward(depth);
			return true;
		}

		return false;
	}

	private transitionForward(depth: number): void {
		const previousState = this.getCurrentState();
		if (previousState != null) {
			previousState.unmatch();
		}

		this._currentState = this._currentState != null ? this._currentState + 1 : 0;

		const currentState = this.getCurrentState();
		if (currentState != null) {
			currentState.match(depth);
		}

		if (this.isFinalState()) {
			this._toRecordTokens = this._cachedTokens;
		}
		this.resetCurrentStateCache();
	}

	public transitionBack(depth: number): void {
		const previousState = this.getCurrentState();
		if (previousState != null) {
			previousState.unmatch();
		}

		this._currentState = this._currentState != null ? this._currentState - 1 : 0;

		const currentState = this.getCurrentState();
		if (currentState != null) {
			currentState.match(depth);
		}

		this.resetCurrentStateCache();
	}

	public isFinalState(): boolean {
		return this._currentState != null && this._currentState >= this._states.length - 1;
	}

	public getOffsetToFinal(): number {
		if (this._currentState == null) {
			return this._states.length;
		}
		return this._states.length - 1 - this._currentState;
	}

	public resetCurrentStateCache(): void {
		this._cachedNodeProps.prefix = null;
		this._cachedNodeProps.local = null;
		this._cachedNodeProps.attributes = null;
		this._cachedNodeProps.text = null;
		this._cachedTokens = [];
	}
}

interface TCachedNodeProps {
	prefix: string | null;
	local: string | null;
	attributes: Record<string, string> | null;
	text: string | null;
}
