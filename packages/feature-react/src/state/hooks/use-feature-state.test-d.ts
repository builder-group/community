import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { assertType, describe, expectTypeOf, it } from 'vitest';
import { useFeatureState } from './use-feature-state';

describe('useFeatureState function', () => {
	it('should infer the state value', () => {
		const value = useFeatureState(createState(0));

		assertType<number>(value);
	});

	it('should infer null from nullable state input', () => {
		const value = useFeatureState(null);

		expectTypeOf(value).toEqualTypeOf<null>();
	});

	it('should infer nullable values from nullable state unions', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;
		const value = useFeatureState(state);

		expectTypeOf(value).toEqualTypeOf<string | null>();
	});

	it('should infer values from states with installed features', () => {
		const state = createState(0).with(testFeature());
		const value = useFeatureState(state);

		assertType<number>(value);
		expectTypeOf(state.test).toEqualTypeOf<() => string>();
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
