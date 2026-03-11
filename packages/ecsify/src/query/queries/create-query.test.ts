import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../../component';
import { createEntityIndex, TEntityIndex } from '../../entity';
import { createQueryRegistry, TQueryRegistry } from '../create-query-registry';
import { And, With, Without } from '../query-filters';
import { createQuery } from './create-query';

describe('createQuery function', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	it('should create query with correct initial state', () => {
		const Position = { x: [] as number[], y: [] as number[] };
		const filter = With(Position);

		const query = createQuery(queryRegistry, filter);

		expect(query.filter).toBe(filter);
		expect(query.cachedResult).toEqual([]);
		expect(query.isDirty).toBe(true);
		expect(query.generations).toEqual([0]);
		expect(typeof query.key).toBe('string');
		expect(query.key.length).toBeGreaterThan(0);
		expect(query.evaluationStrategy).toBe('bitmask'); // Default for simple With
	});

	it('should create query with custom options', () => {
		const Position = { x: [] as number[], y: [] as number[] };
		const customHash = 'custom-hash-123';

		const query = createQuery(queryRegistry, With(Position), {
			evaluationStrategy: 'individual',
			key: customHash
		});

		expect(query.evaluationStrategy).toBe('individual');
		expect(query.key).toBe(customHash);
	});

	describe('register', () => {
		it('should call filter register method', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const filter = With(Position);
			const filterRegisterSpy = vi.spyOn(filter, 'register');

			const query = createQuery(queryRegistry, filter);

			expect(filterRegisterSpy).toHaveBeenCalledWith(query, undefined);
		});
	});

	describe('execute', () => {
		it('should return matching entities', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));

			// Create entities
			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Only eid1 has Position
			componentRegistry.add(eid1, Position, { x: 10, y: 20 });

			const result = query.execute();

			expect(result).toEqual([eid1]);
		});

		it('should return empty array when no entities match', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));

			// Create entity without Position component
			entityIndex.createEntity();

			const result = query.execute();

			expect(result).toEqual([]);
		});

		it('should handle more complex filters', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			const query = createQuery(queryRegistry, And(With(Position), Without(Health)));

			// Create entities
			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// eid1: Position only (should match)
			componentRegistry.add(eid1, Position, { x: 10, y: 20 });

			// eid2: Position + Health (should not match)
			componentRegistry.add(eid2, Position, { x: 30, y: 40 });
			componentRegistry.add(eid2, Health, 100);

			// eid3: Nothing (should not match)

			const result = query.execute();

			expect(result).toEqual([eid1]);
		});
	});

	describe('evaluate', () => {
		it('should return true for matching entity', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));

			const eid = entityIndex.createEntity();
			componentRegistry.add(eid, Position, { x: 10, y: 20 });

			const result = query.evaluate(eid);

			expect(result).toBe(true);
		});

		it('should return false for non-matching entity', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));

			const eid = entityIndex.createEntity();
			// No Position component added

			const result = query.evaluate(eid);

			expect(result).toBe(false);
		});
	});

	describe('markDirty', () => {
		it('should set isDirty to true', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));
			query.isDirty = false; // Reset to test

			query.markDirty();

			expect(query.isDirty).toBe(true);
		});

		it('should work when already dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const query = createQuery(queryRegistry, With(Position));

			expect(query.isDirty).toBe(true); // Starts dirty

			query.markDirty();

			expect(query.isDirty).toBe(true);
		});
	});
});
