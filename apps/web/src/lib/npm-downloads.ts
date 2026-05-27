import { fetchClient } from '@/environment';

let CACHE: TNpmCache | null = null;

interface TNpmCache {
	cachedAt: number;
	downloads: Record<string, number>;
}

export async function getNpmTotalDownloads(
	packageNames: string[]
): Promise<Record<string, number>> {
	if (CACHE != null && !isCacheStale(CACHE)) {
		return CACHE.downloads;
	}

	const today = new Date().toISOString().split('T')[0];
	const range = `2015-01-10:${today}`;

	const results = await Promise.allSettled(
		packageNames.map(async (name) => {
			const [ok, , data] = await fetchClient.get<TNpmDownloadResponse>(
				'https://api.npmjs.org/downloads/point/{range}/{name}',
				{ pathParams: { range, name } }
			);
			if (ok) {
				return { name, data };
			}
			return { name, data: null };
		})
	);

	const downloads: Record<string, number> = {};
	for (const result of results) {
		if (result.status === 'fulfilled' && result.value.data != null) {
			downloads[result.value.name] = result.value.data.downloads;
		}
	}

	CACHE = { cachedAt: Date.now(), downloads };
	return downloads;
}

interface TNpmDownloadResponse {
	downloads: number;
	start: string;
	end: string;
	package: string;
}

function isCacheStale(cache: TNpmCache, ttlMs = 24 * 60 * 60 * 1000): boolean {
	return Date.now() >= cache.cachedAt + ttlMs;
}

export function formatNpmDownloads(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}
