import { beforeEach, describe, expect, it } from 'vitest';
import { sleep } from '@ibg/utils';

import { createState } from '../create-state';
import { FAILED_TO_LOAD_IDENTIFIER, withPersist, type StorageInterface } from './with-persist';

class MockStorage<GValue> implements StorageInterface<GValue> {
	private store: Record<string, GValue> = {};

	async save(key: string, value: GValue): Promise<boolean> {
		this.store[key] = value;
		return true;
	}

	async load(key: string): Promise<GValue | typeof FAILED_TO_LOAD_IDENTIFIER> {
		return this.store[key] ?? FAILED_TO_LOAD_IDENTIFIER;
	}

	async delete(key: string): Promise<boolean> {
		if (key in this.store) {
			delete this.store[key];
			return true;
		}
		return false;
	}

	clear(): void {
		this.store = {};
	}
}

describe('withPersist function', () => {
	let mockStorage: MockStorage<any>;

	beforeEach(() => {
		mockStorage = new MockStorage();
	});

	it('should initialize state with persisted value if available', async () => {
		// Prepare
		const key = 'testKey';
		const persistedValue = 42;
		await mockStorage.save(key, persistedValue);
		const state = withPersist(createState(0), mockStorage, key);

		// Act
		const result = await state.persist();

		// Assert
		expect(result).toBe(true);
		expect(state.get()).toBe(persistedValue);
	});

	it('should persist state changes', async () => {
		// Prepare
		const key = 'testKey';
		const state = withPersist(createState(10), mockStorage, key);
		await state.persist();

		// Act
		state.set(20);
		await sleep(10);

		// Assert
		expect(await mockStorage.load(key)).toBe(20);
	});

	it('should delete persisted state', async () => {
		// Prepare
		const key = 'testKey';
		const state = withPersist(createState(10), mockStorage, key);
		await state.persist();

		// Act
		const deleteResult = await state.deletePersisted();

		// Assert
		expect(deleteResult).toBe(true);
		expect(await mockStorage.load(key)).toBe(FAILED_TO_LOAD_IDENTIFIER);
	});

	it('should return false if deleting non-existent key', async () => {
		// Prepare
		const key = 'nonExistentKey';
		const state = withPersist(createState(10), mockStorage, key);

		// Act
		const deleteResult = await state.deletePersisted();

		// Assert
		expect(deleteResult).toBe(false);
	});

	it('should not override state with null if no persisted value', async () => {
		// Prepare
		const key = 'testKey';

		// Act
		const state = withPersist(createState(10, false), mockStorage, key);
		await state.persist();

		// Assert
		expect(state.get()).toBe(10);
	});
});
