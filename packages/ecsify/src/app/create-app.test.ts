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
});
