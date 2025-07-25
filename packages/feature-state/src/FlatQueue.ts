// Based on: https://github.com/mourner/flatqueue/blob/main/index.js
// Could not use the original package because it doesn't support CommonJs.
export class FlatQueue<GItem> {
	private _ids: Array<GItem | undefined>;
	private _values: Array<number>;
	private _length: number;

	constructor() {
		this._ids = [];
		this._values = [];
		this._length = 0;
	}

	/**
	 * Number of items in the queue.
	 */
	public get length(): number {
		return this._length;
	}

	/**
	 * Adds `item` to the queue with the specified `priority`.
	 *
	 * `priority` must be a number. Items are sorted and returned from low to
	 * high priority. Multiple items with the same priority value can be added
	 * to the queue, but there is no guaranteed order between these items.
	 */
	public push(id: GItem, priority: number): void {
		let pos = this._length++;

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

	/**
	 * Removes and returns the item from the head of this queue, which is one of
	 * the items with the lowest priority. If this queue is empty, returns
	 * `null`.
	 */
	public pop(): GItem | null {
		if (!this._length) {
			return null;
		}

		const top = this._ids[0];
		this._length--;

		if (this._length > 0) {
			const id = this._ids[this._length] as GItem;
			const value = this._values[this._length] as number;
			this._ids[0] = id;
			this._values[0] = value;

			const halfLength = this._length >> 1;
			let pos = 0;

			while (pos < halfLength) {
				let left = (pos << 1) + 1;
				const right = left + 1;

				// Initialize with left child values
				let bestIndex = this._ids[left] as GItem;
				let bestValue = this._values[left] as number;

				// Check if right child exists and has lower priority
				const rightValue = this._values[right] as number;

				if (right < this._length && rightValue < bestValue) {
					left = right;
					bestIndex = this._ids[right] as GItem;
					bestValue = rightValue;
				}

				// If current node has lower or equal priority than best child, stop
				if (bestValue >= value) {
					break;
				}

				// Move best child up
				this._ids[pos] = bestIndex;
				this._values[pos] = bestValue;
				pos = left;
			}

			// Place the current item at its new position
			this._ids[pos] = id;
			this._values[pos] = value;
		}

		return top ?? null;
	}
}
