import { beforeEach, describe, expect, it } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../component';
import { createEntityIndex, TEntityIndex } from '../entity';
import { createQueryRegistry, TQueryRegistry } from './create-query-registry';
import { Added, And, Changed, Or, Removed, With, Without } from './query-filters';
import { Entity } from './types';

describe('createQueryRegistry', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	describe('queryEntities', () => {
		it('should return matching entities', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position);

			const result = queryRegistry.queryEntities(With(Position));
			expect(result).toEqual([eid1]);
		});

		it('should return empty array when no entities match', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const result = queryRegistry.queryEntities(With(Position));
			expect(result).toEqual([]);
		});

		it('should handle complex filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position);
			componentRegistry.addComponent(eid1, Health);
			componentRegistry.addComponent(eid2, Position);

			const result = queryRegistry.queryEntities(And(With(Position), With(Health)));
			expect(result).toEqual([eid1]);
		});

		it('should use cached results when not dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);

			// First execution should cache result
			const result1 = queryRegistry.queryEntities(With(Position));
			expect(result1).toEqual([eid]);

			// Second execution should use cache
			const result2 = queryRegistry.queryEntities(With(Position));
			expect(result2).toEqual([eid]);
		});

		it('should rebuild when cache is dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			componentRegistry.addComponent(eid1, Position);

			// First execution
			const result1 = queryRegistry.queryEntities(With(Position));
			expect(result1).toEqual([eid1]);

			// Add another entity (makes cache dirty)
			const eid2 = entityIndex.createEntity();
			componentRegistry.addComponent(eid2, Position);

			// Should rebuild with new entity
			const result2 = queryRegistry.queryEntities(With(Position));
			expect(result2.sort()).toEqual([eid1, eid2].sort());
		});

		it('should bypass cache when cache=false', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);

			// Query with cache enabled
			const result1 = queryRegistry.queryEntities(With(Position));
			expect(result1).toEqual([eid]);

			// Add another entity
			const eid2 = entityIndex.createEntity();
			componentRegistry.addComponent(eid2, Position);

			// Query with cache disabled - should always rebuild
			const result2 = queryRegistry.queryEntities(With(Position), { cache: false });
			expect(result2.sort()).toEqual([eid, eid2].sort());
		});

		it('should respect evaluationStrategy option', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.addComponent(eid, Health);

			const filter = And(With(Position), With(Health));

			// Force individual evaluation
			const individualResult = queryRegistry.queryEntities(filter, {
				evaluationStrategy: 'individual'
			});

			// Force bitmask evaluation
			const bitmaskResult = queryRegistry.queryEntities(filter, {
				evaluationStrategy: 'bitmask'
			});

			expect(individualResult).toEqual([eid]);
			expect(bitmaskResult).toEqual([eid]);
			expect(individualResult).toEqual(bitmaskResult);
		});
	});

	describe('queryComponents', () => {
		it('should query components with Entity ID', () => {
			// Create components with proper typing
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = [] as { x: number; y: number }[];
			const Health = [] as number[];
			const Player = {};

			// Create entities
			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// Add components with data
			componentRegistry.addComponent(eid1, Position, { x: 10, y: 5 });
			componentRegistry.addComponent(eid1, Velocity, { x: 0, y: 0 });
			componentRegistry.addComponent(eid1, Health, 100);
			componentRegistry.addComponent(eid1, Player);

			componentRegistry.addComponent(eid2, Position, { x: 20, y: 15 });
			componentRegistry.addComponent(eid2, Velocity, { x: 10, y: 0 });
			componentRegistry.addComponent(eid2, Health, 75);

			componentRegistry.addComponent(eid3, Health, 50);

			// Query with Entity ID
			const results = queryRegistry.queryComponents([Entity, Position, Velocity, Health] as const);

			expect(results).toHaveLength(2);
			expect(results[0]).toEqual([eid1, { x: 10, y: 5 }, { x: 0, y: 0 }, 100]);
			expect(results[1]).toEqual([eid2, { x: 20, y: 15 }, { x: 10, y: 0 }, 75]);
		});

		it('should query with filters', () => {
			const Health = [] as number[];
			const Player = {};
			const Enemy = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Health, 100);
			componentRegistry.addComponent(eid1, Player);

			componentRegistry.addComponent(eid2, Health, 75);
			componentRegistry.addComponent(eid2, Enemy);

			componentRegistry.addComponent(eid3, Health, 50);

			// Query only players
			const playerResults = queryRegistry.queryComponents([Entity, Health] as const, With(Player));
			expect(playerResults).toHaveLength(1);
			expect(playerResults[0]).toEqual([eid1, 100]);

			// Query entities without Player marker
			const nonPlayerResults = queryRegistry.queryComponents(
				[Entity, Health] as const,
				Without(Player)
			);
			expect(nonPlayerResults).toHaveLength(2);
			expect(nonPlayerResults).toContainEqual([eid2, 75]);
			expect(nonPlayerResults).toContainEqual([eid3, 50]);
		});

		it('should handle single array components', () => {
			const Health = [] as number[];

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Health, 100);
			componentRegistry.addComponent(eid2, Health, 75);

			const results = queryRegistry.queryComponents([Entity, Health] as const);

			expect(results).toHaveLength(2);
			expect(results[0]).toEqual([eid1, 100]);
			expect(results[1]).toEqual([eid2, 75]);
		});

		it('should handle marker components', () => {
			const Player = {};

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Player);

			const results = queryRegistry.queryComponents([Entity, Player] as const);

			expect(results).toHaveLength(1);
			expect(results[0]).toEqual([eid1, true]);
		});

		it('should exclude entities without all components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// eid1 has both Position and Velocity
			componentRegistry.addComponent(eid1, Position, { x: 10, y: 5 });
			componentRegistry.addComponent(eid1, Velocity, { x: 2, y: 1 });

			// eid2 has only Position
			componentRegistry.addComponent(eid2, Position, { x: 20, y: 15 });

			const results = queryRegistry.queryComponents([Entity, Position, Velocity] as const);

			// Only eid1 should be included
			expect(results).toHaveLength(1);
			expect(results[0]).toEqual([eid1, { x: 10, y: 5 }, { x: 2, y: 1 }]);
		});
	});

	describe('getQuery', () => {
		it('should create and cache query data', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData = queryRegistry.getQuery(With(Position));

			expect(queryData.filter.type).toBe('With');
			expect(typeof queryData.hash).toBe('string');
			expect(queryData.hash.length).toBeGreaterThan(0);
			expect(Array.isArray(queryData.cachedResult)).toBe(true);
			expect(typeof queryData.isDirty).toBe('boolean');
		});

		it('should return same cached query for identical filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData1 = queryRegistry.getQuery(With(Position));
			const queryData2 = queryRegistry.getQuery(With(Position));

			expect(queryData1).toBe(queryData2);
			expect(queryRegistry._queryCache.size).toBe(1);
		});

		it('should create separate entries for different filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const query1 = queryRegistry.getQuery(With(Position));
			const query2 = queryRegistry.getQuery(With(Health));

			expect(query1).not.toBe(query2);
			expect(queryRegistry._queryCache.size).toBe(2);
		});

		it('should set correct evaluation strategy by default', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Simple And should use bitmask
			const simpleQuery = queryRegistry.getQuery(And(With(Position), With(Health)));
			expect(simpleQuery.evaluationStrategy).toBe('bitmask');

			// Complex nested should use individual
			const complexQuery = queryRegistry.getQuery(
				Or(And(With(Position), With(Health)), With(Position))
			);
			expect(complexQuery.evaluationStrategy).toBe('individual');
		});

		it('should respect evaluationStrategy option', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Force individual strategy
			const queryData = queryRegistry.getQuery(And(With(Position), With(Health)), {
				evaluationStrategy: 'individual'
			});

			expect(queryData.evaluationStrategy).toBe('individual');
		});

		it('should auto-register components', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Component should not be registered initially
			expect(componentRegistry._componentMap.has(Position)).toBe(false);

			// getQuery should auto-register component
			queryRegistry.getQuery(With(Position));
			expect(componentRegistry._componentMap.has(Position)).toBe(true);
		});
	});

	describe('registerQuery', () => {
		it('should be an alias for getQuery', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData1 = queryRegistry.registerQuery(With(Position));
			const queryData2 = queryRegistry.getQuery(With(Position));

			expect(queryData1).toBe(queryData2);
		});
	});

	describe('generateQueryHash', () => {
		it('should generate string hashes', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash = queryRegistry.generateQueryHash(With(Position));

			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		});

		it('should generate same hash for identical filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const hash1 = queryRegistry.generateQueryHash(With(Position));
			const hash2 = queryRegistry.generateQueryHash(With(Position));

			expect(hash1).toBe(hash2);
		});

		it('should generate different hashes for different filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const withHash = queryRegistry.generateQueryHash(With(Position));
			const withoutHash = queryRegistry.generateQueryHash(Without(Position));
			const addedHash = queryRegistry.generateQueryHash(Added(Position));
			const changedHash = queryRegistry.generateQueryHash(Changed(Position));
			const removedHash = queryRegistry.generateQueryHash(Removed(Position));
			const healthHash = queryRegistry.generateQueryHash(With(Health));

			const hashes = [withHash, withoutHash, addedHash, changedHash, removedHash, healthHash];
			const uniqueHashes = new Set(hashes);
			expect(uniqueHashes.size).toBe(hashes.length);
		});

		it('should handle component order consistently', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			// Order shouldn't matter due to sorting in And
			const hash1 = queryRegistry.generateQueryHash(And(With(Position), With(Velocity)));
			const hash2 = queryRegistry.generateQueryHash(And(With(Velocity), With(Position)));

			expect(hash1).toBe(hash2);
		});
	});

	describe('checkEntity', () => {
		it('should return true when entity matches query', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			componentRegistry.addComponent(eid, Health);

			const queryData = queryRegistry.getQuery(And(With(Position), With(Health)));
			const result = queryRegistry.checkEntity(queryData, eid);

			expect(result).toBe(true);
		});

		it('should return false when entity does not match query', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position);
			// Missing Health component

			const queryData = queryRegistry.getQuery(And(With(Position), With(Health)));
			const result = queryRegistry.checkEntity(queryData, eid);

			expect(result).toBe(false);
		});

		it('should handle non-existent entities', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queryData = queryRegistry.getQuery(With(Position));
			const result = queryRegistry.checkEntity(queryData, 999);

			expect(result).toBe(false);
		});
	});

	describe('reset', () => {
		it('should clear all cached queries', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Populate cache with multiple queries
			queryRegistry.getQuery(With(Position));
			queryRegistry.getQuery(With(Health));
			queryRegistry.getQuery(And(With(Position), With(Health)));

			expect(queryRegistry._queryCache.size).toBe(3);

			queryRegistry.reset();

			expect(queryRegistry._queryCache.size).toBe(0);
		});

		it('should allow normal operation after reset', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			// Use registry, then reset
			queryRegistry.getQuery(With(Position));
			queryRegistry.reset();

			// Should work normally after reset
			const queryData = queryRegistry.getQuery(With(Position));
			expect(queryData.filter.type).toBe('With');
			expect(queryRegistry._queryCache.size).toBe(1);
		});
	});
});
