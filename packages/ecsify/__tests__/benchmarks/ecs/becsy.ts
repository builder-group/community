import { field, System, World } from '@lastolivegames/becsy/perf.js';

export function createBecsyBenchmarks() {
	return {
		async packedIteration() {
			// Component definitions with decorators
			class A {
				@field.float32 declare value: number;
			}
			class B {
				@field.float32 declare value: number;
			}
			class C {
				@field.float32 declare value: number;
			}
			class D {
				@field.float32 declare value: number;
			}
			class E {
				@field.float32 declare value: number;
			}

			// System that processes all component types
			class PackedIterationSystem extends System {
				a = this.query((q) => q.current.with(A).write);
				b = this.query((q) => q.current.with(B).write);
				c = this.query((q) => q.current.with(C).write);
				d = this.query((q) => q.current.with(D).write);
				e = this.query((q) => q.current.with(E).write);

				execute() {
					// Process each component type - doubles all values
					for (const entity of this.a.current) {
						entity.write(A).value *= 2;
					}
					for (const entity of this.b.current) {
						entity.write(B).value *= 2;
					}
					for (const entity of this.c.current) {
						entity.write(C).value *= 2;
					}
					for (const entity of this.d.current) {
						entity.write(D).value *= 2;
					}
					for (const entity of this.e.current) {
						entity.write(E).value *= 2;
					}
				}
			}

			// Setup: Create world with components and system clearly defined in defs
			const world = await World.create({
				defs: [A, B, C, D, E, PackedIterationSystem]
			});

			// Create 1,000 entities with all 5 components (packed archetype)
			world.build((builder) => {
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(
						A,
						{ value: 1 },
						B,
						{ value: 1 },
						C,
						{ value: 1 },
						D,
						{ value: 1 },
						E,
						{ value: 1 }
					);
				}
			});

			return {
				async runPackedIteration() {
					await world.execute();
				}
			};
		},

		async simpleIteration() {
			// Component definitions with decorators
			class A {
				@field.float32 declare value: number;
			}
			class B {
				@field.float32 declare value: number;
			}
			class C {
				@field.float32 declare value: number;
			}
			class D {
				@field.float32 declare value: number;
			}
			class E {
				@field.float32 declare value: number;
			}

			// System 1: Swaps values between A and B components
			class SystemAB extends System {
				entities = this.query((q) => q.current.with(A, B).write);

				execute() {
					for (const entity of this.entities.current) {
						const valueA = entity.write(A).value;
						const valueB = entity.write(B).value;
						entity.write(A).value = valueB;
						entity.write(B).value = valueA;
					}
				}
			}

			// System 2: Swaps values between C and D components
			class SystemCD extends System {
				entities = this.query((q) => q.current.with(C, D).write);

				execute() {
					for (const entity of this.entities.current) {
						const valueC = entity.write(C).value;
						const valueD = entity.write(D).value;
						entity.write(C).value = valueD;
						entity.write(D).value = valueC;
					}
				}
			}

			// System 3: Swaps values between C and E components
			class SystemCE extends System {
				entities = this.query((q) => q.current.with(C, E).write);

				execute() {
					for (const entity of this.entities.current) {
						const valueC = entity.write(C).value;
						const valueE = entity.write(E).value;
						entity.write(C).value = valueE;
						entity.write(E).value = valueC;
					}
				}
			}

			// Setup: Create world with all components and systems clearly defined in defs
			const world = await World.create({
				defs: [A, B, C, D, E, SystemAB, SystemCD, SystemCE]
			});

			// Create entities with different component combinations
			world.build((builder) => {
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: 0 }, B, { value: 0 });
				}
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: 0 }, B, { value: 0 }, C, {
						value: 0
					});
				}
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: 0 }, B, { value: 0 }, C, { value: 0 }, D, { value: 0 });
				}
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: 0 }, B, { value: 0 }, C, { value: 0 }, E, { value: 0 });
				}
			});

			return {
				async runSimpleIteration() {
					await world.execute();
				}
			};
		},

		async fragmentedIteration() {
			// Shared component across all entities
			class Data {
				@field.float32 declare value: number;
			}

			// Create 26 different component types (A-Z)
			const components: any[] = [];
			for (let i = 0; i < 26; i++) {
				class SpecializedComponent {
					@field.float32 declare value: number;
				}
				// Give each component a unique name for Becsy
				Object.defineProperty(SpecializedComponent, 'name', {
					value: `Component${String.fromCharCode(65 + i)}`
				});
				components[i] = SpecializedComponent;
			}

			class FragmentedIterationSystem extends System {
				data = this.query((q) => q.current.with(Data).write);
				z = this.query((q) => q.current.with(components[25] as any).write);

				execute() {
					// Process all entities with shared data
					for (const entity of this.data.current) {
						entity.write(Data).value *= 2;
					}

					// Process entities with the last specialized component
					for (const entity of this.z.current) {
						(entity.write(components[25]) as any).value *= 2;
					}
				}
			}

			// Setup: Create world with shared data, all specialized components, and system
			const world = await World.create({
				defs: [Data, ...components, FragmentedIterationSystem]
			});

			// Create sparse entity distribution - 100 entities per specialized component type
			world.build((builder) => {
				for (let componentIndex = 0; componentIndex < 26; componentIndex++) {
					for (let entityCount = 0; entityCount < 100; entityCount++) {
						builder.createEntity(components[componentIndex], { value: componentIndex }, Data, {
							value: entityCount
						});
					}
				}
			});

			return {
				async runFragmentedIteration() {
					await world.execute();
				}
			};
		},

		async entityCycle() {
			class A {
				@field.float32 declare value: number;
			}
			class B {
				@field.float32 declare value: number;
			}

			class EntityCycleSystem extends System {
				a = this.query((q) => q.current.with(A));
				b = this.query((q) => q.current.with(B));

				execute() {
					// Create new temporary entity for each persistent entity
					for (const _entity of this.a.current) {
						this.createEntity(B, { value: 0 });
					}

					// Destroy all temporary entities
					for (const entity of [...this.b.current]) {
						entity.delete();
					}
				}
			}

			// Setup
			const world = await World.create({
				defs: [A, B, EntityCycleSystem],
				maxLimboComponents: 10000
			});

			// Create initial persistent entities
			world.build((builder) => {
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: i });
				}
			});

			return {
				async runEntityCycle() {
					await world.execute();
				}
			};
		},

		async addRemove() {
			class A {
				@field.float32 declare value: number;
			}
			class B {
				@field.uint8 declare active: number;
			}

			class AddRemoveSystem extends System {
				a = this.query((q) => q.current.with(A).without(B));
				b = this.query((q) => q.current.with(B));

				execute() {
					// Add dynamic component to entities that only have base component
					for (const entity of this.a.current) {
						entity.add(B, { active: 1 });
					}

					// Remove dynamic component from entities that have both components
					for (const entity of this.b.current) {
						entity.remove(B);
					}
				}
			}

			// Setup
			const world = await World.create({
				defs: [A, B, AddRemoveSystem],
				maxLimboComponents: 10000
			});

			// Create initial entities with only base component
			world.build((builder) => {
				for (let i = 0; i < 1000; i++) {
					builder.createEntity(A, { value: i });
				}
			});

			return {
				async runAddRemove() {
					await world.execute();
				}
			};
		}
	};
}
