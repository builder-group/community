import { describe, expect, it, vi } from 'vitest';
import { createApp } from './create-app';
import { createDefaultPlugin } from './plugins';

describe('createApp function', () => {
	describe('initialization', () => {
		it('should create app with required plugins and systemSets', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			expect(app._pluginNames).toEqual(['Default']);
			expect(app.c.Removed).toBeDefined();
		});
	});

	describe('addPlugin', () => {
		it('should add plugin with components and resources', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const testPlugin = {
				name: 'Test',
				deps: [],
				components: {
					TestComponent: { value: [] as number[] }
				},
				resources: {
					testResource: 'test-value'
				}
			};

			const result = app.addPlugin(testPlugin);

			expect(app._pluginNames).toContain('Test');
			expect((app.c as any).TestComponent).toBe(testPlugin.components.TestComponent);
			expect((app.r as any).testResource).toBe(testPlugin.resources.testResource);
			expect(result).toBe(app);
		});

		it('should track newly added resources as changed', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const typedApp = app.addPlugin({
				name: 'Test',
				deps: [],
				resources: {
					inputState: { jump: false }
				}
			});

			expect(typedApp.wasResourceAdded('inputState')).toBe(true);
			expect(typedApp.wasResourceChanged('inputState')).toBe(true);
		});

		it('should add plugin with dependencies', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const depPlugin = {
				name: 'Dependency',
				deps: [],
				components: {
					DepComponent: { data: [] as string[] }
				}
			};

			const consumerPlugin = {
				name: 'Consumer',
				deps: ['Dependency'],
				appExtensions: {
					doSomething() {
						console.log('doing something');
					}
				}
			};

			app.addPlugin(depPlugin);
			const result = app.addPlugin(consumerPlugin);

			expect(app._pluginNames).toEqual(['Default', 'Dependency', 'Consumer']);
			expect((app.c as any).DepComponent).toBe(depPlugin.components.DepComponent);
			expect((app as any).doSomething).toBe(consumerPlugin.appExtensions.doSomething);
			expect(result).toBe(app);
		});

		it('should throw error for missing dependencies', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const pluginWithDeps = {
				name: 'Consumer',
				deps: ['NonExistent'],
				appExtensions: {
					doSomething() {
						console.log('doing something');
					}
				}
			};

			expect(() => app.addPlugin(pluginWithDeps)).toThrow(
				"Plugin 'Consumer' depends on 'NonExistent' which is not loaded"
			);
		});

		it('should call setup function if provided', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});
			const setupSpy = vi.fn();

			const pluginWithSetup = {
				name: 'Test',
				deps: [],
				components: {
					TestComponent: { value: [] as number[] }
				},
				setup: setupSpy
			};

			app.addPlugin(pluginWithSetup);

			expect(setupSpy).toHaveBeenCalledWith(app);
		});
	});

	describe('addPlugins', () => {
		it('should add multiple plugins in order', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const plugin1 = {
				name: 'Plugin1',
				deps: [],
				components: {
					Component1: { value: [] as number[] }
				}
			};

			const plugin2 = {
				name: 'Plugin2',
				deps: [],
				components: {
					Component2: { value: [] as string[] }
				}
			};

			const result = app.addPlugins([plugin1, plugin2]);

			expect(app._pluginNames).toEqual(['Default', 'Plugin1', 'Plugin2']);
			expect((app.c as any).Component1).toBe(plugin1.components.Component1);
			expect((app.c as any).Component2).toBe(plugin2.components.Component2);
			expect(result).toBe(app);
		});

		it('should throw error if dependencies not in correct order', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			const depPlugin = {
				name: 'Dependency',
				deps: [],
				components: {
					DepComponent: { data: [] as string[] }
				}
			};

			const consumerPlugin = {
				name: 'Consumer',
				deps: ['Dependency'],
				appExtensions: {
					doSomething() {
						console.log('doing something');
					}
				}
			};

			// Wrong order - consumer before dependency
			expect(() => app.addPlugins([consumerPlugin, depPlugin])).toThrow(
				"Plugin 'Consumer' depends on 'Dependency' which is not loaded"
			);
		});
	});

	describe('resources', () => {
		it('should report whether a resource is registered', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			expect(app.hasResource('score')).toBe(true);
		});

		it('should mark nested resource mutations explicitly', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							inputState: { jump: false }
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			app.flush();
			app.r.inputState.jump = true;

			expect(app.wasResourceChanged('inputState')).toBe(false);

			app.markResourceChanged('inputState');

			expect(app.wasResourceChanged('inputState')).toBe(true);
		});

		it('should update top-level resources and mark them as changed', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			app.flush();
			app.updateResource('score', 10);

			expect(app.r.score).toBe(10);
			expect(app.wasResourceChanged('score')).toBe(true);
		});

		it('should respect markAsChanged when updating a resource', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			app.flush();
			app.updateResource('score', 10, false);

			expect(app.r.score).toBe(10);
			expect(app.wasResourceChanged('score')).toBe(false);
		});

		it('should clear resource change state on flush', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			app.flush();
			app.updateResource('score', 10);

			expect(app.wasResourceChanged('score')).toBe(true);

			app.flush();

			expect(app.wasResourceAdded('score')).toBe(false);
			expect(app.wasResourceChanged('score')).toBe(false);
		});

		it('should preserve resource registration on reset', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					{
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					}
				] as const,
				systemSets: ['First', 'Update', 'Last']
			});

			expect(app.wasResourceAdded('score')).toBe(true);

			app.reset();

			expect(app.hasResource('score')).toBe(true);
			expect(app.r.score).toBe(0);
			expect(app.wasResourceAdded('score')).toBe(false);
			expect(app.wasResourceChanged('score')).toBe(false);

			app.markResourceChanged('score');

			expect(app.wasResourceChanged('score')).toBe(true);
		});
	});
});
