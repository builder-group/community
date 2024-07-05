/** Find first match of multiple keys */
export type TFilterKeys<GObject, GMatchers> = GObject[keyof GObject & GMatchers];

/** Filter objects that have required keys */
export type TFindRequiredKeys<T, K extends keyof T> = K extends unknown
	? undefined extends T[K]
		? never
		: K
	: K;

/** Does this object contain required keys? */
export type THasRequiredKeys<T> = TFindRequiredKeys<T, keyof T>;

// TODO: Add other utils from @ibg/utils
