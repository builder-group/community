import {
	CLOSE_CURLY_BRACKET,
	CLOSE_SQUARE_BRACKET,
	DOUBLE_QUOTE,
	EQUALS,
	EXCLAMATION_MARK,
	GREATER_THAN,
	HYPHEN,
	LESS_THAN,
	OPEN_CURLY_BRACKET,
	OPEN_SQUARE_BRACKET,
	PERCENT,
	QUESTION_MARK,
	SINGLE_QUOTE,
	SLASH,
	UPPERCASE_P,
	UPPERCASE_S
} from './ascii-constants';
import { type TLiquidToken, type TTokenCallback } from './types';
import { isXmlSpaceByte } from './utils';
import { XmlError } from './XmlError';
import { XmlStream, type TXmlStreamOptions } from './XmlStream';

const BOM = '\uFEFF';
const XML_DECLARATION_START = '<?xml ';
const XML_DECLARATION_END = '?>';
const ENTITY_DECLARATION_START = '<!ENTITY';
const ELEMENT_DECLARATION_START = '<!ELEMENT';
const ATTLIST_DECLARATION_START = '<!ATTLIST';
const NOTATION_DECLARATION_START = '<!NOTATION';
const DOCTYPE_START = '<!DOCTYPE';
const PI_START = '<?';
const PI_END = '?>';
const COMMENT_START = '<!--';
const COMMENT_END = '-->';
const CDATA_START = '<![CDATA[';
const CDATA_END = ']]>';
const NDATA = 'NDATA';
const PUBLIC = 'PUBLIC';
const SYSTEM = 'SYSTEM';
const VERSION = 'version';
const ENCODING = 'encoding';
const STANDALONE = 'standalone';

export function tokenize(
	xmlString: string,
	tokenCallback: TTokenCallback,
	options: TXmlStreamOptions = {}
): void {
	tokenizeXmlStream(new XmlStream(xmlString, options), tokenCallback);
}

/**
 * Parses an XML document.
 *
 * document ::= prolog element Misc*
 *
 * https://www.w3.org/TR/xml/#NT-document
 */
export function tokenizeXmlStream(s: XmlStream, tokenCallback: TTokenCallback): void {
	// Skip UTF-8 BOM
	if (s.startsWith(BOM)) {
		s.advance(1);
	}

	if (s.startsWith(XML_DECLARATION_START)) {
		parseDeclaration(s);
	}

	parseMisc(s, tokenCallback);

	s.skipSpaces();
	if (s.startsWith(DOCTYPE_START)) {
		if (!s.config.allowDtd) {
			throw new XmlError({ type: 'DtdDetected' });
		}

		parseDoctype(s, tokenCallback);
		parseMisc(s, tokenCallback);
	}

	s.skipSpaces();

	if (s.config.strict) {
		if (!s.atEnd() && s.currCodeUnit() === LESS_THAN) {
			parseElement(s, tokenCallback);
		}

		parseMisc(s, tokenCallback);

		if (!s.atEnd()) {
			throw new XmlError({ type: 'UnknownToken', message: 'Not at end' }, s.genTextPos());
		}
	} else {
		while (!s.atEnd()) {
			if (s.currCodeUnitUnchecked() === LESS_THAN) {
				parseElement(s, tokenCallback);
			} else {
				parseText(s, tokenCallback);
			}
			parseMisc(s, tokenCallback);
		}
	}
}

/**
 * Parses miscellaneous XML content (comments, processing instructions, whitespace).
 *
 * Misc ::= Comment | PI | S
 *
 * https://www.w3.org/TR/xml/#NT-Misc
 */
