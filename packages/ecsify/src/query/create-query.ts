import { categorizeEvaluationStrategy } from './categorize-evaluation-strategy';
import { TQueryRegistry } from './create-query-registry';
import { TQueryData } from './types';

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
		generations: []
	};
}

export interface TCreateQueryOptions {
	evaluationStrategy?: TQueryData['evaluationStrategy'];
	hash?: TQueryData['hash'];
}

export interface TQuery extends TQueryData {}

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
