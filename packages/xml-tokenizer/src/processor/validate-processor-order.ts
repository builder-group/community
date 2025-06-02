import { TProcessorAny } from './types';

export function validateProcessorOrder(processors: TProcessorAny[]) {
	const seen = new Set<TProcessorAny>();

	for (let i = 0; i < processors.length; i++) {
		const processor = processors[i] as TProcessorAny;

		if (processor.deps == null) {
			seen.add(processor);
			continue;
		}

		const missingDeps: TProcessorAny[] = [];
		for (const dep of processor.deps) {
			if (!seen.has(dep)) {
				missingDeps.push(dep);
			}
		}

		if (missingDeps.length > 0) {
			const processorName = processor.name || `Processor[${i}]`;
			const missingNames = missingDeps
				.map((dep, idx) => {
					const depIndex = processors.indexOf(dep);
					return dep.name || `Processor[${depIndex >= 0 ? depIndex : idx}]`;
				})
				.join(', ');

			const currentOrder = processors
				.filter((p) => p != null)
				.map((p, idx) => p.name || `Processor[${idx}]`)
				.join(' → ');

			throw new Error(
				`Processor dependency order invalid:\n` +
					`  ${processorName} depends on: ${missingNames}\n` +
					`  But those dependencies haven't been processed yet.\n` +
					`  Current order: ${currentOrder}\n` +
					`  Solution: Move dependencies before ${processorName} in the processors array.`
			);
		}

		seen.add(processor);
	}
}
