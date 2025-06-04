import { describe, expect, it } from 'vitest';
import { createEntityIndex } from './create-entity-index';
import { validateEntityIndex } from './validate-entity-index';

describe('validateEntityIndex', () => {
	it('should return true for valid empty index', () => {
		const index = createEntityIndex();

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true for valid index with entities', () => {
		const index = createEntityIndex();
		index.createEntity();
		index.createEntity();
		index.createEntity();

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after remove operations', () => {
		const index = createEntityIndex();
		const id1 = index.createEntity();
		const id2 = index.createEntity();
		const id3 = index.createEntity();

		index.removeEntity(id2);

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after recycling', () => {
		const index = createEntityIndex({ versioning: true });
		const id1 = index.createEntity();

		index.removeEntity(id1);
		index.createEntity(); // Recycle

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after reset', () => {
		const index = createEntityIndex();
		index.createEntity();
		index.createEntity();
		index.removeEntity(index.createEntity());

		index.reset();

		expect(validateEntityIndex(index)).toBe(true);
	});
});
