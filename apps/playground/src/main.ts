import { initWasm, parseXml } from 'roxmltree';

console.log('Hello World');

await initWasm();

parseXml(
	`
  <note>
<to>Tove</to>
<from>Jani</from>
<heading>Reminder</heading>
<body>Don't forget me this weekend!</body>
</note>
  `,
	true,
	(token: any) => {
		console.log({ token });
	}
);
