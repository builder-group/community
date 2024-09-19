import {
	Err,
	FetchError,
	hasFeatures,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TSelectFeatures
} from 'feature-fetch';
import { mapOk, Ok, unwrapOrNull } from '@blgc/utils';

import { type paths } from './gen/v1';
import { isVoiceId } from './helper';

export function withElevenLabs<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base', 'openapi']>>
): TFetchClient<['elevenlabs', ...GSelectedFeatureKeys], paths> {
	if (!hasFeatures(fetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withElevenLabs');
	}
	fetchClient._features.push('elevenlabs');

	const elevenLabsFeatures: TSelectFeatures<['elevenlabs']> = {
		async getVoices(this: TFetchClient<['base', 'openapi', 'elevenlabs'], paths>) {
			const result = await this.get('/v1/voices', { queryParams: { show_legacy: true } });
			return mapOk(result, (ok) => ok.data);
		},
		async generateTextToSpeach(
			this: TFetchClient<['base', 'openapi', 'elevenlabs'], paths>,
			config
		) {
			const {
				text,
				modelId = 'eleven_multilingual_v2',
				voice,
				languageCode,
				nextRequestIds = [],
				nextText,
				previousRequestIds = [],
				previousText,
				pronunciationDictionaryLocators = [],
				seed
			} = config;
			const {
				stability = 0.5,
				similarityBoost = 0.8,
				style = 0.0,
				useSpeakerBoost = true
			} = config.voiceSettings ?? {};

			const voiceId = isVoiceId(voice)
				? voice
				: unwrapOrNull(await this.getVoices())?.voices.find((v) => v.name === voice)?.voice_id;
			if (voiceId == null) {
				return Err(
					new FetchError('#ERR_INVALID_VOICE', {
						description: `${voice} is not a valid voice name or id`
					})
				);
			}

			const result = await this.post(
				'/v1/text-to-speech/{voice_id}',
				{
					text,
					model_id: modelId,
					voice_settings: {
						stability,
						similarity_boost: similarityBoost,
						style,
						use_speaker_boost: useSpeakerBoost
					},
					language_code: languageCode,
					next_request_ids: nextRequestIds,
					next_text: nextText,
					previous_request_ids: previousRequestIds,
					previous_text: previousText,
					pronunciation_dictionary_locators: pronunciationDictionaryLocators.map((v) => ({
						pronunciation_dictionary_id: v.pronunciationDictionaryId,
						version_id: v.versionId
					})),
					seed,
					use_pvc_as_ivc: false // Deprecated but still required by type
				},
				{
					pathParams: {
						voice_id: voiceId
					},
					queryParams: {},
					parseAs: 'stream'
				}
			);

			if (result.isErr()) {
				return Err(result.error);
			}
			if (result.value.data == null) {
				return Err(new FetchError('#ERR_INVALID_STREAM'));
			}

			return Ok(result.value.data);
		}
	};

	// Merge existing features from the state with the new api feature
	const _fetchClient = Object.assign(fetchClient, elevenLabsFeatures);

	return _fetchClient as TFetchClient<['elevenlabs', ...GSelectedFeatureKeys], paths>;
}
