import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import {
	Err,
	FetchError,
	isFetchClientWithFeatures,
	mapOk,
	Ok,
	TFetchClient,
	TOpenApiFeature,
	unwrapOrNull
} from 'feature-fetch';
import { type paths } from './gen/v1';
import { isVoiceId } from './helper';
import { TElevenLabsFeature } from './types';

export function withElevenLabs<GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<
		TFetchClient<GFeatures>,
		TFetchClient<GFeatures>,
		['openapi']
	>
): TFetchClient<[TElevenLabsFeature, ...GFeatures]> {
	if (!isFetchClientWithFeatures<[TOpenApiFeature<paths>]>(baseFetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withElevenLabs');
	}

	const elevenLabsFeature: TElevenLabsFeature['api'] = {
		async getVoices(this: TFetchClient<[TOpenApiFeature<paths>, TElevenLabsFeature]>) {
			return mapOk(
				await this.get('/v1/voices', { queryParams: { show_legacy: true } }),
				(ok) => ok.data
			);
		},
		async generateTextToSpeach(
			this: TFetchClient<[TOpenApiFeature<paths>, TElevenLabsFeature]>,
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
			const {
				value: {
					data,
					response: { headers }
				}
			} = result;

			if (data == null) {
				return Err(new FetchError('#ERR_INVALID_STREAM'));
			}

			const contentType = headers.get('content-type') ?? undefined;
			const characterCost = headers.get('character-cost') ?? undefined;
			const historyItemId = headers.get('history-item-id') ?? undefined;
			const requestId = headers.get('request-id') ?? undefined;

			return Ok({ stream: data, contentType, characterCost, historyItemId, requestId });
		}
	};

	// Extend the base fetch client with the elevenlabs feature
	const extendedFetchClient = Object.assign(baseFetchClient, elevenLabsFeature) as TFetchClient<
		[TElevenLabsFeature]
	>;
	extendedFetchClient._features.push('elevenlabs');

	return extendedFetchClient as unknown as TFetchClient<[TElevenLabsFeature, ...GFeatures]>;
}
