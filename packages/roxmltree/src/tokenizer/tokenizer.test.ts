import { describe, expect, it } from 'vitest';

import { parseString } from './index';
import { type TXMLToken } from './types';
import { XmlError } from './XmlError';

describe('tokenizer tests', () => {
	describe('CDATA', () => {
		it('cdata_01', () => {
			assertTokens('<p><![CDATA[content]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: 'content',
					range: { start: 3, end: 22 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 22, end: 26 }
				}
			]);
		});

		it('cdata_02', () => {
			assertTokens('<p><![CDATA[&amping]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '&amping',
					range: { start: 3, end: 22 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 22, end: 26 }
				}
			]);
		});

		it('cdata_03', () => {
			assertTokens('<p><![CDATA[&amping ]]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '&amping ]',
					range: { start: 3, end: 24 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 24, end: 28 }
				}
			]);
		});

		it('cdata_04', () => {
			assertTokens('<p><![CDATA[&amping]] ]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '&amping]] ',
					range: { start: 3, end: 25 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 25, end: 29 }
				}
			]);
		});

		it('cdata_05', () => {
			assertTokens('<p><![CDATA[<message>text</message>]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '<message>text</message>',
					range: { start: 3, end: 38 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 38, end: 42 }
				}
			]);
		});

		it('cdata_06', () => {
			assertTokens('<p><![CDATA[</this is malformed!</malformed</malformed & worse>]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '</this is malformed!</malformed</malformed & worse>',
					range: { start: 3, end: 66 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 66, end: 70 }
				}
			]);
		});

		it('cdata_07', () => {
			assertTokens('<p><![CDATA[1]]><![CDATA[2]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: '1',
					range: { start: 3, end: 16 }
				},
				{
					type: 'Cdata',
					text: '2',
					range: { start: 16, end: 29 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 29, end: 33 }
				}
			]);
		});

		it('cdata_08', () => {
			assertTokens('<p> \n <![CDATA[data]]> \t </p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: ' \n ',
					range: { start: 3, end: 6 }
				},
				{
					type: 'Cdata',
					text: 'data',
					range: { start: 6, end: 22 }
				},
				{
					type: 'Text',
					text: ' \t ',
					range: { start: 22, end: 25 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 25, end: 29 }
				}
			]);
		});

		it('cdata_09', () => {
			assertTokens('<p><![CDATA[bracket ]after]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Cdata',
					text: 'bracket ]after',
					range: { start: 3, end: 29 }
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Close',
						prefix: '',
						local: 'p'
					},
					range: { start: 29, end: 33 }
				}
			]);
		});

		it('cdata_err_01', () => {
			assertTokens('<p><![CDATA[\u{1}]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Open'
					},
					range: { start: 2, end: 3 }
				},
				{
					type: 'Error',
					message: "a non-XML character '\\u{0001}' found at 1:13"
				}
			]);
		});
	});

	describe('Comment', () => {
		it('comment_01', () => {
			assertTokens('<!--comment-->', [
				{
					type: 'Comment',
					text: 'comment',
					range: { start: 0, end: 14 }
				}
			]);
		});

		it('comment_02', () => {
			assertTokens('<!--<head>-->', [
				{
					type: 'Comment',
					text: '<head>',
					range: { start: 0, end: 13 }
				}
			]);
		});

		it('comment_03', () => {
			assertTokens('<!--<!-x-->', [
				{
					type: 'Comment',
					text: '<!-x',
					range: { start: 0, end: 11 }
				}
			]);
		});

		it('comment_04', () => {
			assertTokens('<!--<!x-->', [
				{
					type: 'Comment',
					text: '<!x',
					range: { start: 0, end: 10 }
				}
			]);
		});

		it('comment_05', () => {
			assertTokens('<!--<<!x-->', [
				{
					type: 'Comment',
					text: '<<!x',
					range: { start: 0, end: 11 }
				}
			]);
		});

		it('comment_06', () => {
			assertTokens('<!--<<!-x-->', [
				{
					type: 'Comment',
					text: '<<!-x',
					range: { start: 0, end: 12 }
				}
			]);
		});

		it('comment_07', () => {
			assertTokens('<!--<x-->', [
				{
					type: 'Comment',
					text: '<x',
					range: { start: 0, end: 9 }
				}
			]);
		});

		it('comment_08', () => {
			assertTokens('<!--<>-->', [
				{
					type: 'Comment',
					text: '<>',
					range: { start: 0, end: 9 }
				}
			]);
		});

		it('comment_09', () => {
			assertTokens('<!--<-->', [
				{
					type: 'Comment',
					text: '<',
					range: { start: 0, end: 8 }
				}
			]);
		});

		it('comment_10', () => {
			assertTokens('<!--<!-->', [
				{
					type: 'Comment',
					text: '<!',
					range: { start: 0, end: 9 }
				}
			]);
		});

		it('comment_11', () => {
			assertTokens('<!---->', [
				{
					type: 'Comment',
					text: '',
					range: { start: 0, end: 7 }
				}
			]);
		});

		it('comment_err_01', () => {
			assertTokens('<!----!>', [
				{
					type: 'Error',
					message: "expected '-->' at 1:9"
				}
			]);
		});

		it('comment_err_02', () => {
			assertTokens('<!----!', [
				{
					type: 'Error',
					message: "expected '-->' at 1:8"
				}
			]);
		});

		it('comment_err_03', () => {
			assertTokens('<!----', [
				{
					type: 'Error',
					message: "expected '-->' at 1:7"
				}
			]);
		});

		it('comment_err_04', () => {
			assertTokens('<!--->', [
				{
					type: 'Error',
					message: "expected '-->' at 1:7"
				}
			]);
		});

		it('comment_err_05', () => {
			assertTokens('<!-----', [
				{
					type: 'Error',
					message: "expected '-->' at 1:8"
				}
			]);
		});

		it('comment_err_06', () => {
			assertTokens('<!-->', [
				{
					type: 'Error',
					message: "expected '-->' at 1:6"
				}
			]);
		});

		it('comment_err_07', () => {
			assertTokens('<!--', [
				{
					type: 'Error',
					message: "expected '-->' at 1:5"
				}
			]);
		});

		it('comment_err_08', () => {
			assertTokens('<!--x', [
				{
					type: 'Error',
					message: "expected '-->' at 1:6"
				}
			]);
		});

		it('comment_err_09', () => {
			assertTokens('<!--<', [
				{
					type: 'Error',
					message: "expected '-->' at 1:6"
				}
			]);
		});

		it('comment_err_10', () => {
			assertTokens('<!--<!-', [
				{
					type: 'Error',
					message: "expected '-->' at 1:8"
				}
			]);
		});

		it('comment_err_11', () => {
			assertTokens('<!--<!-', [
				{
					type: 'Error',
					message: "expected '-->' at 1:8"
				}
			]);
		});

		it('comment_err_12', () => {
			assertTokens('<!--<!--', [
				{
					type: 'Error',
					message: "expected '-->' at 1:9"
				}
			]);
		});

		it('comment_err_13', () => {
			assertTokens('<!--<!--!', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_14', () => {
			assertTokens('<!--<!--!>', [
				{
					type: 'Error',
					message: "expected '-->' at 1:11"
				}
			]);
		});

		it('comment_err_15', () => {
			assertTokens('<!--<!---', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_16', () => {
			assertTokens('<!--<!--x', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_17', () => {
			assertTokens('<!--<!--x-', [
				{
					type: 'Error',
					message: "expected '-->' at 1:11"
				}
			]);
		});

		it('comment_err_18', () => {
			assertTokens('<!--<!--x--', [
				{
					type: 'Error',
					message: "expected '-->' at 1:12"
				}
			]);
		});

		it('comment_err_19', () => {
			assertTokens('<!--<!--x-->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_20', () => {
			assertTokens('<!--<!-x', [
				{
					type: 'Error',
					message: "expected '-->' at 1:9"
				}
			]);
		});

		it('comment_err_21', () => {
			assertTokens('<!--<!-x-', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_22', () => {
			assertTokens('<!--<!-x--', [
				{
					type: 'Error',
					message: "expected '-->' at 1:11"
				}
			]);
		});

		it('comment_err_23', () => {
			assertTokens('<!--<!x', [
				{
					type: 'Error',
					message: "expected '-->' at 1:8"
				}
			]);
		});

		it('comment_err_24', () => {
			assertTokens('<!--<!x-', [
				{
					type: 'Error',
					message: "expected '-->' at 1:9"
				}
			]);
		});

		it('comment_err_25', () => {
			assertTokens('<!--<!x--', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_26', () => {
			assertTokens('<!--<<!--x-->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_27', () => {
			assertTokens('<!--<!<!--x-->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_28', () => {
			assertTokens('<!--<!-<!--x-->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_29', () => {
			assertTokens('<!----!->', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_30', () => {
			assertTokens('<!----!x>', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_31', () => {
			assertTokens('<!-----x>', [
				{
					type: 'Error',
					message: "expected '-->' at 1:10"
				}
			]);
		});

		it('comment_err_32', () => {
			assertTokens('<!----->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_33', () => {
			assertTokens('<!------>', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_34', () => {
			assertTokens('<!-- --->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});

		it('comment_err_35', () => {
			assertTokens('<!--a--->', [
				{
					type: 'Error',
					message: "comment at 1:1 contains '--'"
				}
			]);
		});
	});

	describe('DTD', () => {
		it('dtd_01', () => {
			assertTokens('<!DOCTYPE greeting SYSTEM "hello.dtd">', [
				// No tokens expected
			]);
		});

		it('dtd_02', () => {
			assertTokens('<!DOCTYPE greeting PUBLIC "hello.dtd" "goodbye.dtd">', [
				// No tokens expected
			]);
		});

		it('dtd_03', () => {
			assertTokens("<!DOCTYPE greeting SYSTEM 'hello.dtd'>", [
				// No tokens expected
			]);
		});

		it('dtd_04', () => {
			assertTokens('<!DOCTYPE greeting>', [
				// No tokens expected
			]);
		});

		it('dtd_05', () => {
			assertTokens('<!DOCTYPE greeting []>', [
				// No tokens expected
			]);
		});

		it('dtd_06', () => {
			assertTokens('<!DOCTYPE greeting><a/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 19
				},
				{
					type: 'ElementEnd',
					end: {
						type: 'Empty'
					},
					range: { start: 21, end: 23 }
				}
			]);
		});

		it('dtd_07', () => {
			assertTokens('<!DOCTYPE greeting [] >', [
				// No tokens expected
			]);
		});

		it('dtd_08', () => {
			assertTokens('<!DOCTYPE greeting [ ] >', [
				// No tokens expected
			]);
		});

		it('dtd_entity_01', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/">\n]>',
				[
					{
						type: 'EntityDecl',
						name: 'ns_extend',
						definition: 'http://ns.adobe.com/Extensibility/1.0/'
					}
				]
			);
		});

		it('dtd_entity_02', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ENTITY Pub-Status "This is a pre-release of the\nspecification.">\n]>',
				[
					{
						type: 'EntityDecl',
						name: 'Pub-Status',
						definition: 'This is a pre-release of the\nspecification.'
					}
				]
			);
		});

		it('dtd_entity_03', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ENTITY open-hatch SYSTEM "http://www.textuality.com/boilerplate/OpenHatch.xml">\n]>',
				[
					// No tokens expected
				]
			);
		});

		it('dtd_entity_04', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ENTITY open-hatch\n             PUBLIC "-//Textuality//TEXT Standard open-hatch boilerplate//EN"\n             "http://www.textuality.com/boilerplate/OpenHatch.xml">\n]>',
				[
					// No tokens expected
				]
			);
		});

		// TODO: NDATA will be ignored
		it('dtd_entity_05', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ENTITY hatch-pic SYSTEM "../grafix/OpenHatch.gif" NDATA gif >\n]>',
				[
					// NDATA is ignored, no tokens expected
				]
			);
		});

		// TODO: unsupported data will be ignored
		it('dtd_entity_06', () => {
			assertTokens(
				'<!DOCTYPE svg [\n    <!ELEMENT sgml ANY>\n    <!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/">\n    <!NOTATION example1SVG-rdf SYSTEM "example1.svg.rdf">\n    <!ATTLIST img data ENTITY #IMPLIED>\n]>',
				[
					{
						type: 'EntityDecl',
						name: 'ns_extend',
						definition: 'http://ns.adobe.com/Extensibility/1.0/'
					}
				]
			);
		});

		it('dtd_err_01', () => {
			assertTokens('<!DOCTYPEEG[<!ENTITY%ETT\nSSSSSSSS<D_IDYT;->\n<', [
				{
					type: 'Error',
					message: "expected a whitespace not '\\u{0045}' at 1:10"
				}
			]);
		});

		it('dtd_err_02', () => {
			assertTokens('<!DOCTYPE s [<!ENTITY % name S YSTEM', [
				{
					type: 'Error',
					message: 'invalid ExternalID at 1:30'
				}
			]);
		});

		it('dtd_err_03', () => {
			assertTokens('<!DOCTYPE s [<!ENTITY % name B', [
				{
					type: 'Error',
					message: "expected a quote, SYSTEM or PUBLIC not '\\u{0042}' at 1:30"
				}
			]);
		});

		it('dtd_err_04', () => {
			assertTokens('<!DOCTYPE s []', [
				{
					type: 'Error',
					message: 'unexpected end of stream'
				}
			]);
		});

		it('dtd_err_05', () => {
			assertTokens('<!DOCTYPE s [] !', [
				{
					type: 'Error',
					message: "expected '>' not '\\u{0021}' at 1:16"
				}
			]);
		});
	});

	describe('Document', () => {
		it('document_01', () => {
			assertTokens('', [
				// No tokens expected
			]);
		});

		it('document_02', () => {
			assertTokens('    ', [
				// No tokens expected
			]);
		});

		it('document_03', () => {
			assertTokens(' \n\t\r ', [
				// No tokens expected
			]);
		});

		it('document_05', () => {
			assertTokens(
				'\uFEFF<a/>', // \u{FEFF} is the BOM (Byte Order Mark) for UTF-8
				[
					{
						type: 'ElementStart',
						prefix: '',
						local: 'a',
						start: 1
						// start: 3 // When based on bytes
					},
					{
						type: 'ElementEnd',
						end: { type: 'Empty' },
						range: { start: 3, end: 5 }
						// range: { start: 5, end: 7 } // When based on bytes
					}
				]
			);
		});

		it('document_06', () => {
			assertTokens("<?xml version='1.0'?>", []);
		});

		it('document_07', () => {
			assertTokens(
				"<?xml version='1.0' encoding='utf-8'?>\n<!-- comment -->\n<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>",
				[
					{
						type: 'Comment',
						text: ' comment ',
						range: { start: 39, end: 55 }
					}
				]
			);
		});

		it('document_08', () => {
			assertTokens(
				"<?xml-stylesheet?>\n<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>",
				[
					{
						type: 'ProcessingInstruction',
						target: 'xml-stylesheet',
						content: undefined,
						range: { start: 0, end: 18 }
					}
				]
			);
		});

		it('document_09', () => {
			assertTokens(
				"<?xml version='1.0' encoding='utf-8'?>\n<?xml-stylesheet?>\n<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>",
				[
					{
						type: 'ProcessingInstruction',
						target: 'xml-stylesheet',
						content: undefined,
						range: { start: 39, end: 57 }
					}
				]
			);
		});

		// TODO: better error
		it('document_err_01', () => {
			assertTokens('<![CDATA[text]]>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('document_err_02', () => {
			assertTokens(' &www---------Ӥ+----------w-----www_', [
				{
					type: 'Error',
					message: 'unknown token at 1:2'
				}
			]);
		});

		it('document_err_03', () => {
			assertTokens('q', [
				{
					type: 'Error',
					message: 'unknown token at 1:1'
				}
			]);
		});

		it('document_err_04', () => {
			assertTokens('<!>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		// TODO: better error
		it('document_err_05', () => {
			assertTokens('<!DOCTYPE greeting1><!DOCTYPE greeting2>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:22'
				}
			]);
		});

		it('document_err_06', () => {
			assertTokens('&#x20;', [
				{
					type: 'Error',
					message: 'unknown token at 1:1'
				}
			]);
		});
	});

	describe('Element', () => {
		it('element_01', () => {
			assertTokens('<a/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 2, end: 4 }
				}
			]);
		});

		it('element_02', () => {
			assertTokens('<a></a>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'a' },
					range: { start: 3, end: 7 }
				}
			]);
		});

		it('element_03', () => {
			assertTokens('  \t  <a/>   \n ', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 5
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 7, end: 9 }
				}
			]);
		});

		it('element_04', () => {
			assertTokens('  \t  <b><a/></b>   \n ', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'b',
					start: 5
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 7, end: 8 }
				},
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 8
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 10, end: 12 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'b' },
					range: { start: 12, end: 16 }
				}
			]);
		});

		// TODO
		// it('element_06', () => {
		// 	assertTokens('<俄语 լեզու="ռուսերեն">данные</俄语>', [
		// 		{
		// 			type: 'ElementStart',
		// 			prefix: '',
		// 			local: '俄语',
		// 			startPos: 0
		// 		},
		// 		{
		// 			type: 'Attr',
		// 			prefix: '',
		// 			local: 'լեզու',
		// 			value: 'ռուսերեն'
		// 		},
		// 		{
		// 			type: 'ElementEnd',
		// 			variant: { type: 'Open' },
		// 			range: {start: 37, end: 38}
		// 		},
		// 		{
		// 			type: 'Text',
		// 			text: 'данные',
		// 			range: {start: 38, end: 50}
		// 		},
		// 		{
		// 			type: 'ElementEnd',
		// 			variant: { type: 'Close', prefix: '', local: '俄语' },
		// 			range: {start: 50, end: 59}
		// 		}
		// 	]);
		// });

		it('element_07', () => {
			assertTokens('<svg:circle></svg:circle>', [
				{
					type: 'ElementStart',
					prefix: 'svg',
					local: 'circle',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 11, end: 12 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: 'svg', local: 'circle' },
					range: { start: 12, end: 25 }
				}
			]);
		});

		it('element_08', () => {
			assertTokens('<:circle/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'circle',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 8, end: 10 }
				}
			]);
		});

		it('element_err_01', () => {
			assertTokens('<>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_02', () => {
			assertTokens('</', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_03', () => {
			assertTokens('</a', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_04', () => {
			assertTokens("<a x='test' /", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'x',
					value: 'test'
				},
				{
					type: 'Error',
					message: 'unexpected end of stream'
				}
			]);
		});

		it('element_err_05', () => {
			assertTokens('<<', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_06', () => {
			assertTokens('< a', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_07', () => {
			assertTokens('< ', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_08', () => {
			assertTokens('<&#x9;', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_09', () => {
			assertTokens('<a></a></a>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'a' },
					range: { start: 3, end: 7 }
				},
				{
					type: 'Error',
					message: 'unknown token at 1:8'
				}
			]);
		});

		it('element_err_10', () => {
			assertTokens('<a/><a/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 2, end: 4 }
				},
				{
					type: 'Error',
					message: 'unknown token at 1:5'
				}
			]);
		});

		it('element_err_11', () => {
			assertTokens('<a></br/></a>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Error',
					message: "expected '\\u{003E}' not '\\u{002F}' at 1:8"
				}
			]);
		});

		it('element_err_12', () => {
			assertTokens('<svg:/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_13', () => {
			assertTokens(`<root>\n</root>\n</root>`, [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'root',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 5, end: 6 }
				},
				{
					type: 'Text',
					text: '\n',
					range: { start: 6, end: 7 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'root' },
					range: { start: 7, end: 14 }
				},
				{
					type: 'Error',
					message: 'unknown token at 3:1'
				}
			]);
		});

		it('element_err_14', () => {
			assertTokens('<-svg/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_15', () => {
			assertTokens('<svg:-svg/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_16', () => {
			assertTokens('<svg::svg/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_17', () => {
			assertTokens('<svg:s:vg/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});

		it('element_err_18', () => {
			assertTokens('<::svg/>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:2'
				}
			]);
		});
	});

	describe('Attribute', () => {
		it('attribute_01', () => {
			assertTokens('<a ax="test"/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'ax',
					value: 'test'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 12, end: 14 }
				}
			]);
		});

		it('attribute_02', () => {
			assertTokens("<a ax='test'/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'ax',
					value: 'test'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 12, end: 14 }
				}
			]);
		});

		it('attribute_03', () => {
			assertTokens('<a b=\'test1\' c="test2"/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'b',
					value: 'test1'
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'c',
					value: 'test2'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 22, end: 24 }
				}
			]);
		});

		it('attribute_04', () => {
			assertTokens('<a b=\'"test1"\' c="\'test2\'"/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'a',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'b',
					value: '"test1"'
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'c',
					value: "'test2'"
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 26, end: 28 }
				}
			]);
		});

		it('attribute_05', () => {
			assertTokens('<c a="test1\' c=\'test2" b=\'test1" c="test2\'/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'a',
					value: "test1' c='test2"
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'b',
					value: 'test1" c="test2'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 42, end: 44 }
				}
			]);
		});

		it('attribute_06', () => {
			assertTokens("<c   a   =    'test1'     />", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'a',
					value: 'test1'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 26, end: 28 }
				}
			]);
		});

		it('attribute_07', () => {
			assertTokens("<c q:a='b'/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Attr',
					prefix: 'q',
					local: 'a',
					value: 'b'
				},
				{
					type: 'ElementEnd',
					end: { type: 'Empty' },
					range: { start: 10, end: 12 }
				}
			]);
		});

		it('attribute_err_01', () => {
			assertTokens('<c az=test>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Error',
					message: "expected a quote not '\\u{0074}' at 1:7"
				}
			]);
		});

		it('attribute_err_02', () => {
			assertTokens('<c a>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Error',
					message: "expected '\\u{003D}' not '\\u{003E}' at 1:5"
				}
			]);
		});

		it('attribute_err_03', () => {
			assertTokens('<c a/>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Error',
					message: "expected '\\u{003D}' not '\\u{002F}' at 1:5"
				}
			]);
		});

		it('attribute_err_04', () => {
			assertTokens("<c a='b' q/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'a',
					value: 'b'
				},
				{
					type: 'Error',
					message: "expected '\\u{003D}' not '\\u{002F}' at 1:11"
				}
			]);
		});

		it('attribute_err_05', () => {
			assertTokens("<c a='<'/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Error',
					message: "expected '\\u{0027}' not '\\u{003C}' at 1:7"
				}
			]);
		});

		it('attribute_err_06', () => {
			assertTokens("<c a='\u{1}'/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Error',
					message: "a non-XML character '\\u{0001}' found at 1:7"
				}
			]);
		});

		it('attribute_err_07', () => {
			assertTokens("<c a='v'b='v'/>", [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'c',
					start: 0
				},
				{
					type: 'Attr',
					prefix: '',
					local: 'a',
					value: 'v'
				},
				{
					type: 'Error',
					message: "expected a whitespace not '\\u{0062}' at 1:9"
				}
			]);
		});
	});

	describe('PI', () => {
		it('pi_01', () => {
			assertTokens('<?xslt ma?>', [
				{
					type: 'ProcessingInstruction',
					target: 'xslt',
					content: 'ma',
					range: { start: 0, end: 11 }
				}
			]);
		});

		it('pi_02', () => {
			assertTokens('<?xslt \t\n m?>', [
				{
					type: 'ProcessingInstruction',
					target: 'xslt',
					content: 'm',
					range: { start: 0, end: 13 }
				}
			]);
		});

		it('pi_03', () => {
			assertTokens('<?xslt?>', [
				{
					type: 'ProcessingInstruction',
					target: 'xslt',
					content: undefined,
					range: { start: 0, end: 8 }
				}
			]);
		});

		it('pi_04', () => {
			assertTokens('<?xslt ?>', [
				{
					type: 'ProcessingInstruction',
					target: 'xslt',
					content: undefined,
					range: { start: 0, end: 9 }
				}
			]);
		});

		it('pi_05', () => {
			assertTokens('<?xml-stylesheet?>', [
				{
					type: 'ProcessingInstruction',
					target: 'xml-stylesheet',
					content: undefined,
					range: { start: 0, end: 18 }
				}
			]);
		});

		it('pi_err_01', () => {
			assertTokens('<??xml \t\n m?>', [
				{
					type: 'Error',
					message: 'invalid name token at 1:3'
				}
			]);
		});
	});

	describe('Declaration', () => {
		it('declaration_01', () => {
			assertTokens('<?xml version="1.0"?>', []);
		});

		it('declaration_02', () => {
			assertTokens("<?xml version='1.0'?>", []);
		});

		it('declaration_03', () => {
			assertTokens('<?xml version=\'1.0\' encoding="UTF-8"?>', []);
		});

		it('declaration_04', () => {
			assertTokens("<?xml version='1.0' encoding='UTF-8'?>", []);
		});

		it('declaration_05', () => {
			assertTokens("<?xml version='1.0' encoding='utf-8'?>", []);
		});

		it('declaration_06', () => {
			assertTokens("<?xml version='1.0' encoding='EUC-JP'?>", []);
		});

		it('declaration_07', () => {
			assertTokens("<?xml version='1.0' encoding='UTF-8' standalone='yes'?>", []);
		});

		it('declaration_08', () => {
			assertTokens("<?xml version='1.0' encoding='UTF-8' standalone='no'?>", []);
		});

		it('declaration_09', () => {
			assertTokens("<?xml version='1.0' standalone='no'?>", []);
		});

		it('declaration_10', () => {
			assertTokens("<?xml version='1.0' standalone='no' ?>", []);
		});

		// Declaration with an invalid order
		it('declaration_err_01', () => {
			assertTokens("<?xml encoding='UTF-8' version='1.0'?>", [
				{
					type: 'Error',
					message: "expected 'version' at 1:7"
				}
			]);
		});

		it('declaration_err_05', () => {
			assertTokens("<?xml version='1.0' yes='true'?>", [
				{
					type: 'Error',
					message: "expected '?>' at 1:21"
				}
			]);
		});

		it('declaration_err_06', () => {
			assertTokens("<?xml version='1.0' encoding='UTF-8' standalone='yes' yes='true'?>", [
				{
					type: 'Error',
					message: "expected '?>' at 1:55"
				}
			]);
		});

		it('declaration_err_07', () => {
			assertTokens("\u{000a}<?xml\u{000a}&jg'];", [
				{
					type: 'Error',
					message: "expected '?>' at 3:7"
				}
			]);
		});

		it('declaration_err_08', () => {
			assertTokens('<?xml \t\n ?m?>', [
				{
					type: 'Error',
					message: "expected 'version' at 2:2"
				}
			]);
		});

		it('declaration_err_09', () => {
			assertTokens('<?xml \t\n m?>', [
				{
					type: 'Error',
					message: "expected 'version' at 2:2"
				}
			]);
		});

		// XML declaration allowed only at the start of the document
		it('declaration_err_10', () => {
			assertTokens(" <?xml version='1.0'?>", [
				{
					type: 'Error',
					message: 'unexpected XML declaration at 1:2'
				}
			]);
		});

		it('declaration_err_11', () => {
			assertTokens("<!-- comment --><?xml version='1.0'?>", [
				{
					type: 'Comment',
					text: ' comment ',
					range: { start: 0, end: 16 }
				},
				{
					type: 'Error',
					message: 'unexpected XML declaration at 1:17'
				}
			]);
		});

		it('declaration_err_12', () => {
			assertTokens("<?xml version='1.0'?><?xml version='1.0'?>", [
				{
					type: 'Error',
					message: 'unexpected XML declaration at 1:22'
				}
			]);
		});

		it('declaration_err_13', () => {
			assertTokens('<?target \u{1}content>', [
				{
					type: 'Error',
					message: "a non-XML character '\\u{0001}' found at 1:10"
				}
			]);
		});

		it('declaration_err_14', () => {
			assertTokens("<?xml version='1.0'encoding='UTF-8'?>", [
				{
					type: 'Error',
					message: "expected a whitespace not '\\u{0065}' at 1:20"
				}
			]);
		});

		it('declaration_err_15', () => {
			assertTokens("<?xml version='1.0' encoding='UTF-8'standalone='yes'?>", [
				{
					type: 'Error',
					message: "expected a whitespace not '\\u{0073}' at 1:37"
				}
			]);
		});

		it('declaration_err_16', () => {
			assertTokens("<?xml version='1.0'", [
				{
					type: 'Error',
					message: "expected '?>' at 1:20"
				}
			]);
		});
	});

	describe('Text', () => {
		it('text_01', () => {
			assertTokens('<p>text</p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: 'text',
					range: { start: 3, end: 7 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 7, end: 11 }
				}
			]);
		});

		it('text_02', () => {
			assertTokens('<p> text </p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: ' text ',
					range: { start: 3, end: 9 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 9, end: 13 }
				}
			]);
		});

		// 欄 is EF A4 9D. And EF can be mistreated for UTF-8 BOM
		it('text_03', () => {
			assertTokens('<p>欄</p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: '欄',
					range: { start: 3, end: 4 }
					// range: { start: 3, end: 6 } // When based on bytes
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 4, end: 8 }
					// range: { start: 6, end: 10 } // When based on bytes
				}
			]);
		});

		it('text_04', () => {
			assertTokens('<p> </p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: ' ',
					range: { start: 3, end: 4 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 4, end: 8 }
				}
			]);
		});

		it('text_05', () => {
			assertTokens('<p> \r\n\t </p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: ' \r\n\t ',
					range: { start: 3, end: 8 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 8, end: 12 }
				}
			]);
		});

		it('text_06', () => {
			assertTokens('<p>&#x20;</p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: '&#x20;',
					range: { start: 3, end: 9 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 9, end: 13 }
				}
			]);
		});

		it('text_07', () => {
			assertTokens('<p>]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Text',
					text: ']>',
					range: { start: 3, end: 5 }
				},
				{
					type: 'ElementEnd',
					end: { type: 'Close', prefix: '', local: 'p' },
					range: { start: 5, end: 9 }
				}
			]);
		});

		it('text_err_01', () => {
			assertTokens('<p>]]></p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Error',
					message: "']]>' at 1:7 is not allowed inside a character data"
				}
			]);
		});

		it('text_err_02', () => {
			assertTokens('<p>\u{0c}</p>', [
				{
					type: 'ElementStart',
					prefix: '',
					local: 'p',
					start: 0
				},
				{
					type: 'ElementEnd',
					end: { type: 'Open' },
					range: { start: 2, end: 3 }
				},
				{
					type: 'Error',
					message: "a non-XML character '\\u{000C}' found at 1:4"
				}
			]);
		});
	});
});

type TToken = TXMLToken | TErrorToken | TEntityDeclToken | TAttrToken;

interface TErrorToken {
	type: 'Error';
	message: string;
}

interface TEntityDeclToken {
	type: 'EntityDecl';
	name: string;
	definition: string;
}

interface TAttrToken {
	type: 'Attr';
	prefix: string;
	local: string;
	value: string;
}

function collectTokens(text: string): TToken[] {
	const tokens: TToken[] = [];
	try {
		parseString(text, true, (token) => {
			switch (token.type) {
				case 'EntityDeclaration':
					tokens.push({
						type: 'EntityDecl',
						name: token.name,
						definition: token.definition.toString()
					});
					break;
				case 'Attribute':
					tokens.push({
						type: 'Attr',
						prefix: token.prefix,
						local: token.local,
						value: token.value.toString()
					});
					break;
				default:
					tokens.push(token);
			}
		});
	} catch (error) {
		if (error instanceof XmlError) {
			tokens.push({ type: 'Error', message: error.message });
		} else {
			console.error(error);
		}
	}
	return tokens;
}

function assertTokens(text: string, tokens: TToken[]): void {
	expect(collectTokens(text)).toStrictEqual(tokens);
}
