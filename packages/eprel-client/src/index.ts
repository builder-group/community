export * from 'feature-fetch';
export * from './create-eprel-client';
export * from './with-eprel';

declare module 'feature-fetch' {
	interface TThirdPartyFeatures<GPaths> {
		eprel: {
			// TODO
		};
	}
}
