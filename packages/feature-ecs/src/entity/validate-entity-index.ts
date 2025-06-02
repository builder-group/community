import { TEntityIndex } from './create-entity-index';

/**
 * Validates the internal data structure integrity.
 * Useful for debugging and testing.
 * @returns True if the data structure is valid, false otherwise
 */
export function validateEntityIndex(entityIndex: TEntityIndex) {
	// Check that all alive entities have correct sparse mappings (Dense -> Sparse)
	for (let i = 0; i < entityIndex._aliveCount; i++) {
		const eid = entityIndex._dense[i] as number;
		const baseEid = entityIndex.getBaseEid(eid);
		if (entityIndex._sparse[baseEid] !== i) {
			return false;
		}
	}

	// Check that all entities in sparse array point to valid positions (Sparse -> Dense)
	for (let baseEid = 1; baseEid < entityIndex._nextBaseEid; baseEid++) {
		const denseIndex = entityIndex._sparse[baseEid];
		if (denseIndex != null) {
			// Check bounds
			if (denseIndex >= entityIndex._dense.length || denseIndex < 0) {
				return false;
			}

			// Check that the entity at this position has the correct base ID
			const storedEid = entityIndex._dense[denseIndex] as number;
			if (entityIndex.getBaseEid(storedEid) !== baseEid) {
				return false;
			}
		}
	}

	return true;
}
