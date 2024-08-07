import { type TTokenCallback } from './types';
import {
	CLOSE_BRACKET,
	DOUBLE_QUOTE,
	EXCLAMATION_MARK,
	GREATER_THAN,
	HYPHEN,
	LESS_THAN,
	OPEN_BRACKET,
	PERCENT,
	QUESTION_MARK,
	SINGLE_QUOTE,
	SLASH,
	UPPERCASE_P,
	UPPERCASE_S
} from './utils';
import { XmlError } from './XmlError';
import { type TXmlStream } from './XmlStream';

const BOM = Uint8Array.from([239, 187, 191]); // '\uFEFF'
const XML_DECLARATION = Uint8Array.from([60, 63, 120, 109, 108, 32]); // '<?xml '
const DOCTYPE_DECLARATION = Uint8Array.from([60, 33, 68, 79, 67, 84, 89, 80, 69]); // '<!DOCTYPE'
const COMMENT_START = Uint8Array.from([60, 33, 45, 45]); // '<!--'
const LESS_THAN_QUESTION = Uint8Array.from([60, 63]); // '<?'
const VERSION = Uint8Array.from([118, 101, 114, 115, 105, 111, 110]); // 'version'
const ENCODING = Uint8Array.from([101, 110, 99, 111, 100, 105, 110, 103]); // 'encoding'
const STANDALONE = Uint8Array.from([115, 116, 97, 110, 100, 97, 108, 111, 110, 101]); // 'standalone'
const QUESTION_GREATER_THAN = Uint8Array.from([63, 62]); // '?>'
const DASH_DASH_GREATER_THAN = Uint8Array.from([45, 45, 62]); // '-->'
const XML_SPACE = Uint8Array.from([60, 63, 120, 109, 108, 32]); // '<?xml '
const ENTITY_DECLARATION = Uint8Array.from([60, 33, 69, 78, 84, 73, 84, 89]); // '<!ENTITY'
const ELEMENT_DECLARATION = Uint8Array.from([60, 33, 69, 76, 69, 77, 69, 78, 84]); // '<!ELEMENT'
const ATTLIST_DECLARATION = Uint8Array.from([60, 33, 65, 84, 84, 76, 73, 83, 84]); // '<!ATTLIST'
const NOTATION_DECLARATION = Uint8Array.from([60, 33, 78, 79, 84, 65, 84, 73, 79, 78]); // '<!NOTATION'
const SYSTEM = Uint8Array.from([83, 89, 83, 84, 69, 77]); // 'SYSTEM'
const PUBLIC = Uint8Array.from([80, 85, 66, 76, 73, 67]); // 'PUBLIC'
const NDATA = Uint8Array.from([78, 68, 65, 84, 65]); // 'NDATA'
const CDATA_START = Uint8Array.from([60, 33, 91, 67, 68, 65, 84, 65, 91]); // '<![CDATA['
const CDATA_END = Uint8Array.from([93, 93, 62]); // ']]>'

function toText(bytes: Uint8Array): string {
	return String.fromCharCode(...bytes);
}

/**
 * Parses an XML document.
 *
 * document ::= prolog element Misc*
 *
 * https://www.w3.org/TR/xml/#NT-document
 */
export function parseXmlStream(
	s: TXmlStream,
	allowDtd: boolean,
	tokenCallback: TTokenCallback
): void {
	// Skip UTF-8 BOM
	if (s.startsWith(BOM)) {
		s.advance(1);
	}

	if (s.startsWith(XML_DECLARATION)) {
		parseDeclaration(s);
	}

	parseMisc(s, tokenCallback);

	s.skipSpaces();
	if (s.startsWith(DOCTYPE_DECLARATION)) {
		if (!allowDtd) {
			throw new XmlError({ type: 'DtdDetected' });
		}

		parseDoctype(s, tokenCallback);
		parseMisc(s, tokenCallback);
	}

	s.skipSpaces();
	if (!s.atEnd() && s.currByte() === LESS_THAN) {
		parseElement(s, tokenCallback);
	}

	parseMisc(s, tokenCallback);

	if (!s.atEnd()) {
		throw new XmlError({ type: 'UnknownToken', message: 'Not at end' }, s.genTextPos());
	}
}

/**
 * Parses miscellaneous XML content (comments, processing instructions, whitespace).
 *
 * Misc ::= Comment | PI | S
 *
 * https://www.w3.org/TR/xml/#NT-Misc
 */
function parseMisc(s: TXmlStream, tokenCallback: TTokenCallback): void {
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.startsWith(COMMENT_START)) {
			parseComment(s, tokenCallback);
		} else if (s.startsWith(LESS_THAN_QUESTION)) {
			parsePi(s, tokenCallback);
		} else {
			break;
		}
	}
}

