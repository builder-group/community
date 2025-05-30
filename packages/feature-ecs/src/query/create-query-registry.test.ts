import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, TWorld } from '../world';
import { Added, And, Changed, Or, Removed, With, Without } from './query-filters';

describe('createQueryRegistry', () => {
	let world: TWorld;

	beforeEach(() => {
		world = createWorld();
	});

	describe('executeQuery', () => {
		it('should return matching entities', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			world.addComponent(eid1, Position);

			const result = world._queryRegistry.executeQuery(With(Position));
			expect(result).toEqual([eid1]);
		});

		it('should return empty array when no entities match', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const result = world._queryRegistry.executeQuery(With(Position));
			expect(result).toEqual([]);
		});

		it('should handle complex filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = world.createEntity();
			const eid2 = world.createEntity();

			world.addComponent(eid1, Position);
			world.addComponent(eid1, Health);
			world.addComponent(eid2, Position);

			const result = world._queryRegistry.executeQuery(And(With(Position), With(Health)));
			expect(result).toEqual([eid1]);
		});

		it('should use cached results when not dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			// First execution should cache result
			const result1 = world._queryRegistry.executeQuery(With(Position));
			expect(result1).toEqual([eid]);

			// Second execution should use cache
			const result2 = world._queryRegistry.executeQuery(With(Position));
			expect(result2).toEqual([eid]);
		});

		it('should rebuild when cache is dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = world.createEntity();
			world.addComponent(eid1, Position);

			// First execution
			const result1 = world._queryRegistry.executeQuery(With(Position));
			expect(result1).toEqual([eid1]);

			// Add another entity (makes cache dirty)
			const eid2 = world.createEntity();
			world.addComponent(eid2, Position);

			// Should rebuild with new entity
			const result2 = world._queryRegistry.executeQuery(With(Position));
			expect(result2.sort()).toEqual([eid1, eid2].sort());
		});

		it('should bypass cache when cache=false', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = world.createEntity();
			world.addComponent(eid, Position);

			// Query with cache enabled
			const result1 = world._queryRegistry.executeQuery(With(Position));
			expect(result1).toEqual([eid]);

			// Add another entity
			const eid2 = world.createEntity();
			world.addComponent(eid2, Position);

			// Query with cache disabled - should always rebuild
			const result2 = world._queryRegistry.executeQuery(With(Position), { cache: false });
			expect(result2.sort()).toEqual([eid, eid2].sort());
		});

		it('should respect evaluationStrategy option', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.addComponent(eid, Health);

			const filter = And(With(Position), With(Health));

			// Force individual evaluation
			const individualResult = world._queryRegistry.executeQuery(filter, {
				evaluationStrategy: 'individual'
			});

			// Force bitmask evaluation
			const bitmaskResult = world._queryRegistry.executeQuery(filter, {
				evaluationStrategy: 'bitmask'
			});

			expect(individualResult).toEqual([eid]);
			expect(bitmaskResult).toEqual([eid]);
			expect(individualResult).toEqual(bitmaskResult);
		});
	});

	describe('getQuery', () => {
		it('should create and cache query data', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData = world._queryRegistry.getQuery(With(Position));

			expect(queryData.filter.type).toBe('With');
			expect(typeof queryData.hash).toBe('string');
			expect(queryData.hash.length).toBeGreaterThan(0);
			expect(Array.isArray(queryData.cachedResult)).toBe(true);
			expect(typeof queryData.isDirty).toBe('boolean');
		});

		it('should return same cached query for identical filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData1 = world._queryRegistry.getQuery(With(Position));
			const queryData2 = world._queryRegistry.getQuery(With(Position));

			expect(queryData1).toBe(queryData2);
			expect(world._queryRegistry._queryCache.size).toBe(1);
		});

		it('should create separate entries for different filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const query1 = world._queryRegistry.getQuery(With(Position));
			const query2 = world._queryRegistry.getQuery(With(Health));

			expect(query1).not.toBe(query2);
			expect(world._queryRegistry._queryCache.size).toBe(2);
		});

		it('should set correct evaluation strategy by default', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Simple And should use bitmask
			const simpleQuery = world._queryRegistry.getQuery(And(With(Position), With(Health)));
			expect(simpleQuery.evaluationStrategy).toBe('bitmask');

			// Complex nested should use individual
			const complexQuery = world._queryRegistry.getQuery(
				Or(And(With(Position), With(Health)), With(Position))
			);
			expect(complexQuery.evaluationStrategy).toBe('individual');
		});

		it('should respect evaluationStrategy option', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Force individual strategy
			const queryData = world._queryRegistry.getQuery(And(With(Position), With(Health)), {
				evaluationStrategy: 'individual'
			});

			expect(queryData.evaluationStrategy).toBe('individual');
		});

		it('should auto-register components', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Component should not be registered initially
			expect(world._componentRegistry._componentMap.has(Position)).toBe(false);

			// getQuery should auto-register component
			world._queryRegistry.getQuery(With(Position));
			expect(world._componentRegistry._componentMap.has(Position)).toBe(true);
		});
	});

	describe('registerQuery', () => {
		it('should be an alias for getQuery', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData1 = world._queryRegistry.registerQuery(With(Position));
			const queryData2 = world._queryRegistry.getQuery(With(Position));

			expect(queryData1).toBe(queryData2);
		});
	});

	describe('generateQueryHash', () => {
		it('should generate string hashes', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash = world._queryRegistry.generateQueryHash(With(Position));

			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		});

		it('should generate same hash for identical filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash1 = world._queryRegistry.generateQueryHash(With(Position));
			const hash2 = world._queryRegistry.generateQueryHash(With(Position));

			expect(hash1).toBe(hash2);
		});

		it('should generate different hashes for different filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const withHash = world._queryRegistry.generateQueryHash(With(Position));
			const withoutHash = world._queryRegistry.generateQueryHash(Without(Position));
			const addedHash = world._queryRegistry.generateQueryHash(Added(Position));
			const changedHash = world._queryRegistry.generateQueryHash(Changed(Position));
			const removedHash = world._queryRegistry.generateQueryHash(Removed(Position));
			const healthHash = world._queryRegistry.generateQueryHash(With(Health));

			const hashes = [withHash, withoutHash, addedHash, changedHash, removedHash, healthHash];
			const uniqueHashes = new Set(hashes);
			expect(uniqueHashes.size).toBe(hashes.length);
		});

		it('should handle component order consistently', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			// Order shouldn't matter due to sorting in And
			const hash1 = world._queryRegistry.generateQueryHash(And(With(Position), With(Velocity)));
			const hash2 = world._queryRegistry.generateQueryHash(And(With(Velocity), With(Position)));

			expect(hash1).toBe(hash2);
		});
	});

	describe('checkEntity', () => {
		it('should return true when entity matches query', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			world.addComponent(eid, Health);

			const queryData = world._queryRegistry.getQuery(And(With(Position), With(Health)));
			const result = world._queryRegistry.checkEntity(queryData, eid);

			expect(result).toBe(true);
		});

		it('should return false when entity does not match query', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = world.createEntity();
			world.addComponent(eid, Position);
			// Missing Health component

			const queryData = world._queryRegistry.getQuery(And(With(Position), With(Health)));
			const result = world._queryRegistry.checkEntity(queryData, eid);

			expect(result).toBe(false);
		});

		it('should handle non-existent entities', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData = world._queryRegistry.getQuery(With(Position));
			const result = world._queryRegistry.checkEntity(queryData, 999);

			expect(result).toBe(false);
		});
	});

	describe('reset', () => {
		it('should clear all cached queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Populate cache with multiple queries
			world._queryRegistry.getQuery(With(Position));
			world._queryRegistry.getQuery(With(Health));
			world._queryRegistry.getQuery(And(With(Position), With(Health)));

			expect(world._queryRegistry._queryCache.size).toBe(3);

			world._queryRegistry.reset();

			expect(world._queryRegistry._queryCache.size).toBe(0);
		});

		it('should allow normal operation after reset', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Use registry, then reset
			world._queryRegistry.getQuery(With(Position));
			world._queryRegistry.reset();

			// Should work normally after reset
			const queryData = world._queryRegistry.getQuery(With(Position));
			expect(queryData.filter.type).toBe('With');
			expect(world._queryRegistry._queryCache.size).toBe(1);
		});
	});
});
