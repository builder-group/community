/**
 * Creates a new resource registry for tracking top-level resource changes.
 */
export function createResourceRegistry<
	GResources extends Record<string, any>
>(): TResourceRegistry<GResources> {
	return {
		_registered: new Set(),
		_added: new Set(),
		_changed: new Set(),
		_callbacks: new Map(),
		_resourcesToFlush: new Set(),

		register(key, options = {}) {
			const { trackAdded = true, trackChanged = true } = options;

			if (this._registered.has(key)) {
				return false;
			}

			this._registered.add(key);
			if (trackAdded) {
				this._added.add(key);
			}
			if (trackChanged) {
				this._changed.add(key);
			}
			if (trackAdded) {
				const callbacks = this._callbacks.get(key);
				if (callbacks?.onAdd != null) {
					for (const callback of callbacks.onAdd) {
						callback();
					}
				}
			}
			if (trackChanged) {
				const callbacks = this._callbacks.get(key);
				if (callbacks?.onChange != null) {
					for (const callback of callbacks.onChange) {
						callback();
					}
				}
			}
			if (trackAdded || trackChanged) {
				this._resourcesToFlush.add(key);
			}

			return true;
		},

		has(key) {
			return this._registered.has(key);
		},

		markChanged(key) {
			if (!this._registered.has(key)) {
				return false;
			}

			this._changed.add(key);
			const callbacks = this._callbacks.get(key);
			if (callbacks?.onChange != null) {
				for (const callback of callbacks.onChange) {
					callback();
				}
			}
			this._resourcesToFlush.add(key);
			return true;
		},

		wasAdded(key) {
			return this._added.has(key);
		},

		wasChanged(key) {
			return this._changed.has(key);
		},

		onAdd(key, callback) {
			if (!this._callbacks.has(key)) {
				this._callbacks.set(key, {});
			}
			const resourceCallbacks = this._callbacks.get(key) as TResourceCallbacks;
			if (resourceCallbacks.onAdd == null) {
				resourceCallbacks.onAdd = [];
			}
			resourceCallbacks.onAdd.push(callback);

			return () => {
				const index = resourceCallbacks.onAdd?.indexOf(callback);
				if (index != null && index !== -1) {
					resourceCallbacks.onAdd?.splice(index, 1);
				}
			};
		},

		onChange(key, callback) {
			if (!this._callbacks.has(key)) {
				this._callbacks.set(key, {});
			}
			const resourceCallbacks = this._callbacks.get(key) as TResourceCallbacks;
			if (resourceCallbacks.onChange == null) {
				resourceCallbacks.onChange = [];
			}
			resourceCallbacks.onChange.push(callback);

			return () => {
				const index = resourceCallbacks.onChange?.indexOf(callback);
				if (index != null && index !== -1) {
					resourceCallbacks.onChange?.splice(index, 1);
				}
			};
		},

		onFlush(key, callback) {
			if (!this._callbacks.has(key)) {
				this._callbacks.set(key, {});
			}
			const resourceCallbacks = this._callbacks.get(key) as TResourceCallbacks;
			if (resourceCallbacks.onFlush == null) {
				resourceCallbacks.onFlush = [];
			}
			resourceCallbacks.onFlush.push(callback);

			return () => {
				const index = resourceCallbacks.onFlush?.indexOf(callback);
				if (index != null && index !== -1) {
					resourceCallbacks.onFlush?.splice(index, 1);
				}
			};
		},

		flush() {
			for (const key of this._resourcesToFlush) {
				const callbacks = this._callbacks.get(key);
				if (callbacks?.onFlush != null) {
					for (const callback of callbacks.onFlush) {
						callback();
					}
				}
			}

			this._added.clear();
			this._changed.clear();
			this._resourcesToFlush.clear();
		},

		reset() {
			this._registered.clear();
			this._added.clear();
			this._changed.clear();
			this._callbacks.clear();
			this._resourcesToFlush.clear();
		}
	};
}

export interface TResourceRegistry<GResources extends Record<string, any>> {
	/** Registered top-level resource keys. */
	_registered: Set<keyof GResources>;
	/** Resources added since the last flush. */
	_added: Set<keyof GResources>;
	/** Resources changed since the last flush. */
	_changed: Set<keyof GResources>;
	/** Optional callbacks for resource lifecycle changes. */
	_callbacks: Map<keyof GResources, TResourceCallbacks>;
	/** Resource keys that should receive flush notifications. */
	_resourcesToFlush: Set<keyof GResources>;

	/**
	 * Registers a resource key with configurable change tracking behavior.
	 * @returns True if the resource was newly registered
	 */
	register<GKey extends keyof GResources>(key: GKey, options?: TRegisterResourceOptions): boolean;

	/**
	 * Checks if a resource key is registered.
	 */
	has<GKey extends keyof GResources>(key: GKey): boolean;

	/**
	 * Marks a registered resource as changed for the current frame.
	 * @returns True if the resource exists and was marked as changed
	 */
	markChanged<GKey extends keyof GResources>(key: GKey): boolean;

	/**
	 * Checks if a resource was added since the last flush.
	 */
	wasAdded<GKey extends keyof GResources>(key: GKey): boolean;

	/**
	 * Checks if a resource was changed since the last flush.
	 */
	wasChanged<GKey extends keyof GResources>(key: GKey): boolean;

	/**
	 * Registers a callback for when a resource is added.
	 */
	onAdd<GKey extends keyof GResources>(key: GKey, callback: () => void): () => void;

	/**
	 * Registers a callback for when a resource is marked as changed.
	 */
	onChange<GKey extends keyof GResources>(key: GKey, callback: () => void): () => void;

	/**
	 * Registers a callback for when a tracked resource key is flushed.
	 */
	onFlush<GKey extends keyof GResources>(key: GKey, callback: () => void): () => void;

	/**
	 * Clears per-frame resource change state.
	 */
	flush(): void;

	/**
	 * Clears all registry state.
	 */
	reset(): void;
}

export interface TRegisterResourceOptions {
	/** Whether the registration should be tracked as an added resource. Defaults to true. */
	trackAdded?: boolean;
	/** Whether the registration should be tracked as a changed resource. Defaults to true. */
	trackChanged?: boolean;
}

export interface TResourceCallbacks {
	onAdd?: (() => void)[];
	onChange?: (() => void)[];
	onFlush?: (() => void)[];
}
