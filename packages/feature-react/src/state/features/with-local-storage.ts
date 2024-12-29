import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import {
	FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER,
	TPersistFeature,
	withStorage,
	type TState,
	type TStorageInterface
} from 'feature-state';

class LocalStorageInterface<GStorageValue> implements TStorageInterface<GStorageValue> {
	save(key: string, value: GStorageValue): boolean {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	}
	load(key: string): GStorageValue | typeof FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER {
		const item = localStorage.getItem(key);
		return item !== null
			? (JSON.parse(item) as GStorageValue)
			: FAILED_TO_LOAD_FROM_STORAGE_IDENTIFIER;
	}
	delete(key: string): boolean {
		localStorage.removeItem(key);
		return true;
	}
}

export function withLocalStorage<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>,
	key: string
): TState<GValue, [TPersistFeature, ...GFeatures]> {
	return withStorage(state, new LocalStorageInterface<GValue>(), key);
}
