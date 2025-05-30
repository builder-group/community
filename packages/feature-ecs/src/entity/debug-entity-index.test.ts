import { describe, expect, it } from 'vitest';
import { createEntityIndex } from './create-entity-index';
import { debugEntityIndex } from './debug-entity-index';

describe('debugEntityIndex', () => {
	it('should show empty state for new index', () => {
		const index = createEntityIndex({ versioning: true });
		const state = debugEntityIndex(index);

		expect(state).toContain('Alive (0): []');
		expect(state).toContain('Dead (0): []');
		expect(state).toContain('Sparse: {}');
		expect(state).toContain('NextBaseEid: 1');
		expect(state).toContain('Versioning: enabled');
	});

	it('should show alive entities', () => {
		const index = createEntityIndex({ versioning: true });
		index.addEntity();
		index.addEntity();
		const state = debugEntityIndex(index);

		expect(state).toContain('Alive (2): [1v0, 2v0]');
		expect(state).toContain('Dead (0): []');
		expect(state).toContain('Sparse: {1→0, 2→1}');
	});

	it('should show dead entities after removal', () => {
		const index = createEntityIndex({ versioning: true });
		const id1 = index.addEntity();
		const id2 = index.addEntity();
		index.removeEntity(id1);
		const state = debugEntityIndex(index);

		expect(state).toContain('Alive (1): [2v0]');
		expect(state).toContain('Dead (1): [1v1]');
		expect(state).toContain('Sparse: {2→0}');
	});
});
