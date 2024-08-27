// Simplified port of Headers class because some environment (like Figma plugin)
// don't provide the Headers class.
//
// https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers
export class FetchHeaders {
	private readonly _headers: Map<string, string[]>;

	constructor(init?: RequestInit['headers'] | FetchHeaders) {
		this._headers = new Map();

		if (init instanceof FetchHeaders) {
			init.headers.forEach((values, key) => {
				this._headers.set(key, values);
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
			headers2.headers.forEach((values, key) => {
				values.forEach((value) => {
					merged.append(key, value);
				});
			});
		}

		return merged;
	}

	public get headers(): ReadonlyMap<string, string[]> {
		return new Map(this._headers);
	}

	public toHeadersInit(): Record<string, string[]> /* RequestInit */ {
		const headersInit: Record<string, string[]> = {};
		this._headers.forEach((value, key) => {
			headersInit[key] = value;
		});
		return headersInit;
	}

	public append(name: string, value: string): void {
		const key = FetchHeaders.formatName(name);
		const values = this._headers.get(key);
		if (values != null) {
			values.push(...FetchHeaders.formatValue(value));
		} else {
			this._headers.set(key, FetchHeaders.formatValue(value));
		}
	}

	public delete(name: string): void {
		this._headers.delete(FetchHeaders.formatName(name));
	}

	public get(name: string): string | null {
		const values = this._headers.get(FetchHeaders.formatName(name));
		if (values != null) {
			return FetchHeaders.joinValues(values);
		}
		return null;
	}

	public has(name: string): boolean {
		return this._headers.has(FetchHeaders.formatName(name));
	}

	public set(name: string, value: string): void {
		this._headers.set(FetchHeaders.formatName(name), FetchHeaders.formatValue(value));
	}

	public getSetCookie(): string[] {
		return this._headers.get('set-cookie') ?? [];
	}

	public forEach(
		callbackfn: (value: string, name: string, iterable: FetchHeaders) => void,
		thisArg?: any
	): void {
		this._headers.forEach((values, name) => {
			callbackfn.call(thisArg, FetchHeaders.joinValues(values), name, this);
		});
	}

	public keys(): Iterator<string> {
		return this._headers.keys();
	}

	public *values(): Iterator<string> {
		for (const values of this._headers.values()) {
			yield FetchHeaders.joinValues(values);
		}
	}

	public *entries(): Iterator<[string, string]> {
		for (const [name, values] of this._headers.entries()) {
			yield [name, FetchHeaders.joinValues(values)];
		}
	}

	public [Symbol.iterator](): Iterator<[string, string]> {
		return this.entries();
	}
}
