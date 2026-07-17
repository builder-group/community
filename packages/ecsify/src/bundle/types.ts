import { TComponentRef, TComponentValue } from '../component';

export interface TBundleEntry<GComponent extends TComponentRef = TComponentRef> {
	component: GComponent;
	value?: TComponentValue<GComponent>;
}

export type TBundle<GComponent extends TComponentRef = TComponentRef> =
	readonly TBundleEntry<GComponent>[];

export type TBundlePart<GComponent extends TComponentRef = TComponentRef> =
	TBundleEntry<GComponent> | TBundle<GComponent>;

export type TBundleComponentFromPart<GPart> =
	GPart extends TBundleEntry<infer GComponent>
		? GComponent
		: GPart extends TBundle<infer GComponent>
			? GComponent
			: never;
