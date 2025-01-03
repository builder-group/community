import { FetchError, TResult } from 'feature-fetch';
import { type components } from './gen/v1';

export interface TElevenLabsFeature {
	key: 'elevenlabs';
	api: {
		getVoices(): Promise<TResult<TVoiceResponse, FetchError>>;
		generateTextToSpeach(config: TGenerateTextToSpeechConfig): Promise<
			TResult<
				{
					stream: ReadableStream;
					characterCost?: string;
					contentType?: string;
					historyItemId?: string;
					requestId?: string;
				},
				FetchError
			>
		>;
	};
}

export type TVoiceResponse = components['schemas']['GetVoicesResponseModel'];

export interface TVoiceSettings {
	stability?: number;
	similarityBoost?: number;
	style?: number;
	useSpeakerBoost?: boolean;
}

export interface TPronunciationDictionaryLocator {
	pronunciationDictionaryId: string;
	versionId: string;
}

export interface TGenerateTextToSpeechConfig {
	voice: string;
	text: string;
	modelId?: string;
	languageCode?: string;
	voiceSettings?: TVoiceSettings;
	pronunciationDictionaryLocators?: TPronunciationDictionaryLocator[];
	seed?: number;
	previousText?: string;
	nextText?: string;
	previousRequestIds?: string[];
	nextRequestIds?: string[];
}
