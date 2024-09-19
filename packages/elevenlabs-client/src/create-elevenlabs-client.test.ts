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

	it('should work', async () => {
		const result = await client.generateTextToSpeach({
			text: 'Hello World',
			voice: 'Sarah' // EXAVITQu4vr4xnSDxMaL
		});

		const audioStream = result.unwrap();
		const filePath = path.join(process.cwd(), 'test-audio.mp3');

		// Write the stream to the file using pipeline
		await pipelineAsync(audioStream, fs.createWriteStream(filePath));

		// Confirm that the file exists after the stream is written
		const fileExists = fs.existsSync(filePath);
		expect(fileExists).toBe(true);
	});
});
