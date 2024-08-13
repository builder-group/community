import {
	type TAttributeToken,
	type TElementEndToken,
	type TElementStartToken,
	type TTextToken,
	type TXmlToken
} from '../tokenizer';
import { ETokenMatchCriteria } from './TokenSelectState';
import { TokenSelectStateMachine } from './TokenSelectStateMachine';
import { type TSelectedXmlToken, type TTokenSelectPath } from './types';

export class TokenSelector {
	private _currentDepth = 0;
	private _tspStateMachines: TokenSelectStateMachine[];
	private _isRecording = false;

	constructor(tokenSelectPaths: TTokenSelectPath[]) {
		this._tspStateMachines = tokenSelectPaths.map(
			(tokenSelectPath) => new TokenSelectStateMachine(tokenSelectPath)
		);
	}

	public pipeToken(token: TXmlToken, recorder: (token: TSelectedXmlToken) => void): void {
		let startRecording = false;
		let stopRecording = false;
		switch (token.type) {
			case 'ElementStart':
				startRecording = this.handleElementStart(token);
				break;
			case 'Attribute':
				startRecording = this.handleAttribute(token);
				break;
			case 'Text':
				startRecording = this.handleText(token);
				break;
			case 'ElementEnd': {
				stopRecording = this.handleElementEnd(token);
				break;
			}
			default:
		}

		if (startRecording && !this._isRecording) {
			this._isRecording = true;
			recorder({ type: 'SelectionStart' });
		}

		for (const stateMachine of this._tspStateMachines) {
			stateMachine.record(token);
			const recordedTokens = stateMachine.takeRecordedTokens();
			if (recordedTokens != null) {
				recordedTokens.forEach((t) => {
					recorder(t);
				});
			}
		}

		if (this._isRecording) {
			recorder(token);
		}

		if (stopRecording) {
			recorder({ type: 'SelectionEnd' });
			this._isRecording = false;
		}
	}

	private handleElementStart(token: TElementStartToken): boolean {
		this._currentDepth += 1;

		let startRecording = false;

		for (const stateMachine of this._tspStateMachines) {
			stateMachine.resetCurrentStateCache();
			if (stateMachine.isFinalState()) {
				continue;
			}

			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Name)) {
				continue;
			}

			const transitioned = stateMachine.transitionIfNameMatch(
				token.local,
				token.prefix,
				this._currentDepth
			);
			if (transitioned && stateMachine.isFinalState()) {
				startRecording = true;
			}
		}

		return startRecording;
	}

	private handleAttribute(token: TAttributeToken): boolean {
		let startRecording = false;

		for (const stateMachine of this._tspStateMachines) {
			if (stateMachine.isFinalState()) {
				continue;
			}

			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Attributes)) {
				continue;
			}

			const transitioned = stateMachine.transitionIfAttributesMatch(
				token.local,
				token.prefix,
				token.value,
				this._currentDepth
			);
			if (transitioned && stateMachine.isFinalState()) {
				startRecording = true;
			}
		}

		return startRecording;
	}

	private handleText(token: TTextToken): boolean {
		let startRecording = false;

		for (const stateMachine of this._tspStateMachines) {
			if (stateMachine.isFinalState()) {
				continue;
			}

			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Text)) {
				continue;
			}

			const transitioned = stateMachine.transitionIfTextMatch(token.text, this._currentDepth);
			if (transitioned && stateMachine.isFinalState()) {
				startRecording = true;
			}
		}

		return startRecording;
	}

	private handleElementEnd(token: TElementEndToken): boolean {
		if (token.end.type === 'Close' || token.end.type === 'Empty') {
			this._currentDepth -= 1;

			let isFinalState = false;

			for (const stateMachine of this._tspStateMachines) {
				const currentState = stateMachine.getCurrentState();
				if (currentState == null) {
					continue;
				}

				if (currentState.enteredDepth != null && this._currentDepth < currentState.enteredDepth) {
					stateMachine.transitionBack(this._currentDepth);
				}

				isFinalState = isFinalState || stateMachine.isFinalState();
			}

			return !isFinalState;
		}
		return false;
	}
}
