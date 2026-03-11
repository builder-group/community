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
			return true;
		},

		wasAdded(key) {
			return this._added.has(key);
		},

		wasChanged(key) {
			return this._changed.has(key);
		},

		flush() {
			this._added.clear();
			this._changed.clear();
		},

		reset() {
			this._registered.clear();
			this._added.clear();
			this._changed.clear();
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
