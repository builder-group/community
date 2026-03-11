import { TComponentRef, TComponentValue } from '../component';
import { TBundle, TBundleComponentFromPart, TBundleEntry, TBundlePart } from './types';

export function defineBundle<const GParts extends readonly TBundlePart[]>(
	...parts: GParts
): TBundle<TBundleComponentFromPart<GParts[number]>> {
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

function flattenBundle<const GParts extends readonly TBundlePart[]>(
	parts: GParts
): TBundle<TBundleComponentFromPart<GParts[number]>> {
	const entries: TBundleEntry<TBundleComponentFromPart<GParts[number]>>[] = [];

	for (const part of parts) {
		if (isBundleEntry(part)) {
			entries.push(part);
			continue;
		}

		entries.push(...part);
	}

	return entries;
}

function isBundleEntry(part: TBundlePart): part is TBundleEntry {
	return typeof part === 'object' && part !== null && 'component' in part;
}
