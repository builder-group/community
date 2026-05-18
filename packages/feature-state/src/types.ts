import { type TAnyFeature, type TFeatureHost } from 'feature-core';
import type { TListenerQueue, TQueueOptions } from './queue';

/** State object returned by `createState()`. */
export type TState<GValue, GFeatures extends TAnyFeature[]> = TFeatureHost<
	TStateBase<GValue>,
	GFeatures
>;

/**
 * Core state API used by feature installers.
 * Use this type when a feature only needs the base methods and internal slots,
 * regardless of which other features are already installed on the host.
 */
export interface TStateBase<GValue> {
	/** @internal */
	_listeners: TListener<GValue>[];
	/** @internal */
	_queue: TListenerQueue;
	/** Raw backing value. Mutate it directly only when you will call `notify()` yourself. */
	_v: GValue;
	/** Current state value. Assigning a new value is equivalent to calling `set()`. */
	value: GValue;
	/** Notifies listeners with the current value. Useful after mutating `value` in place. */
	notify(options?: TStateNotifyOptions<GValue>): void;
	get(): GValue;
	/** Sets the value and notifies listeners if it changed by reference. */
	set(
		newValueOrUpdater: GValue | ((value: GValue) => GValue),
		options?: TStateSetOptions<GValue>
	): void;
	/** Registers a callback for future changes. Returns an unsubscribe function. */
	listen(callback: TListenerCallback<GValue>, options?: TStateListenerOptions): () => void;
	/** Like `listen`, but also calls the callback immediately with the current value. */
	subscribe(callback: TListenerCallback<GValue>, options?: TStateListenerOptions): () => void;
}

export interface TStateNotifyOptions<GValue> {
	/** When false, listeners are queued but the queue is not flushed. Defaults to true. */
	processListenerQueue?: boolean;
	/** Extra fields merged into each listener's context for this notification. */
	listenerContext?: TAdditionalListenerContext;
	/** Previous value passed to listeners. Not inferred automatically; pass it when listeners need a snapshot. */
	prevValue?: GValue;
}

export type TStateSetOptions<GValue> = Omit<TStateNotifyOptions<GValue>, 'prevValue'>;

export type TStateListenerOptions = TQueueOptions;

export interface TListener<GValue> extends TQueueOptions {
	callback: TListenerCallback<GValue>;
}

export type TListenerCallback<GValue> = (context: TListenerContext<GValue>) => Promise<void> | void;

export interface TListenerContext<GValue> extends TAdditionalListenerContext {
	value: GValue;
	prevValue?: GValue;
}

export interface TAdditionalListenerContext {
	[key: string]: unknown;
	/** Identifies what triggered the change, e.g. `'state_set'` for `set()`. */
	source?: string;
	/** When true, signals that the change is a background sync. Consumers can use this to suppress UI updates. */
	background?: boolean;
}

export type TStateValue<GState> =
	GState extends TState<infer GValue, TAnyFeature[]> ? GValue : never;
