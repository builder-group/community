// "/users/{userId}/books/{bookId}" -> "/users/:userId/books/:bookId"
export function formatPath(path: string): string {
	return path.replace(/\{(?<name>\w+)\}/g, ':$<name>');
}
