import { XmlError } from '../XMLError';
import { type StrSpan } from './StrSpan';
import { type TXmlEvents } from './types';
import { XmlStream } from './XmlStream';

export * from './StrSpan';
export * from './types';
export * from './utils';
export * from './XmlStream';

/**
 * Parses an XML document.
 *
 * document ::= prolog element Misc*
 *
 * https://www.w3.org/TR/xml/#NT-document
 */
export function parse(text: string, allowDtd: boolean, events: TXmlEvents): void {
	const s = XmlStream.fromString(text);

	// Skip UTF-8 BOM
	if (s.startsWith('\uFEFF')) {
		s.advance(3);
	}

	if (s.startsWith('<?xml ')) {
		parseDeclaration(s);
	}

	parseMisc(s, events);

	s.skipSpaces();
	if (s.startsWith('<!DOCTYPE')) {
		if (!allowDtd) {
			throw new XmlError({ type: 'DtdDetected' });
		}

		parseDoctype(s, events);
		parseMisc(s, events);
	}

	s.skipSpaces();
	if (!s.atEnd() && s.currByte() === 60 /* < */) {
		parseElement(s, events);
	}

	parseMisc(s, events);

	if (!s.atEnd()) {
		throw new XmlError({ type: 'UnknownToken' }, s.genTextPos());
	}
}

/**
 * Parses miscellaneous XML content (comments, processing instructions, whitespace).
 *
 * Misc ::= Comment | PI | S
 *
 * https://www.w3.org/TR/xml/#NT-Misc
 */
function parseMisc(s: XmlStream, events: TXmlEvents): void {
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.startsWith('<!--')) {
			parseComment(s, events);
		} else if (s.startsWith('<?')) {
			parsePi(s, events);
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
	s.advance(5); // <?xml
	consumeSpaces(s);

	// The `version` "attribute" is mandatory
	if (!s.startsWith('version')) {
		throw new XmlError({ type: 'InvalidString', expected: 'version' }, s.genTextPos());
	}
	parseAttribute(s);
	consumeSpaces(s);

	if (s.startsWith('encoding')) {
		parseAttribute(s);
		consumeSpaces(s);
	}

	if (s.startsWith('standalone')) {
		parseAttribute(s);
	}

	s.skipSpaces();
	s.skipString('?>');
}

