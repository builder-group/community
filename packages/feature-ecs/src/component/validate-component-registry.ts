import { TComponentRegistry } from './create-component-registry';

/**
 * Validates the internal data structure integrity.
 * @returns True if the data structure is valid, false otherwise
 */
export function validateComponentRegistry(registry: TComponentRegistry) {
	// Validate generation structure
	if (registry._entityMasks.length === 0) {
		return false;
	}

	// Validate change tracking arrays match entity masks
	if (
		registry._addedMasks.length !== registry._entityMasks.length ||
		registry._changedMasks.length !== registry._entityMasks.length ||
		registry._removedMasks.length !== registry._entityMasks.length
	) {
		return false;
	}

	// Validate bitflag consistency within generations
	const generationCounts = new Array(registry._entityMasks.length).fill(0);

	for (const componentData of registry._componentMap.values()) {
		const { generationId, bitflag } = componentData;

		// Check generation ID is valid
		if (generationId >= registry._entityMasks.length || generationId < 0) return false;

		// Check bitflag is a power of 2 and within valid range
		if (bitflag <= 0 || bitflag >= 2 ** 31 || (bitflag & (bitflag - 1)) !== 0) return false;

		generationCounts[generationId]++;
	}

	// Validate current bitflag matches expected value for current generation
	const currentGeneration = registry._entityMasks.length - 1;
	const componentsInCurrentGen = generationCounts[currentGeneration] || 0;
	const expectedBitflag = componentsInCurrentGen === 0 ? 1 : 2 ** (componentsInCurrentGen % 31);

	if (registry._currentBitflag !== expectedBitflag) {
		return false;
	}

	return true;
}
