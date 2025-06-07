import { TComponentRegistry } from '../../component';
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
		key = filter.toString(queryRegistry._componentRegistry),
		register = true
	} = options;

	const query: TQuery = {
		_componentRegistry: queryRegistry._componentRegistry,
		filter,
		evaluationStrategy,
		key,
		cachedResult: [],
		isDirty: true,
		generations: [],

		register(parentType) {
			this.filter.register?.(this, parentType);
		},
		execute() {
			// Find matching entities
			// Dense iteration with O(1) bitmask checks - simple and cache-friendly
			// If this becomes slow: consider archetype system (group entities by component signature)?
			// https://www.youtube.com/watch?v=71RSWVyOMEY
			const matchingEntities: TEntityId[] = [];
			for (let i = 0; i < queryRegistry._entityIndex._aliveCount; i++) {
				const eid = queryRegistry._entityIndex._dense[i];
				if (eid != null && this.filter.evaluate(this, eid)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},
		evaluate(eid) {
			return this.filter.evaluate(this, eid);
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
	key?: TQueryData['key'];
	register?: boolean;
}

export interface TQuery extends TQueryData {
	_componentRegistry: TComponentRegistry;
	register(parentType?: TQueryFilterParentType): void;
	execute(): TEntityId[];
	evaluate(eid: TEntityId): boolean;
	markDirty(): void;
}

export function isQuery(value: unknown): value is TQuery {
	return (
		typeof value === 'object' &&
		value != null &&
		'filter' in value &&
		typeof value.filter === 'object' &&
		'key' in value &&
		typeof value.key === 'string'
	);
}