function consumeSpaces(s: XmlStream): void {
	if (s.startsWithSpace()) {
		s.skipSpaces();
	} else if (!s.startsWith('?>') && !s.atEnd()) {
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
function parseComment(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	s.advance(4);
	const text = s.consumeChars((_s, c) => !(c === '-' && _s.startsWith('-->')));
	s.skipString('-->');

	if (text.includes('--') || text.endsWith('-')) {
		throw new XmlError({ type: 'InvalidComment' }, s.genTextPosFrom(start));
	}

	events.token({ type: 'Comment', content: text, range: s.rangeFrom(start) });
}

/**
 * Parses a processing instruction.
 *
 * PI       ::= '\<?' PITarget (S (Char* - (Char* '?\>' Char*)))? '?\>'
 * PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
 *
 * https://www.w3.org/TR/xml/#sec-pi
 */
function parsePi(s: XmlStream, events: TXmlEvents): void {
	if (s.startsWith('<?xml ')) {
		throw new XmlError({ type: 'UnexpectedDeclaration' }, s.genTextPos());
	}

	const start = s.getPos();
	s.advance(2);
	const target = s.consumeName();
	s.skipSpaces();
	const content = s.consumeChars((_s, c) => !(c === '?' && _s.startsWith('?>')));

	s.skipString('?>');

	events.token({
		type: 'ProcessingInstruction',
		name: target,
		content: content.length === 0 ? undefined : content,
		range: s.rangeFrom(start)
	});
}

/**
 * Parses the DOCTYPE declaration.
 */
function parseDoctype(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	parseDoctypeStart(s);
	s.skipSpaces();

	if (s.currByte() === 62 /* > */) {
		s.advance(1);
		return;
	}

	s.advance(1); // '['
	while (!s.atEnd()) {
		s.skipSpaces();
		if (s.startsWith('<!ENTITY')) {
			parseEntityDecl(s, events);
		} else if (s.startsWith('<!--')) {
			parseComment(s, events);
		} else if (s.startsWith('<?')) {
			parsePi(s, events);
		} else if (s.startsWith(']')) {
			// DTD ends with ']' S? '>', therefore we have to skip possible spaces
			s.advance(1);
			s.skipSpaces();
			if (s.currByte() === 62 /* > */) {
				s.advance(1);
				break;
			} else {
				throw new XmlError(
					{ type: 'InvalidChar', expected: "'>'", actual: s.currByteUnchecked() },
					s.genTextPos()
				);
			}
		} else if (
			s.startsWith('<!ELEMENT') ||
			s.startsWith('<!ATTLIST') ||
			s.startsWith('<!NOTATION')
		) {
			try {
				consumeDecl(s);
			} catch (e) {
				throw new XmlError({ type: 'UnknownToken' }, s.genTextPosFrom(start));
			}
		} else {
			throw new XmlError({ type: 'UnknownToken' }, s.genTextPos());
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

	const c = s.currByte();
	if (c !== 91 /* [ */ && c !== 62 /* > */) {
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
function parseExternalId(s: XmlStream): boolean {
	if (s.startsWith('SYSTEM') || s.startsWith('PUBLIC')) {
		const start = s.getPos();
		s.advance(6);
		const id = s.sliceBack(start);

		s.consumeSpaces();
		const quote = s.consumeQuote();
		s.consumeBytes((c) => c !== quote);
		s.consumeByte(quote);

		if (id === 'PUBLIC') {
			s.consumeSpaces();
			const _quote = s.consumeQuote();
			s.consumeBytes((c) => c !== _quote);
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
function parseEntityDecl(s: XmlStream, events: TXmlEvents): void {
	s.advance(8);
	s.consumeSpaces();

	const isGe = !s.tryConsumeByte(37 /* % */);
	if (!isGe) {
		s.consumeSpaces();
	}

	const name = s.consumeName();
	s.consumeSpaces();
	const definition = parseEntityDef(s, isGe);
	if (definition !== null) {
		events.token({ type: 'EntityDeclaration', name, definition });
	}
	s.skipSpaces();
	s.consumeByte(62 /* > */);
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
function parseEntityDef(s: XmlStream, isGe: boolean): StrSpan | null {
	const c = s.currByte();
	if (c === 34 /* " */ || c === 39 /* ' */) {
		const quote = s.consumeQuote();
		const start = s.getPos();
		s.skipBytes((_c) => _c !== quote);
		const value = s.sliceBackSpan(start);
		s.consumeByte(quote);
		return value;
	} else if (c === 83 /* S */ || c === 80 /* P */) {
		if (parseExternalId(s)) {
			if (isGe) {
				s.skipSpaces();
				if (s.startsWith('NDATA')) {
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
function consumeDecl(s: XmlStream): void {
	s.skipBytes((c) => c !== 62 /* > */);
	s.consumeByte(62 /* > */);
}

/**
 * Parses an XML element.
 *
 * element ::= EmptyElemTag | STag content ETag
 * '\<' Name (S Attribute)* S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-element
 */
function parseElement(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	s.advance(1); // '<'
	const [prefix, local] = s.consumeQName();
	events.token({ type: 'ElementStart', prefix, local, startPos: start });

	let open = false;
	while (!s.atEnd()) {
		const hasSpace = s.startsWithSpace();
		s.skipSpaces();
		const _start = s.getPos();
		const currByte = s.currByte();

		if (currByte === 47 /* / */) {
			s.advance(1);
			s.consumeByte(62 /* > */);
			const range = s.rangeFrom(_start);
			events.token({ type: 'ElementEnd', variant: { type: 'Empty' }, range });
			break;
		} else if (currByte === 62 /* > */) {
			s.advance(1);
			const range = s.rangeFrom(_start);
			events.token({ type: 'ElementEnd', variant: { type: 'Open' }, range });
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
			events.token({
				type: 'Attribute',
				range: [_start, end],
				prefix: _prefix,
				local: _local,
				value
			});
		}
	}

	if (open) {
		parseContent(s, events);
	}
}

/**
 * Parses an XML attribute.
 *
 * Attribute ::= Name Eq AttValue
 *
 * https://www.w3.org/TR/xml/#NT-Attribute
 */
function parseAttribute(s: XmlStream): [string, string, StrSpan] {
	const [prefix, local] = s.consumeQName();
	s.consumeEq();
	const quote = s.consumeQuote();
	const quoteChar = String.fromCharCode(quote);
	const valueStart = s.getPos();
	s.skipChars((_, c) => c !== quoteChar && c !== '<');
	const value = s.sliceBackSpan(valueStart);
	s.consumeByte(quote);
	return [prefix, local, value];
}

/**
 * Parses the content of an XML element.
 *
 * content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
 *
 * https://www.w3.org/TR/xml/#NT-content
 */
function parseContent(s: XmlStream, events: TXmlEvents): void {
	while (!s.atEnd()) {
		const currByte = s.currByte();
		if (currByte === 60 /* < */) {
			const nextByte = s.nextByte();
			if (nextByte === 33 /* ! */) {
				if (s.startsWith('<!--')) {
					parseComment(s, events);
				} else if (s.startsWith('<![CDATA[')) {
					parseCdata(s, events);
				} else {
					throw new XmlError({ type: 'UnknownToken' }, s.genTextPos());
				}
			} else if (nextByte === 63 /* ? */) {
				parsePi(s, events);
			} else if (nextByte === 47 /* / */) {
				parseCloseElement(s, events);
				break;
			} else {
				parseElement(s, events);
			}
		} else {
			parseText(s, events);
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
function parseCdata(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	s.advance(9); // <![CDATA[
	const text = s.consumeChars((_s, c) => !(c === ']' && _s.startsWith(']]>')));
	s.skipString(']]>');
	const range = s.rangeFrom(start);
	events.token({ type: 'Cdata', text, range });
}

/**
 * Parses a closing element tag.
 *
 * '\</' Name S? '\>'
 *
 * https://www.w3.org/TR/xml/#NT-ETag
 */
function parseCloseElement(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	s.advance(2); // </

	const [prefix, tagName] = s.consumeQName();
	s.skipSpaces();
	s.consumeByte(62 /* > */);

	const range = s.rangeFrom(start);
	events.token({ type: 'ElementEnd', variant: { type: 'Close', prefix, name: tagName }, range });
}

/**
 * Parses text content.
 */
function parseText(s: XmlStream, events: TXmlEvents): void {
	const start = s.getPos();
	const text = s.consumeChars((_, c) => c !== '<');

	// According to the spec, `]]>` must not appear inside a Text node.
	// https://www.w3.org/TR/xml/#syntax
	//
	// Search for `>` first, since it's a bit faster than looking for `]]>`.
	if (text.includes('>') && text.includes(']]>')) {
		throw new XmlError({ type: 'InvalidCharacterData' }, s.genTextPos());
	}

	events.token({ type: 'Text', text, range: s.rangeFrom(start) });
}
