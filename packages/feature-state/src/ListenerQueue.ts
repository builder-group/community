import { FlatQueue } from './FlatQueue';
import type { TListenerQueueItem } from './types';

export class ListenerQueue extends FlatQueue<TListenerQueueItem> {
	public readonly sync: boolean;

	constructor(sync = false) {
		super();
		this.sync = sync;
	}

	public process(): void | Promise<void> {
		if (this.sync) {
			return this.processSync();
		} else {
			return this.processAsync();
		}
	}

	public processSync(): void {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			void item.callback(item.context);
		}
	}

	public async processAsync(): Promise<void> {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			await item.callback(item.context);
		}
	}
}
