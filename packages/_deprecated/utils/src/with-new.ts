export function withNew<GObject extends object, GArgs extends any[] = []>(
	obj: TWithNew<GObject, GArgs>,
	...args: GArgs
): GObject {
	if (typeof obj._new === 'function') {
		if (args.length === 0) {
			(obj._new as () => void)();
		} else {
			(obj._new as (...args: GArgs) => void)(...args);
		}

		// @ts-expect-error -- _new is not needed anymore
		delete obj._new;

		return obj;
	}

	return obj;
}

export async function withNewAsync<GObject extends object, GArgs extends any[] = []>(
	obj: TWithNewAsync<GObject, GArgs>,
	...args: GArgs
): Promise<GObject> {
	if (typeof obj._new === 'function') {
		if (args.length === 0) {
			await (obj._new as () => Promise<void>)();
		} else {
			await (obj._new as (...args: GArgs) => Promise<void>)(...args);
		}

		// @ts-expect-error -- _new is not needed anymore
		delete obj._new;

		return obj;
	}

	return obj;
}

// https://stackoverflow.com/questions/2980763/javascript-objects-get-parent
export type TWithNew<GObject extends object, GArgs extends any[] = []> = GObject & {
	_new: GArgs['length'] extends 0 ? () => void : (...args: GArgs) => void;
};

export type TWithNewAsync<GObject extends object, GArgs extends any[] = []> = GObject & {
	_new: GArgs['length'] extends 0 ? () => Promise<void> : (...args: GArgs) => Promise<void>;
};
