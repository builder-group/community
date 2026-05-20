import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { assertType, describe, expectTypeOf, it } from 'vitest';
import { useCompute } from './use-compute';

describe('useCompute function', () => {
	it('should infer computed values from one state', () => {
		const value = useCompute(createState(2), (count) => count * 2);

		assertType<number>(value);
	});

	it('should infer nullable values from nullable state input', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;
		const value = useCompute(state, (name) => name?.length ?? 0);

		assertType<number>(value);
	});

	it('should infer computed values from states with installed features', () => {
		const state = createState(2).with(testFeature());
		const value = useCompute(state, (count) => count * 2);

		assertType<number>(value);
		assertType<() => string>(state.test);
	});

	it('should infer computed values from a tuple of states', () => {
		const count = createState(2);
		const label = createState('count');
		const value = useCompute([count, label] as const, ([countValue, labelValue]) => {
			assertType<number>(countValue);
			assertType<string>(labelValue);

			return `${labelValue}:${countValue}`;
		});

		assertType<string>(value);
	});

	it('should infer null for nullable tuple entries', () => {
		const count = createState(2);
		const label = Math.random() > 0.5 ? createState('count') : null;
		const value = useCompute([count, label] as const, ([countValue, labelValue]) => {
			assertType<number>(countValue);
			expectTypeOf(labelValue).toEqualTypeOf<string | null>();

			return labelValue == null ? countValue : `${labelValue}:${countValue}`;
		});

		expectTypeOf(value).toEqualTypeOf<number | string>();
	});

	it('should accept custom equality after deps', () => {
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
			return {
				test() {
					return 'test';
				}
			};
		}
	};
}

type TTestFeature = TFeature<'test', { test(): string }>;
