import { readFile, writeFile } from 'node:fs/promises';

const inputUrl = new URL('../openapi.json', import.meta.url);
const outputUrl = new URL('../src/openapi/document.gen.ts', import.meta.url);
const document = JSON.parse(await readFile(inputUrl, 'utf8')) as unknown;
const output = `// Generated from openapi.json by generate-openapi-runtime.ts. Do not edit directly.\nexport const openApiDocument = ${JSON.stringify(document, null, '\t')} as const;\n`;

await writeFile(outputUrl, output);
