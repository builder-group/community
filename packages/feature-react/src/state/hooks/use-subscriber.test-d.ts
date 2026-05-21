import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { assertType, describe, it } from 'vitest';
import { useSubscriber, type TUseSubscriberCallback } from './use-subscriber';

describe('useSubscriber function', () => {
	it('should infer subscriber context values from state values', () => {
		const state = createState(0);

		useSubscriber(state, (context) => {
			assertType<number>(context.value);
			assertType<number | undefined>(context.prevValue);
		});
	});

	it('should accept nullable state input', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;

		useSubscriber(state, (context) => {
			assertType<string>(context.value);
		});
	});

	it('should accept states with installed features', () => {
		const state = createState(0).with(testFeature());

		useSubscriber(state, (context) => {
			assertType<number>(context.value);
		});
		assertType<() => string>(state.test);
	});

	it('should accept subscriber cleanups', () => {
		const callback: TUseSubscriberCallback<number> = () => () => {};

		useSubscriber(createState(0), callback);
	});

	it('should accept async subscribers', () => {
		useSubscriber(createState(0), async ({ value }) => {
			assertType<number>(value);
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
			return {
				test() {
					return 'test';
				}
			};
		}
	};
}

type TTestFeature = TFeature<'test', { test(): string }>;
