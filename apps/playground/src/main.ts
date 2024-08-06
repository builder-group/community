import { wasm, xmlToObject } from 'roxmltree';

const response = await fetch('http://localhost:5173/midsize.xml');
const sample = await response.text();

console.log('Sample', { sample });

await wasm.initWasm();

console.log(xmlToObject(sample));

console.log(wasm.xmlToObject(sample, false));

// wasm.parseXml(
// 	`
//   <note>
// <to>Tove</to>
// <from>Jani</from>
// <heading>Reminder</heading>
// <body>Don't forget me this weekend!</body>
// </note>
//   `,
// 	true,
// 	(token: any) => {
// 		console.log({ token });
// 	}
// );
