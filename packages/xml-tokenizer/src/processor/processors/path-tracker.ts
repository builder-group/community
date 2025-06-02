import type { TProcessor } from '../types';

export type TPathTrackerContext = {
	currentPath: string[];
};

export const pathTracker: TProcessor<TPathTrackerContext> = {
	name: 'PathTracker',
	context: {
		currentPath: []
	},
	process: (token, context) => {
		if (token.type === 'ElementStart') {
			// Add element to path
			const elementName = token.prefix ? `${token.prefix}:${token.local}` : token.local;
			context.currentPath.push(elementName);
		} else if (token.type === 'ElementEnd' && token.end.type === 'Close') {
			context.currentPath.pop();
		}
	}
};
