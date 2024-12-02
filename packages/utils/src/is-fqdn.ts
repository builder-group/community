import { isIP } from './is-ip';

// Adapted from https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js
export function isFQDN(input: unknown, options: FQDNOptions = {}): boolean {
	if (typeof input !== 'string') {
		return false;
	}

	const {
		requireTld = true,
		allowUnderscores = false,
		allowTrailingDot = false,
		allowNumericTld = false,
		allowWildcard = false,
		ignoreMaxLength = false
	} = options;

	let domain = input;

	// Handle trailing dot
	if (allowTrailingDot && domain.endsWith('.')) {
		domain = domain.slice(0, -1);
	}

	// Handle wildcard
	if (allowWildcard && domain.startsWith('*.')) {
		domain = domain.slice(2);
	}

	// Reject IP addresses
	if (isIP(domain)) {
		return false;
	}

	const parts = domain.split('.');

	if (parts.length === 0 || parts.some((part) => part === '')) {
		return false;
	}

	const tld = parts[parts.length - 1];
	if (tld == null) {
		return false;
	}

	// TLD validation
	if (requireTld) {
		if (parts.length < 2) {
			return false;
		}

		// Check for spaces in TLD
		if (/\s/.test(tld)) {
			return false;
		}

		// Validate TLD character set (including IDN)
		const tldRegex =
			/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i;
		if (!allowNumericTld && !tldRegex.test(tld)) {
			return false;
		}
	}

	// Reject numeric TLDs if not allowed
	if (!allowNumericTld && /^\d+$/.test(tld)) {
		return false;
	}

	// Domain part validation
	const allowedCharsRegex = allowUnderscores
		? /^[a-z_\u00a1-\uffff0-9-]+$/i
		: /^[a-z\u00a1-\uffff0-9-]+$/i;

	return parts.every((part) => {
		// Length validation (max 63 characters per part)
		if (!ignoreMaxLength && part.length > 63) {
			return false;
		}

		// Character set validation
		if (!allowedCharsRegex.test(part)) {
			return false;
		}

		// Check for full-width characters
		if (/[\uff01-\uff5e]/.test(part)) {
			return false;
		}

		// Check for hyphens at start or end
		if (part.startsWith('-') || part.endsWith('-')) {
			return false;
		}

		return true;
	});
}

export interface FQDNOptions {
	/**
	 * Require a top-level domain (TLD)
	 * @default true
	 */
	requireTld?: boolean;

	/**
	 * Allow underscores in domain parts
	 * @default false
	 */
	allowUnderscores?: boolean;

	/**
	 * Allow a trailing dot at the end of the domain
	 * @default false
	 */
	allowTrailingDot?: boolean;

	/**
	 * Allow numeric top-level domains
	 * @default false
	 */
	allowNumericTld?: boolean;

	/**
	 * Allow wildcard domains (starting with *.）
	 * @default false
	 */
	allowWildcard?: boolean;

	/**
	 * Ignore maximum length restrictions for domain parts
	 * @default false
	 */
	ignoreMaxLength?: boolean;
}
