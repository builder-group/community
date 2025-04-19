import { isIPv4 } from 'net';
import { getHostname } from './get-hostname';

/**
 * Extracts the root hostname from a URL.
 * For IPv4 addresses, returns the full address.
 * For domains, returns the last two parts (e.g., 'example.com' from 'sub.example.com')
 * Returns null if the input is invalid.
 */
export function getRootHostname(url: string): string | null {
	const hostname = getHostname(url);
	if (hostname == null) {
		return null;
	}

	if (isIPv4(hostname)) {
		return hostname;
	}

	const parts = hostname.split('.');
	return parts.length >= 2 ? parts.slice(-2).join('.') : null;
}
