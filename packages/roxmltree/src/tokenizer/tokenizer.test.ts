import { describe, expect, it } from 'vitest';

import { parse } from './index';
import { TXmlEvents, TXMLToken } from './types';

describe('tokenizer tests', () => {
	// TODO: Benchmark
	// bench(() => {
	// 	parse('<p><![CDATA[content]]></p>', true, new EventsCollector());
	// });

	describe('CDATA', () => {
		it('cdata_01', () => {
			assertTokens('<p><![CDATA[content]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: 'content',
					range: [3, 22]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [22, 26]
				}
			]);
		});

		it('cdata_02', () => {
			assertTokens('<p><![CDATA[&amping]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '&amping',
					range: [3, 22]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [22, 26]
				}
			]);
		});

		it('cdata_03', () => {
			assertTokens('<p><![CDATA[&amping ]]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '&amping ]',
					range: [3, 24]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [24, 28]
				}
			]);
		});

		it('cdata_04', () => {
			assertTokens('<p><![CDATA[&amping]] ]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '&amping]] ',
					range: [3, 25]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [25, 29]
				}
			]);
		});

		it('cdata_05', () => {
			assertTokens('<p><![CDATA[<message>text</message>]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '<message>text</message>',
					range: [3, 38]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [38, 42]
				}
			]);
		});

		it('cdata_06', () => {
			assertTokens('<p><![CDATA[</this is malformed!</malformed</malformed & worse>]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '</this is malformed!</malformed</malformed & worse>',
					range: [3, 66]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [66, 70]
				}
			]);
		});

		it('cdata_07', () => {
			assertTokens('<p><![CDATA[1]]><![CDATA[2]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: '1',
					range: [3, 16]
				},
				{
					type: 'Cdata',
					text: '2',
					range: [16, 29]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [29, 33]
				}
			]);
		});

		it('cdata_08', () => {
			assertTokens('<p> \n <![CDATA[data]]> \t </p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Text',
					text: ' \n ',
					range: [3, 6]
				},
				{
					type: 'Cdata',
					text: 'data',
					range: [6, 22]
				},
				{
					type: 'Text',
					text: ' \t ',
					range: [22, 25]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [25, 29]
				}
			]);
		});

		it('cdata_09', () => {
			assertTokens('<p><![CDATA[bracket ]after]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Cdata',
					text: 'bracket ]after',
					range: [3, 29]
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Close',
						prefix: '',
						name: 'p'
					},
					range: [29, 33]
				}
			]);
		});

		it('cdata_err_01', () => {
			assertTokens('<p><![CDATA[\u{1}]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					startPos: 0
				},
				{
					type: 'ElementEnd',
					variant: {
						type: 'Open'
					},
					range: [2, 3]
				},
				{
					type: 'Error',
					message: "a non-XML character '\\u{1}' found at 1:13"
				}
			]);
		});
	});

	describe('Comments', () => {
		it('comment_01', () => {
			assertTokens('<!--comment-->', [
				{
					type: 'Comment',
					text: 'comment',
					range: [0, 14]
				}
			]);
		});

		it('comment_02', () => {
			assertTokens('<!--<head>-->', [
				{
					type: 'Comment',
					text: '<head>',
					range: [0, 13]
				}
			]);
		});

		it('comment_03', () => {
			assertTokens('<!--<!-x-->', [
				{
					type: 'Comment',
					text: '<!-x',
					range: [0, 11]
				}
			]);
		});

		it('comment_04', () => {
			assertTokens('<!--<!x-->', [
				{
					type: 'Comment',
					text: '<!x',
					range: [0, 10]
				}
			]);
		});

		it('comment_05', () => {
			assertTokens('<!--<<!x-->', [
				{
					type: 'Comment',
					text: '<<!x',
					range: [0, 11]
				}
			]);
		});

		it('comment_06', () => {
			assertTokens('<!--<<!-x-->', [
				{
					type: 'Comment',
					text: '<<!-x',
					range: [0, 12]
				}
			]);
		});

		it('comment_07', () => {
			assertTokens('<!--<x-->', [
				{
					type: 'Comment',
					text: '<x',
					range: [0, 9]
				}
			]);
		});

		it('comment_08', () => {
			assertTokens('<!--<>-->', [
				{
					type: 'Comment',
					text: '<>',
					range: [0, 9]
				}
			]);
		});

		it('comment_09', () => {
			assertTokens('<!--<-->', [
				{
					type: 'Comment',
					text: '<',
					range: [0, 8]
				}
			]);
		});

		it('comment_10', () => {
			assertTokens('<!--<!-->', [
				{
					type: 'Comment',
					text: '<!',
					range: [0, 9]
				}
			]);
		});

		it('comment_11', () => {
			assertTokens('<!---->', [
				{
					type: 'Comment',
					text: '',
					range: [0, 7]
				}
			]);
		});
	});
});

type TToken = TXMLToken | TErrorToken;

interface TErrorToken {
	type: 'Error';
	message: string;
}

class EventsCollector implements TXmlEvents {
	public tokens: TToken[] = [];

	public token(token: TXMLToken): void {
		this.tokens.push(token);
	}
}

function collectTokens(text: string): TToken[] {
	const collector = new EventsCollector();
	try {
		parse(text, true, collector);
	} catch (error) {
		collector.tokens.push({ type: 'Error', message: '' });
	}
	return collector.tokens;
}

function assertTokens(text: string, tokens: TToken[]) {
	expect(collectTokens(text)).toStrictEqual(tokens);
}
