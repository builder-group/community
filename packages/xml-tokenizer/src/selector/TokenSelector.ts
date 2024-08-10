// xpather.com

import { getQName } from '../get-q-name';
import {
	type TAttributeToken,
	type TElementEndToken,
	type TElementStartToken,
	type TTextToken,
	type TXmlToken
} from '../tokenizer';
import { ETokenCacheProps, ETokenMatchCriteria } from './TokenSelectState';
import { TokenSelectStateMachine } from './TokenSelectStateMachine';
import { type TTokenSelectPath } from './types';

export class TokenSelector {
	private _currentDepth = 0;
	private _tspStateMachines: TokenSelectStateMachine[];
	private _isRecording = false;

	private _currentCacheProps: ETokenCacheProps = ETokenCacheProps.None;
	private _currentNodeCache: TCurrentNodeCache = {
		local: null,
		prefix: null,
		attributes: null,
		text: null
	};

	constructor(tokenSelectPaths: TTokenSelectPath[]) {
		this._tspStateMachines = tokenSelectPaths.map(
			(tokenSelectPath) => new TokenSelectStateMachine(tokenSelectPath)
		);
	}

	public pipeToken(token: TXmlToken, recorder: (token: TXmlToken) => void): void {
		switch (token.type) {
			case 'ElementStart':
				this._handleElementStart(token);
				break;
			case 'Attribute':
				this._handleAttribute(token);
				break;
			case 'Text':
				this._handleText(token);
				break;
			case 'ElementEnd': {
				this._handleElementEnd(token);
				break;
			}
			default:
		}

		if (this._isRecording) {
			recorder(token);
		}
	}

	private _handleElementStart(token: TElementStartToken): void {
		this._currentDepth += 1;
		if (this._isRecording) {
			return;
		}

		// TODO: Reset cached node? We have to reset attributes and name but can't text?

		for (const stateMachine of this._tspStateMachines) {
			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Name)) {
				return;
			}

			const transitioned = stateMachine.transitionIfNameMatch(
				token.local,
				token.prefix,
				this._currentDepth
			);
			if (transitioned && stateMachine.isFinalState()) {
				this.record();
				return;
			}

			this._currentCacheProps |= nextState.cacheProps;
		}

		if (this._currentCacheProps & ETokenCacheProps.Name) {
			this._currentNodeCache.local = token.local;
			this._currentNodeCache.prefix = token.prefix;
		}
	}

	private _handleAttribute(token: TAttributeToken): void {
		if (this._isRecording) {
			return;
		}

		const attributes = this._currentNodeCache.attributes ?? {};
		attributes[getQName(token.local, token.prefix)] = token.value;

		for (const stateMachine of this._tspStateMachines) {
			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Attributes)) {
				return;
			}

			const transitioned = stateMachine.transitionIfAttributesMatch(attributes, this._currentDepth);
			if (transitioned && stateMachine.isFinalState()) {
				this.record();
				return;
			}
		}

		if (this._currentCacheProps & ETokenCacheProps.Attributes) {
			this._currentNodeCache.attributes = attributes;
		}
	}

	private _handleText(token: TTextToken): void {
		if (this._isRecording) {
			return;
		}

		for (const stateMachine of this._tspStateMachines) {
			const nextState = stateMachine.getNextState();
			if (nextState == null || !(nextState.matchCriteria & ETokenMatchCriteria.Text)) {
				return;
			}

			const transitioned = stateMachine.transitionIfTextMatch(token.text, this._currentDepth);
			if (transitioned && stateMachine.isFinalState()) {
				this.record();
				return;
			}
		}

		if (this._currentCacheProps & ETokenCacheProps.Text) {
			this._currentNodeCache.text = token.text;
		}
	}

	private _handleElementEnd(token: TElementEndToken): void {
		if (token.end.type === 'Close' || token.end.type === 'Empty') {
			this._currentDepth -= 1;

			// TODO: Reset cached node?

			for (const stateMachine of this._tspStateMachines) {
				const currentState = stateMachine.getCurrentState();
				if (currentState == null) {
					continue;
				}

				if (currentState.enteredDepth != null && this._currentDepth <= currentState.enteredDepth) {
					stateMachine.transitionBack(this._currentDepth);
				}
			}
		}
	}

	private record(): void {
		this._isRecording = true;
		this._currentNodeCache.local = null;
		this._currentNodeCache.prefix = null;
		this._currentNodeCache.attributes = null;
		this._currentNodeCache.text = null;
		this._currentCacheProps = ETokenCacheProps.None;
	}
}

interface TCurrentNodeCache {
	attributes: Record<string, string> | null;
	local: string | null;
	prefix: string | null;
	text: string | null;
}
