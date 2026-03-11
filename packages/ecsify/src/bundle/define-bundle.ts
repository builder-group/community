import { TComponentRef, TComponentValue } from '../component';
import { TBundle, TBundleEntry, TBundlePart } from './types';

export function defineBundle<GComponent extends TComponentRef = TComponentRef>(
	...parts: readonly TBundlePart<GComponent>[]
): TBundle<GComponent> {
	const entries = flattenBundle(parts);
	const components = new Set<TComponentRef>();

	for (const entry of entries) {
		if (components.has(entry.component)) {
			throw new Error('Bundle contains duplicate component references');
		}
		components.add(entry.component);
	}

	return entries;
}

export function bundleEntry<GComponent extends TComponentRef>(
	component: GComponent,
	value?: TComponentValue<GComponent>
): TBundleEntry<GComponent> {
	return { component, value };
}

function flattenBundle<GComponent extends TComponentRef>(
	parts: readonly TBundlePart<GComponent>[]
): TBundleEntry<GComponent>[] {
	const entries: TBundleEntry<GComponent>[] = [];

	for (const part of parts) {
		if (isBundleEntry(part)) {
			entries.push(part);
			continue;
		}

		entries.push(...part);
	}

	return entries;
}

function isBundleEntry<GComponent extends TComponentRef>(
	part: TBundlePart<GComponent>
): part is TBundleEntry<GComponent> {
	return typeof part === 'object' && part !== null && 'component' in part;
}
