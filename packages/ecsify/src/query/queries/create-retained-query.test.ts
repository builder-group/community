import { beforeEach, describe, expect, it } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from '../../component';
import { createEntityIndex, TEntityIndex } from '../../entity';
import { createQueryRegistry, TQueryRegistry } from '../create-query-registry';
import { And, Changed } from '../query-filters';
import { createRetainedQuery } from './create-retained-query';

describe('createRetainedQuery function', () => {
	let entityIndex: TEntityIndex;
	let componentRegistry: TComponentRegistry;
	let queryRegistry: TQueryRegistry;

	beforeEach(() => {
		entityIndex = createEntityIndex();
		componentRegistry = createComponentRegistry();
		queryRegistry = createQueryRegistry(entityIndex, componentRegistry);
	});

	it('should only update a Changed query when both tracked components are changed', () => {
		const Foo = {};
		const Bar = {};

		const retainedQuery = createRetainedQuery(queryRegistry, And(Changed(Foo), Changed(Bar)));

		const eid1 = entityIndex.createEntity();
		componentRegistry.addComponent(eid1, Foo);
		componentRegistry.addComponent(eid1, Bar);

		// Tick X-3, throttled system runs
		const res1 = retainedQuery.execute();
		expect(res1).toEqual([]);

		// Tick X-2, throttled system doesn't run
		componentRegistry.markChanged(eid1, Foo);
		componentRegistry.flush();

		// Tick X-1, throttled system doesn't run
		componentRegistry.markChanged(eid1, Bar);
		componentRegistry.flush();

		// Tick X, throttled system runs
		//
		// Expects to find entities which had Foo and Bar
		// changed since last system execution
		const res2 = retainedQuery.execute();
		expect(res2).toEqual([eid1]);
	});

	it('should only update a Changed query when tracked component is changed', () => {
		const Foo = {};

		const retainedQuery = createRetainedQuery(queryRegistry, Changed(Foo));

		const eid1 = entityIndex.createEntity();
		componentRegistry.addComponent(eid1, Foo);

		const eid2 = entityIndex.createEntity();
		componentRegistry.addComponent(eid2, Foo);

		// Tick X-3, throttled system runs
		const res1 = retainedQuery.execute();
		expect(res1).toEqual([]);
		componentRegistry.flush();

		// Tick X-2, throttled system doesn't run
		componentRegistry.flush();

		// Tick X-1, throttled system doesn't run
		componentRegistry.markChanged(eid1, Foo);
		componentRegistry.markChanged(eid2, Foo);
		componentRegistry.flush();

		// Tick X, throttled system runs
		//
		// Expects to find entities which had Foo
		// changed since last system execution
		const res2 = retainedQuery.execute();
		expect(res2).toEqual([eid1, eid2]);
		componentRegistry.flush();

		// Tick X+1, throttled system doesn't run
		componentRegistry.flush();

		// Tick X+2, throttled system doesn't run
		componentRegistry.flush();

		// Tick X+3, throttled system runs
		//
		// Expects to find no entities
		const res3 = retainedQuery.execute();
		expect(res3).toEqual([]);
	});
});
