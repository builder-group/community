import { TEntityIndex } from './create-entity-index';

/**
 * Returns a human-readable debug representation of the entity index state.
 * Shows alive entities, dead entities, sparse mappings, and configuration.
 * @returns Multi-line string with formatted state information
 */
export function debugEntityIndex(entityIndex: TEntityIndex) {
	const aliveEntities = entityIndex._dense
		.slice(0, entityIndex._aliveCount)
		.map((eid) => entityIndex.formatEid(eid));
	const deadEntities = entityIndex._dense
		.slice(entityIndex._aliveCount)
		.map((eid) => entityIndex.formatEid(eid));

	const sparseEntries = [];
	for (let baseEid = 1; baseEid < entityIndex._nextBaseEid; baseEid++) {
		const denseIndex = entityIndex._sparse[baseEid];
		if (denseIndex != null) {
			sparseEntries.push(`${baseEid}→${denseIndex}`);
		}
	}

	return [
		`EntityIndex State:`,
		`  Alive (${entityIndex._aliveCount}): [${aliveEntities.join(', ')}]`,
		`  Dead (${entityIndex._dense.length - entityIndex._aliveCount}): [${deadEntities.join(', ')}]`,
		`  Sparse: {${sparseEntries.join(', ')}}`,
		`  NextBaseEid: ${entityIndex._nextBaseEid}`,
		`  Versioning: ${entityIndex._config.versioning ? 'enabled' : 'disabled'}`
	].join('\n');
}