/**
 * Parses the XML declaration.
 *
 * XMLDecl ::= '\<?xml' VersionInfo EncodingDecl? SDDecl? S? '?\>'
 *
 * https://www.w3.org/TR/xml/#sec-prolog-dtd
 */
function parseDeclaration(s: TXmlStream): void {
	s.advance(5); // <?xml
	consumeSpaces(s);

	// The `version` "attribute" is mandatory
	if (!s.startsWith(VERSION)) {
		throw new XmlError({ type: 'InvalidString', expected: 'version' }, s.genTextPos());
	}
	parseAttribute(s);
	consumeSpaces(s);

	if (s.startsWith(ENCODING)) {
		parseAttribute(s);
		consumeSpaces(s);
	}

	if (s.startsWith(STANDALONE)) {
		parseAttribute(s);
	}

	s.skipSpaces();
	s.skipBytes(QUESTION_GREATER_THAN);
}

function consumeSpaces(s: TXmlStream): void {
	if (s.startsWithSpace()) {
		s.skipSpaces();
	} else if (!s.startsWith(QUESTION_GREATER_THAN) && !s.atEnd()) {
		throw new XmlError(
			{ type: 'InvalidChar', expected: 'a whitespace', actual: s.currByteUnchecked() },
			s.genTextPos()
		);
	}
}

/**
 * Parses an XML comment.
 *
 * '\<!--' ((Char - '-') | ('-' (Char - '-')))* '--\>'
 *
 * https://www.w3.org/TR/xml/#sec-comments
 */
function parseComment(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(4);
	const bytes = s.consumeBytesWhile(
		(_s, c) => !(c === HYPHEN && _s.startsWith(DASH_DASH_GREATER_THAN))
	);
	const text = toText(bytes);
	s.skipBytes(DASH_DASH_GREATER_THAN);

	if (text.includes('--') || text.endsWith('-')) {
		throw new XmlError({ type: 'InvalidComment' }, s.genTextPosFrom(start));
	}

	tokenCallback({ type: 'Comment', text, range: s.rangeFrom(start) });
}

/**
 * Parses a processing instruction.
 *
 * PI       ::= '\<?' PITarget (S (Char* - (Char* '?\>' Char*)))? '?\>'
 * PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
 *
 * https://www.w3.org/TR/xml/#sec-pi
 */
function parsePi(s: TXmlStream, tokenCallback: TTokenCallback): void {
	if (s.startsWith(XML_SPACE)) {
		throw new XmlError({ type: 'UnexpectedDeclaration' }, s.genTextPos());
	}

	const start = s.getPos();
	s.advance(2);
	const target = s.consumeName();
	s.skipSpaces();
	const content = s.consumeBytesWhile(
		(_s, b) => !(b === QUESTION_MARK && _s.startsWith(QUESTION_GREATER_THAN))
	);

	s.skipBytes(QUESTION_GREATER_THAN);

	tokenCallback({
		type: 'ProcessingInstruction',
		target: toText(target),
		content: content.length === 0 ? undefined : toText(content),
		range: s.rangeFrom(start)
	});
}

/**
 * Parses the DOCTYPE declaration.
 */
function parseDoctype(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	parseDoctypeStart(s);
	s.skipSpaces();

	if (s.currByte() === GREATER_THAN) {
		s.advance(1);
		return;
	}

	s.advance(1); // '['
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.startsWith(ENTITY_DECLARATION)) {
			parseEntityDecl(s, tokenCallback);
		} else if (s.startsWith(COMMENT_START)) {
			parseComment(s, tokenCallback);
		} else if (s.startsWith(LESS_THAN_QUESTION)) {
			parsePi(s, tokenCallback);
		} else if (s.startsWith(Uint8Array.from([CLOSE_BRACKET]))) {
			// DTD ends with ']' S? '>', therefore we have to skip possible spaces
			s.advance(1);
			s.skipSpaces();
			if (s.currByte() === GREATER_THAN) {
				s.advance(1);
				break;
			} else {
				throw new XmlError(
					{ type: 'InvalidChar', expected: "'>'", actual: s.currByteUnchecked() },
					s.genTextPos()
				);
			}
		} else if (
			s.startsWith(ELEMENT_DECLARATION) ||
			s.startsWith(ATTLIST_DECLARATION) ||
			s.startsWith(NOTATION_DECLARATION)
		) {
			try {
				consumeDecl(s);
			} catch (e) {
				throw new XmlError(
					{ type: 'UnknownToken', message: 'Failed to consume declaration' },
					s.genTextPosFrom(start)
				);
			}
		} else {
			throw new XmlError(
				{ type: 'UnknownToken', message: 'Failed to parse doctype' },
				s.genTextPos()
			);
		}
	}
}

