/**
 * Creates a new event registry
 */
export function createEventRegistry<
	GEvents extends Record<string, any>
>(): TEventRegistry<GEvents> {
	return {
		_events: new Map(),

		push(type, data) {
			if (!this._events.has(type)) {
				this._events.set(type, []);
			}
			this._events.get(type)?.push({
				type: type as string,
				data,
				timestamp: Date.now()
			});
		},

		read(type) {
			return this._events.get(type) ?? [];
		},

		consume(type) {
			const events = this.read(type);
			this._events.set(type, []);
			return events;
		},

		flush() {
			this._events.clear();
		}
	};
}

export interface TEventRegistry<GEvents extends Record<string, any>> {
	/** Internal event storage */
	_events: Map<keyof GEvents, TEvent<any>[]>;

	/**
	 * Push a new event of a specific type
	 */
	push<GType extends keyof GEvents>(type: GType, data: GEvents[GType]): void;

	/**
	 * Read all events of a specific type without consuming them
	 */
	read<GType extends keyof GEvents>(type: GType): TEvent<GEvents[GType]>[];

	/**
	 * Read and consume all events of a specific type
	 */
	consume<GType extends keyof GEvents>(type: GType): TEvent<GEvents[GType]>[];

	/**
	 * Clear all events
	 */
	flush(): void;
}

export interface TEvent<GData = any> {
	type: string;
	data: GData;
	timestamp: number;
}
