import { describe, expect, it } from 'vitest';
import { createEntityIndex } from './create-entity-index';

describe('createEntityIndex', () => {
	describe('initialization', () => {
		it('should create index with default options', () => {
			const index = createEntityIndex();

			expect(index._aliveCount).toBe(0);
			expect(index._dense).toEqual([]);
			expect(index._sparse).toEqual([]);
			expect(index._nextBaseEid).toBe(1);
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
			expect(index._aliveCount).toBe(1);
			expect(index._dense).toEqual([1]);
			expect(index._sparse[1]).toBe(0);
			expect(index._nextBaseEid).toBe(2);
		});

		it('should add multiple entities with sequential IDs', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			expect(id1).toBe(1);
			expect(id2).toBe(2);
			expect(id3).toBe(3);
			expect(index._aliveCount).toBe(3);
			expect(index._dense).toEqual([1, 2, 3]);
		});

		it('should recycle removed entity IDs', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();

			index.removeEntity(id1);
			const recycledId = index.addEntity();

			expect(recycledId).toBe(id1);
			expect(index._aliveCount).toBe(2);
		});

		it('should throw error when exceeding max entities', () => {
			// Use maximum versionBits to minimize entity space for testing
			const index = createEntityIndex({ versionBits: 16 }); // 16 entity bits, max = 65535

			// Manually set _nextId to the limit to test the boundary condition
			index._nextBaseEid = index._maxBaseEid; // Set to max allowed (65535)

			// This should work (creates entity with ID = maxEid)
			const lastValidId = index.addEntity();
			expect(lastValidId).toBe(index._maxBaseEid);

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
			expect(index._aliveCount).toBe(0);
			expect(index.isEntityAlive(id)).toBe(false);
		});

		it('should return false for non-existent entity', () => {
			const index = createEntityIndex();

			const result = index.removeEntity(999);

			expect(result).toBe(false);
			expect(index._aliveCount).toBe(0);
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

			expect(index._aliveCount).toBe(2);
			expect(index._dense[0]).toBe(id1);
			expect(index._dense[1]).toBe(id3); // id3 moved to position 1
			expect(index._sparse[1]).toBe(0); // id1 at position 0
			expect(index._sparse[3]).toBe(1); // id3 at position 1
		});

		it('should increment version when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			const recycledId = index.addEntity();

			expect(index.getBaseEid(recycledId)).toBe(index.getBaseEid(id));
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

			expect(index.getBaseEid(id)).toBe(id);
		});

		it('should extract base ID from versioned entity', () => {
			const index = createEntityIndex({ versioning: true });
			const id = index.addEntity();

			index.removeEntity(id);
			const recycledId = index.addEntity();

			expect(index.getBaseEid(recycledId)).toBe(index.getBaseEid(id));
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

	describe('formatEid', () => {
		it('should format entity ID without version when versioning disabled', () => {
			const index = createEntityIndex({ versioning: false });
			const id1 = index.addEntity();
			const id2 = index.addEntity();

			expect(index.formatEid(id1)).toBe('1');
			expect(index.formatEid(id2)).toBe('2');
		});

		it('should format entity ID with version when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true });
			const id1 = index.addEntity();
			const id2 = index.addEntity();

			expect(index.formatEid(id1)).toBe('1v0');
			expect(index.formatEid(id2)).toBe('2v0');
		});

		it('should format recycled entity with incremented version', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 4 });
			let currentId = index.addEntity();

			// Cycle through multiple versions
			for (let i = 0; i < 10; i++) {
				index.removeEntity(currentId);
				currentId = index.addEntity();
				expect(index.formatEid(currentId)).toBe(`1v${i + 1}`);
			}
		});

		it('should format entity after version overflow', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 2 }); // Max version 3
			let currentId = index.addEntity();

			// Cycle through versions 0, 1, 2, 3, then back to 0
			for (let i = 0; i < 4; i++) {
				index.removeEntity(currentId);
				currentId = index.addEntity();
			}

			expect(index.formatEid(currentId)).toBe('1v0'); // Wrapped around
		});
	});

	describe('debugState', () => {
		it('should show empty state for new index', () => {
			const index = createEntityIndex({ versioning: true });
			const state = index.debugState();

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
			const state = index.debugState();

			expect(state).toContain('Alive (2): [1v0, 2v0]');
			expect(state).toContain('Dead (0): []');
			expect(state).toContain('Sparse: {1→0, 2→1}');
		});

		it('should show dead entities after removal', () => {
			const index = createEntityIndex({ versioning: true });
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			index.removeEntity(id1);
			const state = index.debugState();

			expect(state).toContain('Alive (1): [2v0]');
			expect(state).toContain('Dead (1): [1v1]');
			expect(state).toContain('Sparse: {2→0}');
		});
	});

	describe('validate', () => {
		it('should return true for valid empty index', () => {
			const index = createEntityIndex();

			expect(index.validate()).toBe(true);
		});

		it('should return true for valid index with entities', () => {
			const index = createEntityIndex();
			index.addEntity();
			index.addEntity();
			index.addEntity();

			expect(index.validate()).toBe(true);
		});

		it('should return true after remove operations', () => {
			const index = createEntityIndex();
			const id1 = index.addEntity();
			const id2 = index.addEntity();
			const id3 = index.addEntity();

			index.removeEntity(id2);

			expect(index.validate()).toBe(true);
		});

		it('should return true after recycling', () => {
			const index = createEntityIndex({ versioning: true });
			const id1 = index.addEntity();

			index.removeEntity(id1);
			index.addEntity(); // Recycle

			expect(index.validate()).toBe(true);
		});
	});

	describe('_createVersionedId', () => {
		it('should return base ID when versioning disabled', () => {
			const index = createEntityIndex({ versioning: false });

			expect(index._createVersionedEid(5, 3)).toBe(5);
		});

		it('should combine base ID and version when versioning enabled', () => {
			const index = createEntityIndex({ versioning: true, versionBits: 8 });
			const baseId = 5;
			const version = 3;

			const versionedId = index._createVersionedEid(baseId, version);

			expect(index.getBaseEid(versionedId)).toBe(baseId);
			expect(index.getEidVersion(versionedId)).toBe(version);
		});
	});
});
