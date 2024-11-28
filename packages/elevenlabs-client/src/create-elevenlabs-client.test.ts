import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';
import { createElvenLabsClient } from './create-elevenlabs-client';

const pipelineAsync = promisify(pipeline);

describe('createElevenLabsClient function tests', () => {
	let client: ReturnType<typeof createElvenLabsClient>;

	beforeAll(() => {
		client = createElvenLabsClient({
			apiKey: 'YOUR_API_KEY'
		});
	});

	it('should genertate text to speak', async () => {
		const result = await client.generateTextToSpeach({
			text: 'Hello',
			voice: 'Sarah' // EXAVITQu4vr4xnSDxMaL
		});

		const audioStream = result.unwrap().stream;
		const filePath = path.join(process.cwd(), 'test-audio.mp3');

		await pipelineAsync(audioStream, fs.createWriteStream(filePath));

		const fileExists = fs.existsSync(filePath);
		expect(fileExists).toBe(true);
	});

	it('should get voices', async () => {
		const result = await client.getVoices();

		// const voicesMap = result.unwrap().voices.reduce(
		// 	(map, voice) => ({
		// 		...map,
		// 		[voice.name]: {
		// 			voiceId: voice.voice_id,
		// 			labels: voice.labels,
		// 			previewUrl: voice.preview_url
		// 		}
		// 	}),
		// 	{}
		// );

		expect(result.isOk()).toBe(true);
	});
});
