import { isIPv4 } from './is-ip';

/**
 * Extracts the hostname from a URL.
 * Returns the hostname for both domain names (e.g., 'api.example.com') and IP addresses (e.g., '192.168.1.1')
 * Returns null for invalid URLs or hostnames.
 */
export function getHostname(url: string): string | null {
	if (!url.length) {
		return null;
	}

	try {
		const hostname = new URL(url.includes('://') ? url : `https://${url}`).hostname;

		// Valid if it's either:
		// 1. A domain with at least one dot (e.g., 'example.com')
		// 2. An IPv4 address
		if (!hostname.length || (!hostname.includes('.') && !isIPv4(hostname))) {
			return null;
		}

		return hostname;
	} catch {
		return null;
	}
}
