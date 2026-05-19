// Based on: https://github.com/mourner/flatqueue/blob/main/index.js
// Note: Kept local because the original package does not support CommonJS output
export class FlatQueue<GItem> {
	private _ids: Array<GItem | undefined>;
	private _orders: Array<number>;
	private _values: Array<number>;
	private _length: number;
	private _nextOrder: number;

	constructor() {
		this._ids = [];
		this._orders = [];
		this._values = [];
		this._length = 0;
		this._nextOrder = 0;
	}

	public get length(): number {
		return this._length;
	}

	public clear(): void {
		for (let i = 0; i < this._length; i++) {
			this._ids[i] = undefined;
			this._orders[i] = 0;
			this._values[i] = 0;
		}
		this._length = 0;
		this._nextOrder = 0;
	}

	/** Adds an item. Lower priority values are popped first. Same-priority items keep insertion order. */
	public push(id: GItem, priority: number): void {
		const order = this._nextOrder++;
		let pos = this._length++;

		// Move parents down until the new item fits the heap order
		while (pos > 0) {
			const parent = (pos - 1) >> 1;
			const parentValue = this._values[parent] as number;
			const parentOrder = this._orders[parent] as number;
			if (!isBefore(priority, order, parentValue, parentOrder)) {
				break;
			}
			this._ids[pos] = this._ids[parent];
			this._orders[pos] = parentOrder;
			this._values[pos] = parentValue;
			pos = parent;
		}

		this._ids[pos] = id;
		this._orders[pos] = order;
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
			this._orders[0] = this._orders[this._length] as number;
			this._values[0] = this._values[this._length] as number;
			this._ids[this._length] = undefined;
			this._orders[this._length] = 0;
			this._values[this._length] = 0;
			this._siftDown(0);
		} else {
			this._ids[0] = undefined;
			this._orders[0] = 0;
			this._values[0] = 0;
			this._nextOrder = 0;
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
				this._orders[writeIdx] = this._orders[i] as number;
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
			this._orders[i] = 0;
			this._values[i] = 0;
		}
		this._length = writeIdx;
		if (this._length === 0) {
			this._nextOrder = 0;
		}

		// Restore heap order using Floyd's bottom-up heapify: O(n) vs O(n log n) for re-pushing
		for (let i = (this._length >> 1) - 1; i >= 0; i--) {
			this._siftDown(i);
		}

		return removedCount;
	}

	private _siftDown(pos: number): void {
		const id = this._ids[pos] as GItem;
		const value = this._values[pos] as number;
		const order = this._orders[pos] as number;
		const halfLength = this._length >> 1;

		// Move the item down until the heap order is restored
		while (pos < halfLength) {
			let bestPos = (pos << 1) + 1;
			let bestId = this._ids[bestPos] as GItem;
			let bestValue = this._values[bestPos] as number;
			let bestOrder = this._orders[bestPos] as number;

			const right = bestPos + 1;
			const rightValue = this._values[right] as number;
			const rightOrder = this._orders[right] as number;

			// Prefer the child with the lower priority value, then the earlier insertion order
			if (right < this._length && isBefore(rightValue, rightOrder, bestValue, bestOrder)) {
				bestPos = right;
				bestId = this._ids[right] as GItem;
				bestValue = rightValue;
				bestOrder = rightOrder;
			}

			if (!isBefore(bestValue, bestOrder, value, order)) {
				break;
			}

			this._ids[pos] = bestId;
			this._orders[pos] = bestOrder;
			this._values[pos] = bestValue;
			pos = bestPos;
		}

		this._ids[pos] = id;
		this._orders[pos] = order;
		this._values[pos] = value;
	}
}

function isBefore(
	priority: number,
	order: number,
	otherPriority: number,
	otherOrder: number
): boolean {
	return priority < otherPriority || (priority === otherPriority && order < otherOrder);
}
