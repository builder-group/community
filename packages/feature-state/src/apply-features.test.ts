import { describe, it } from 'vitest';
import { applyFeatures } from './apply-features';
import { createState } from './create-state';
import { withMultiUndo, withStorage, withUndo } from './features';

describe('applyFeatures function', () => {
	it('should have correct types', () => {
		const state = createState(0);

		// Empty features array - works!
		const state1 = applyFeatures(createState(0), []);

		// Single feature - works with correct type chain!
		const state2 = applyFeatures(createState(0), [(s) => withUndo(s)]);

		// Two features - works with correct type chain!
		const state3 = applyFeatures(createState(0), [(s) => withUndo(s), (s) => withMultiUndo(s)]);

		// Three features - works with correct type chain!
		const state4 = applyFeatures(createState(0), [
			(s) => withUndo(s),
			(s) => withMultiUndo(s),
			(s) => withStorage(s, null as any, 'test')
		]);
	});
});
