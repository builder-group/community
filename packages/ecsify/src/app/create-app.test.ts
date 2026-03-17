import { describe, expect, it, vi } from 'vitest';
import { bundleEntry, defineBundle } from '../bundle';
import { createApp } from './create-app';
import { definePlugin } from './define-plugin';
import { createDefaultPlugin } from './plugins';

describe('createApp function', () => {
	describe('initialization', () => {
		it('should create app with required plugins and systemSets', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			expect(app._pluginNames).toEqual(['Default']);
			expect(app.c.Removed).toBeDefined();
		});
	});

	describe('addPlugin', () => {
		it('should add plugin with components and resources', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const testPlugin = definePlugin({
				name: 'Test',
				deps: [],
				components: {
					TestComponent: { value: [] as number[] }
				},
				resources: {
					testResource: 'test-value'
				}
			});

			const result = app.addPlugin(testPlugin);

			expect(app._pluginNames).toContain('Test');
			expect(result.c.TestComponent).toBe(testPlugin.components.TestComponent);
			expect(result.r.testResource).toBe(testPlugin.resources.testResource);
			expect(result).toBe(app);
		});

		it('should track newly added resources as changed', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const typedApp = app.addPlugin(
				definePlugin({
					name: 'Test',
					deps: [],
					resources: {
						inputState: { jump: false }
					}
				})
			);

			expect(typedApp.wasResourceAdded('inputState')).toBe(true);
			expect(typedApp.wasResourceChanged('inputState')).toBe(true);
		});

		it('should add plugin with dependencies', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const depPlugin = definePlugin({
				name: 'Dependency',
				deps: [],
				components: {
					DepComponent: { data: [] as string[] }
				}
			});

			const consumerPlugin = definePlugin({
				name: 'Consumer',
				deps: ['Dependency'],
				appExtensions: {
					doSomething() {
						console.log('doing something');
					}
				}
			});

			const afterDep = app.addPlugin(depPlugin);
			const result = afterDep.addPlugin(consumerPlugin);

			expect(app._pluginNames).toEqual(['Default', 'Dependency', 'Consumer']);
			expect(result.c.DepComponent).toBe(depPlugin.components.DepComponent);
			expect(result.doSomething).toBe(consumerPlugin.appExtensions.doSomething);
			expect(result).toBe(app);
		});

		it('should throw error for missing dependencies', () => {
			const app = createApp({
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
				plugins: [createDefaultPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			expect(app.hasResource('score')).toBe(true);
		});

		it('should mark nested resource mutations explicitly', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							inputState: { jump: false }
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						resources: {
							score: 0
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
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

	describe('bundles', () => {
		it('should add all bundle components to an entity', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						components: {
							Position: { x: [] as number[], y: [] as number[] },
							Health: [] as number[],
							Player: {}
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const eid = app.createEntity();
			const actorBundle = defineBundle(
				bundleEntry(app.c.Position, { x: 10, y: 20 }),
				bundleEntry(app.c.Health, 100)
			);
			const playerBundle = defineBundle(actorBundle, bundleEntry(app.c.Player));

			app.addBundle(eid, playerBundle);

			expect(app.c.Position.x[eid]).toBe(10);
			expect(app.c.Position.y[eid]).toBe(20);
			expect(app.c.Health[eid]).toBe(100);
			expect(app.hasComponent(eid, app.c.Player)).toBe(true);
		});

		it('should not overwrite existing component data when adding a bundle', () => {
			const app = createApp({
				plugins: [
					createDefaultPlugin(),
					definePlugin({
						name: 'Test',
						deps: ['Default'],
						components: {
							Health: [] as number[]
						}
					})
				] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const eid = app.createEntity();
			app.addComponent(eid, app.c.Health, 100);

			app.addBundle(eid, defineBundle(bundleEntry(app.c.Health, 25)));

			expect(app.c.Health[eid]).toBe(100);
		});
	});
});
