import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSystemRegistry, TSystemFn, TSystemRegistry } from './create-system-registry';

describe('createSystemRegistry', () => {
	type TTestSystemSets = 'First' | 'Update' | 'Last' | 'Flush';

	type TestContext = {
		value: number;
		executed: string[];
	};

	let systemRegistry: TSystemRegistry<TTestSystemSets, TestContext>;
	let context: TestContext;

	beforeEach(() => {
		systemRegistry = createSystemRegistry<TTestSystemSets>([
			'First',
			'Update',
			'Last',
			'Flush'
		] as const);
		context = { value: 0, executed: [] };
	});

	describe('addSystem', () => {
		it('should add a single system', () => {
			const system: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system1');
			};

			systemRegistry.addSystem(system);
			systemRegistry.update(context);

			expect(context.executed).toEqual(['system1']);
		});

		it('should add systems in set order', () => {
			const firstSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('first');
			};
			const lastSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('last');
			};
			const updateSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('update');
			};

			systemRegistry.addSystem(lastSystem, { set: 'Last' });
			systemRegistry.addSystem(firstSystem, { set: 'First' });
			systemRegistry.addSystem(updateSystem, { set: 'Update' });

			systemRegistry.update(context);

			expect(context.executed).toEqual(['first', 'update', 'last']);
		});

		it('should add system with before option', () => {
			const system1: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system1');
			};
			const system2: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system2');
			};

			systemRegistry.addSystem(system1);
			systemRegistry.addSystem(system2, { before: system1 });

			systemRegistry.update(context);

			expect(context.executed).toEqual(['system2', 'system1']);
		});

		it('should add system with after option', () => {
			const system1: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system1');
			};
			const system2: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system2');
			};

			systemRegistry.addSystem(system1);
			systemRegistry.addSystem(system2, { after: system1 });

			systemRegistry.update(context);

			expect(context.executed).toEqual(['system1', 'system2']);
		});

		it('should call setup function when adding system', () => {
			const setupFn = vi.fn();
			const system: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system');
			};
			system.setup = setupFn;

			systemRegistry.addSystem(system);

			expect(setupFn).toHaveBeenCalledTimes(1);
			expect(setupFn).toHaveBeenCalledWith(systemRegistry);
		});

		it('should use default set when none specified', () => {
			const system: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system');
			};

			systemRegistry.addSystem(system);

			expect(system.set).toBe('First');
		});

		it('should throw when adding a system to an undeclared set', () => {
			const system: TSystemFn<TTestSystemSets, TestContext> = () => {};

			expect(() => systemRegistry.addSystem(system, { set: 'Render' as TTestSystemSets })).toThrow(
				"System set 'Render' is not declared in createApp({ systemSets: [...] })"
			);
		});
	});

	describe('update', () => {
		it('should call all systems in order', () => {
			const system1: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system1');
			};
			const system2: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('system2');
			};

			systemRegistry.addSystem(system1);
			systemRegistry.addSystem(system2);
			systemRegistry.update(context);

			expect(context.executed).toEqual(['system1', 'system2']);
		});

		it('should pass context and delta to systems', () => {
			const system: TSystemFn<TTestSystemSets, TestContext> = (ctx, delta) => {
				ctx.value = delta ?? 0;
			};

			systemRegistry.addSystem(system);
			systemRegistry.update(context, 16.67);

			expect(context.value).toBe(16.67);
		});

		it('should handle empty system list', () => {
			expect(() => systemRegistry.update(context)).not.toThrow();
		});
	});

	describe('setSystemSets', () => {
		it('should update system set order', () => {
			const firstSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('first');
			};
			const lastSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('last');
			};

			systemRegistry.addSystem(firstSystem, { set: 'First' });
			systemRegistry.addSystem(lastSystem, { set: 'Last' });

			// Reverse the order
			systemRegistry.setSystemSets(['Last', 'Update', 'First', 'Flush'] as const);
			systemRegistry.update(context);

			expect(context.executed).toEqual(['last', 'first']);
		});

		it('should re-sort existing systems', () => {
			const updateSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('update');
			};
			const firstSystem: TSystemFn<TTestSystemSets, TestContext> = (ctx) => {
				ctx.executed.push('first');
			};

			systemRegistry.addSystem(updateSystem, { set: 'Update' });
			systemRegistry.addSystem(firstSystem, { set: 'First' });

			// Initial order should be First, Update
			systemRegistry.update(context);
			expect(context.executed).toEqual(['first', 'update']);

			// Reset and change order
			context.executed = [];
			systemRegistry.setSystemSets(['Update', 'First', 'Last', 'Flush'] as const);
			systemRegistry.update(context);

			expect(context.executed).toEqual(['update', 'first']);
		});

		it('should throw when new system sets omit an existing system set', () => {
			const flushSystem: TSystemFn<TTestSystemSets, TestContext> = () => {};

			systemRegistry.addSystem(flushSystem, { set: 'Flush' });

			expect(() => systemRegistry.setSystemSets(['First', 'Update', 'Last'] as const)).toThrow(
				"System set 'Flush' is not declared in createApp({ systemSets: [...] })"
			);
		});
	});

	describe('getSystems', () => {
		it('should return empty array for new registry', () => {
			const systems = systemRegistry.getSystems();
			expect(systems).toEqual([]);
		});

		it('should return all systems in order', () => {
			const system1: TSystemFn<TTestSystemSets, TestContext> = () => {};
			const system2: TSystemFn<TTestSystemSets, TestContext> = () => {};

			systemRegistry.addSystem(system1);
			systemRegistry.addSystem(system2);

			const systems = systemRegistry.getSystems();
			expect(systems).toHaveLength(2);
			expect(systems[0]).toBe(system1);
			expect(systems[1]).toBe(system2);
		});

		it('should return copy of systems array', () => {
			const system: TSystemFn<TTestSystemSets, TestContext> = () => {};
			systemRegistry.addSystem(system);

			const systems1 = systemRegistry.getSystems();
			const systems2 = systemRegistry.getSystems();

			expect(systems1).not.toBe(systems2);
			expect(systems1).toEqual(systems2);
		});
	});
});
