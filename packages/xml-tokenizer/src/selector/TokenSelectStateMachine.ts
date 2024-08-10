import { ETokenMatchCriteria, TokenSelectState } from './TokenSelectState';
import { type TTokenSelectPath } from './types';

export class TokenSelectStateMachine {
	private _states: TokenSelectState[];
	// null (start) -> index (x)
	private _currentState: number | null = null;

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

	public transitionIfNameMatch(local: string, prefix: string, depth: number): boolean {
		const nextState = this.getNextState();
		if (
			nextState?.matchesName(local, prefix) &&
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

	public transitionIfAttributesMatch(attributes: Record<string, string>, depth: number): boolean {
		const nextState = this.getNextState();
		if (
			nextState?.matchesAttributes(attributes) &&
			!(nextState.matchCriteria & (ETokenMatchCriteria.Text | ETokenMatchCriteria.Node))
		) {
			this.transitionForward(depth);
			return true;
		}
		return false;
	}

	public transitionIfTextMatch(text: string, depth: number): boolean {
		const nextState = this.getNextState();
		if (nextState?.matchesText(text) && !(nextState.matchCriteria & ETokenMatchCriteria.Node)) {
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
	}

	public isFinalState(): boolean {
		return this._currentState != null && this._currentState >= this._states.length - 1;
	}
}
