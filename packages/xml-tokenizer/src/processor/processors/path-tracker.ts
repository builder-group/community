import type { TProcessor } from '../types';

export type TPathTrackerContext = {
	currentPath: string;
	currentPathArray: string[];
};

export const pathTracker: TProcessor<TPathTrackerContext> = {
	name: 'PathTracker',
	context: {
		currentPath: '',
		currentPathArray: []
	},
	process: (token, context) => {
		if (token.type === 'ElementStart') {
			// Add element to path
			const elementName = token.prefix ? `${token.prefix}:${token.local}` : token.local;
			context.currentPathArray.push(elementName);
			context.currentPath = context.currentPathArray.join('/');
		} else if (token.type === 'ElementEnd' && token.end.type === 'Close') {
			context.currentPathArray.pop();
			context.currentPath = context.currentPathArray.join('/');
		}
	}
};
