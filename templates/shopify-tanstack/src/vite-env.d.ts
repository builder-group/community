/// <reference types="vite/client" />

// https://vite.dev/guide/env-and-mode#intellisense-for-typescript
interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
	readonly APP_ENVIRONMENT: 'development' | 'production' | 'test';
	readonly PACKAGE_VERSION: string;
}
