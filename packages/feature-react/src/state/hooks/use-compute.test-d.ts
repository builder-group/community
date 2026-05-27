import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { describe, expectTypeOf, it } from 'vitest';
import { useCompute } from './use-compute';

describe('useCompute function', () => {
	it('should infer the computed value type from a single state', () => {
		expectTypeOf(useCompute(createState(2), (count) => count * 2)).toEqualTypeOf<number>();
	});

	it('should infer the computed value type from a tuple of states', () => {
		const count = createState(2);
		const label = createState('count');
		const value = useCompute([count, label] as const, ([countValue, labelValue]) => {
			expectTypeOf(countValue).toEqualTypeOf<number>();
			expectTypeOf(labelValue).toEqualTypeOf<string>();
			return `${labelValue}:${countValue}`;
		});

		expectTypeOf(value).toEqualTypeOf<string>();
	});

	it('should handle nullable state input', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;

		expectTypeOf(useCompute(state, (name) => name?.length ?? 0)).toEqualTypeOf<number>();
	});

	it('should handle nullable entries in a state tuple', () => {
		const count = createState(2);
		const label = Math.random() > 0.5 ? createState('count') : null;
		const value = useCompute([count, label] as const, ([countValue, labelValue]) => {
			expectTypeOf(labelValue).toEqualTypeOf<string | null>();
			return labelValue == null ? countValue : `${labelValue}:${countValue}`;
		});

		expectTypeOf(value).toEqualTypeOf<number | string>();
	});

	it('should infer the computed value type for states with installed features', () => {
		const state = createState(2).with(testFeature());

		expectTypeOf(useCompute(state, (count) => count * 2)).toEqualTypeOf<number>();
	});

	it('should accept a custom equality function', () => {
		const value = useCompute(
			createState(2),
			(count) => ({ count }),
			[],
			(next, current) => next.count === current.count
		);

		expectTypeOf(value).toEqualTypeOf<{ count: number }>();
	});

	it('should accept explicit compute dependencies with custom equality', () => {
		const multiplier = 2;
		const value = useCompute(
			createState(2),
			(count) => ({ count: count * multiplier }),
			[multiplier],
			(next, current) => next.count === current.count
		);

		expectTypeOf(value).toEqualTypeOf<{ count: number }>();
	});
});

function testFeature(): TTestFeature {
	return {
		key: 'test',
		overrides: [],
		requires: [],
		install() {
			return { test: () => 'test' };
		}
	};
}

type TTestFeature = TFeature<'test', { test(): string }>;
