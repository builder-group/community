import { describe, expect, it } from 'vitest';
import { createEntityIndex } from './create-entity-index';

describe('createEntityIndex', () => {
	describe('initialization', () => {
		it('should create index with default options', () => {
			const index = createEntityIndex();

			expect(index.aliveCount).toBe(0);
			expect(index.dense).toEqual([]);
			expect(index._sparse).toEqual([]);
			expect(index._nextId).toBe(1);
			expect(index._config.versioning).toBe(false);
			expect(index._versionBits).toBe(8);
			expect(index._entityBits).toBe(24);
		});

		it('should create index with versioning enabled', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 4 });

			expect(index._config.versioning).toBe(true);
			expect(index._versionBits).toBe(4);
			expect(index._entityBits).toBe(28);
		});

		it('should validate versionBits range', () => {
			expect(() => createEntityIndex({ versionBits: 0 })).toThrow(
				'versionBits must be between 1 and 16'
			);
			expect(() => createEntityIndex({ versionBits: 17 })).toThrow(
				'versionBits must be between 1 and 16'
			);
			expect(() => createEntityIndex({ versionBits: 1 })).not.toThrow();
			expect(() => createEntityIndex({ versionBits: 16 })).not.toThrow();
		});
	});

	describe('addEntity', () => {
		it('should add first entity with ID 1', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			expect(id).toBe(1);
			expect(index.aliveCount).toBe(1);
			expect(index.dense).toEqual([1]);
			expect(index._sparse[1]).toBe(0);
			expect(index._nextId).toBe(2);
		});

		it('should add multiple entities with sequential IDs', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			expect(id1).toBe(1);
			expect(id2).toBe(2);
			expect(id3).toBe(3);
			expect(index.aliveCount).toBe(3);
			expect(index.dense).toEqual([1, 2, 3]);
		});

		it('should recycle removed entity IDs', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();

			index.removeEntity(id1);
			const recycledId = index.addEntity();

			expect(recycledId).toBe(id1);
			expect(index.aliveCount).toBe(2);
		});

		it('should throw error when exceeding max entities', () => {
			// Use maximum versionBits to minimize entity space for testing
			const index = createEntityIndex({ versionBits: 16 }); // 16 entity bits, max = 65535

			// Manually set _nextId to the limit to test the boundary condition
			index._nextId = index._maxEid; // Set to max allowed (65535)

			// This should work (creates entity with ID = maxEid)
			const lastValidId = index.addEntity();
			expect(lastValidId).toBe(index._maxEid);

			// This should fail (nextId is now maxEid + 1 = 65536)
			expect(() => index.addEntity()).toThrow('Maximum number of entities exceeded');
		});
	});

	describe('removeEntity', () => {
		it('should remove existing entity', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			const result = index.removeEntity(id);

			expect(result).toBe(true);
			expect(index.aliveCount).toBe(0);
			expect(index.isEntityAlive(id)).toBe(false);
		});

		it('should return false for non-existent entity', () => {
			const index = createEntityIndex();

			const result = index.removeEntity(999);

			expect(result).toBe(false);
			expect(index.aliveCount).toBe(0);
		});

		it('should return false for already removed entity', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			index.removeEntity(id);
			const result = index.removeEntity(id);

			expect(result).toBe(false);
		});

		it('should handle swap-and-pop correctly', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			index.removeEntity(id2); // Remove middle entity

			expect(index.aliveCount).toBe(2);
			expect(index.dense[0]).toBe(id1);
			expect(index.dense[1]).toBe(id3); // id3 moved to position 1
			expect(index._sparse[1]).toBe(0); // id1 at position 0
			expect(index._sparse[3]).toBe(1); // id3 at position 1
		});

		it('should increment version when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			const recycledId = index.addEntity();

			expect(index.getEid(recycledId)).toBe(index.getEid(id));
			expect(index.getEidVersion(recycledId)).toBe(1);
			expect(recycledId).not.toBe(id);
		});
	});

	describe('isEntityAlive', () => {
		it('should return true for alive entity', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			expect(index.isEntityAlive(id)).toBe(true);
		});

		it('should return false for removed entity', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			index.removeEntity(id);

			expect(index.isEntityAlive(id)).toBe(false);
		});

		it('should return false for non-existent entity', () => {
			const index = createEntityIndex();

			expect(index.isEntityAlive(999)).toBe(false);
		});

		it('should return false for stale versioned entity', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			index.addEntity(); // Recycle with new version

			expect(index.isEntityAlive(id)).toBe(false); // Old version should be dead
		});
	});

	describe('getEid', () => {
		it('should return entity ID without version', () => {
			const index = createEntityIndex();
			const id = index.addEntity();

			expect(index.getEid(id)).toBe(id);
		});

		it('should extract base ID from versioned entity', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			const recycledId = index.addEntity();

			expect(index.getEid(recycledId)).toBe(index.getEid(id));
		});
	});

	describe('getEidVersion', () => {
		it('should return 0 when versioning disabled', () => {
			const index = createEntityIndex({ versioning: false });
			const id = index.addEntity();

			expect(index.getEidVersion(id)).toBe(0);
		});

		it('should return 0 for new entity when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			expect(index.getEidVersion(id)).toBe(0);
		});

		it('should return incremented version for recycled entity', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			const recycledId = index.addEntity();

			expect(index.getEidVersion(recycledId)).toBe(1);
		});

		it('should handle version overflow', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 2 }); // Max version 3
			let currentId = index.addEntity();

			// Cycle through versions 0, 1, 2, 3, then back to 0
			for (let i = 0; i < 4; i++) {
				index.removeEntity(currentId);
				currentId = index.addEntity();
			}

			expect(index.getEidVersion(currentId)).toBe(0); // Wrapped around
		});
	});

	describe('getAliveEntities', () => {
		it('should return empty array for new index', () => {
			const index = createEntityIndex();

			expect(index.getAliveEntities()).toEqual([]);
		});

		it('should return all alive entities', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			expect(index.getAliveEntities()).toEqual([id1, id2, id3]);
		});

		it('should not include removed entities', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			index.removeEntity(id2);

			expect(index.getAliveEntities()).toEqual([id1, id3]);
		});
	});

	describe('_createVersionedId', () => {
		it('should return base ID when versioning disabled', () => {
			const index = createEntityIndex({ versioning: false });

			expect(index._createVersionedId(5, 3)).toBe(5);
		});

		it('should combine base ID and version when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 8 });
			const baseId = 5;
			const version = 3;

			const versionedId = index._createVersionedId(baseId, version);

			expect(index.getEid(versionedId)).toBe(baseId);
			expect(index.getEidVersion(versionedId)).toBe(version);
		});
	});

	describe('_validate', () => {
		it('should return true for valid empty index', () => {
			const index = createEntityIndex();

			expect(index._validate()).toBe(true);
		});

		it('should return true for valid index with entities', () => {
			const index = createEntityIndex();
			index.addEntity();
			index.addEntity();
			index.addEntity();

			expect(index._validate()).toBe(true);
		});

		it('should return true after remove operations', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			index.removeEntity(id2);

			expect(index._validate()).toBe(true);
		});

		it('should return true after recycling', () => {
			const index = createEntityIndex({ versioning: true });
			const id1 = index.addEntity();

			index.removeEntity(id1);
			index.addEntity(); // Recycle

			expect(index._validate()).toBe(true);
		});
	});

	describe('complex scenarios', () => {
		it('should handle multiple add/remove cycles', () => {
			const index = createEntityIndex({ versioning: true });
			const entities: number[] = [];

			// Add 5 entities
			for (let i = 0; i < 5; i++) {
				entities.push(index.addEntity());
			}

			// Remove every other entity
			for (let i = 0; i < entities.length; i += 2) {
				index.removeEntity(entities[i] as number);
			}

			// Add 3 more entities (should recycle)
			for (let i = 0; i < 3; i++) {
				index.addEntity();
			}

			expect(index.aliveCount).toBe(5); // 2 remaining + 3 new
			expect(index._validate()).toBe(true);
		});

		it('should maintain consistency with random operations', () => {
			const index = createEntityIndex({ versioning: true });
			const aliveEntities = new Set<number>();

			// Perform 100 random operations
			for (let i = 0; i < 100; i++) {
				if (Math.random() < 0.7 || aliveEntities.size === 0) {
					// Add entity
					const id = index.addEntity();
					aliveEntities.add(id);
				} else {
					// Remove random entity
					const entities = Array.from(aliveEntities);
					const randomEntity = entities[Math.floor(Math.random() * entities.length)] as number;
					index.removeEntity(randomEntity);
					aliveEntities.delete(randomEntity);
				}

				// Validate consistency
				expect(index.aliveCount).toBe(aliveEntities.size);
				expect(index._validate()).toBe(true);

				// Check all tracked entities are alive
				for (const entity of aliveEntities) {
					expect(index.isEntityAlive(entity)).toBe(true);
				}
			}
		});
	});
});
