import { describe, it } from 'vitest';

import { createState } from '../create-state';
import { withMultiUndo } from './with-multi-undo';
import { withUndo } from './with-undo';

describe('withMultiUndo function tests', () => {
	it('should have correct types', () => {
		const state = createState('Jeff');
		const stateWithUndo = withUndo(state);
		const stateWithMultiUndo = withMultiUndo(stateWithUndo);
	});
});
