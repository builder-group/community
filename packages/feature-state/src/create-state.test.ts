import { describe, expect, it, vi } from 'vitest';

import { createState } from './create-state';

describe('createState function', () => {
	it('should initialize with the provided value', () => {
		// Prepare
		const initialState = 10;

		// Act
		const state = createState(initialState);

		// Assert
		expect(state.get()).toBe(initialState);
	});

	it('should handle different types of values correctly', () => {
		// Prepare - different types of values
		const numberState = createState(10);
		const stringState = createState('hello');
		const arrayState = createState([1, 2, 3]);
		const objectState = createState({ key: 'value' });

		// Act and Assert for number
		numberState.set(20);
		expect(numberState.get()).toBe(20);

		// Act and Assert for string
		stringState.set('world');
		expect(stringState.get()).toBe('world');

		// Act and Assert for array
		const newArray = [4, 5, 6];
		arrayState.set(newArray);
		expect(arrayState.get()).toEqual(newArray);

		// Act and Assert for object
		const newObject = { key: 'newValue' };
		objectState.set(newObject);
		expect(objectState.get()).toEqual(newObject);
	});

	it('should update the value with set', () => {
		// Prepare
		const state = createState(10);

		// Act
		state.set(20);

		// Assert
		expect(state.get()).toBe(20);
	});

	it('should not update the value if set with the same value', () => {
		// Prepare
		const initialState = 10;
		const state = createState(initialState);

		// Act
		state.set(initialState);

		// Assert
		expect(state.get()).toBe(initialState);
	});

	it('should call listeners when the value is updated', async () => {
		// Prepare
		const state = createState(10);
		const listener = vi.fn();
		state.listen(listener);

		// Act
		state.set(20);
		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		// Assert
		expect(listener).toHaveBeenCalledWith(20);
	});

	it('should not call listeners when set with the same value', () => {
		// Prepare
		const state = createState(10);
		const listener = vi.fn();
		state.listen(listener);

		// Act
		state.set(10);

		// Assert
		expect(listener).not.toHaveBeenCalled();
	});

	it('should call listeners with the correct order based on level', async () => {
		// Prepare
		const state = createState(10);
		const firstListener = vi.fn();
		const secondListener = vi.fn();
		state.listen(firstListener, 0);
		state.listen(secondListener, 1);

		// Act
		state.set(20);
		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		// Assert
		expect(firstListener).toHaveBeenCalled();
		expect(secondListener).toHaveBeenCalled();
		if (firstListener.mock.calls.length > 0 && secondListener.mock.calls.length > 0) {
			expect(firstListener.mock.invocationCallOrder[0] as unknown as number).toBeLessThan(
				secondListener.mock.invocationCallOrder[0] as unknown as number
			);
		}
	});

	it('should remove listener when the returned unbind function is called', () => {
		// Prepare
		const state = createState(10);
		const listener = vi.fn();
		const unbind = state.listen(listener);

		// Act
		unbind();
		state.set(20);

		// Assert
		expect(listener).not.toHaveBeenCalled();
	});

	it('should call listeners immediately on subscribe', () => {
		// Prepare
		const initialState = 10;
		const state = createState(initialState);
		const listener = vi.fn();

		// Act
		state.subscribe(listener);

		// Assert
		expect(listener).toHaveBeenCalledWith(initialState);
	});
});
