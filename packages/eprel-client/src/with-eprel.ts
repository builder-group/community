import {
	hasFeatures,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TSelectFeatures
} from 'feature-fetch';

import type { paths } from './gen/v1';

export function withEPREL<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base', 'openapi']>>
): TFetchClient<['eprel', ...GSelectedFeatureKeys], paths> {
	if (!hasFeatures(fetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withEPREL');
	}
	fetchClient._features.push('google-webfonts');

	const googleFeature: TSelectFeatures<['eprel']> = {};

	// Merge existing features from the state with the new api feature
	const _fetchClient = Object.assign(fetchClient, googleFeature);

	return _fetchClient as TFetchClient<['eprel', ...GSelectedFeatureKeys], paths>;
}
