/* eslint-disable @typescript-eslint/method-signature-style -- Ok here */
import { type FetchError, type TResult } from 'feature-fetch';

import { type TGenerateTextToSpeechConfig, type TVoiceResponse } from './types';

export * from 'feature-fetch';
export * from './create-elevenlabs-client';
export * from './helper';
export * from './types';
export * from './with-elevenlabs';

declare module 'feature-fetch' {
	interface TThirdPartyFeatures<GPaths> {
		elevenlabs: {
			getVoices(): Promise<TResult<TVoiceResponse, FetchError>>;
			generateTextToSpeach(
				config: TGenerateTextToSpeechConfig
			): Promise<TResult<ReadableStream, FetchError>>;
		};
	}
}