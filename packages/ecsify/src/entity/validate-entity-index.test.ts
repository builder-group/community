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
		index.addEntity();
		index.addEntity();
		index.addEntity();

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after remove operations', () => {
		const index = createEntityIndex();
		const id1 = index.addEntity();
		const id2 = index.addEntity();
		const id3 = index.addEntity();

		index.removeEntity(id2);

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after recycling', () => {
		const index = createEntityIndex({ versioning: true });
		const id1 = index.addEntity();

		index.removeEntity(id1);
		index.addEntity(); // Recycle

		expect(validateEntityIndex(index)).toBe(true);
	});

	it('should return true after reset', () => {
		const index = createEntityIndex();
		index.addEntity();
		index.addEntity();
		index.removeEntity(index.addEntity());

		index.reset();

		expect(validateEntityIndex(index)).toBe(true);
	});
});
