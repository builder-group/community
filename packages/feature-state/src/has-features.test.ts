import { describe, expect, it } from 'vitest';

import { createState } from './create-state';
import { withUndo } from './features';
import { hasFeatures } from './has-features';

describe('hasFeatures function', () => {
	it('should return true if the state has all the requested features', () => {
		const state = withUndo(createState(10));
		expect(hasFeatures(state, ['base', 'undo'])).toBe(true);
	});

	it('should return false if the state is missing any of the requested features', () => {
		const state = createState(10);
		expect(hasFeatures(state, ['base', 'undo'])).toBe(false);
	});

	it('should return true for a state with only the specified features', () => {
		const state = createState(10);
		expect(hasFeatures(state, ['base'])).toBe(true);
	});

	it('should return false if no features are present in the state', () => {
		const state = {}; // Mock a state with no features
		expect(hasFeatures(state as any, ['base', 'undo'])).toBe(false);
	});

	it('should return true if checking for an empty feature set', () => {
		const state = createState(10);
		expect(hasFeatures(state, [])).toBe(true);
	});
});
