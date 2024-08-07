import { parseXmlStream, TextXmlStream } from 'roxmltree';

const xmlResult = await fetch('http://localhost:5173/midsize.xml');
const xml = await xmlResult.text();
const xmlBytes = new TextEncoder().encode(xml);

console.log({ xml });

console.log('TextXmlStream');
for (let i = 0; i < 100; i++) {
	let tokenCount = 0;
	parseXmlStream(new TextXmlStream(xml), false, (token) => {
		if (token.type === 'ElementStart') {
			tokenCount++;
		}
	});
	console.log(tokenCount);
}

// console.log('ByteXmlStream');
// for (let i = 0; i < 100; i++) {
// 	let tokenCount = 0;
// 	parseXmlStream(new ByteXmlStream(xmlBytes), false, (token) => {
// 		if (token.type === 'ElementStart') {
// 			tokenCount++;
// 		}
// 	});
// 	console.log(tokenCount);
// }
