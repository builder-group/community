import { Component, createComponent, createSystem, Types, World } from 'elics';

export function createElicsBenchmarks() {
	return {
		packedIteration() {
			const world = new World({ entityCapacity: 1000, checksOn: false });

			// Create 5 simple components
			const A = createComponent({ value: { type: Types.Float32, default: 1 } });
			const B = createComponent({ value: { type: Types.Float32, default: 1 } });
			const C = createComponent({ value: { type: Types.Float32, default: 1 } });
			const D = createComponent({ value: { type: Types.Float32, default: 1 } });
			const E = createComponent({ value: { type: Types.Float32, default: 1 } });

			// System that processes all 5 component types separately
			class PackedIterationSystem extends createSystem({
				a: { required: [A] },
				b: { required: [B] },
				c: { required: [C] },
				d: { required: [D] },
				e: { required: [E] }
			}) {
				update() {
					// Process each component type - doubles all values
					for (const entity of this.queries.a.entities) {
						const eid = entity.index;
						A.data.value[eid] = (A.data.value[eid] ?? 0) * 2;
					}
					for (const entity of this.queries.b.entities) {
						const eid = entity.index;
						B.data.value[eid] = (B.data.value[eid] ?? 0) * 2;
					}
					for (const entity of this.queries.c.entities) {
						const eid = entity.index;
						C.data.value[eid] = (C.data.value[eid] ?? 0) * 2;
					}
					for (const entity of this.queries.d.entities) {
						const eid = entity.index;
						D.data.value[eid] = (D.data.value[eid] ?? 0) * 2;
					}
					for (const entity of this.queries.e.entities) {
						const eid = entity.index;
						E.data.value[eid] = (E.data.value[eid] ?? 0) * 2;
					}
				}
			}

			// Register components and systems
			world
				.registerComponent(A)
				.registerComponent(B)
				.registerComponent(C)
				.registerComponent(D)
				.registerComponent(E)
				.registerSystem(PackedIterationSystem);

			// Create 1,000 entities with all 5 components (packed archetype)
			for (let i = 0; i < 1000; i++) {
				world
					.createEntity()
					.addComponent(A)
					.addComponent(B)
					.addComponent(C)
					.addComponent(D)
					.addComponent(E);
			}

			return {
				runPackedIteration() {
					world.update(0, 0);
				}
			};
		},

		simpleIteration() {
			const world = new World({ entityCapacity: 5000, checksOn: false });

			// Create 5 components for different combinations
			const A = createComponent({ value: { type: Types.Float32, default: 0 } });
			const B = createComponent({ value: { type: Types.Float32, default: 0 } });
			const C = createComponent({ value: { type: Types.Float32, default: 0 } });
			const D = createComponent({ value: { type: Types.Float32, default: 0 } });
			const E = createComponent({ value: { type: Types.Float32, default: 0 } });

			// System 1: Swaps values between A and B components
			class SystemAB extends createSystem({
				ab: { required: [A, B] }
			}) {
				update() {
					for (const entity of this.queries.ab.entities) {
						const eid = entity.index;
						const valueA = A.data.value?.[eid] ?? 0;
						const valueB = B.data.value?.[eid] ?? 0;
						A.data.value[eid] = valueB;
						B.data.value[eid] = valueA;
					}
				}
			}

			// System 2: Swaps values between C and D components
			class SystemCD extends createSystem({
				cd: { required: [C, D] }
			}) {
				update() {
					for (const entity of this.queries.cd.entities) {
						const eid = entity.index;
						const valueC = C.data.value?.[eid] ?? 0;
						const valueD = D.data.value?.[eid] ?? 0;
						C.data.value[eid] = valueD;
						D.data.value[eid] = valueC;
					}
				}
			}

			// System 3: Swaps values between C and E components
			class SystemCE extends createSystem({
				ce: { required: [C, E] }
			}) {
				update() {
					for (const entity of this.queries.ce.entities) {
						const eid = entity.index;
						const valueC = C.data.value?.[eid] ?? 0;
						const valueE = E.data.value?.[eid] ?? 0;
						C.data.value[eid] = valueE;
						E.data.value[eid] = valueC;
					}
				}
			}

			// Register components and systems
			world
				.registerComponent(A)
				.registerComponent(B)
				.registerComponent(C)
				.registerComponent(D)
				.registerComponent(E)
				.registerSystem(SystemAB)
				.registerSystem(SystemCD)
				.registerSystem(SystemCE);

			// Create entities with different component combinations
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A).addComponent(B);
			}
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A).addComponent(B).addComponent(C);
			}
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(D);
			}
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(E);
			}

			return {
				runSimpleIteration() {
					world.update(0, 0);
				}
			};
		},

		fragmentedIteration() {
			type TNumberComponent = Component<{
				value: {
					type: Types.Float32;
					default: number;
				};
			}>;

			const world = new World({ entityCapacity: 3000, checksOn: false });

			// Shared component across all entities
			const Data = createComponent({ value: { type: Types.Float32, default: 0 } });

			// Create 26 different component types (A-Z)
			const components: TNumberComponent[] = [];
			for (let i = 0; i < 26; i++) {
				components[i] = createComponent({ value: { type: Types.Float32, default: 0 } });
			}

			// System that processes shared data and the last specialized component
			class FragmentedSystem extends createSystem({
				data: { required: [Data] },
				z: { required: [components[25] as TNumberComponent] }
			}) {
				update() {
					// Process all entities with shared data
					for (const entity of this.queries.data.entities) {
						const eid = entity.index;
						Data.data.value[eid] = (Data.data.value?.[eid] ?? 0) * 2;
					}

					// Process entities with the last specialized component
					const component = components[25];
					if (component != null) {
						for (const entity of this.queries.z.entities) {
							const eid = entity.index;
							component.data.value[eid] = (component.data.value?.[eid] ?? 0) * 2;
						}
					}
				}
			}

			// Register components and systems
			world.registerComponent(Data);
			for (const component of components) {
				world.registerComponent(component);
			}
			world.registerSystem(FragmentedSystem);

			// Create sparse entity distribution - 100 entities per specialized component type
			for (let componentIndex = 0; componentIndex < 26; componentIndex++) {
				const component = components[componentIndex];
				if (component != null) {
					for (let entityCount = 0; entityCount < 100; entityCount++) {
						world.createEntity().addComponent(component).addComponent(Data);
					}
				}
			}

			return {
				runFragmentedIteration() {
					world.update(0, 0);
				}
			};
		},

		entityCycle() {
			const world = new World({ entityCapacity: 2000, checksOn: false });

			const A = createComponent({ value: { type: Types.Float32, default: 0 } });
			const B = createComponent({ value: { type: Types.Float32, default: 0 } });

			// System that creates and destroys entities each frame
			class EntityCycleSystem extends createSystem({
				a: { required: [A] },
				b: { required: [B] }
			}) {
				update() {
					// Create new temporary entity for each persistent entity
					for (const _entity of this.queries.a.entities) {
						world.createEntity().addComponent(B);
					}

					// Destroy all temporary entities
					for (const entity of this.queries.b.entities) {
						entity.destroy();
					}
				}
			}

			// Register components and systems
			world.registerComponent(A).registerComponent(B).registerSystem(EntityCycleSystem);

			// Create initial persistent entities
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A);
			}

			return {
				runEntityCycle() {
					world.update(0, 0);
				}
			};
		},

		addRemove() {
			const world = new World({ entityCapacity: 1000, checksOn: false });

			const A = createComponent({ value: { type: Types.Float32, default: 0 } });
			const B = createComponent({ value: { type: Types.Float32, default: 0 } });

			// System that adds/removes components causing archetype migrations
			class AddRemoveSystem extends createSystem({
				a: { required: [A] },
				b: { required: [B] }
			}) {
				update() {
					// Add dynamic component to entities that only have base component
					for (const entity of this.queries.a.entities) {
						entity.addComponent(B);
					}

					// Remove dynamic component from entities that have both components
					for (const entity of this.queries.b.entities) {
						entity.removeComponent(B);
					}
				}
			}

			// Register components and systems
			world.registerComponent(A).registerComponent(B).registerSystem(AddRemoveSystem);

			// Create initial entities with only base component
			for (let i = 0; i < 1000; i++) {
				world.createEntity().addComponent(A);
			}

			return {
				runAddRemove() {
					world.update(0, 0);
				}
			};
		}
	};
}
