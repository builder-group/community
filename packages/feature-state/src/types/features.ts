import { TFeatureDefinition } from '@blgc/types/features';
import { type TNestedPath } from '@blgc/utils';
import { type TListenerCallback, type TListenerOptions, type TStateSetOptions } from './state';

export interface TUndoFeature<GValue> {
	key: 'undo';
	api: {
		undo: (options?: TStateSetOptions<GValue>) => void;
		_history: GValue[];
	};
}

export interface TMultiUndoFeature {
	key: 'multiundo';
	api: {
		multiUndo: (count: number) => void;
	};
}

export interface TPersistFeature {
	key: 'persist';
	api: {
		persist: () => Promise<boolean>;
		loadFormStorage: () => Promise<boolean>;
		deleteFormStorage: () => Promise<boolean>;
	};
}

export interface TSelectorFeature<GValue, GFeatures extends TFeatureDefinition[] = []> {
	key: 'selector';
	api: {
		_pv: GValue;
		listenToSelected: (
			queueIf: TNestedPath<GValue>[] | ((value: GValue) => unknown),
			callback: TListenerCallback<GValue, GFeatures>,
			options?: Omit<TListenerOptions<GValue, GFeatures>, 'queueIf'>
		) => () => void;
	};
}
