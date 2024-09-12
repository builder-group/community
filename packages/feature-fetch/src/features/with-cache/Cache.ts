export class Cache<GKey = string> {
	private readonly store = new Map<GKey, TCacheEntry>();

	public set(key: GKey, response: Response, maxAge = 5 * 60 * 1000): void {
		this.store.set(key, {
			response: response.clone(),
			timestamp: Date.now() + maxAge
		});
	}

	public get(key: GKey): Response | null {
		const entry = this.store.get(key);
		if (entry && entry.timestamp > Date.now()) {
			return entry.response.clone();
		}
		this.store.delete(key);
		return null;
	}

	public invalidate(predicate: (key: GKey) => boolean): void {
		for (const key of this.store.keys()) {
			if (predicate(key)) {
				this.store.delete(key);
			}
		}
	}
}

export interface TCacheOptions {
	maxAge?: number;
	getCacheKey?: TGetCacheKey;
	shouldCache?: TShouldCache;
}

export type TGetCacheKey = (url: URL | string, init?: RequestInit) => string | null;
export type TShouldCache = (response: Response) => boolean;

export interface TCacheEntry {
	response: Response;
	timestamp: number;
}
