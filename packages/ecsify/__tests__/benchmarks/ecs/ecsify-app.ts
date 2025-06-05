import {
	And,
	createApp,
	createDefaultPlugin,
	Entity,
	TApp,
	TAppContext,
	TPlugin,
	With
} from '../../../src';

export function createEcsifyAppBenchmarks() {
	return {
		packedIteration() {
			type TCorePlugin = TPlugin<
				{
					name: 'Core';
					components: {
						A: { value: number[] };
						B: { value: number[] };
						C: { value: number[] };
						D: { value: number[] };
						E: { value: number[] };
					};
				},
				[]
			>;

			function createCorePlugin(): TCorePlugin {
				// System that processes all 5 component types separately
				function packedIterationSystem(app: TApp<TAppContext<[TCorePlugin]>>) {
					// Process each component type - doubles all values
					for (const [eid, a] of app.queryComponents([Entity, app.c.A] as const, With(app.c.A))) {
						app.updateComponent(eid, app.c.A, { value: a.value * 2 });
					}
					for (const [eid, b] of app.queryComponents([Entity, app.c.B] as const, With(app.c.B))) {
						app.updateComponent(eid, app.c.B, { value: b.value * 2 });
					}
					for (const [eid, c] of app.queryComponents([Entity, app.c.C] as const, With(app.c.C))) {
						app.updateComponent(eid, app.c.C, { value: c.value * 2 });
					}
					for (const [eid, d] of app.queryComponents([Entity, app.c.D] as const, With(app.c.D))) {
						app.updateComponent(eid, app.c.D, { value: d.value * 2 });
					}
					for (const [eid, e] of app.queryComponents([Entity, app.c.E] as const, With(app.c.E))) {
						app.updateComponent(eid, app.c.E, { value: e.value * 2 });
					}
				}

				return {
					name: 'Core',
					deps: [],
					components: {
						A: { value: [] },
						B: { value: [] },
						C: { value: [] },
						D: { value: [] },
						E: { value: [] }
					},
					setup(app: TApp<TAppContext<[TCorePlugin]>>) {
						// Create 1,000 entities with all 5 components (packed archetype)
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 1 });
							app.addComponent(eid, app.c.B, { value: 1 });
							app.addComponent(eid, app.c.C, { value: 1 });
							app.addComponent(eid, app.c.D, { value: 1 });
							app.addComponent(eid, app.c.E, { value: 1 });
						}

						// Register systems
						app.addSystem(packedIterationSystem);
					}
				};
			}

			const app = createApp({
				plugins: [createDefaultPlugin(), createCorePlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			return {
				runPackedIteration() {
					app.update();
				}
			};
		},

		simpleIteration() {
			type TCorePlugin = TPlugin<
				{
					name: 'Core';
					components: {
						A: { value: number[] };
						B: { value: number[] };
						C: { value: number[] };
						D: { value: number[] };
						E: { value: number[] };
					};
				},
				[]
			>;

			function createCorePlugin(): TCorePlugin {
				// System 1: Swaps values between A and B components
				function systemAB(app: TApp<TAppContext<[TCorePlugin]>>) {
					for (const [eid, a, b] of app.queryComponents(
						[Entity, app.c.A, app.c.B] as const,
						And(With(app.c.A), With(app.c.B))
					)) {
						app.updateComponent(eid, app.c.A, { value: b.value });
						app.updateComponent(eid, app.c.B, { value: a.value });
					}
				}

				// System 2: Swaps values between C and D components
				function systemCD(app: TApp<TAppContext<[TCorePlugin]>>) {
					for (const [eid, c, d] of app.queryComponents(
						[Entity, app.c.C, app.c.D] as const,
						And(With(app.c.C), With(app.c.D))
					)) {
						app.updateComponent(eid, app.c.C, { value: d.value });
						app.updateComponent(eid, app.c.D, { value: c.value });
					}
				}

				// System 3: Swaps values between C and E components
				function systemCE(app: TApp<TAppContext<[TCorePlugin]>>) {
					for (const [eid, c, e] of app.queryComponents(
						[Entity, app.c.C, app.c.E] as const,
						And(With(app.c.C), With(app.c.E))
					)) {
						app.updateComponent(eid, app.c.C, { value: e.value });
						app.updateComponent(eid, app.c.E, { value: c.value });
					}
				}

				return {
					name: 'Core',
					deps: [],
					components: {
						A: { value: [] },
						B: { value: [] },
						C: { value: [] },
						D: { value: [] },
						E: { value: [] }
					},
					setup(app: TApp<TAppContext<[TCorePlugin]>>) {
						// Create entities with different component combinations
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
							app.addComponent(eid, app.c.B, { value: 0 });
						}
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
							app.addComponent(eid, app.c.B, { value: 0 });
							app.addComponent(eid, app.c.C, { value: 0 });
						}
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
							app.addComponent(eid, app.c.B, { value: 0 });
							app.addComponent(eid, app.c.C, { value: 0 });
							app.addComponent(eid, app.c.D, { value: 0 });
						}
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
							app.addComponent(eid, app.c.B, { value: 0 });
							app.addComponent(eid, app.c.C, { value: 0 });
							app.addComponent(eid, app.c.E, { value: 0 });
						}

						// Register systems
						app.addSystem(systemAB);
						app.addSystem(systemCD);
						app.addSystem(systemCE);
					}
				};
			}

			const app = createApp({
				plugins: [createDefaultPlugin(), createCorePlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			return {
				runSimpleIteration() {
					app.update();
				}
			};
		},

		fragmentedIteration() {
			type TCorePlugin = TPlugin<
				{
					name: 'Core';
					components: {
						Data: { value: number[] };
						[K: `C${number}`]: { value: number[] };
					};
				},
				[]
			>;

			function createCorePlugin(): TCorePlugin {
				// System that processes shared data and the last specialized component
				function fragmentedSystem(app: TApp<TAppContext<[TCorePlugin]>>) {
					// Process all entities with shared data
					for (const [eid, data] of app.queryComponents(
						[Entity, app.c.Data] as const,
						With(app.c.Data)
					)) {
						app.updateComponent(eid, app.c.Data, { value: data.value * 2 });
					}

					// Process entities with the last specialized component
					const Component = app.c['C25'];
					if (Component != null) {
						for (const [eid, component] of app.queryComponents(
							[Entity, Component] as const,
							With(Component)
						)) {
							app.updateComponent(eid, Component, { value: component.value * 2 });
						}
					}
				}

				return {
					name: 'Core',
					deps: [],
					components: {
						// Shared component across all entities
						Data: { value: [] },
						// Create 26 specialized components (A-Z)
						...Array.from({ length: 26 }, (_, i) => ({
							[`C${i}`]: { value: [] }
						})).reduce((acc, cur) => ({ ...acc, ...cur }), {})
					},
					setup(app: TApp<TAppContext<[TCorePlugin]>>) {
						// Create sparse entity distribution - 100 entities per specialized component type
						for (let componentIndex = 0; componentIndex < 26; componentIndex++) {
							const Component = app.c[`C${componentIndex}` as const];
							if (Component != null) {
								for (let entityCount = 0; entityCount < 100; entityCount++) {
									const eid = app.createEntity();
									app.addComponent(eid, Component, { value: 0 });
									app.addComponent(eid, app.c.Data, { value: 0 });
								}
							}
						}

						// Register systems
						app.addSystem(fragmentedSystem);
					}
				};
			}

			const app = createApp({
				plugins: [createDefaultPlugin(), createCorePlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			return {
				runFragmentedIteration() {
					app.update();
				}
			};
		},

		entityCycle() {
			type TCorePlugin = TPlugin<
				{
					name: 'Core';
					components: {
						A: { value: number[] };
						B: { value: number[] };
					};
				},
				[]
			>;

			function createCorePlugin(): TCorePlugin {
				// System that creates and destroys entities each frame
				function entityCycleSystem(app: TApp<TAppContext<[TCorePlugin]>>) {
					// Create new temporary entity for each persistent entity
					for (const _eid of app.queryEntities(With(app.c.A))) {
						const newEid = app.createEntity();
						app.addComponent(newEid, app.c.B, { value: 0 });
					}

					// Destroy all temporary entities
					for (const eid of app.queryEntities(With(app.c.B))) {
						app.destroyEntity(eid);
					}
				}

				return {
					name: 'Core',
					deps: [],
					components: {
						A: { value: [] },
						B: { value: [] }
					},
					setup(app: TApp<TAppContext<[TCorePlugin]>>) {
						// Create initial persistent entities
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
						}

						// Register systems
						app.addSystem(entityCycleSystem);
					}
				};
			}

			const app = createApp({
				plugins: [createDefaultPlugin(), createCorePlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			return {
				runEntityCycle() {
					app.update();
				}
			};
		},

		addRemove() {
			type TCorePlugin = TPlugin<
				{
					name: 'Core';
					components: {
						A: { value: number[] };
						B: { value: number[] };
					};
				},
				[]
			>;

			function createCorePlugin(): TCorePlugin {
				// System that adds/removes components causing archetype migrations
				function addRemoveSystem(app: TApp<TAppContext<[TCorePlugin]>>) {
					// Add dynamic component to entities that only have base component
					for (const eid of app.queryEntities(With(app.c.A))) {
						app.addComponent(eid, app.c.B, { value: 0 });
					}

					// Remove dynamic component from entities that have both components
					for (const eid of app.queryEntities(With(app.c.B))) {
						app.removeComponent(eid, app.c.B);
					}
				}

				return {
					name: 'Core',
					deps: [],
					components: {
						A: { value: [] },
						B: { value: [] }
					},
					setup(app) {
						// Create initial entities with only base component
						for (let i = 0; i < 1000; i++) {
							const eid = app.createEntity();
							app.addComponent(eid, app.c.A, { value: 0 });
						}

						// Register systems
						app.addSystem(addRemoveSystem);
					}
				};
			}

			const app = createApp({
				plugins: [createDefaultPlugin(), createCorePlugin()],
				systemSets: ['First', 'Update', 'Last']
			});

			return {
				runAddRemove() {
					app.update();
				}
			};
		}
	};
}
