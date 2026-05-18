export class FifoQueue<GItem> {
	private _items: GItem[] = [];
	private _processIndex = 0;

	public get length(): number {
		return this._items.length - this._processIndex;
	}

	public push(item: GItem): void {
		this._items.push(item);
	}

	public removeWhere(predicate: (item: GItem) => boolean): number {
		let writeIdx = 0;
		let removedCount = 0;

		for (let i = this._processIndex; i < this._items.length; i++) {
			const item = this._items[i] as GItem;
			if (predicate(item)) {
				removedCount++;
			} else {
				this._items[writeIdx] = item;
				writeIdx++;
			}
		}

		this._items.length = writeIdx;
		this._processIndex = 0;

		return removedCount;
	}

	public pop(): GItem | null {
		if (this._processIndex >= this._items.length) {
			this._items.length = 0;
			this._processIndex = 0;
			return null;
		}

		const item = this._items[this._processIndex] as GItem;
		this._processIndex++;
		if (this._processIndex >= this._items.length) {
			this._items.length = 0;
			this._processIndex = 0;
		}
		return item;
	}
}
