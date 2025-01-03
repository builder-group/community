export * from './api';
export * from './graphql';
export * from './openapi';

export interface TRetryFeature {
	key: 'retry';
	api: {};
}

export interface TDelayFeature {
	key: 'delay';
	api: {};
}

export interface TCacheFeature {
	key: 'cache';
	api: {};
}

export interface TGraphQLCacheFeature {
	key: 'graphqlCache';
	api: {};
}
