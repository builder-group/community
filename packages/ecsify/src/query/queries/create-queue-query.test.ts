import { beforeEach, describe, expect, it } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../../component';
import { createEntityIndex, TEntityIndex } from '../../entity';
import { createQueryRegistry, TQueryRegistry } from '../create-query-registry';
import { Changed, With } from '../query-filters';
import { createQueueQuery } from './create-queue-query';

describe('createQueueQuery function', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	it('should create queue query with correct initial state', () => {
		const Position = { x: [] as number[], y: [] as number[] };

		const queueQuery = createQueueQuery(queryRegistry, With(Position), { maxQueueSize: 5 });

		expect(queueQuery._entityQueue).toEqual([]);
		expect(queueQuery.maxQueueSize).toBe(5);
		expect(typeof queueQuery.query).toBe('function');
	});

	describe('register', () => {
		it('should register and setup auto-queuing on dirty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Initially empty queue
			expect(queueQuery._entityQueue).toHaveLength(0);

			// Add component - should trigger auto-queue via dirty callback
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			// Should have queued result
			expect(queueQuery._entityQueue).toHaveLength(1);
			expect(queueQuery._entityQueue[0]?.entities).toEqual([eid]);
		});

		it('should work with Changed filter', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, Changed(Position));
			queueQuery.register(queryRegistry);

			// Create entity with component first
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			// Clear any initial queue from adding
			queueQuery._entityQueue = [];

			// Change component - should trigger auto-queue
			componentRegistry.updateComponent(eid, Position, { x: 15, y: 25 });

			// Should have queued the changed entity
			expect(queueQuery._entityQueue).toHaveLength(1);
			expect(queueQuery._entityQueue[0]?.entities).toEqual([eid]);
		});

		it('should queue multiple changes separately', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Add entities one by one
			const eid1 = entityIndex.createEntity();
			componentRegistry.addComponent(eid1, Position, { x: 10, y: 20 });

			const eid2 = entityIndex.createEntity();
			componentRegistry.addComponent(eid2, Position, { x: 30, y: 40 });

			// Should have queued both changes
			expect(queueQuery._entityQueue).toHaveLength(2);
			expect(queueQuery._entityQueue[0]?.entities).toEqual([eid1]);
			expect(queueQuery._entityQueue[1]?.entities).toEqual([eid1, eid2]);
		});
	});

	describe('query', () => {
		it('should pop from queue when available', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Add entity to trigger queuing
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			// Verify queue has content
			expect(queueQuery._entityQueue).toHaveLength(1);

			// Query should pop from queue
			const result = queueQuery.query(queryRegistry);

			expect(result).toEqual([eid]);
			expect(queueQuery._entityQueue).toHaveLength(0); // Should be popped
		});

		it('should return FIFO order from queue', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Add entities to create queue
			const eid1 = entityIndex.createEntity();
			componentRegistry.addComponent(eid1, Position, { x: 10, y: 20 });

			const eid2 = entityIndex.createEntity();
			componentRegistry.addComponent(eid2, Position, { x: 30, y: 40 });

			// Should get first queued result
			const result1 = queueQuery.query(queryRegistry);
			expect(result1).toEqual([eid1]);

			// Should get second queued result
			const result2 = queueQuery.query(queryRegistry);
			expect(result2).toEqual([eid1, eid2]);
		});

		it('should fallback to direct query when queue is empty', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));

			// Create entity but don't register (no auto-queuing)
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			// Query with empty queue should fallback to direct query
			const result = queueQuery.query(queryRegistry);
			expect(result).toEqual([eid]);
		});

		it('should handle empty results', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));

			// Query with no entities and empty queue
			const result = queueQuery.query(queryRegistry);

			expect(result).toEqual([]);
		});

		it('should track queue size correctly', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Initially empty
			expect(queueQuery._entityQueue).toHaveLength(0);

			// Add entity to trigger queuing
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			expect(queueQuery._entityQueue).toHaveLength(1);

			// Pop from queue
			queueQuery.query(queryRegistry);

			expect(queueQuery._entityQueue).toHaveLength(0);
		});

		it('should respect maxQueueSize limit', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position), { maxQueueSize: 2 });
			queueQuery.register(queryRegistry);

			// Add more entities than queue size
			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			componentRegistry.addComponent(eid1, Position, { x: 10, y: 20 });
			componentRegistry.addComponent(eid2, Position, { x: 30, y: 40 });
			componentRegistry.addComponent(eid3, Position, { x: 50, y: 60 });

			// Should only keep maxQueueSize entries
			expect(queueQuery._entityQueue).toHaveLength(2);
		});
	});

	describe('cleanup', () => {
		it('should clear queue and call parent cleanup', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const queueQuery = createQueueQuery(queryRegistry, With(Position));
			queueQuery.register(queryRegistry);

			// Add entity to create queue
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			expect(queueQuery._entityQueue).toHaveLength(1);

			// Cleanup should clear queue
			queueQuery.cleanup();

			expect(queueQuery._entityQueue).toHaveLength(0);
		});
	});
});
