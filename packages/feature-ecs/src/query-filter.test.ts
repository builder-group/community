import { beforeEach, describe, expect, it } from 'vitest';
import { Added, And, Changed, Or, Removed, With, Without } from './query-filter';
import { createWorld, TWorld } from './world';

describe('Query Filters', () => {
	let world: TWorld;

	beforeEach(() => {
		world = createWorld();
	});

	describe('With filter', () => {
		it('should match entities that have the component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position only
			world.addComponent(eid1, Position);

			// eid2: Health only
			world.addComponent(eid2, Health);

			// eid3: Both components
			world.addComponent(eid3, Position);
			world.addComponent(eid3, Health);

			const positionEntities = world.query(With(Position));
			expect(positionEntities.sort()).toEqual([eid1, eid3].sort());

			const healthEntities = world.query(With(Health));
			expect(healthEntities.sort()).toEqual([eid2, eid3].sort());
		});

		it('should return empty array when no entities have component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const result = world.query(With(Position));
			expect(result).toEqual([]);
		});

		it('should auto-register components', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			expect(world._componentRegistry._componentMap.has(Position)).toBe(false);
			world.query(With(Position));
			expect(world._componentRegistry._componentMap.has(Position)).toBe(true);
		});
	});

	describe('Without filter', () => {
		it('should match entities that lack the component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position only
			world.addComponent(eid1, Position);

			// eid2: Health only
			world.addComponent(eid2, Health);

			// eid3: Both components

			const withoutHealth = world.query(Without(Health));
			expect(withoutHealth.sort()).toEqual([eid1, eid3].sort());

			const withoutPosition = world.query(Without(Position));
			expect(withoutPosition.sort()).toEqual([eid2, eid3].sort());
		});

		it('should match all entities when component doesnt exist', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const NonExistent = { value: [] as number[] };

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			world.addComponent(eid1, Position);

			const withoutNonExistent = world.query(Without(NonExistent));
			expect(withoutNonExistent.sort()).toEqual([eid1, eid2].sort());
		});
	});

	describe('Added filter', () => {
		it('should match entities with components added this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// Add Position to eid1 (should be tracked as added)
			world.addComponent(eid1, Position);

			// Add Health to eid2 (should be tracked as added)
			world.addComponent(eid2, Health);

			const addedPosition = world.query(Added(Position));
			expect(addedPosition).toEqual([eid1]);

			const addedHealth = world.query(Added(Health));
			expect(addedHealth).toEqual([eid2]);
		});

		it('should return empty after flush clears tracking', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = world.query(Added(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			world.flush();
			const afterFlush = world.query(Added(Position));
			expect(afterFlush).toEqual([]);
		});

		it('should track multiple adds in same frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			world.addComponent(eid1, Position);
			world.addComponent(eid2, Position);
			world.addComponent(eid3, Position);

			const addedPosition = world.query(Added(Position));
			expect(addedPosition.sort()).toEqual([eid1, eid2, eid3].sort());
		});
	});

	describe('Changed filter', () => {
		it('should match entities with components changed this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// Add components first
			world.addComponent(eid1, Position);
			world.addComponent(eid2, Health);

			// Clear initial "added" tracking
			world.flush();

			// Mark Position as changed for eid1
			world._componentRegistry.markChanged(eid1, Position);

			const changedPosition = world.query(Changed(Position));
			expect(changedPosition).toEqual([eid1]);

			const changedHealth = world.query(Changed(Health));
			expect(changedHealth).toEqual([]);
		});

		it('should clear tracking after flush', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.flush();

			world._componentRegistry.markChanged(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = world.query(Changed(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			world.flush();
			const afterFlush = world.query(Changed(Position));
			expect(afterFlush).toEqual([]);
		});
	});

	describe('Removed filter', () => {
		it('should match entities with components removed this frame', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// Add components first
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);
			world.addComponent(eid2, Position);

			// Clear initial "added" tracking
			world.flush();

			// Remove Health from eid1
			world.removeComponent(eid1, Health);

			const removedHealth = world.query(Removed(Health));
			expect(removedHealth).toEqual([eid1]);

			const removedPosition = world.query(Removed(Position));
			expect(removedPosition).toEqual([]);
		});

		it('should clear tracking after flush', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.flush();

			world.removeComponent(eid, Position);

			// Before flush: should find the entity
			const beforeFlush = world.query(Removed(Position));
			expect(beforeFlush).toEqual([eid]);

			// After flush: should be empty
			world.flush();
			const afterFlush = world.query(Removed(Position));
			expect(afterFlush).toEqual([]);
		});
	});

	describe('And filter', () => {
		it('should match entities that have ALL specified components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position + Velocity
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Velocity);

			// eid2: Position + Health
			world.addComponent(eid2, Position);
			world.addComponent(eid2, Health);

			// eid3: All three
			world.addComponent(eid3, Position);
			world.addComponent(eid3, Velocity);
			world.addComponent(eid3, Health);

			const positionAndVelocity = world.query(And(With(Position), With(Velocity)));
			expect(positionAndVelocity.sort()).toEqual([eid1, eid3].sort());

			const allThree = world.query(And(With(Position), With(Velocity), With(Health)));
			expect(allThree).toEqual([eid3]);
		});

		it('should support nested And filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.addComponent(eid, Velocity);
			world.addComponent(eid, Health);

			// And(And(Position, Velocity), Health) should work
			const nestedAnd = world.query(And(And(With(Position), With(Velocity)), With(Health)));
			expect(nestedAnd).toEqual([eid]);
		});

		it('should support And with Without filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Enemy = {};

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// eid1: Position + Health
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);

			// eid2: Position + Health + Enemy
			world.addComponent(eid2, Position);
			world.addComponent(eid2, Health);
			world.addComponent(eid2, Enemy);

			const healthyNonEnemies = world.query(And(With(Position), With(Health), Without(Enemy)));
			expect(healthyNonEnemies).toEqual([eid1]);
		});

		it('should support And with change detection', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// Add components
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);
			world.addComponent(eid2, Position);

			// Clear initial tracking
			world.flush();

			// Mark Health as changed for eid1
			world._componentRegistry.markChanged(eid1, Health);

			const positionWithChangedHealth = world.query(And(With(Position), Changed(Health)));
			expect(positionWithChangedHealth).toEqual([eid1]);
		});
	});

	describe('Or filter', () => {
		it('should match entities that have ANY of the specified components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();
			const eid4 = world.createEntity();

			// eid1: Position only
			world.addComponent(eid1, Position);

			// eid2: Health only
			world.addComponent(eid2, Health);

			// eid3: Shield only
			world.addComponent(eid3, Shield);

			// eid4: No components

			const positionOrHealth = world.query(Or(With(Position), With(Health)));
			expect(positionOrHealth.sort()).toEqual([eid1, eid2].sort());

			const anyOfThree = world.query(Or(With(Position), With(Health), With(Shield)));
			expect(anyOfThree.sort()).toEqual([eid1, eid2, eid3].sort());
		});

		it('should support Or with Without filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Enemy = {};
			const Ally = {};

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position + Enemy
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Enemy);

			// eid2: Position + Ally
			world.addComponent(eid2, Position);
			world.addComponent(eid2, Ally);

			// eid3: Position + Health + Enemy
			world.addComponent(eid3, Position);
			world.addComponent(eid3, Health);
			world.addComponent(eid3, Enemy);

			// Entities that lack Enemy OR lack Ally
			const notEnemyOrNotAlly = world.query(Or(Without(Enemy), Without(Ally)));
			expect(notEnemyOrNotAlly.sort()).toEqual([eid1, eid2, eid3].sort()); // All match since each lacks at least one
		});

		it('should support Or with change detection', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// Setup initial state
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);
			world.addComponent(eid2, Position);
			world.addComponent(eid2, Shield);
			world.addComponent(eid3, Position);

			// Clear initial tracking
			world.flush();

			// Add Shield to eid1, mark Position as changed for eid2
			world.addComponent(eid1, Shield);
			world._componentRegistry.markChanged(eid2, Position);

			const addedShieldOrChangedPosition = world.query(Or(Added(Shield), Changed(Position)));
			expect(addedShieldOrChangedPosition.sort()).toEqual([eid1, eid2].sort());
		});

		it('should return empty when no entities match any conditions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			// Entity has no components

			const result = world.query(Or(With(Position), With(Health)));
			expect(result).toEqual([]);
		});
	});

	describe('Complex filter combinations', () => {
		it('should handle And(Or(...), With(...))', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];
			const Alive = {};

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();
			const eid4 = world.createEntity();

			// eid1: Position + Health + Alive
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);
			world.addComponent(eid1, Alive);

			// eid2: Position + Shield + Alive
			world.addComponent(eid2, Position);
			world.addComponent(eid2, Shield);
			world.addComponent(eid2, Alive);

			// eid3: Position + Health (no Alive)
			world.addComponent(eid3, Position);
			world.addComponent(eid3, Health);

			// eid4: Shield + Alive (no Position)
			world.addComponent(eid4, Shield);
			world.addComponent(eid4, Alive);

			// Entities with Position AND (Health OR Shield) AND Alive
			const complex = world.query(And(With(Position), Or(With(Health), With(Shield)), With(Alive)));

			expect(complex.sort()).toEqual([eid1, eid2].sort());
		});

		it('should handle Or(And(...), With(...))', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position + Velocity
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Velocity);

			// eid2: Health only
			world.addComponent(eid2, Health);

			// eid3: Position only (missing Velocity)
			world.addComponent(eid3, Position);

			// Entities that have (Position AND Velocity) OR Health
			const complex = world.query(Or(And(With(Position), With(Velocity)), With(Health)));

			expect(complex.sort()).toEqual([eid1, eid2].sort());
		});

		it('should handle deeply nested filters', () => {
			const A = {};
			const B = {};
			const C = {};
			const D = {};

			const eid = world.createEntity();
			world.addComponent(eid, A);
			world.addComponent(eid, B);
			world.addComponent(eid, C);

			// And(And(A, B), And(C, Without(D)))
			const deeplyNested = world.query(And(And(With(A), With(B)), And(With(C), Without(D))));

			expect(deeplyNested).toEqual([eid]);
		});

		it('should handle mixed change detection and regular filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];
			const Enemy = {};

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// Setup initial state
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);

			world.addComponent(eid2, Position);
			world.addComponent(eid2, Health);
			world.addComponent(eid2, Enemy);

			world.addComponent(eid3, Position);
			world.addComponent(eid3, Shield);

			// Clear initial tracking
			world.flush();

			// Add Shield to eid1, mark Health as changed for eid2
			world.addComponent(eid1, Shield);
			world._componentRegistry.markChanged(eid2, Health);

			// Entities with Position AND (Added Shield OR Changed Health) AND Without Enemy
			const complex = world.query(
				And(With(Position), Or(Added(Shield), Changed(Health)), Without(Enemy))
			);

			// Should match eid1 (has Position + added Shield + not Enemy)
			// Should NOT match eid2 (has Position + changed Health but IS Enemy)
			expect(complex).toEqual([eid1]);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty And filter', () => {
			const result = world.query(And());
			expect(result).toEqual([]);
		});

		it('should handle empty Or filter', () => {
			const result = world.query(Or());
			expect(result).toEqual([]);
		});

		it('should handle single filter in And', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			const result = world.query(And(With(Position)));
			expect(result).toEqual([eid]);
		});

		it('should handle single filter in Or', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			const result = world.query(Or(With(Position)));
			expect(result).toEqual([eid]);
		});

		it('should handle queries with non-existent components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const NonExistent = { value: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			// With non-existent should return empty
			const withNonExistent = world.query(With(NonExistent));
			expect(withNonExistent).toEqual([]);

			// Without non-existent should return all entities
			const withoutNonExistent = world.query(Without(NonExistent));
			expect(withoutNonExistent).toEqual([eid]);
		});
	});

	describe('Performance and caching', () => {
		it('should cache identical queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.addComponent(eid, Health);

			// Execute same query multiple times
			const filter = And(With(Position), With(Health));
			const result1 = world.query(filter);
			const result2 = world.query(filter);
			const result3 = world.query(filter);

			// Should return consistent results
			expect(result1).toEqual([eid]);
			expect(result2).toEqual([eid]);
			expect(result3).toEqual([eid]);

			// Verify caching occurred
			expect(world._queryRegistry._queryCache.size).toBe(1);
		});

		it('should invalidate cache when components change', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			world.addComponent(eid1, Position);

			// Initial query
			const result1 = world.query(With(Position));
			expect(result1).toEqual([eid1]);

			// Add component to another entity
			world.addComponent(eid2, Position);

			// Query should reflect change
			const result2 = world.query(With(Position));
			expect(result2.sort()).toEqual([eid1, eid2].sort());
		});

		it('should only invalidate affected queries (selective invalidation)', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Velocity = { x: [] as number[], y: [] as number[] };

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			// Add Position and Health to eid1
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);

			// Execute different queries to populate cache
			const positionQuery = world.query(With(Position));
			const healthQuery = world.query(With(Health));
			const velocityQuery = world.query(With(Velocity));

			// Verify initial state
			expect(positionQuery).toEqual([eid1]);
			expect(healthQuery).toEqual([eid1]);
			expect(velocityQuery).toEqual([]);

			// Get query data to check dirty flags
			const positionQueryData = world._queryRegistry.registerQuery(With(Position));
			const healthQueryData = world._queryRegistry.registerQuery(With(Health));
			const velocityQueryData = world._queryRegistry.registerQuery(With(Velocity));

			// Queries should not be dirty after execution
			expect(positionQueryData.isDirty).toBe(false);
			expect(healthQueryData.isDirty).toBe(false);
			expect(velocityQueryData.isDirty).toBe(false);

			// Add Velocity to eid2 - should ONLY affect Velocity query
			world.addComponent(eid2, Velocity);

			// Only Velocity query should be marked as dirty
			expect(positionQueryData.isDirty).toBe(false); // Should NOT be dirty
			expect(healthQueryData.isDirty).toBe(false); // Should NOT be dirty
			expect(velocityQueryData.isDirty).toBe(true); // Should be dirty

			// Execute queries to verify results
			const newPositionQuery = world.query(With(Position));
			const newHealthQuery = world.query(With(Health));
			const newVelocityQuery = world.query(With(Velocity));

			expect(newPositionQuery).toEqual([eid1]); // No change
			expect(newHealthQuery).toEqual([eid1]); // No change
			expect(newVelocityQuery).toEqual([eid2]); // Changed
		});

		it('should invalidate multiple queries when shared component changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			world.addComponent(eid1, Health);

			// Create multiple queries that depend on Position
			const positionOnlyQuery = world.query(With(Position));
			const positionAndHealthQuery = world.query(And(With(Position), With(Health)));
			const positionOrHealthQuery = world.query(Or(With(Position), With(Health)));

			// Get query data
			const positionOnlyData = world._queryRegistry.registerQuery(With(Position));
			const positionAndHealthData = world._queryRegistry.registerQuery(
				And(With(Position), With(Health))
			);
			const positionOrHealthData = world._queryRegistry.registerQuery(
				Or(With(Position), With(Health))
			);

			// All should be clean after execution
			expect(positionOnlyData.isDirty).toBe(false);
			expect(positionAndHealthData.isDirty).toBe(false);
			expect(positionOrHealthData.isDirty).toBe(false);

			// Add Position component - should invalidate all Position-related queries
			world.addComponent(eid1, Position);

			// All Position-related queries should be dirty
			expect(positionOnlyData.isDirty).toBe(true);
			expect(positionAndHealthData.isDirty).toBe(true);
			expect(positionOrHealthData.isDirty).toBe(true);
		});
	});

	describe('Bitmask vs Individual evaluation strategies', () => {
		it('should use bitmask evaluation for simple filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const queryData = world._queryRegistry.registerQuery(And(With(Position), With(Health)));
			expect(queryData.evaluationStrategy).toBe('bitmask');
		});

		it('should use bitmask evaluation for simple Or filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const queryData = world._queryRegistry.registerQuery(Or(With(Position), With(Health)));
			expect(queryData.evaluationStrategy).toBe('bitmask');
		});

		it('should use individual evaluation for complex nested filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			// Or(And(...), ...) should fall back to individual evaluation
			const queryData = world._queryRegistry.registerQuery(
				Or(And(With(Position), With(Health)), With(Shield))
			);
			expect(queryData.evaluationStrategy).toBe('individual');
		});

		it('should produce same results regardless of evaluation strategy', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const Shield = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();
			const eid3 = world.createEntity();

			// eid1: Position + Health
			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);

			// eid2: Shield only
			world.addComponent(eid2, Shield);

			// eid3: Nothing

			// Bitmask-compatible query
			const bitmaskResult = world.query(Or(With(Position), With(Shield)));

			// Individual evaluation query (same logic)
			const individualResult = world.query(
				Or(And(With(Position)), With(Shield)) // Forces individual evaluation
			);

			expect(bitmaskResult.sort()).toEqual([eid1, eid2].sort());
			expect(individualResult.sort()).toEqual([eid1, eid2].sort());
		});
	});
});
