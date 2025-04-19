import { getHostname } from './get-hostname';
import { isIPv4 } from './is-ip';

/**
 * Extracts the domain from a URL.
 * Returns null for IP addresses, invalid URLs, or invalid hostnames.
 * For valid domains, returns the entire hostname (e.g., 'api.example.com' from 'https://api.example.com')
 */
export function getDomain(url: string): string | null {
	const hostname = getHostname(url);
	if (hostname == null || isIPv4(hostname)) {
		return null;
	}

	return hostname;
}
