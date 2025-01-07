import { describe, it } from 'vitest';
import { applyFeatures } from './apply-features';
import { createState } from './create-state';
import { withMultiUndo, withStorage, withUndo } from './features';

describe('applyFeatures function', () => {
	it('should have correct types', () => {
		const state = createState(0);
		const state1 = applyFeatures(createState(0), []);
		const state2 = applyFeatures(createState(0), [(s) => withUndo(s)]);
		const state3 = applyFeatures(createState(0), [(s) => withUndo(s), (s) => withMultiUndo(s)]);
		const state4 = applyFeatures(createState(0), [
			(s) => withUndo(s),
			(s) => withMultiUndo(s),
			(s) => withStorage(s, null as any, 'test')
		]);
	});
});
