/**
 * Constructs a qualified name (QName) from a local name and an optional namespace prefix.
 *
 * https://www.w3.org/2001/tag/doc/qnameids.html
 */
export function getQName(local: string, prefix: string | null = null): string {
	return prefix != null && prefix.length > 0 ? `${prefix}:${local}` : local;
}
