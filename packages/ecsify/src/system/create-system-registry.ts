/**
 * Creates a new system registry
 */
export function createSystemRegistry<GSystemSets extends string = string, GContext = any>(
	systemSets: GSystemSets[]
): TSystemRegistry<GSystemSets, GContext> {
	return {
		_systems: [],
		_systemSets: systemSets,

		addSystem(fn, options = {}) {
			const { set = this._systemSets[0] as GSystemSets, before, after } = options;
			fn.set = set;

			// Setup the system if it has a setup function
			fn.setup?.(this as any);

			// Find the index of the 'before' system
			if (before != null) {
				const beforeIndex = this._systems.findIndex((s) => s === before);
				if (beforeIndex !== -1) {
					this._systems.splice(beforeIndex, 0, fn);
					return;
				}
			}

			// Find the index of the 'after' system
			if (after != null) {
				const afterIndex = this._systems.findIndex((s) => s === after);
				if (afterIndex !== -1) {
					this._systems.splice(afterIndex + 1, 0, fn);
					return;
				}
			}

			// Default insertion based on system set order
			const insertIndex = this._systems.findIndex(
				(s) => s.set != null && this._systemSets.indexOf(s.set) > this._systemSets.indexOf(set)
			);

			if (insertIndex === -1) {
				this._systems.push(fn);
			} else {
				this._systems.splice(insertIndex, 0, fn);
			}
		},

		setSystemSets(newSystemSets) {
			this._systemSets = [...newSystemSets];
			// Re-sort existing systems based on new order
			this._systems.sort((a, b) => {
				const aIndex = a.set != null ? this._systemSets.indexOf(a.set) : -1;
				const bIndex = b.set != null ? this._systemSets.indexOf(b.set) : -1;
				return aIndex - bIndex;
			});
		},

		update(context, delta) {
			for (const system of this._systems) {
				system(context, delta);
			}
		},

		getSystems() {
			return [...this._systems];
		}
	};
}

export interface TSystemRegistry<GSystemSets extends string = string, GContext = any> {
	/** Internal system storage */
	_systems: TSystemFn<GSystemSets, GContext>[];

	/** System set order */
	_systemSets: GSystemSets[];

	/**
	 * Add a system with optional ordering
	 */
	addSystem(
		fn: TSystemFn<GSystemSets, GContext>,
		options?: TAddSystemOptions<GSystemSets, GContext>
	): void;

	/**
	 * Update the system set order and re-sort systems
	 */
	setSystemSets(newSystemSets: readonly GSystemSets[]): void;

	/**
	 * Run all systems in order
	 */
	update(context: GContext, delta?: number): void;

	/**
	 * Get all systems in current order
	 */
	getSystems(): TSystemFn<GSystemSets, GContext>[];
}

export type TSystemFn<GSystemSets extends string = string, GContext = any> = ((
	context: GContext,
	delta?: number
) => void) & {
	set?: GSystemSets;
	setup?: (registry: TSystemRegistry<GSystemSets, GContext>) => void;
};

export interface TAddSystemOptions<GSystemSets extends string = string, GContext = any> {
	before?: TSystemFn<GSystemSets, GContext>;
	after?: TSystemFn<GSystemSets, GContext>;
	set?: GSystemSets;
}
