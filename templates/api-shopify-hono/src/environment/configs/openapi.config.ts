import { appConfig } from './app.config';

export const openApiDocumentConfig = {
	openapi: '3.1.0',
	info: {
		title: appConfig.name,
		version: appConfig.packageVersion
	}
} as const;
