export type TExtractField<GObject, GKey extends keyof any, GDefault> =
	GObject extends Record<GKey, infer GValue> ? GValue : GDefault;
