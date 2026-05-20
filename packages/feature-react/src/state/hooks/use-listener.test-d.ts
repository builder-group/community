import { type TFeature } from 'feature-core';
import { createState } from 'feature-state';
import { assertType, describe, it } from 'vitest';
import { useListener, type TUseListenerCallback } from './use-listener';

describe('useListener function', () => {
	it('should infer listener context values from state values', () => {
		const state = createState(0);

		useListener(state, (context) => {
			assertType<number>(context.value);
			assertType<number | undefined>(context.prevValue);
		});
	});

	it('should accept nullable state input', () => {
		const state = Math.random() > 0.5 ? createState('Jeff') : null;

		useListener(state, (context) => {
			assertType<string>(context.value);
		});
	});

	it('should accept states with installed features', () => {
		const state = createState(0).with(testFeature());

		useListener(state, (context) => {
			assertType<number>(context.value);
		});
		assertType<() => string>(state.test);
	});

	it('should accept listener cleanups', () => {
		const callback: TUseListenerCallback<number> = () => () => {};

		useListener(createState(0), callback);
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
