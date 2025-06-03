import { TQueryFilter } from './types';

/**
 * Pre-categorizes a query's evaluation strategy.
 *
 * Strategies:
 * - 'bitmask': All filters can use bitwise operations (With/Without/Added/Changed/Removed)
 * - 'individual': Contains complex nested filters requiring individual evaluation
 */
export function categorizeEvaluationStrategy(filter: TQueryFilter): 'bitmask' | 'individual' {
	switch (filter.type) {
		case 'With':
		case 'Without':
		case 'Added':
		case 'Changed':
		case 'Removed':
			// Simple component and change detection filters are bitmask-compatible
			return 'bitmask';

		case 'And':
			// And is bitmask-compatible if ALL children are bitmask-compatible
			// Nested And filters work because And(And(A,B),C) === And(A,B,C) logically
			return filter.filters.every((f) => categorizeEvaluationStrategy(f) === 'bitmask')
				? 'bitmask'
				: 'individual';

		case 'Or':
			// Or is bitmask-compatible ONLY for simple component/change filters
			//
			// Why Or doesn't support nested And/Or:
			// - Or(And(A,B), C) cannot be flattened to simple bitmasks
			// - Would require complex mask structures: { andGroups: [..], .. }
			// - The performance benefit diminishes while code complexity explodes
			return filter.filters.every(
				(f) =>
					f.type === 'With' ||
					f.type === 'Without' ||
					f.type === 'Added' ||
					f.type === 'Changed' ||
					f.type === 'Removed'
			)
				? 'bitmask'
				: 'individual';

		default:
			// Unknown filter types default to individual evaluation
			return 'individual';
	}
}
