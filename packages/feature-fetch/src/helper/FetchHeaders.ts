// Simplified port of Headers class because some environment (like Figma plugin)
// don't provide the Headers class.
//
// https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers
export class FetchHeaders {
	private readonly headers: Map<string, string[]>;

	constructor(init?: RequestInit['headers'] | FetchHeaders) {
		this.headers = new Map();

		if (init instanceof FetchHeaders) {
			init.getHeaders().forEach((values, key) => {
				this.headers.set(key, values);
			});
		} else if (Array.isArray(init)) {
			init.forEach(([key, value]) => {
				if (key != null && value != null) {
					this.append(key, value);
				}
			});
		} else if (init != null) {
			Object.entries(init).forEach(([key, values]) => {
				if (Array.isArray(values)) {
					values.forEach((value) => {
						this.append(key, value);
					});
				} else {
					this.set(key, values);
				}
			});
		}
	}

	private static formatName(name: string): string {
		return name.toLowerCase().trim();
	}

	private static formatValue(value: string): string[] {
		return value.split(',').map((v) => v.trim());
	}

	private static joinValues(value: string[]): string {
		return value.join(', ');
	}

	public static merge(headers1?: FetchHeaders, headers2?: FetchHeaders): FetchHeaders {
		const merged = new FetchHeaders(headers1);

		if (headers2 instanceof FetchHeaders) {
			const rawHeaders2 = headers2.getHeaders();
			rawHeaders2.forEach((values, key) => {
				values.forEach((value) => {
					merged.append(key, value);
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
		this.forEach((value, key) => {
			headersInit[key] = value;
		});
		return headersInit;
	}

	public append(name: string, value: string): void {
		const key = FetchHeaders.formatName(name);
		const values = this.headers.get(key);
		if (values != null) {
			values.push(...FetchHeaders.formatValue(value));
		} else {
			this.headers.set(key, FetchHeaders.formatValue(value));
		}
	}

	public delete(name: string): void {
		this.headers.delete(FetchHeaders.formatName(name));
	}

	public get(name: string): string | null {
		const values = this.headers.get(FetchHeaders.formatName(name));
		if (values != null) {
			return FetchHeaders.joinValues(values);
		}
		return null;
	}

	public has(name: string): boolean {
		return this.headers.has(FetchHeaders.formatName(name));
	}

	public set(name: string, value: string): void {
		this.headers.set(FetchHeaders.formatName(name), FetchHeaders.formatValue(value));
	}

	public getSetCookie(): string[] {
		return this.headers.get('set-cookie') ?? [];
	}

	public forEach(
		callbackfn: (value: string, name: string, iterable: FetchHeaders) => void,
		thisArg?: any
	): void {
		this.headers.forEach((values, name) => {
			callbackfn.call(thisArg, FetchHeaders.joinValues(values), name, this);
		});
	}

	public keys(): Iterator<string> {
		return this.headers.keys();
	}

	public *values(): Iterator<string> {
		for (const values of this.headers.values()) {
			yield FetchHeaders.joinValues(values);
		}
	}

	public *entries(): Iterator<[string, string]> {
		for (const [name, values] of this.headers.entries()) {
			yield [name, FetchHeaders.joinValues(values)];
		}
	}

	public [Symbol.iterator](): Iterator<[string, string]> {
		return this.entries();
	}
}
