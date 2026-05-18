import { beforeEach, describe, expect, it } from 'vitest';
import { createState } from '../create-state';
import {
	missingStorageValue,
	storageFeature,
	type TStorageInterface
} from './storage';

class MockStorage<GValue> implements TStorageInterface<GValue> {
	private store: Record<string, GValue> = {};

	public save(key: string, value: GValue): boolean {
		this.store[key] = value;
		return true;
	}

	public load(key: string): GValue | typeof missingStorageValue {
		return this.store[key] ?? missingStorageValue;
	}

	public delete(key: string): boolean {
		const hasValue = key in this.store;
		const nextStore = { ...this.store };
		Reflect.deleteProperty(nextStore, key);
		this.store = nextStore;
		return hasValue;
	}
}

describe('storageFeature function', () => {
	let mockStorage: MockStorage<number>;

	beforeEach(() => {
		mockStorage = new MockStorage();
	});

	it('should initialize state with persisted value if available', async () => {
		// Prepare
		const key = 'testKey';
		const persistedValue = 42;
		mockStorage.save(key, persistedValue);
		const state = createState(0).with(storageFeature<number>(mockStorage, key));

		// Act
		const result = await state.persist();

		// Assert
		expect(result).toBe(true);
		expect(state.get()).toBe(persistedValue);
	});

	it('should persist state changes', async () => {
		// Prepare
		const key = 'testKey';
		const state = createState(10).with(storageFeature<number>(mockStorage, key));
		await state.persist();

		// Act
		state.set(20);
		const value: number = state.get();

		// Assert
		expect(value).toBe(20);
		expect(mockStorage.load(key)).toBe(20);
	});

	it('should delete persisted state', async () => {
		// Prepare
		const key = 'testKey';
		const state = createState(10).with(storageFeature<number>(mockStorage, key));
		await state.persist();

		// Act
		const deleteResult = await state.deleteFromStorage();

		// Assert
		expect(deleteResult).toBe(true);
		expect(mockStorage.load(key)).toBe(missingStorageValue);
	});

	it('should return false if deleting non-existent key', async () => {
		// Prepare
		const key = 'nonExistentKey';
		const state = createState(10).with(storageFeature<number>(mockStorage, key));

		// Act
		const deleteResult = await state.deleteFromStorage();

		// Assert
		expect(deleteResult).toBe(false);
	});

	it('should not override state with null if no persisted value', async () => {
		// Prepare
		const key = 'testKey';

		// Act
		const state = createState(10).with(storageFeature<number>(mockStorage, key));
		await state.persist();

		// Assert
		expect(state.get()).toBe(10);
	});
});
