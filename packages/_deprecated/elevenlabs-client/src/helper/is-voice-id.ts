export function isVoiceId(val: string): boolean {
	return /^[a-zA-Z0-9]{20}$/.test(val);
}
