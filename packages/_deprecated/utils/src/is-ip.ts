const IPv4SegmentFormat = '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
const IPv4AddressFormat = `(${IPv4SegmentFormat}[.]){3}${IPv4SegmentFormat}`;
const IPv4AddressRegExp = new RegExp(`^${IPv4AddressFormat}$`);
const IPv6SegmentFormat = '(?:[0-9a-fA-F]{1,4})';
const IPv6AddressRegExp = new RegExp(
	'^(' +
		`(?:${IPv6SegmentFormat}:){7}(?:${IPv6SegmentFormat}|:)|` +
		`(?:${IPv6SegmentFormat}:){6}(?:${IPv4AddressFormat}|:${IPv6SegmentFormat}|:)|` +
		`(?:${IPv6SegmentFormat}:){5}(?::${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,2}|:)|` +
		`(?:${IPv6SegmentFormat}:){4}(?:(:${IPv6SegmentFormat}){0,1}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,3}|:)|` +
		`(?:${IPv6SegmentFormat}:){3}(?:(:${IPv6SegmentFormat}){0,2}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,4}|:)|` +
		`(?:${IPv6SegmentFormat}:){2}(?:(:${IPv6SegmentFormat}){0,3}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,5}|:)|` +
		`(?:${IPv6SegmentFormat}:){1}(?:(:${IPv6SegmentFormat}){0,4}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,6}|:)|` +
		`(?::((?::${IPv6SegmentFormat}){0,5}:${IPv4AddressFormat}|(?::${IPv6SegmentFormat}){1,7}|:))` +
		')(%[0-9a-zA-Z-.:]{1,})?$'
);

export function isIPv4(input: unknown): boolean {
	if (typeof input !== 'string') {
		return false;
	}
	return IPv4AddressRegExp.test(input);
}

export function isIPv6(input: unknown): boolean {
	if (typeof input !== 'string') {
		return false;
	}
	return IPv6AddressRegExp.test(input);
}

// Adapted from https://github.com/validatorjs/validator.js/blob/master/src/lib/isIP.js
export function isIP(input: unknown): boolean {
	return isIPv4(input) || isIPv6(input);
}
