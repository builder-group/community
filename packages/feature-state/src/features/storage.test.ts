import { beforeEach, describe, expect, it } from 'vitest';
import { createState } from '../create-state';
import { missingStorageValue, storageFeature, type TStorageInterface } from './storage';

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

	it('should not override state if no persisted value exists', async () => {
		// Prepare
		const key = 'testKey';

		// Act
		const state = createState(10).with(storageFeature<number>(mockStorage, key));
		await state.persist();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should support null and undefined as persisted values', async () => {
		// Prepare
		const nullKey = 'nullKey';
		const undefinedKey = 'undefinedKey';
		const nullableStorage = new MockStorage<number | null | undefined>();
		nullableStorage.save(nullKey, null);
		nullableStorage.save(undefinedKey, undefined);
		const nullState = createState<number | null | undefined>(10).with(
			storageFeature<number | null | undefined>(nullableStorage, nullKey)
		);
		const undefinedState = createState<number | null | undefined>(10).with(
			storageFeature<number | null | undefined>(nullableStorage, undefinedKey)
		);

		// Act
		const nullResult = await nullState.persist();
		const undefinedResult = await undefinedState.persist();

		// Assert
		expect(nullResult).toBe(true);
		expect(nullState.get()).toBe(null);
		expect(undefinedResult).toBe(true);
		expect(undefinedState.get()).toBe(undefined);
	});
});

class MockStorage<GValue> implements TStorageInterface<GValue> {
	private store = new Map<string, GValue>();

	public save(key: string, value: GValue): boolean {
		this.store.set(key, value);
		return true;
	}

	public load(key: string): GValue | typeof missingStorageValue {
		return this.store.has(key) ? (this.store.get(key) as GValue) : missingStorageValue;
	}

	public delete(key: string): boolean {
		return this.store.delete(key);
	}
}
