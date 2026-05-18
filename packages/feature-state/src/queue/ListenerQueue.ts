import type { TListenerCallback, TListenerContext } from '../types';
import { FifoQueue } from './FifoQueue';
import { FlatQueue } from './FlatQueue';

/** Schedules listener callbacks for one or more state instances. */
export interface TListenerQueue {
	readonly length: number;
	/** Adds a listener callback with queue-specific scheduling options. */
	push(item: TListenerQueueItem, options: TQueueOptions): void;
	/** Removes queued callbacks that match `predicate` and returns the removed count. */
	removeWhere(predicate: (item: TListenerQueueItem) => boolean): number;
	process(): void | Promise<void>;
}

/** Base options bag forwarded from `listen()`/`subscribe()` to the queue. Arbitrary fields pass through. */
export type TQueueOptions = Record<string, unknown>;

export interface TListenerQueueItem<GValue = unknown> {
	callback: TListenerCallback<GValue>;
	context: TListenerContext<GValue>;
}

// MARK: - Fifo Queue

export class SyncListenerQueue extends FifoQueue<TListenerQueueItem> implements TListenerQueue {
	public process(): void {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			void item.callback(item.context);
		}
	}
}

export class AsyncListenerQueue extends FifoQueue<TListenerQueueItem> implements TListenerQueue {
	private _processPromise: Promise<void> | null = null;

	public process(): Promise<void> {
		if (this._processPromise != null) {
			return this._processPromise;
		}

		this._processPromise = this._process();
		return this._processPromise;
	}

	private async _process(): Promise<void> {
		try {
			let item: TListenerQueueItem | null;
			while ((item = this.pop()) != null) {
				await item.callback(item.context);
			}
		} finally {
			this._processPromise = null;
		}
	}
}

// MARK: - Priority Queue

export class SyncPriorityListenerQueue implements TListenerQueue {
	private readonly _queue = new FlatQueue<TListenerQueueItem>();

	public get length(): number {
		return this._queue.length;
	}

	public push(item: TListenerQueueItem, options: TPriorityQueueOptions): void {
		const { priority = EListenerQueuePriority.DEFAULT } = options;
		this._queue.push(item, priority);
	}

	public removeWhere(predicate: (item: TListenerQueueItem) => boolean): number {
		return this._queue.removeWhere(predicate);
	}

	public process(): void {
		let item: TListenerQueueItem | null;
		while ((item = this._queue.pop()) != null) {
			void item.callback(item.context);
		}
	}
}

export interface TPriorityQueueOptions extends TQueueOptions {
	/** Determines execution order relative to other listeners. Lower values run first. */
	priority?: number;
}

/** Listener priority values. Lower values are processed earlier. */
export enum EListenerQueuePriority {
	FIRST = 0,
	EARLY = 125,
	DEFAULT = 250,
	LATE = 375,
	LAST = 500
}
