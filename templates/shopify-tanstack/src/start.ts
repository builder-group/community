import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { httpErrorSerializationAdapter } from './serialization';

export const startInstance = createStart(() => ({
	serializationAdapters: [httpErrorSerializationAdapter],
	requestMiddleware: [csrfMiddleware]
}));

// Note: Register CSRF protection for server functions explicitly because custom Start configuration
// replaces TanStack's default middleware
// https://tanstack.com/start/latest/docs/framework/react/guide/middleware#csrf-middleware
const csrfMiddleware = createCsrfMiddleware({
	filter: (cx) => cx.handlerType === 'serverFn'
});
