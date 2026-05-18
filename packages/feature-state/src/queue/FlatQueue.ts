// Based on: https://github.com/mourner/flatqueue/blob/main/index.js
// Note: Kept local because the original package does not support CommonJS output
export class FlatQueue<GItem> {
	private _ids: Array<GItem | undefined>;
	private _values: Array<number>;
	private _length: number;

	constructor() {
		this._ids = [];
		this._values = [];
		this._length = 0;
	}

	public get length(): number {
		return this._length;
	}

	/** Adds an item. Lower priority values are popped first. Same-priority order is not guaranteed. */
	public push(id: GItem, priority: number): void {
		let pos = this._length++;

		// Move parents down until the new item fits the heap order
		while (pos > 0) {
			const parent = (pos - 1) >> 1;
			const parentValue = this._values[parent] as number;
			if (priority >= parentValue) {
				break;
			}
			this._ids[pos] = this._ids[parent];
			this._values[pos] = parentValue;
			pos = parent;
		}

		this._ids[pos] = id;
		this._values[pos] = priority;
	}

	/** Removes the item with the lowest priority, or returns null when empty. */
	public pop(): GItem | null {
		if (!this._length) {
			return null;
		}

		const top = this._ids[0];
		this._length--;

		if (this._length > 0) {
			this._ids[0] = this._ids[this._length] as GItem;
			this._values[0] = this._values[this._length] as number;
			this._ids[this._length] = undefined;
			this._values[this._length] = 0;
			this._siftDown(0);
		} else {
			this._ids[0] = undefined;
			this._values[0] = 0;
		}

		return top ?? null;
	}

	/** Removes every queued item matching `predicate` and returns the removed count. */
	public removeWhere(predicate: (id: GItem) => boolean): number {
		let writeIdx = 0;
		let removedCount = 0;

		for (let i = 0; i < this._length; i++) {
			if (predicate(this._ids[i] as GItem)) {
				removedCount++;
			} else {
				this._ids[writeIdx] = this._ids[i];
				this._values[writeIdx] = this._values[i] as number;
				writeIdx++;
			}
		}

		if (removedCount === 0) {
			return 0;
		}

		// Clear vacated slots so removed items can be garbage collected
		for (let i = writeIdx; i < this._length; i++) {
			this._ids[i] = undefined;
			this._values[i] = 0;
		}
		this._length = writeIdx;

		// Restore heap order using Floyd's bottom-up heapify: O(n) vs O(n log n) for re-pushing
		for (let i = (this._length >> 1) - 1; i >= 0; i--) {
			this._siftDown(i);
		}

		return removedCount;
	}

	private _siftDown(pos: number): void {
		const id = this._ids[pos] as GItem;
		const value = this._values[pos] as number;
		const halfLength = this._length >> 1;

		// Move the item down until the heap order is restored
		while (pos < halfLength) {
			let bestPos = (pos << 1) + 1;
			let bestId = this._ids[bestPos] as GItem;
			let bestValue = this._values[bestPos] as number;

			const right = bestPos + 1;
			const rightValue = this._values[right] as number;

			// Prefer the child with the lower priority value
			if (right < this._length && rightValue < bestValue) {
				bestPos = right;
				bestId = this._ids[right] as GItem;
				bestValue = rightValue;
			}

			if (bestValue >= value) {
				break;
			}

			this._ids[pos] = bestId;
			this._values[pos] = bestValue;
			pos = bestPos;
		}

		this._ids[pos] = id;
		this._values[pos] = value;
	}
}
