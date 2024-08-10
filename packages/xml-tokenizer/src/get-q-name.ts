// Get qualified name
export function getQName(local: string, prefix: string | null = null): string {
	return prefix != null && prefix.length > 0 ? `${prefix}:${local}` : local;
}
