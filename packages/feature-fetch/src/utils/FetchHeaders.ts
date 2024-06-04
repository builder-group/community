// Simplified port of 'fetch' Headers class as some environments
// like Figma Plugins don't support the 'fetch' Headers class (yet)
export class FetchHeaders {
	private readonly headers: Map<string, string[]>;

	constructor(init?: RequestInit['headers'] | FetchHeaders) {
		this.headers = new Map();

		if (init instanceof FetchHeaders) {
			init.forEach((value, name) => {
				this.headers.set(name.toLowerCase(), [value]);
			});
		} else if (Array.isArray(init)) {
			init.forEach(([key, value]) => {
				if (key != null && value != null) {
					this.append(key, value);
				}
			});
		} else if (init != null) {
			Object.entries(init).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					value.forEach((val) => {
						this.append(key, val);
					});
				} else {
					this.set(key, value);
				}
			});
		}
	}

	public static merge(headers1?: FetchHeaders, headers2?: FetchHeaders): FetchHeaders {
		const merged = new FetchHeaders(headers1);

		if (headers2 instanceof FetchHeaders) {
			const rawHeaders2 = headers2.getHeaders();
			rawHeaders2.forEach((values, key) => {
				values.forEach((value) => {
					if (merged.headers.has(key)) {
						merged.append(key, value);
					} else {
						merged.set(key, value);
					}
				});
			});
		}

		return merged;
	}

	public getHeaders(): ReadonlyMap<string, string[]> {
		return new Map(this.headers);
	}

	public toHeadersInit(): RequestInit['headers'] {
		const headersInit: Record<string, string> = {};
		this.headers.forEach((values, key) => {
			headersInit[key] = values.join(', ');
		});
		return headersInit;
	}

	public append(name: string, value: string): void {
		const key = name.toLowerCase();
		if (this.headers.has(key)) {
			this.headers.get(key)?.push(value);
		} else {
			this.headers.set(key, [value]);
		}
	}

	public delete(name: string): void {
		this.headers.delete(name.toLowerCase());
	}

	public get(name: string): string | null {
		const values = this.headers.get(name.toLowerCase());
		if (values) {
			return values.join(', ');
		}
		return null;
	}

	public has(name: string): boolean {
		return this.headers.has(name.toLowerCase());
	}

	public set(name: string, value: string): void {
		this.headers.set(name.toLowerCase(), [value]);
	}

	public getSetCookie(): string[] {
		return this.headers.get('set-cookie') || [];
	}

	public forEach(
		callbackfn: (value: string, key: string, iterable: FetchHeaders) => void,
		thisArg?: any
	): void {
		this.headers.forEach((values, key) => {
			callbackfn.call(thisArg, values.join(', '), key, this);
		});
	}

	public keys(): Iterator<string> {
		return this.headers.keys();
	}

	public values(): Iterator<string> {
		const flatValuesIterator = {
			[Symbol.iterator]: () => {
				const valuesIterator = this.headers.values();
				let currentSet = valuesIterator.next();
				let index = 0;

				return {
					next(): IteratorResult<string> {
						if (!currentSet.done) {
							if (index < currentSet.value.length) {
								const value = currentSet.value[index++];
								if (value != null) {
									return { value, done: false };
								}
							}
							currentSet = valuesIterator.next();
							index = 0;
						}
						return { value: undefined, done: true };
					}
				};
			}
		};
		return flatValuesIterator[Symbol.iterator]();
	}

	public entries(): Iterator<[string, string]> {
		const entriesIterator = {
			[Symbol.iterator]: () => {
				const iterator = this.headers.entries();
				return {
					next(): IteratorResult<[string, string]> {
						const { value, done } = iterator.next();
						if (done) return { value: undefined, done: true };
						return { value: [value[0], value[1].join(', ')], done: false };
					}
				};
			}
		};
		return entriesIterator[Symbol.iterator]();
	}

	public [Symbol.iterator](): Iterator<[string, string]> {
		return this.entries();
	}
}
