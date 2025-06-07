import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../../component';
import { createEntityIndex, TEntityIndex } from '../../entity';
import { createQueryRegistry, TQueryRegistry } from '../create-query-registry';
import { With } from '../query-filters';
import { createReactiveQuery } from './create-reactive-query';

describe('createReactiveQuery function', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	it('should create reactive query with correct initial state', () => {
		const Position = { x: [] as number[], y: [] as number[] };

		const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));

		expect(reactiveQuery._callbacks).toEqual([]);
		expect(typeof reactiveQuery.markDirty).toBe('function');
		expect(typeof reactiveQuery.onDirty).toBe('function');
		expect(typeof reactiveQuery.cleanup).toBe('function');
		expect(reactiveQuery.isDirty).toBe(true); // Base query starts dirty
	});

	describe('markDirty', () => {
		it('should set isDirty to true', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));
			reactiveQuery.isDirty = false; // Reset to test

			reactiveQuery.markDirty();

			expect(reactiveQuery.isDirty).toBe(true);
		});

		it('should call all registered callbacks', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));

			const callback1 = vi.fn();
			const callback2 = vi.fn();

			reactiveQuery.onDirty(callback1);
			reactiveQuery.onDirty(callback2);

			reactiveQuery.markDirty();

			expect(callback1).toHaveBeenCalledTimes(1);
			expect(callback2).toHaveBeenCalledTimes(1);
		});
	});

	describe('onDirty', () => {
		it('should register callback and return unregister function', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));
			const callback = vi.fn();

			const unregister = reactiveQuery.onDirty(callback);

			expect(reactiveQuery._callbacks).toContain(callback);
			expect(typeof unregister).toBe('function');
		});

		it('should allow multiple callbacks to be registered', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			reactiveQuery.onDirty(callback1);
			reactiveQuery.onDirty(callback2);

			expect(reactiveQuery._callbacks).toHaveLength(2);
			expect(reactiveQuery._callbacks).toContain(callback1);
			expect(reactiveQuery._callbacks).toContain(callback2);
		});

		it('should return unregister function that removes callback', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));
			const callback = vi.fn();

			const unregister = reactiveQuery.onDirty(callback);
			expect(reactiveQuery._callbacks).toContain(callback);

			unregister();
			expect(reactiveQuery._callbacks).not.toContain(callback);
		});

		it('should work with real component changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));
			reactiveQuery.register(queryRegistry); // Register with component callbacks

			const dirtyCallback = vi.fn();
			reactiveQuery.onDirty(dirtyCallback);

			// Add component should trigger dirty
			const eid = entityIndex.createEntity();
			componentRegistry.addComponent(eid, Position, { x: 10, y: 20 });

			expect(dirtyCallback).toHaveBeenCalledTimes(1);
		});
	});

	describe('cleanup', () => {
		it('should clear all callbacks', () => {
			const Position = { x: [] as number[], y: [] as number[] };

			const reactiveQuery = createReactiveQuery(queryRegistry, With(Position));

			reactiveQuery.onDirty(vi.fn());
			reactiveQuery.onDirty(vi.fn());

			expect(reactiveQuery._callbacks).toHaveLength(2);

			reactiveQuery.cleanup();

			expect(reactiveQuery._callbacks).toHaveLength(0);
		});
	});
});
