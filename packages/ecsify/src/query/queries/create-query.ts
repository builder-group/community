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
		hash = filter.getHash(queryRegistry)
	} = options;

	return {
		filter,
		evaluationStrategy,
		hash,
		cachedResult: [],
		isDirty: true,
		generations: [],
		evaluate(queryRegistry, eid) {
			return this.filter.evaluate(queryRegistry, eid, this);
		},
		register(queryRegistry, parentType) {
			this.filter.register?.(queryRegistry, this, parentType);
		},
		getHash(queryRegistry) {
			return this.filter.getHash(queryRegistry);
		},
		markDirty() {
			this.isDirty = true;
		}
	};
}

export interface TCreateQueryOptions {
	evaluationStrategy?: TQueryData['evaluationStrategy'];
	hash?: TQueryData['hash'];
}

export interface TQuery extends TQueryData {
	evaluate(queryRegistry: TQueryRegistry, eid: TEntityId): boolean;
	register(queryRegistry: TQueryRegistry, parentType?: TQueryFilterParentType): void;
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