/**
 * Parses the start of a DOCTYPE declaration.
 *
 * doctypedecl ::= '\<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-doctypedecl
 */
function parseDoctypeStart(s: TXmlStream): void {
	s.advance(9);

	s.consumeSpaces();
	s.skipName();
	s.skipSpaces();

	parseExternalId(s);
	s.skipSpaces();

	const c = s.currByte();
	if (c !== OPEN_BRACKET && c !== GREATER_THAN) {
		throw new XmlError({ type: 'InvalidChar', expected: "'[' or '>'", actual: c }, s.genTextPos());
	}
}

/**
 * Parses an external ID.
 *
 * ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
 *
 * https://www.w3.org/TR/xml/#NT-ExternalID
 */
function parseExternalId(s: TXmlStream): boolean {
	if (s.startsWith(SYSTEM) || s.startsWith(PUBLIC)) {
		const start = s.getPos();
		s.advance(6);
		const id = s.sliceBack(start);

		s.consumeSpaces();
		const quote = s.consumeQuote();
		s.consumeBytesWhile((_, b) => b !== quote);
		s.consumeByte(quote);

		if (id === PUBLIC) {
			s.consumeSpaces();
			const _quote = s.consumeQuote();
			s.consumeBytesWhile((_, b) => b !== _quote);
			s.consumeByte(_quote);
		}

		return true;
	}

	return false;
}

/**
 * Parses an entity declaration.
 *
 * EntityDecl  ::= GEDecl | PEDecl
 * GEDecl      ::= '\<!ENTITY' S Name S EntityDef S? '\>'
 * PEDecl      ::= '\<!ENTITY' S '%' S Name S PEDef S? '\>'
 *
 * https://www.w3.org/TR/xml/#sec-entity-decl
 */
function parseEntityDecl(s: TXmlStream, tokenCallback: TTokenCallback): void {
	s.advance(8);
	s.consumeSpaces();

	const isGe = !s.tryConsumeByte(PERCENT);
	if (!isGe) {
		s.consumeSpaces();
	}

	const name = s.consumeName();
	s.consumeSpaces();
	const definition = parseEntityDef(s, isGe);
	if (definition !== null) {
		tokenCallback({ type: 'EntityDeclaration', name: toText(name), definition });
	}
	s.skipSpaces();
	s.consumeByte(GREATER_THAN);
}

/**
 * Parses an entity definition.
 *
 * EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
 * PEDef       ::= EntityValue | ExternalID
 * EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |  "'" ([^%&']
 *                              | PEReference | Reference)* "'"
 * ExternalID  ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
 * NDataDecl   ::= S 'NDATA' S Name
 *
 * https://www.w3.org/TR/xml/#sec-entity-decl
 */
function parseEntityDef(s: TXmlStream, isGe: boolean): string | null {
	const c = s.currByte();
	if (c === DOUBLE_QUOTE || c === SINGLE_QUOTE) {
		const quote = s.consumeQuote();
		const start = s.getPos();
		s.skipBytesWhile((_, b) => b !== quote);
		const value = s.sliceBack(start);
		s.consumeByte(quote);
		return toText(value);
	} else if (c === UPPERCASE_S || c === UPPERCASE_P) {
		if (parseExternalId(s)) {
			if (isGe) {
				s.skipSpaces();
				if (s.startsWith(NDATA)) {
					s.advance(5);
					s.consumeSpaces();
					s.skipName();
					// TODO: NDataDecl is not supported
				}
			}

			return null;
		}

		throw new XmlError({ type: 'InvalidExternalID' }, s.genTextPos());
	} else {
		throw new XmlError(
			{ type: 'InvalidChar', expected: 'a quote, SYSTEM or PUBLIC', actual: c },
			s.genTextPos()
		);
	}
}

/**
 * Consumes a declaration.
 */
function consumeDecl(s: TXmlStream): void {
	s.skipBytesWhile((_, b) => b !== GREATER_THAN);
	s.consumeByte(GREATER_THAN);
}

/**
 * Parses an XML element.
 *
 * element ::= EmptyElemTag | STag content ETag
 * '\<' Name (S Attribute)* S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-element
 */
