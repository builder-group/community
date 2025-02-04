import { tokenize, TXmlStreamOptions } from '../tokenizer';
import { TokenSelector } from './TokenSelector';
import { type TSelectedTokenCallback, type TTokenSelectPath } from './types';

export function select(
	xml: string,
	tokenSelectPaths: TTokenSelectPath[],
	callback: TSelectedTokenCallback,
	options?: TXmlStreamOptions
): void {
	const selector = new TokenSelector(tokenSelectPaths);
	tokenize(
		xml,
		(token) => {
			selector.pipeToken(token, (recordedToken) => {
				callback(recordedToken);
			});
		},
		options
	);
}
