import { writeFile } from 'node:fs/promises';
import { createApi } from '../src/api';
import { openApiDocumentConfig } from '../src/environment/configs/openapi.config';

const document = createApi().getOpenAPI31Document(openApiDocumentConfig);

await writeFile(
	new URL('../openapi.json', import.meta.url),
	`${JSON.stringify(document, null, 2)}\n`
);