function parseMisc(s: XmlStream, tokenCallback: TTokenCallback): void {
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.currCodeUnit() === OPEN_CURLY_BRACKET) {
			parseLiquid(s);
		} else if (s.startsWith(COMMENT_START)) {
			parseComment(s, tokenCallback);
		} else if (s.startsWith(PI_START)) {
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
function parseDeclaration(s: XmlStream): void {
	function consumeSpaces(_s: XmlStream): void {
		if (_s.startsWithSpace()) {
			_s.skipSpaces();
		} else if (!_s.startsWith(XML_DECLARATION_END) && !_s.atEnd()) {
			throw new XmlError(
				{ type: 'InvalidChar', expected: 'a whitespace', actual: _s.currCodeUnitUnchecked() },
				_s.genTextPos()
			);
		}
	}

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
	s.skipString(XML_DECLARATION_END);
}

/**
 * Parses an XML comment.
 *
 * '\<!--' ((Char - '-') | ('-' (Char - '-')))* '--\>'
 *
 * https://www.w3.org/TR/xml/#sec-comments
 */
function parseComment(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(4);
	const text = s.consumeCodeUnitsWhile((c, _s) => !(c === HYPHEN && _s.startsWith(COMMENT_END)));
	s.skipString(COMMENT_END);

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
function parsePi(s: XmlStream, tokenCallback: TTokenCallback): void {
	if (s.startsWith(XML_DECLARATION_START)) {
		throw new XmlError({ type: 'UnexpectedDeclaration' }, s.genTextPos());
	}

	const start = s.getPos();
	s.advance(2);
	const target = s.consumeName();
	s.skipSpaces();
	const content = s.consumeCodeUnitsWhile(
		(c, _s) => !(c === QUESTION_MARK && _s.startsWith(PI_END))
	);

	s.skipString(PI_END);

	tokenCallback({
		type: 'ProcessingInstruction',
		target,
		content: content.length === 0 ? undefined : content,
		range: s.rangeFrom(start)
	});
}

/**
 * Parses the DOCTYPE declaration.
 */
function parseDoctype(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	parseDoctypeStart(s);
	s.skipSpaces();

	if (s.currCodeUnit() === GREATER_THAN) {
		s.advance(1);
		return;
	}

	s.advance(1); // '['
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.startsWith(ENTITY_DECLARATION_START)) {
			parseEntityDecl(s, tokenCallback);
		} else if (s.startsWith(COMMENT_START)) {
			parseComment(s, tokenCallback);
		} else if (s.startsWith(PI_START)) {
			parsePi(s, tokenCallback);
		} else if (s.startsWith(']')) {
			// DTD ends with ']' S? '>', therefore we have to skip possible spaces
			s.advance(1);
			s.skipSpaces();
			if (s.currCodeUnit() === GREATER_THAN) {
				s.advance(1);
				break;
			} else {
				throw new XmlError(
					{ type: 'InvalidChar', expected: "'>'", actual: s.currCodeUnitUnchecked() },
					s.genTextPos()
				);
			}
		} else if (
			s.startsWith(ELEMENT_DECLARATION_START) ||
			s.startsWith(ATTLIST_DECLARATION_START) ||
			s.startsWith(NOTATION_DECLARATION_START)
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
function parseDoctypeStart(s: XmlStream): void {
	s.advance(9);

	s.consumeSpaces();
	s.skipName();
	s.skipSpaces();

	parseExternalId(s);
	s.skipSpaces();

	const currCodeUnit = s.currCodeUnit();
	if (currCodeUnit !== OPEN_SQUARE_BRACKET && currCodeUnit !== GREATER_THAN) {
		throw new XmlError(
			{ type: 'InvalidChar', expected: "'[' or '>'", actual: currCodeUnit },
			s.genTextPos()
		);
	}
}

/**
 * Parses an external ID.
 *
 * ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
 *
 * https://www.w3.org/TR/xml/#NT-ExternalID
 */
function parseExternalId(s: XmlStream): boolean {
	if (s.startsWith(SYSTEM) || s.startsWith(PUBLIC)) {
		const start = s.getPos();
		s.advance(6);
		const id = s.sliceBack(start);

		s.consumeSpaces();
		const quote = s.consumeQuote();
		s.consumeCodeUnitsWhile((c) => c !== quote);
		s.consumeCodeUnit(quote);

		if (id === PUBLIC) {
			s.consumeSpaces();
			const _quote = s.consumeQuote();
			s.consumeCodeUnitsWhile((c) => c !== _quote);
			s.consumeCodeUnit(_quote);
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
function parseEntityDecl(s: XmlStream, tokenCallback: TTokenCallback): void {
	s.advance(8);
	s.consumeSpaces();

	const isGe = !s.tryConsumeCodeUnit(PERCENT);
	if (!isGe) {
		s.consumeSpaces();
	}

	const name = s.consumeName();
	s.consumeSpaces();
	const definition = parseEntityDef(s, isGe);
	if (definition !== null) {
		tokenCallback({ type: 'EntityDeclaration', name, definition });
	}
	s.skipSpaces();
	s.consumeCodeUnit(GREATER_THAN);
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
function parseEntityDef(s: XmlStream, isGe: boolean): string | null {
	const currCodeUnit = s.currCodeUnit();
	if (currCodeUnit === DOUBLE_QUOTE || currCodeUnit === SINGLE_QUOTE) {
		const quote = s.consumeQuote();
		const start = s.getPos();
		s.skipCodeUnitsWhile((c) => c !== quote);
		const value = s.sliceBack(start);
		s.consumeCodeUnit(quote);
		return value;
	} else if (currCodeUnit === UPPERCASE_S || currCodeUnit === UPPERCASE_P) {
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
			{ type: 'InvalidChar', expected: 'a quote, SYSTEM or PUBLIC', actual: currCodeUnit },
			s.genTextPos()
		);
	}
}

/**
 * Consumes a declaration.
 */
function consumeDecl(s: XmlStream): void {
	s.skipCodeUnitsWhile((c) => c !== GREATER_THAN);
	s.consumeCodeUnit(GREATER_THAN);
}

/**
 * Parses an XML element.
 *
 * element ::= EmptyElemTag | STag content ETag
 * '\<' Name (S Attribute)* S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-element
 */
function parseElement(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(1); // '<'
	const [prefix, local] = s.consumeQName();
	tokenCallback({ type: 'ElementStart', prefix, local, start });

	let open = false;
	while (!s.atEnd()) {
		const hasSpace = s.startsWithSpace();
		s.skipSpaces();
		const _start = s.getPos();
		const currCodeUnit = s.currCodeUnit();

		if (currCodeUnit === OPEN_CURLY_BRACKET) {
			parseLiquid(s);
		} else if (currCodeUnit === SLASH) {
			s.advance(1);
			s.consumeCodeUnit(GREATER_THAN);
			const range = s.rangeFrom(_start);
			tokenCallback({ type: 'ElementEnd', end: { type: 'Empty' }, range });
			break;
		} else if (currCodeUnit === GREATER_THAN) {
			s.advance(1);
			const range = s.rangeFrom(_start);
			tokenCallback({ type: 'ElementEnd', end: { type: 'Open' }, range });
			open = true;
			break;
		} else {
			// An attribute must be preceded with a whitespace
			if (!hasSpace) {
				throw new XmlError(
					{ type: 'InvalidChar', expected: 'a whitespace', actual: s.currCodeUnitUnchecked() },
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
 * If there's no Eq (equal sign), the value is interpreted as "true".
 *
 * Attribute ::= Name Eq AttValue
 *
 * https://www.w3.org/TR/xml/#NT-Attribute
 */
function parseAttribute(s: XmlStream): [string, string, string] {
	const [prefix, local] = s.consumeQName();
	let value = '';
	const start = s.getPos();

	s.skipSpaces();
	if (s.tryConsumeCodeUnit(EQUALS)) {
		s.skipSpaces();
		const quote = s.consumeQuote();
		while (!s.atEnd()) {
			const c = s.currCodeUnitUnchecked();
			if (c === quote) {
				s.consumeCodeUnit(quote);
				break;
			} else if (c === LESS_THAN) {
				throw new XmlError({ type: 'InvalidChar', expected: quote, actual: c }, s.genTextPos());
			} else if (c === OPEN_CURLY_BRACKET) {
				const liquidStart = s.getPos();
				parseLiquid(s);
				value = s.sliceBack(liquidStart);
			} else {
				value += String.fromCodePoint(c);
				s.consumeCodeUnit(c);
			}
		}
	} else if (s.config.strict) {
		throw new XmlError(
			{ type: 'InvalidChar', expected: EQUALS, actual: s.currCodeUnit() },
			s.genTextPos()
		);
	} else {
		s.goTo(start);
		value = 'true';
	}

	return [prefix, local, value];
}

/**
 * Parses the content of an XML element.
 *
 * content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
 *
 * https://www.w3.org/TR/xml/#NT-content
 */
function parseContent(s: XmlStream, tokenCallback: TTokenCallback): void {
	while (!s.atEnd()) {
		const currCodeUnit = s.currCodeUnitUnchecked();
		if (currCodeUnit === LESS_THAN) {
			const nextCodeUnit = s.nextCodeUnit();
			if (nextCodeUnit === EXCLAMATION_MARK) {
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
			} else if (nextCodeUnit === QUESTION_MARK) {
				parsePi(s, tokenCallback);
			} else if (nextCodeUnit === SLASH) {
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
function parseCdata(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(9); // <![CDATA[
	const text = s.consumeCodeUnitsWhile(
		(c, _s) => !(c === CLOSE_SQUARE_BRACKET && _s.startsWith(CDATA_END))
	);
	s.skipString(CDATA_END);
	const range = s.rangeFrom(start);
	tokenCallback({ type: 'Cdata', text, range });
}

/**
 * Parses a closing element tag.
 *
 * '\</' Name S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-ETag
 */
function parseCloseElement(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	s.advance(2); // </

	const [prefix, local] = s.consumeQName();
	s.skipSpaces();
	s.consumeCodeUnit(GREATER_THAN);

	const range = s.rangeFrom(start);
	tokenCallback({ type: 'ElementEnd', end: { type: 'Close', prefix, local }, range });
}

/**
 * Parses text content.
 */
function parseText(s: XmlStream, tokenCallback: TTokenCallback): void {
	const start = s.getPos();
	let text = '';
	while (!s.atEnd()) {
		const c = s.currCodeUnitUnchecked();
		if (c === LESS_THAN) {
			break;
		} else if (c === OPEN_CURLY_BRACKET) {
			const liquidStart = s.getPos();
			parseLiquid(s);
			text = s.sliceBack(liquidStart);
		} else {
			text += String.fromCodePoint(c);
			s.consumeCodeUnit(c);
		}
	}

	// According to the spec, `]]>` must not appear inside a Text node.
	// https://www.w3.org/TR/xml/#syntax
	if (text.includes(CDATA_END)) {
		throw new XmlError({ type: 'InvalidCharacterData' }, s.genTextPos());
	}

	tokenCallback({ type: 'Text', text, range: s.rangeFrom(start) });
}

function parseLiquid(s: XmlStream): TLiquidToken {
	const start = s.getPos();

	if (s.startsWith('{{')) {
		const content = parseLiquidObject(s);

		console.log('Liquid Object', { content });
		return { type: 'LiquidObject', content, range: s.rangeFrom(start) };
	}

	if (s.startsWith('{%')) {
		const tag = parseLiquidTag(s);
		let content: string;

		switch (tag.name) {
			case 'comment': {
				content = '';
				while (!s.atEnd()) {
					const c = s.currCodeUnitUnchecked();
					if (c === OPEN_CURLY_BRACKET && s.startsWith('{%')) {
						const nextTag = parseLiquidTag(s);
						if (nextTag.name === 'endcomment') {
							break;
						}
					} else {
						content += String.fromCodePoint(c);
						s.consumeCodeUnit(c);
					}
				}
				break;
			}
			default: {
				content = tag.content;
			}
		}

		console.log('Liquid Tag', { tag: tag.name, content });
		return {
			type: 'LiquidTag',
			name: tag.name,
			content,
			control: tag.control,
			range: s.rangeFrom(start)
		};
	}

	throw new XmlError({ type: 'InvalidComment' }, s.genTextPos());
}

function parseLiquidTag(s: XmlStream): {
	name: string;
	content: string;
	control: {
		left: boolean;
		right: boolean;
	};
} {
	let leftControl = false;
	let rightControl = false;
	let content = '';

	if (s.startsWith('{%-')) {
		leftControl = true;
	}
	s.advance(leftControl ? 3 : 2);

	s.skipSpaces();

	const name = s.consumeCodeUnitsWhile(
		(c, _s) => !(isXmlSpaceByte(c) || (c === PERCENT && _s.startsWith('%}')))
	);
	s.skipSpaces();

	if (!s.startsWith('%}')) {
		content = s.consumeCodeUnitsWhile((c, _s) => {
			if (c === PERCENT && _s.startsWith('%}')) {
				return false;
			} else if (c === HYPHEN && _s.startsWith('-%}')) {
				rightControl = true;
				return false;
			}
			return true;
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Not true
	s.advance(rightControl ? 3 : 2);

	return { name, content, control: { left: leftControl, right: rightControl } };
}

function parseLiquidObject(s: XmlStream): string {
	s.advance(2);
	const content = s.consumeCodeUnitsWhile(
		(c, _s) => !(c === CLOSE_CURLY_BRACKET && _s.startsWith('}}'))
	);
	s.advance(2);
	return content;
}

export type TLiquidToken = TLiquidObjectToken | TLiquidTagToken;

export interface TLiquidObjectToken {
	type: 'LiquidObject';
	content: string;
	range: TRange;
}

export interface TLiquidTagToken {
	type: 'LiquidTag';
	name: string;
	content: string;
	range: TRange;
	control: {
		left: boolean;
		right: boolean;
	};
}
