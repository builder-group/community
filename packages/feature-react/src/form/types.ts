/**
 * Distinguishes the wide string type from string literal unions.
 * `'a' | 'b'` extends string, but string does not extend `'a' | 'b'`.
 */
export type TIsWideString<GValue> =
	Exclude<GValue, undefined> extends string
		? string extends Exclude<GValue, undefined>
			? true
			: false
		: false;
