import { bench, describe } from 'vitest';
import {
	createBecsyBenchmarks,
	createBitEcsBenchmarks,
	createEcsifyAppBenchmarks,
	createEcsifyRawBenchmarks,
	createElicsBenchmarks
} from './ecs';

// Based on: https://github.com/elixr-games/elics/tree/main/benchmarks
//           https://github.com/noctjs/ecs-benchmark

describe('ECS Performance Comparison', () => {
	// Create benchmark instances for each ECS
	const ecsifyAppBenchmarks = createEcsifyAppBenchmarks();
	const ecsifyRawBenchmarks = createEcsifyRawBenchmarks();
	const bitecsBenchmarks = createBitEcsBenchmarks();
	const elicsBenchmarks = createElicsBenchmarks();
	const becsyBenchmarks = createBecsyBenchmarks();

	/**
	 * Tests optimal-case iteration performance with dense, homogeneous data.
	 * 1,000 entities each with components A-E, 5 systems iterating through them.
	 * Simulates high-performance scenarios like physics where all entities share identical layouts.
	 */
	describe('Packed Iteration', async () => {
		const ecsifyApp = ecsifyAppBenchmarks.packedIteration();
		const ecsifyRaw = ecsifyRawBenchmarks.packedIteration();
		const bitecs = bitecsBenchmarks.packedIteration();
		const elics = elicsBenchmarks.packedIteration();
		const becsy = await becsyBenchmarks.packedIteration();

		bench('Ecsify (App) - Packed iteration (5 systems, 1000 entities)', () => {
			ecsifyApp.runPackedIteration();
		});

		bench('Ecsify (Raw) - Packed iteration (5 systems, 1000 entities)', () => {
			ecsifyRaw.runPackedIteration();
		});

		bench('BitECS - Packed iteration (5 systems, 1000 entities)', () => {
			bitecs.runPackedIteration();
		});

		bench('EliCS - Packed iteration (5 systems, 1000 entities)', () => {
			elics.runPackedIteration();
		});

		bench('Becsy - Packed iteration (5 systems, 1000 entities)', async () => {
			await becsy.runPackedIteration();
		});
	});

	/**
	 * Tests heterogeneous entity processing with multiple archetype combinations.
	 * 4,000 entities across different component combinations, 3 systems with overlapping queries.
	 * Simulates typical game scenarios with diverse entity types.
	 */
	describe('Simple Iteration', async () => {
		const ecsifyApp = ecsifyAppBenchmarks.simpleIteration();
		const ecsifyRaw = ecsifyRawBenchmarks.simpleIteration();
		const bitecs = bitecsBenchmarks.simpleIteration();
		const elics = elicsBenchmarks.simpleIteration();
		// const becsy = await becsyBenchmarks.simpleIteration();

		bench('Ecsify (App) - Simple iteration (3 systems, 4000 entities)', () => {
			ecsifyApp.runSimpleIteration();
		});

		bench('Ecsify (Raw) - Simple iteration (3 systems, 4000 entities)', () => {
			ecsifyRaw.runSimpleIteration();
		});

		bench('BitECS - Simple iteration (3 systems, 4000 entities)', () => {
			bitecs.runSimpleIteration();
		});

		bench('EliCS - Simple iteration (3 systems, 4000 entities)', () => {
			elics.runSimpleIteration();
		});

		// bench('Becsy - Simple iteration (3 systems, 4000 entities)', async () => {
		// 	await becsy.runSimpleIteration();
		// });
	});

	/**
	 * Tests sparse data handling with many archetype variations.
	 * 26 component types with only 100 entities per archetype + shared Data component.
	 * Simulates complex games with many specialized entity types spread thin.
	 */
	describe('Fragmented Iteration', async () => {
		const ecsifyApp = ecsifyAppBenchmarks.fragmentedIteration();
		const ecsifyRaw = ecsifyRawBenchmarks.fragmentedIteration();
		const bitecs = bitecsBenchmarks.fragmentedIteration();
		const elics = elicsBenchmarks.fragmentedIteration();
		// const becsy = await becsyBenchmarks.fragmentedIteration();

		bench('Ecsify (App) - Fragmented iteration (26 archetypes, 100 entities each)', () => {
			ecsifyApp.runFragmentedIteration();
		});

		bench('Ecsify (Raw) - Fragmented iteration (26 archetypes, 100 entities each)', () => {
			ecsifyRaw.runFragmentedIteration();
		});

		bench('BitECS - Fragmented iteration (26 archetypes, 100 entities each)', () => {
			bitecs.runFragmentedIteration();
		});

		bench('EliCS - Fragmented iteration (26 archetypes, 100 entities each)', () => {
			elics.runFragmentedIteration();
		});

		// bench('Becsy - Fragmented iteration (26 archetypes, 100 entities each)', async () => {
		// 	await becsy.runFragmentedIteration();
		// });
	});

	/**
	 * Tests dynamic entity lifecycle management with rapid creation/destruction.
	 * Creates new entities for every existing entity, then destroys the new ones.
	 * Simulates high-frequency spawning like bullets, particles, or temporary objects.
	 */
	describe('Entity Lifecycle', async () => {
		const ecsifyApp = ecsifyAppBenchmarks.entityCycle();
		const ecsifyRaw = ecsifyRawBenchmarks.entityCycle();
		const bitecs = bitecsBenchmarks.entityCycle();
		const elics = elicsBenchmarks.entityCycle();
		// const becsy = await becsyBenchmarks.entityCycle();

		bench('Ecsify (App) - Entity creation/destruction cycle', () => {
			ecsifyApp.runEntityCycle();
		});

		bench('Ecsify (Raw) - Entity creation/destruction cycle', () => {
			ecsifyRaw.runEntityCycle();
		});

		bench('BitECS - Entity creation/destruction cycle', () => {
			bitecs.runEntityCycle();
		});

		bench('EliCS - Entity creation/destruction cycle', () => {
			elics.runEntityCycle();
		});

		// bench('Becsy - Entity creation/destruction cycle', async () => {
		// 	await becsy.runEntityCycle();
		// });
	});

	/**
	 * Tests component mutation performance through rapid archetype transitions.
	 * Continuously adds/removes components, causing entities to migrate between archetypes.
	 * Simulates dynamic state changes like status effects or equipment modifications.
	 */
	describe('Component Mutation', async () => {
		const ecsifyApp = ecsifyAppBenchmarks.addRemove();
		const ecsifyRaw = ecsifyRawBenchmarks.addRemove();
		const bitecs = bitecsBenchmarks.addRemove();
		const elics = elicsBenchmarks.addRemove();
		// const becsy = await becsyBenchmarks.addRemove();

		bench('Ecsify (App) - Component add/remove transitions', () => {
			ecsifyApp.runAddRemove();
		});

		bench('Ecsify (Raw) - Component add/remove transitions', () => {
			ecsifyRaw.runAddRemove();
		});

		bench('BitECS - Component add/remove transitions', () => {
			bitecs.runAddRemove();
		});

		bench('EliCS - Component add/remove transitions', () => {
			elics.runAddRemove();
		});

		// bench('Becsy - Component add/remove transitions', async () => {
		// 	await becsy.runAddRemove();
		// });
	});
});
