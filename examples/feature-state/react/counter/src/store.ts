import { withLocalStorage } from 'feature-react/state';
import { createState, withSelector, withUndo } from 'feature-state';

// Example 1: Basic counter with undo functionality
export const $counter = withUndo(createState(0));

// Example 2: Object state with property selection
export const $userState = withSelector(
	createState({
		name: 'John Doe',
		settings: {
			theme: 'dark',
			notifications: true
		},
		stats: {
			lastLogin: new Date().toISOString()
		}
	})
);

// Example 3: Persistent state with localStorage
export const $persistentSettings = withLocalStorage(
	createState({
		volume: 50,
		language: 'en'
	}),
	'app-settings'
);
