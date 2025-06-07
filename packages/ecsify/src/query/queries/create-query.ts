import { TEntityId } from '../../entity';
import { categorizeEvaluationStrategy } from '../categorize-evaluation-strategy';
import { TQueryRegistry } from '../create-query-registry';
import { TQueryFilterParentType } from '../query-filters';
import { TQueryData } from '../types';

export function createQuery(
	queryRegistry: TQueryRegistry,
	filter: TQueryData['filter'],
	options: TCreateQueryOptions = {}
): TQuery {
	const {
		evaluationStrategy = categorizeEvaluationStrategy(filter),
		hash = filter.getHash(queryRegistry),
		register = true
	} = options;

	const query: TQuery = {
		filter,
		evaluationStrategy,
		hash,
		cachedResult: [],
		isDirty: true,
		generations: [],

		register(queryRegistry, parentType) {
			this.filter.register?.(queryRegistry, this, parentType);
		},
		query(queryRegistry) {
			// Find matching entities
			// Dense iteration with O(1) bitmask checks - simple and cache-friendly
			// If this becomes slow: consider archetype system (group entities by component signature)?
			// https://www.youtube.com/watch?v=71RSWVyOMEY
			const matchingEntities: TEntityId[] = [];
			for (let i = 0; i < queryRegistry._entityIndex._aliveCount; i++) {
				const eid = queryRegistry._entityIndex._dense[i];
				if (eid != null && this.filter.evaluate(queryRegistry, eid, this)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},
		evaluate(queryRegistry, eid) {
			return this.filter.evaluate(queryRegistry, eid, this);
		},
		getHash(queryRegistry) {
			return this.filter.getHash(queryRegistry);
		},
		markDirty() {
			this.isDirty = true;
		}
	};

	// Register query if requested
	if (register) {
		queryRegistry.registerQuery(query);
	}

	return query;
}

export interface TCreateQueryOptions {
	evaluationStrategy?: TQueryData['evaluationStrategy'];
	hash?: TQueryData['hash'];
	register?: boolean;
}

export interface TQuery extends TQueryData {
	register(queryRegistry: TQueryRegistry, parentType?: TQueryFilterParentType): void;
	query(queryRegistry: TQueryRegistry): TEntityId[];
	evaluate(queryRegistry: TQueryRegistry, eid: TEntityId): boolean;
	getHash(queryRegistry: TQueryRegistry): string;
	markDirty(): void;
}

export function isQuery(value: unknown): value is TQuery {
	return (
		typeof value === 'object' &&
		value != null &&
		'filter' in value &&
		typeof value.filter === 'object' &&
		'hash' in value &&
		typeof value.hash === 'string'
	);
}
