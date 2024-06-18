export async function asPromise<T>(fn: () => T | Promise<T>): Promise<T> {
	return fn();
}
