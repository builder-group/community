// "/users/{userId}/books/{bookId}" -> "/users/:userId/books/:bookId"
export function formatPath(path: string): string {
	return path.replace(/\{(\w+)\}/g, ':$1');
}
