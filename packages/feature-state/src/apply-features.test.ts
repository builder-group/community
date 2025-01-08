import { describe, it } from 'vitest';
import { applyFeatures } from './apply-features';
import { createState } from './create-state';
import { withMultiUndo, withStorage, withUndo } from './features';

describe('applyFeatures function', () => {
	it('should have correct types', () => {
		const state1 = applyFeatures(createState(0), withUndo(), withMultiUndo());
		const state2 = applyFeatures(createState(0), withUndo());
		const state3 = applyFeatures(
			createState(0),
			withUndo(),
			withMultiUndo(),
			withStorage(null as any, 'test')
		);
		const state4 = withMultiUndo()(withUndo()(createState(0)));
	});
});
