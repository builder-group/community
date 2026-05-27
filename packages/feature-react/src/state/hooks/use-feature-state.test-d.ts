import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { describe, expectTypeOf, it } from 'vitest';
import { useFeatureState } from './use-feature-state';

describe('useFeatureState function', () => {
	it('should infer the state value type', () => {
		expectTypeOf(useFeatureState(createState(0))).toEqualTypeOf<number>();
	});

	it('should return null for null input', () => {
		expectTypeOf(useFeatureState(null)).toEqualTypeOf<null>();
	});

	it('should return value or null for nullable state', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;

		expectTypeOf(useFeatureState(state)).toEqualTypeOf<string | null>();
	});

	it('should infer the value type for states with installed features', () => {
		const state = createState(0).with(testFeature());

		expectTypeOf(useFeatureState(state)).toEqualTypeOf<number>();
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
