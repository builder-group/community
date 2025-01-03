import { describe, expect, it } from 'vitest';
import { createState } from './create-state';
import { withUndo } from './features';
import { isStateWithFeatures } from './is-state-with-features';

describe('isStateWithFeatures function', () => {
	it('should return true if the state has all the requested features', () => {
		const state = withUndo(createState(10));
		expect(isStateWithFeatures(state, ['undo'])).toBe(true);
	});

	it('should return false if the state is missing any of the requested features', () => {
		const state = createState(10);
		expect(isStateWithFeatures(state, ['undo'])).toBe(false);
	});

	it('should return true for a state with only the specified features', () => {
		const state = createState(10);
		expect(isStateWithFeatures(state, [])).toBe(true);
	});

	it('should return true if checking for an empty feature set', () => {
		const state = createState(10);
		expect(isStateWithFeatures(state, [])).toBe(true);
	});
});
