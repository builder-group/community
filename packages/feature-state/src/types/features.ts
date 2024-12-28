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

export interface TSelectorFeature<GValue> {
	key: 'selector';
	api: {
		listenToSelected: (
			callIf: TNestedPath<GValue>[] | ((value: GValue) => unknown),
			callback: TListenerCallback<GValue>,
			options?: Omit<TListenerOptions<GValue>, 'callIf'>
		) => () => void;
	};
}
