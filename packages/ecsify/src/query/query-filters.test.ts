import { beforeEach, describe, expect, it } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../component';
import { createEntityIndex, TEntityIndex } from '../entity';
import { createQueryRegistry, TQueryRegistry } from './create-query-registry';
import { Added, And, Changed, Or, Removed, With, Without } from './query-filters';

describe('Query Filters', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	describe('With filter', () => {
		it('should match entities that have the component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position only
			componentRegistry.addComponent(eid1, Position);

			// eid2: Health only
			componentRegistry.addComponent(eid2, Health);

			// eid3: Both components
			componentRegistry.addComponent(eid3, Position);
			componentRegistry.addComponent(eid3, Health);

			const positionEntities = queryRegistry.queryEntities(With(Position));
			expect(positionEntities.sort()).toEqual([eid1, eid3].sort());

			const healthEntities = queryRegistry.queryEntities(With(Health));
			expect(healthEntities.sort()).toEqual([eid2, eid3].sort());
		});

		it('should return empty array when no entities have component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const result = queryRegistry.queryEntities(With(Position));
			expect(result).toEqual([]);
		});

		it('should auto-register components', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			expect(componentRegistry._componentMap.has(Position)).toBe(false);
			queryRegistry.queryEntities(With(Position));
			expect(componentRegistry._componentMap.has(Position)).toBe(true);
		});
	});

	describe('Without filter', () => {
		it('should match entities that lack the component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position only
			componentRegistry.addComponent(eid1, Position);

			// eid2: Health only
			componentRegistry.addComponent(eid2, Health);

			// eid3: Both components

			const withoutHealth = queryRegistry.queryEntities(Without(Health));
			expect(withoutHealth.sort()).toEqual([eid1, eid3].sort());

			const withoutPosition = queryRegistry.queryEntities(Without(Position));
			expect(withoutPosition.sort()).toEqual([eid2, eid3].sort());
		});

		it('should match all entities when component doesnt exist', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const NonExistent = { value: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position);

			const withoutNonExistent = queryRegistry.queryEntities(Without(NonExistent));
			expect(withoutNonExistent.sort()).toEqual([eid1, eid2].sort());
		});
	});

	describe('Added filter', () => {
		it('should match entities with components added this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add Position to eid1 (should be tracked as added)
			componentRegistry.addComponent(eid1, Position);

			// Add Health to eid2 (should be tracked as added)
			componentRegistry.addComponent(eid2, Health);

			const addedPosition = queryRegistry.queryEntities(Added(Position));
			expect(addedPosition).toEqual([eid1]);

			const addedHealth = queryRegistry.queryEntities(Added(Health));
			expect(addedHealth).toEqual([eid2]);
		});

		it('should return empty after flush clears tracking', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = queryRegistry.queryEntities(Added(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			componentRegistry.flush();
			const afterFlush = queryRegistry.queryEntities(Added(Position));
			expect(afterFlush).toEqual([]);
		});

		it('should track multiple adds in same frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid3, Position);

			const addedPosition = queryRegistry.queryEntities(Added(Position));
			expect(addedPosition.sort()).toEqual([eid1, eid2, eid3].sort());
		});
	});

	describe('Changed filter', () => {
		it('should match entities with components changed this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components first
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid2, Health);

			// Clear initial "added" tracking
			componentRegistry.flush();

			// Mark Position as changed for eid1
			componentRegistry.markChanged(eid1, Position);

			const changedPosition = queryRegistry.queryEntities(Changed(Position));
			expect(changedPosition).toEqual([eid1]);

			const changedHealth = queryRegistry.queryEntities(Changed(Health));
			expect(changedHealth).toEqual([]);
		});

		it('should clear tracking after flush', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.flush();

			componentRegistry.markChanged(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = queryRegistry.queryEntities(Changed(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			componentRegistry.flush();
			const afterFlush = queryRegistry.queryEntities(Changed(Position));
			expect(afterFlush).toEqual([]);
		});
	});

	describe('Removed filter', () => {
		it('should match entities with components removed this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components first
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);
			componentRegistry.addComponent(eid2, Position);

			// Clear initial "added" tracking
			componentRegistry.flush();

			// Remove Health from eid1
			componentRegistry.removeComponent(eid1, Health);

			const removedHealth = queryRegistry.queryEntities(Removed(Health));
			expect(removedHealth).toEqual([eid1]);

			const removedPosition = queryRegistry.queryEntities(Removed(Position));
			expect(removedPosition).toEqual([]);
		});

		it('should clear tracking after flush', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.flush();

			componentRegistry.removeComponent(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = queryRegistry.queryEntities(Removed(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			componentRegistry.flush();
			const afterFlush = queryRegistry.queryEntities(Removed(Position));
			expect(afterFlush).toEqual([]);
		});
	});

	describe('And filter', () => {
		it('should match entities that have ALL specified components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position + Velocity
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Velocity);

			// eid2: Position + Health
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Health);

			// eid3: All three
			componentRegistry.addComponent(eid3, Position);
			componentRegistry.addComponent(eid3, Velocity);
			componentRegistry.addComponent(eid3, Health);

			const positionAndVelocity = queryRegistry.queryEntities(And(With(Position), With(Velocity)));
			expect(positionAndVelocity.sort()).toEqual([eid1, eid3].sort());

			const allThree = queryRegistry.queryEntities(
				And(With(Position), With(Velocity), With(Health))
			);
			expect(allThree).toEqual([eid3]);
		});

		it('should support nested And filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.addComponent(eid, Velocity);
			componentRegistry.addComponent(eid, Health);

			// And(And(Position, Velocity), Health) should work
			const nestedAnd = queryRegistry.queryEntities(
				And(And(With(Position), With(Velocity)), With(Health))
			);
			expect(nestedAnd).toEqual([eid]);
		});

		it('should support And with Without filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Enemy = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// eid1: Position + Health
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);

			// eid2: Position + Health + Enemy
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Health);
			componentRegistry.addComponent(eid2, Enemy);

			const healthyNonEnemies = queryRegistry.queryEntities(
				And(With(Position), With(Health), Without(Enemy))
			);
			expect(healthyNonEnemies).toEqual([eid1]);
		});

		it('should support And with change detection', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);
			componentRegistry.addComponent(eid2, Position);

			// Clear initial tracking
			componentRegistry.flush();

			// Mark Health as changed for eid1
			componentRegistry.markChanged(eid1, Health);

			const positionWithChangedHealth = queryRegistry.queryEntities(
				And(With(Position), Changed(Health))
			);
			expect(positionWithChangedHealth).toEqual([eid1]);
		});

		it('should handle empty And filter', () => {
			const result = queryRegistry.queryEntities(And());
			expect(result).toEqual([]);
		});

		it('should handle single filter in And', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);

			const result = queryRegistry.queryEntities(And(With(Position)));
			expect(result).toEqual([eid]);
		});
	});

	describe('Or filter', () => {
		it('should match entities that have ANY of the specified components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();
			const eid4 = entityIndex.createEntity();

			// eid1: Position only
			componentRegistry.addComponent(eid1, Position);

			// eid2: Health only
			componentRegistry.addComponent(eid2, Health);

			// eid3: Shield only
			componentRegistry.addComponent(eid3, Shield);

			// eid4: No components

			const positionOrHealth = queryRegistry.queryEntities(Or(With(Position), With(Health)));
			expect(positionOrHealth.sort()).toEqual([eid1, eid2].sort());

			const anyOfThree = queryRegistry.queryEntities(
				Or(With(Position), With(Health), With(Shield))
			);
			expect(anyOfThree.sort()).toEqual([eid1, eid2, eid3].sort());
		});

		it('should support Or with Without filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Enemy = {};
			const Ally = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position + Enemy
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Enemy);

			// eid2: Position + Ally
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Ally);

			// eid3: Position + Health + Enemy
			componentRegistry.addComponent(eid3, Position);
			componentRegistry.addComponent(eid3, Health);
			componentRegistry.addComponent(eid3, Enemy);

			// Entities that lack Enemy OR lack Ally
			const notEnemyOrNotAlly = queryRegistry.queryEntities(Or(Without(Enemy), Without(Ally)));
			expect(notEnemyOrNotAlly.sort()).toEqual([eid1, eid2, eid3].sort()); // All match since each lacks at least one
		});

		it('should support Or with change detection', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// Setup initial state
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Shield);
			componentRegistry.addComponent(eid3, Position);

			// Clear initial tracking
			componentRegistry.flush();

			// Add Shield to eid1, mark Position as changed for eid2
			componentRegistry.addComponent(eid1, Shield);
			componentRegistry.markChanged(eid2, Position);

			const addedShieldOrChangedPosition = queryRegistry.queryEntities(
				Or(Added(Shield), Changed(Position))
			);
			expect(addedShieldOrChangedPosition.sort()).toEqual([eid1, eid2].sort());
		});

		it('should return empty when no entities match any conditions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			// Entity has no components

			const result = queryRegistry.queryEntities(Or(With(Position), With(Health)));
			expect(result).toEqual([]);
		});

		it('should handle empty Or filter', () => {
			const result = queryRegistry.queryEntities(Or());
			expect(result).toEqual([]);
		});

		it('should handle single filter in Or', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);

			const result = queryRegistry.queryEntities(Or(With(Position)));
			expect(result).toEqual([eid]);
		});
	});

	describe('Complex filter combinations', () => {
		it('should handle And(Or(...), With(...))', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];
			const Alive = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();
			const eid4 = entityIndex.createEntity();

			// eid1: Position + Health + Alive
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);
			componentRegistry.addComponent(eid1, Alive);

			// eid2: Position + Shield + Alive
			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Shield);
			componentRegistry.addComponent(eid2, Alive);

			// eid3: Position + Health (no Alive)
			componentRegistry.addComponent(eid3, Position);
			componentRegistry.addComponent(eid3, Health);

			// eid4: Shield + Alive (no Position)
			componentRegistry.addComponent(eid4, Shield);
			componentRegistry.addComponent(eid4, Alive);

			// Entities with Position AND (Health OR Shield) AND Alive
			const complex = queryRegistry.queryEntities(
				And(With(Position), Or(With(Health), With(Shield)), With(Alive))
			);

			expect(complex.sort()).toEqual([eid1, eid2].sort());
		});

		it('should handle Or(And(...), With(...))', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position + Velocity
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Velocity);

			// eid2: Health only
			componentRegistry.addComponent(eid2, Health);

			// eid3: Position only (missing Velocity)
			componentRegistry.addComponent(eid3, Position);

			// Entities that have (Position AND Velocity) OR Health
			const complex = queryRegistry.queryEntities(
				Or(And(With(Position), With(Velocity)), With(Health))
			);

			expect(complex.sort()).toEqual([eid1, eid2].sort());
		});

		it('should handle deeply nested filters', () => {
			const A = {};
			const B = {};
			const C = {};
			const D = {};

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, A);
			componentRegistry.addComponent(eid, B);
			componentRegistry.addComponent(eid, C);

			// And(And(A, B), And(C, Without(D)))
			const deeplyNested = queryRegistry.queryEntities(
				And(And(With(A), With(B)), And(With(C), Without(D)))
			);

			expect(deeplyNested).toEqual([eid]);
		});

		it('should handle mixed change detection and regular filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];
			const Enemy = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// Setup initial state
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);

			componentRegistry.addComponent(eid2, Position);
			componentRegistry.addComponent(eid2, Health);
			componentRegistry.addComponent(eid2, Enemy);

			componentRegistry.addComponent(eid3, Position);
			componentRegistry.addComponent(eid3, Shield);

			// Clear initial tracking
			componentRegistry.flush();

			// Add Shield to eid1, mark Health as changed for eid2
			componentRegistry.addComponent(eid1, Shield);
			componentRegistry.markChanged(eid2, Health);

			// Entities with Position AND (Added Shield OR Changed Health) AND Without Enemy
			const complex = queryRegistry.queryEntities(
				And(With(Position), Or(Added(Shield), Changed(Health)), Without(Enemy))
			);

			// Should match eid1 (has Position + added Shield + not Enemy)
			// Should NOT match eid2 (has Position + changed Health but IS Enemy)
			expect(complex).toEqual([eid1]);
		});
	});

	describe('toString', () => {
		it('should generate string', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash = With(Position).toString(componentRegistry);

			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		});

		it('should generate same string for identical filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash1 = With(Position).toString(componentRegistry);
			const hash2 = With(Position).toString(componentRegistry);

			expect(hash1).toBe(hash2);
		});

		it('should generate different strings for different filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const withHash = With(Position).toString(componentRegistry);
			const withoutHash = Without(Position).toString(componentRegistry);
			const addedHash = Added(Position).toString(componentRegistry);
			const changedHash = Changed(Position).toString(componentRegistry);
			const removedHash = Removed(Position).toString(componentRegistry);
			const healthHash = With(Health).toString(componentRegistry);

			const hashes = [withHash, withoutHash, addedHash, changedHash, removedHash, healthHash];
			const uniqueHashes = new Set(hashes);
			expect(uniqueHashes.size).toBe(hashes.length);
		});

		it('should handle component order consistently', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			// Order shouldn't matter due to sorting in And
			const hash1 = And(With(Position), With(Velocity)).toString(componentRegistry);
			const hash2 = And(With(Velocity), With(Position)).toString(componentRegistry);

			expect(hash1).toBe(hash2);
		});
	});

	describe('Performance and caching', () => {
		it('should cache identical queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.addComponent(eid, Health);

			// Execute same query multiple times
			const filter = And(With(Position), With(Health));
			const result1 = queryRegistry.queryEntities(filter);
			const result2 = queryRegistry.queryEntities(filter);
			const result3 = queryRegistry.queryEntities(filter);

			// Should return consistent results
			expect(result1).toEqual([eid]);
			expect(result2).toEqual([eid]);
			expect(result3).toEqual([eid]);

			// Verify caching occurred
			expect(queryRegistry._queryCache.size).toBe(1);
		});

		it('should invalidate cache when components change', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position);

			// Initial query
			const result1 = queryRegistry.queryEntities(With(Position));
			expect(result1).toEqual([eid1]);

			// Add component to another entity
			componentRegistry.addComponent(eid2, Position);

			// Query should reflect change
			const result2 = queryRegistry.queryEntities(With(Position));
			expect(result2.sort()).toEqual([eid1, eid2].sort());
		});

		it('should only invalidate affected queries (selective invalidation)', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Velocity = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add Position and Health to eid1
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);

			const positionQuery = queryRegistry.registerQuery(With(Position));
			const healthQuery = queryRegistry.registerQuery(With(Health));
			const velocityQuery = queryRegistry.registerQuery(With(Velocity));

			// Execute different queries to populate cache
			const positionQueryResult = queryRegistry.queryEntities(positionQuery);
			const healthQueryResult = queryRegistry.queryEntities(healthQuery);
			const velocityQueryResult = queryRegistry.queryEntities(velocityQuery);

			// Verify initial state
			expect(positionQueryResult).toEqual([eid1]);
			expect(healthQueryResult).toEqual([eid1]);
			expect(velocityQueryResult).toEqual([]);

			// Queries should not be dirty after execution
			expect(positionQuery.isDirty).toBe(false);
			expect(healthQuery.isDirty).toBe(false);
			expect(velocityQuery.isDirty).toBe(false);

			// Add Velocity to eid2 - should ONLY affect Velocity query
			componentRegistry.addComponent(eid2, Velocity);

			// Only Velocity query should be marked as dirty
			expect(positionQuery.isDirty).toBe(false); // Should NOT be dirty
			expect(healthQuery.isDirty).toBe(false); // Should NOT be dirty
			expect(velocityQuery.isDirty).toBe(true); // Should be dirty

			// Execute queries to verify results
			const newPositionQueryResult = queryRegistry.queryEntities(With(Position));
			const newHealthQueryResult = queryRegistry.queryEntities(With(Health));
			const newVelocityQueryResult = queryRegistry.queryEntities(With(Velocity));

			expect(newPositionQueryResult).toEqual([eid1]); // No change
			expect(newHealthQueryResult).toEqual([eid1]); // No change
			expect(newVelocityQueryResult).toEqual([eid2]); // Changed
		});

		it('should invalidate multiple queries when shared component changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			componentRegistry.addComponent(eid1, Health);

			const positionOnlyQuery = queryRegistry.registerQuery(With(Position));
			const positionAndHealthQuery = queryRegistry.registerQuery(And(With(Position), With(Health)));
			const positionOrHealthQuery = queryRegistry.registerQuery(Or(With(Position), With(Health)));

			// Execute different queries to populate cache
			const positionOnlyQueryResult = queryRegistry.queryEntities(positionOnlyQuery);
			const positionAndHealthQueryResult = queryRegistry.queryEntities(positionAndHealthQuery);
			const positionOrHealthQueryResult = queryRegistry.queryEntities(positionOrHealthQuery);

			// Verify initial state
			expect(positionOnlyQueryResult).toEqual([]);
			expect(positionAndHealthQueryResult).toEqual([]);
			expect(positionOrHealthQueryResult).toEqual([eid1]);

			// All should be clean after execution
			expect(positionOnlyQuery.isDirty).toBe(false);
			expect(positionAndHealthQuery.isDirty).toBe(false);
			expect(positionOrHealthQuery.isDirty).toBe(false);

			// Add Position component - should invalidate all Position-related queries
			componentRegistry.addComponent(eid1, Position);

			// All Position-related queries should be dirty
			expect(positionOnlyQuery.isDirty).toBe(true);
			expect(positionAndHealthQuery.isDirty).toBe(true);
			expect(positionOrHealthQuery.isDirty).toBe(true);
		});
	});

	describe('Bitmask vs Individual evaluation strategies', () => {
		it('should use bitmask evaluation for simple filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const query = queryRegistry.registerQuery(And(With(Position), With(Health)));
			expect(query.evaluationStrategy).toBe('bitmask');
		});

		it('should use bitmask evaluation for simple Or filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const query = queryRegistry.registerQuery(Or(With(Position), With(Health)));
			expect(query.evaluationStrategy).toBe('bitmask');
		});

		it('should use individual evaluation for complex nested filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			// Or(And(...), ...) should fall back to individual evaluation
			const query = queryRegistry.registerQuery(
				Or(And(With(Position), With(Health)), With(Shield))
			);
			expect(query.evaluationStrategy).toBe('individual');
		});

		it('should produce same results regardless of evaluation strategy', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position + Health
			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);

			// eid2: Shield only
			componentRegistry.addComponent(eid2, Shield);

			// eid3: Nothing

			// Bitmask-compatible query
			const bitmaskResult = queryRegistry.queryEntities(Or(With(Position), With(Shield)));

			// Individual evaluation query (same logic)
			const individualResult = queryRegistry.queryEntities(
				Or(And(With(Position)), With(Shield)) // Forces individual evaluation
			);

			expect(bitmaskResult.sort()).toEqual([eid1, eid2].sort());
			expect(individualResult.sort()).toEqual([eid1, eid2].sort());
		});
	});
});
