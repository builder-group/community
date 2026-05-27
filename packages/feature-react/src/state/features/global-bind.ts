import { defineFeature, type TFeature } from 'feature-core';
import type { TStateBase } from 'feature-state';

/**
 * Exposes a state on `globalThis` under `key` for browser console debugging.
 * After installing, `globalThis[key]` holds the state object so you can call
 * `get()`, `set()`, and inspect `_v` directly from the browser console.
 */
export function globalBindFeature<GValue>(key: string): TGlobalBindFeature {
	return defineFeature<TGlobalBindFeature>({
		key: 'global-bind',
		install(state: TStateBase<GValue>) {
			(globalThis as Record<string, unknown>)[key] = state;
			return {};
		}
	});
}

export type TGlobalBindFeature = TFeature<'global-bind', object>;