function parseElement(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(1); // '<'
	const [prefix, local] = s.consumeQName();
	tokenCallback({
		type: 'ElementStart',
		prefix: toText(prefix),
		local: toText(local),
		start
	});

	let open = false;
	while (!s.atEnd()) {
		const hasSpace = s.startsWithSpace();
		s.skipSpaces();
		const _start = s.getPos();
		const currByte = s.currByte();

		if (currByte === SLASH) {
			s.advance(1);
			s.consumeByte(GREATER_THAN);
			const range = s.rangeFrom(_start);
			tokenCallback({ type: 'ElementEnd', end: { type: 'Empty' }, range });
			break;
		} else if (currByte === GREATER_THAN) {
			s.advance(1);
			const range = s.rangeFrom(_start);
			tokenCallback({ type: 'ElementEnd', end: { type: 'Open' }, range });
			open = true;
			break;
		} else {
			// An attribute must be preceded with a whitespace
			if (!hasSpace) {
				throw new XmlError(
					{ type: 'InvalidChar', expected: 'a whitespace', actual: s.currByteUnchecked() },
					s.genTextPos()
				);
			}

			const [_prefix, _local, value] = parseAttribute(s);
			const end = s.getPos();
			tokenCallback({
				type: 'Attribute',
				range: { start: _start, end },
				prefix: _prefix,
				local: _local,
				value
			});
		}
	}

	if (open) {
		parseContent(s, tokenCallback);
	}
}

/**
 * Parses an XML attribute.
 *
 * Attribute ::= Name Eq AttValue
 *
 * https://www.w3.org/TR/xml/#NT-Attribute
 */
function parseAttribute(s: TXmlStream): [string, string, string] {
	const [prefix, local] = s.consumeQName();
	s.consumeEq();
	const quote = s.consumeQuote();
	const valueStart = s.getPos();
	s.skipBytesWhile((_, b) => b !== quote && b !== LESS_THAN);
	const value = s.sliceBack(valueStart);
	s.consumeByte(quote);
	return [toText(prefix), toText(local), toText(value)];
}

/**
 * Parses the content of an XML element.
 *
 * content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
 *
 * https://www.w3.org/TR/xml/#NT-content
 */
function parseContent(s: TXmlStream, tokenCallback: TTokenCallback): void {
	while (!s.atEnd()) {
		const currByte = s.currByte();
		if (currByte === LESS_THAN) {
			const nextByte = s.nextByte();
			if (nextByte === EXCLAMATION_MARK) {
				if (s.startsWith(COMMENT_START)) {
					parseComment(s, tokenCallback);
				} else if (s.startsWith(CDATA_START)) {
					parseCdata(s, tokenCallback);
				} else {
					throw new XmlError(
						{ type: 'UnknownToken', message: 'Failed to parse content' },
						s.genTextPos()
					);
				}
			} else if (nextByte === QUESTION_MARK) {
				parsePi(s, tokenCallback);
			} else if (nextByte === SLASH) {
				parseCloseElement(s, tokenCallback);
				break;
			} else {
				parseElement(s, tokenCallback);
			}
		} else {
			parseText(s, tokenCallback);
		}
	}
}

/**
 * Parses a CDATA section.
 *
 * CDSect  ::= CDStart CData CDEnd
 * CDStart ::= '\<![CDATA['
 * CData   ::= (Char* - (Char* ']]\>' Char*))
 * CDEnd   ::= ']]\>'
 *
 * https://www.w3.org/TR/xml/#sec-cdata-sect
 */
function parseCdata(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(9); // <![CDATA[
	const text = s.consumeBytesWhile((_s, b) => !(b === CLOSE_BRACKET && _s.startsWith(CDATA_END)));
	s.skipBytes(CDATA_END);
	const range = s.rangeFrom(start);
	tokenCallback({ type: 'Cdata', text: toText(text), range });
}

/**
 * Parses a closing element tag.
 *
 * '\</' Name S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-ETag
 */
function parseCloseElement(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(2); // </

	const [prefix, local] = s.consumeQName();
	s.skipSpaces();
	s.consumeByte(GREATER_THAN);

	const range = s.rangeFrom(start);
	tokenCallback({
		type: 'ElementEnd',
		end: {
			type: 'Close',
			prefix: toText(prefix),
			local: toText(local)
		},
		range
	});
}

/**
 * Parses text content.
 */
function parseText(s: TXmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	const bytes = s.consumeBytesWhile((_, b) => b !== LESS_THAN);
	const text = toText(bytes);

	// According to the spec, `]]>` must not appear inside a Text node.
	// https://www.w3.org/TR/xml/#syntax
	//
	// Search for `>` first, since it's a bit faster than looking for `]]>`.
	if (text.includes('>') && text.includes(']]>')) {
		throw new XmlError({ type: 'InvalidCharacterData' }, s.genTextPos());
	}

	tokenCallback({ type: 'Text', text, range: s.rangeFrom(start) });
}
