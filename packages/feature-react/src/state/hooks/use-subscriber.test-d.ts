import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { describe, expectTypeOf, it } from 'vitest';
import { useSubscriber, type TUseSubscriberCallback } from './use-subscriber';

describe('useSubscriber function', () => {
	it('should infer value and prevValue types from the state', () => {
		useSubscriber(createState(0), (context) => {
			expectTypeOf(context.value).toEqualTypeOf<number>();
			expectTypeOf(context.prevValue).toEqualTypeOf<number | undefined>();
		});
	});

	it('should accept nullable state input', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;

		useSubscriber(state, (context) => {
			expectTypeOf(context.value).toEqualTypeOf<string>();
		});
	});

	it('should accept states with installed features', () => {
		const state = createState(0).with(testFeature());

		useSubscriber(state, (context) => {
			expectTypeOf(context.value).toEqualTypeOf<number>();
		});
	});

	it('should accept a callback that returns a cleanup function', () => {
		const callback: TUseSubscriberCallback<number> = () => () => {};

		useSubscriber(createState(0), callback);
	});

	it('should accept an async callback', () => {
		useSubscriber(createState(0), async ({ value }) => {
			expectTypeOf(value).toEqualTypeOf<number>();
			await Promise.resolve();
		});
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
