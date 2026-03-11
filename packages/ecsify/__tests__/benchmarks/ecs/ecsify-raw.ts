import {
	And,
	createComponentRegistry,
	createEntityIndex,
	createQueryRegistry,
	With
} from '../../../src';

export function createEcsifyRawBenchmarks() {
	return {
		packedIteration() {
			const entityIndex = createEntityIndex();
			const componentRegistry = createComponentRegistry();
			const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

			// Create 5 simple components
			const A = { value: [] as number[] };
			const B = { value: [] as number[] };
			const C = { value: [] as number[] };
			const D = { value: [] as number[] };
			const E = { value: [] as number[] };

			// Create 1,000 entities with all 5 components (packed archetype)
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 1;
				componentRegistry.add(eid, B);
				B.value[eid] = 1;
				componentRegistry.add(eid, C);
				C.value[eid] = 1;
				componentRegistry.add(eid, D);
				D.value[eid] = 1;
				componentRegistry.add(eid, E);
				E.value[eid] = 1;
			}

			return {
				runPackedIteration() {
					// Process each component type - doubles all values
					for (const eid of queryRegistry.queryEntities(With(A))) {
						A.value[eid] = (A.value[eid] ?? 0) * 2;
					}
					for (const eid of queryRegistry.queryEntities(With(B))) {
						B.value[eid] = (B.value[eid] ?? 0) * 2;
					}
					for (const eid of queryRegistry.queryEntities(With(C))) {
						C.value[eid] = (C.value[eid] ?? 0) * 2;
					}
					for (const eid of queryRegistry.queryEntities(With(D))) {
						D.value[eid] = (D.value[eid] ?? 0) * 2;
					}
					for (const eid of queryRegistry.queryEntities(With(E))) {
						E.value[eid] = (E.value[eid] ?? 0) * 2;
					}
				}
			};
		},

		simpleIteration() {
			const entityIndex = createEntityIndex();
			const componentRegistry = createComponentRegistry();
			const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

			// Create 5 components for different combinations
			const A = { value: [] as number[] };
			const B = { value: [] as number[] };
			const C = { value: [] as number[] };
			const D = { value: [] as number[] };
			const E = { value: [] as number[] };

			// Create entities with different component combinations
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
				componentRegistry.add(eid, B);
				B.value[eid] = 0;
			}
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
				componentRegistry.add(eid, B);
				B.value[eid] = 0;
				componentRegistry.add(eid, C);
				C.value[eid] = 0;
			}
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
				componentRegistry.add(eid, B);
				B.value[eid] = 0;
				componentRegistry.add(eid, C);
				C.value[eid] = 0;
				componentRegistry.add(eid, D);
				D.value[eid] = 0;
			}
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
				componentRegistry.add(eid, B);
				B.value[eid] = 0;
				componentRegistry.add(eid, C);
				C.value[eid] = 0;
				componentRegistry.add(eid, E);
				E.value[eid] = 0;
			}

			return {
				runSimpleIteration() {
					// System 1: Swaps values between A and B components
					for (const eid of queryRegistry.queryEntities(And(With(A), With(B)))) {
						const valueA = A.value[eid] ?? 0;
						const valueB = B.value[eid] ?? 0;
						A.value[eid] = valueB;
						B.value[eid] = valueA;
					}

					// System 2: Swaps values between C and D components
					for (const eid of queryRegistry.queryEntities(And(With(C), With(D)))) {
						const valueC = C.value[eid] ?? 0;
						const valueD = D.value[eid] ?? 0;
						C.value[eid] = valueD;
						D.value[eid] = valueC;
					}

					// System 3: Swaps values between C and E components
					for (const eid of queryRegistry.queryEntities(And(With(C), With(E)))) {
						const valueC = C.value[eid] ?? 0;
						const valueE = E.value[eid] ?? 0;
						C.value[eid] = valueE;
						E.value[eid] = valueC;
					}
				}
			};
		},

		fragmentedIteration() {
			const entityIndex = createEntityIndex();
			const componentRegistry = createComponentRegistry();
			const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

			// Shared component across all entities
			const Data = { value: [] as number[] };

			// Create 26 different component types (A-Z)
			const components: { value: number[] }[] = [];
			for (let i = 0; i < 26; i++) {
				components[i] = { value: [] as number[] };
			}

			// Create sparse entity distribution - 100 entities per specialized component type
			for (let componentIndex = 0; componentIndex < 26; componentIndex++) {
				const component = components[componentIndex];
				if (component != null) {
					for (let entityCount = 0; entityCount < 100; entityCount++) {
						const eid = entityIndex.createEntity();
						componentRegistry.add(eid, component);
						component.value[eid] = 0;
						componentRegistry.add(eid, Data);
						Data.value[eid] = 0;
					}
				}
			}

			return {
				runFragmentedIteration() {
					// Process all entities with shared data
					for (const eid of queryRegistry.queryEntities(With(Data))) {
						Data.value[eid] = (Data.value[eid] ?? 0) * 2;
					}

					// Process entities with the last specialized component
					const component = components[25];
					if (component != null) {
						for (const eid of queryRegistry.queryEntities(With(components[25]))) {
							component.value[eid] = (component.value[eid] ?? 0) * 2;
						}
					}
				}
			};
		},

		entityCycle() {
			const entityIndex = createEntityIndex();
			const componentRegistry = createComponentRegistry();
			const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

			const A = { value: [] as number[] };
			const B = { value: [] as number[] };

			// Create initial persistent entities
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
			}

			return {
				runEntityCycle() {
					// Create new temporary entity for each persistent entity
					for (const _eid of queryRegistry.queryEntities(With(A))) {
						const newEid = entityIndex.createEntity();
						componentRegistry.add(newEid, B);
						B.value[newEid] = 0;
					}

					// Destroy all temporary entities
					for (const eid of queryRegistry.queryEntities(With(B))) {
						componentRegistry.removeAll(eid);
						entityIndex.removeEntity(eid);
					}
				}
			};
		},

		addRemove() {
			const entityIndex = createEntityIndex();
			const componentRegistry = createComponentRegistry();
			const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

			const A = { value: [] as number[] };
			const B = { value: [] as number[] };

			// Create initial entities with only base component
			for (let i = 0; i < 1000; i++) {
				const eid = entityIndex.createEntity();
				componentRegistry.add(eid, A);
				A.value[eid] = 0;
			}

			return {
				runAddRemove() {
					// Add dynamic component to entities that only have base component
					for (const eid of queryRegistry.queryEntities(With(A))) {
						componentRegistry.add(eid, B);
						B.value[eid] = 0;
					}

					// Remove dynamic component from entities that have both components
					for (const eid of queryRegistry.queryEntities(With(B))) {
						componentRegistry.remove(eid, B);
					}
				}
			};
		}
	};
}
