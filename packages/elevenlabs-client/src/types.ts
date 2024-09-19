import { type components } from './gen/v1';

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
