import { beforeEach, describe, expect, it } from 'vitest';
import { Added, And, Changed, None, Or, Removed, With, Without } from './query-filter';
import { createWorld, TWorld } from './world';

describe('createQueryRegistry', () => {
	let world: TWorld;

	beforeEach(() => {
		world = createWorld();
	});

	describe('generateQueryHash', () => {
		it('should generate unique hashes for different filter types', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Different filter types should generate different hashes
			const withHash = world._queryRegistry.generateQueryHash(With(Position));
			const withoutHash = world._queryRegistry.generateQueryHash(Without(Position));
			const addedHash = world._queryRegistry.generateQueryHash(Added(Position));
			const changedHash = world._queryRegistry.generateQueryHash(Changed(Position));
			const removedHash = world._queryRegistry.generateQueryHash(Removed(Position));

			// All hashes should be different
			const hashes = [withHash, withoutHash, addedHash, changedHash, removedHash];
			const uniqueHashes = new Set(hashes);
			expect(uniqueHashes.size).toBe(hashes.length);
		});

		it('should generate same hash for identical queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			const filter1 = And(With(Position), With(Velocity));
			const filter2 = And(With(Position), With(Velocity));

			const hash1 = world._queryRegistry.generateQueryHash(filter1);
			const hash2 = world._queryRegistry.generateQueryHash(filter2);

			expect(hash1).toBe(hash2);
		});

		it('should auto-register components when generating hash', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Component should not be registered initially
			expect(world._componentRegistry._componentMap.has(Position)).toBe(false);

			// Generating hash should auto-register component
			world._queryRegistry.generateQueryHash(With(Position));
			expect(world._componentRegistry._componentMap.has(Position)).toBe(true);
		});
	});

	describe('registerQuery', () => {
		it('should register and cache queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			const queryData1 = world._queryRegistry.registerQuery(And(With(Position), With(Velocity)));
			const queryData2 = world._queryRegistry.registerQuery(And(With(Position), With(Velocity)));

			// Should return same cached query data
			expect(queryData1).toBe(queryData2);
			expect(world._queryRegistry._queryCache.size).toBe(1);
		});

		it('should store filter', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const filter = And(With(Position), With(Health));
			const queryData = world._queryRegistry.registerQuery(filter);

			// Should store the exact filter
			expect(queryData.filter).toBe(filter);
			expect(queryData.filter.type).toBe('And');
		});

		it('should handle single component filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const filter = With(Position);
			const queryData = world._queryRegistry.registerQuery(filter);

			// Should store the With filter
			expect(queryData.filter).toBe(filter);
			expect(queryData.filter.type).toBe('With');
		});

		it('should handle None filter', () => {
			const filter = None();
			const queryData = world._queryRegistry.registerQuery(filter);

			// Should store the None filter
			expect(queryData.filter).toBe(filter);
			expect(queryData.filter.type).toBe('None');
		});
	});

	describe('executeQuery', () => {
		it('should return no entities for None filter', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Create entities with components
			const eid1 = world.addEntity();
			const eid2 = world.addEntity();
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid2, Position);

			// None filter should return no entities
			const emptyResult = world.query(None());
			expect(emptyResult).toEqual([]);
		});

		it('should execute basic With queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Create entities
			const eid1 = world.addEntity();
			const eid2 = world.addEntity();
			const eid3 = world.addEntity();

			// Add components
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Velocity);

			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Health);

			world._componentRegistry.addComponent(eid3, Velocity);
			world._componentRegistry.addComponent(eid3, Health);

			// Test basic WITH queries
			const positionAndVelocity = world.query(And(With(Position), With(Velocity)));
			expect(positionAndVelocity).toEqual([eid1]);

			const positionOnly = world.query(With(Position));
			expect(positionOnly.sort()).toEqual([eid1, eid2].sort());
		});

		it('should execute Without queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Health);

			// Test WITHOUT filter
			const hasPositionButNotHealth = world.query(And(With(Position), Without(Health)));
			expect(hasPositionButNotHealth).toEqual([eid1]);
		});

		it('should execute And queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Health);

			// Test explicit AND filter
			const explicitAnd = world.query(And(With(Position), With(Health)));
			expect(explicitAnd).toEqual([eid2]);
		});

		it('should execute Or queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();
			const eid3 = world.addEntity();

			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid2, Health);
			world._componentRegistry.addComponent(eid3, Position);
			world._componentRegistry.addComponent(eid3, Health);

			// Test OR filter
			const positionOrHealth = world.query(Or(With(Position), With(Health)));
			expect(positionOrHealth.sort()).toEqual([eid1, eid2, eid3].sort());
		});

		it('should execute complex filter combinations', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];
			const Stunned = {};
			const Paralyzed = {};

			// Create entities
			const eid1 = world.addEntity();
			const eid2 = world.addEntity();
			const eid3 = world.addEntity();

			// Setup entity 1: Position + Health + Stunned
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Health);
			world._componentRegistry.addComponent(eid1, Stunned);

			// Setup entity 2: Position + Shield
			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Shield);

			// Setup entity 3: Position + Health + Paralyzed
			world._componentRegistry.addComponent(eid3, Position);
			world._componentRegistry.addComponent(eid3, Health);
			world._componentRegistry.addComponent(eid3, Paralyzed);

			// Complex query: Position + (Health OR Shield) + WITHOUT(Stunned) + WITHOUT(Paralyzed)
			const complexQuery = world.query(
				And(With(Position), Or(With(Health), With(Shield)), Without(Stunned), Without(Paralyzed))
			);

			// Only eid2 should match (has Position + Shield, no Stunned, no Paralyzed)
			expect(complexQuery).toEqual([eid2]);
		});

		it('should cache queries for performance', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			const eid = world.addEntity();
			world._componentRegistry.addComponent(eid, Position);
			world._componentRegistry.addComponent(eid, Velocity);

			// Execute same query multiple times
			const filter = And(With(Position), With(Velocity));
			const result1 = world.query(filter);
			const result2 = world.query(filter);

			// Should return same results
			expect(result1).toEqual(result2);
			expect(result1).toEqual([eid]);

			// Verify query was cached
			expect(world._queryRegistry._queryCache.size).toBe(1);
		});

		it('should auto-register components in filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			// Query should auto-register components
			const result = world.query(And(With(Position), With(Velocity)));
			expect(result).toEqual([]); // No entities have these components yet

			// Verify components were auto-registered
			expect(world._componentRegistry._componentMap.has(Position)).toBe(true);
			expect(world._componentRegistry._componentMap.has(Velocity)).toBe(true);
		});
	});

	describe('executeInnerQuery', () => {
		it('should execute queries without committing removals', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.addEntity();
			world._componentRegistry.addComponent(eid, Position);

			// Inner query should work the same as regular query for now
			const result = world.innerQuery(With(Position));
			expect(result).toEqual([eid]);
		});
	});

	describe('checkEntity', () => {
		it('should check if entity matches query data', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Health);
			world._componentRegistry.addComponent(eid2, Position);

			const queryData = world._queryRegistry.registerQuery(And(With(Position), With(Health)));

			expect(world._queryRegistry.checkEntity(queryData, eid1)).toBe(true);
			expect(world._queryRegistry.checkEntity(queryData, eid2)).toBe(false);
		});
	});

	describe('change detection filters', () => {
		it('should support Added filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			// Add Position to eid1 (should be tracked as added)
			world._componentRegistry.addComponent(eid1, Position);

			// Add Health to eid2 (should be tracked as added)
			world._componentRegistry.addComponent(eid2, Health);

			// Query for entities with added Position
			const addedPosition = world.query(Added(Position));
			expect(addedPosition).toEqual([eid1]);

			// Query for entities with added Health
			const addedHealth = world.query(Added(Health));
			expect(addedHealth).toEqual([eid2]);

			// Clear frame changes
			world.clear();

			// After clearing, no entities should have added components
			const addedPositionAfter = world.query(Added(Position));
			const addedHealthAfter = world.query(Added(Health));
			expect(addedPositionAfter).toEqual([]);
			expect(addedHealthAfter).toEqual([]);
		});

		it('should support Changed filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			// Add components first
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid2, Health);

			// Clear initial "added" tracking
			world.clear();

			// Mark Position as changed for eid1
			world.markChanged(eid1, Position);

			// Query for entities with changed Position
			const changedPosition = world.query(Changed(Position));
			expect(changedPosition).toEqual([eid1]);

			// Query for entities with changed Health (should be empty)
			const changedHealth = world.query(Changed(Health));
			expect(changedHealth).toEqual([]);
		});

		it('should support Removed filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			// Add components first
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Health);
			world._componentRegistry.addComponent(eid2, Position);

			// Clear initial "added" tracking
			world.clear();

			// Remove Health from eid1
			world._componentRegistry.removeComponent(eid1, Health);

			// Query for entities with removed Health
			const removedHealth = world.query(Removed(Health));
			expect(removedHealth).toEqual([eid1]);

			// Query for entities with removed Position (should be empty)
			const removedPosition = world.query(Removed(Position));
			expect(removedPosition).toEqual([]);
		});

		it('should support complex change detection queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();
			const eid3 = world.addEntity();

			// Setup initial state
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Health);

			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Shield);

			// Clear initial "added" tracking
			world.clear();

			// Frame changes:
			// - Add Shield to eid1
			// - Mark Position as changed for eid2
			// - Add Position to eid3 (new entity)
			world._componentRegistry.addComponent(eid1, Shield);
			world.markChanged(eid2, Position);
			world._componentRegistry.addComponent(eid3, Position);

			// Query: Entities with Position AND (Added Shield OR Changed Position)
			const complexQuery = world.query(And(With(Position), Or(Added(Shield), Changed(Position))));

			// Should match eid1 (has Position + added Shield) and eid2 (has Position + changed Position)
			expect(complexQuery.sort()).toEqual([eid1, eid2].sort());
		});

		it('should combine change detection with regular filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Enemy = {};

			const eid1 = world.addEntity();
			const eid2 = world.addEntity();

			// Setup: Both entities have Position and Health
			world._componentRegistry.addComponent(eid1, Position);
			world._componentRegistry.addComponent(eid1, Health);
			world._componentRegistry.addComponent(eid2, Position);
			world._componentRegistry.addComponent(eid2, Health);

			// Only eid2 is an enemy
			world._componentRegistry.addComponent(eid2, Enemy);

			// Clear initial "added" tracking
			world.clear();

			// Mark Health as changed for both entities
			world.markChanged(eid1, Health);
			world.markChanged(eid2, Health);

			// Query: Entities with changed Health but WITHOUT Enemy tag
			const nonEnemiesWithChangedHealth = world.query(And(Changed(Health), Without(Enemy)));

			// Should only match eid1 (has changed Health but is not an Enemy)
			expect(nonEnemiesWithChangedHealth).toEqual([eid1]);
		});
	});

	describe('reset', () => {
		it('should reset to initial state', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = world.addEntity();
			world._componentRegistry.addComponent(eid, Position);

			// Execute query to populate cache
			world.query(With(Position));
			expect(world._queryRegistry._queryCache.size).toBeGreaterThan(0);

			// Reset should clear everything
			world.reset();
			expect(world._queryRegistry._queryCache.size).toBe(0);
			expect(world._componentRegistry._componentMap.size).toBe(0);
			expect(world._entityIndex.getAliveEntities()).toEqual([]);
		});
	});

	describe('validate', () => {
		it('should return true for valid registry', () => {
			expect(world._queryRegistry.validate()).toBe(true);
		});

		it('should return true after query operations', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = world.addEntity();
			world._componentRegistry.addComponent(eid, Position);

			world.query(With(Position));
			expect(world._queryRegistry.validate()).toBe(true);
		});
	});

	describe('world integration', () => {
		it('should have access to world context', () => {
			// Verify query registry has world reference
			expect(world._queryRegistry._world).toBe(world);

			// Verify it can access all world properties through the reference
			expect(world._queryRegistry._world._componentRegistry).toBe(world._componentRegistry);
			expect(world._queryRegistry._world._entityIndex).toBe(world._entityIndex);
		});
	});
});
