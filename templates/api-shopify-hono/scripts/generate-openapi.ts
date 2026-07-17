import { writeFile } from 'node:fs/promises';
import { createApi } from '../src';
import { openApiDocumentConfig } from '../src/environment';

const document = createApi().getOpenAPI31Document(openApiDocumentConfig);
const outputUrl = new URL('../openapi.json', import.meta.url);

await writeFile(outputUrl, `${JSON.stringify(document, null, '\t')}\n`);
