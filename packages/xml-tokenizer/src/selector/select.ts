import { tokenize, type TTokenCallback } from '../tokenizer';
import { TokenSelector } from './TokenSelector';
import { type TTokenSelectPath } from './types';

export function select(
	xml: string,
	tokenSelectPaths: TTokenSelectPath[],
	callback: TTokenCallback
): void {
	const selector = new TokenSelector(tokenSelectPaths);
	tokenize(xml, false, (token) => {
		selector.pipeToken(token, (recordedToken) => {
			callback(recordedToken);
		});
	});
}
