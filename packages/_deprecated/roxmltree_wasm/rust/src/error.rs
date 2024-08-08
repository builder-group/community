use core::fmt;

/// A list of all possible errors.
#[derive(Clone, PartialEq, Eq, Hash, Debug, serde::Serialize, specta::Type)]
#[serde(tag = "type")]
pub enum XmlError {
    /// The `xmlns:xml` attribute must have an <http://www.w3.org/XML/1998/namespace> URI.
    InvalidXmlPrefixUri { pos: TextPos },

    /// Only the `xmlns:xml` attribute can have the <http://www.w3.org/XML/1998/namespace> URI.
    UnexpectedXmlUri { pos: TextPos },

    /// The <http://www.w3.org/2000/xmlns/> URI must not be declared.
    UnexpectedXmlnsUri { pos: TextPos },

    /// `xmlns` can't be used as an element prefix.
    InvalidElementNamePrefix { pos: TextPos },

    /// A namespace was already defined on this element.
    DuplicatedNamespace { name: String, pos: TextPos },

    /// An unknown namespace.
    ///
    /// Indicates that an element or an attribute has an unknown qualified name prefix.
    ///
    /// The first value is a prefix.
    UnknownNamespace { name: String, pos: TextPos },

    /// Incorrect tree structure.
    ///
    /// expected, actual, position
    #[allow(missing_docs)]
    UnexpectedCloseTag {
        expected: String,
        actual: String,
        pos: TextPos,
    },

    /// Entity value starts with a close tag.
    ///
    /// Example:
    /// ```xml
    /// <!DOCTYPE test [ <!ENTITY p '</p>'> ]>
    /// <root>&p;</root>
    /// ```
    UnexpectedEntityCloseTag { pos: TextPos },

    /// A reference to an entity that was not defined in the DTD.
    UnknownEntityReference { name: String, pos: TextPos },

    /// A malformed entity reference.
    ///
    /// A `&` character inside an attribute value or text indicates an entity reference.
    /// Otherwise, the document is not well-formed.
    MalformedEntityReference { pos: TextPos },

    /// A possible entity reference loop.
    ///
    /// The current depth limit is 10. The max number of references per reference is 255.
    EntityReferenceLoop { pos: TextPos },

    /// Attribute value cannot have a `<` character.
    InvalidAttributeValue { pos: TextPos },

    /// An element has a duplicated attributes.
    ///
    /// This also includes namespaces resolving.
    /// So an element like this will lead to an error.
    /// ```xml
    /// <e xmlns:n1='http://www.w3.org' xmlns:n2='http://www.w3.org' n1:a='b1' n2:a='b2'/>
    /// ```
    DuplicatedAttribute { name: String, pos: TextPos },

    /// The XML document must have at least one element.
    NoRootNode,

    /// The root node was opened but never closed.
    UnclosedRootNode,

    /// An XML document can have only one XML declaration
    /// and it must be at the start of the document.
    UnexpectedDeclaration { pos: TextPos },

    /// An XML with DTD detected.
    ///
    /// This error will be emitted only when `ParsingOptions::allow_dtd` is set to `false`.
    DtdDetected,

    /// Indicates that the [`ParsingOptions::nodes_limit`] was reached.
    NodesLimitReached,

    /// Indicates that too many attributes were parsed.
    AttributesLimitReached,

    /// Indicates that too many namespaces were parsed.
    NamespacesLimitReached,

    /// An invalid name.
    InvalidName { pos: TextPos },

    /// A non-XML character has occurred.
    ///
    /// Valid characters are: <https://www.w3.org/TR/xml/#char32>
    NonXmlChar { char: char, pos: TextPos },

    /// An invalid/unexpected character.
    ///
    /// expected, actual, position
    InvalidChar {
        expected: u8,
        actual: u8,
        pos: TextPos,
    },

    /// An invalid/unexpected character.
    ///
    /// expected, actual, position
    InvalidChar2 {
        expected: &'static str,
        actual: u8,
        pos: TextPos,
    },

    /// An unexpected string.
    ///
    /// Contains what string was expected.
    InvalidString {
        expected: &'static str,
        pos: TextPos,
    },

    /// An invalid ExternalID in the DTD.
    InvalidExternalID { pos: TextPos },

    /// A comment cannot contain `--` or end with `-`.
    InvalidComment { pos: TextPos },

    /// A Character Data node contains an invalid data.
    ///
    /// Currently, only `]]>` is not allowed.
    InvalidCharacterData { pos: TextPos },

    /// An unknown token.
    UnknownToken { pos: TextPos },

    /// The steam ended earlier than we expected.
    ///
    /// Should only appear on invalid input data.
    UnexpectedEndOfStream,
}

impl XmlError {
    /// Returns the error position.
    pub fn pos(&self) -> TextPos {
        match *self {
            XmlError::InvalidXmlPrefixUri { pos } => pos,
            XmlError::UnexpectedXmlUri { pos } => pos,
            XmlError::UnexpectedXmlnsUri { pos } => pos,
            XmlError::InvalidElementNamePrefix { pos } => pos,
            XmlError::DuplicatedNamespace { pos, .. } => pos,
            XmlError::UnknownNamespace { pos, .. } => pos,
            XmlError::UnexpectedCloseTag { pos, .. } => pos,
            XmlError::UnexpectedEntityCloseTag { pos } => pos,
            XmlError::UnknownEntityReference { pos, .. } => pos,
            XmlError::MalformedEntityReference { pos } => pos,
            XmlError::EntityReferenceLoop { pos } => pos,
            XmlError::InvalidAttributeValue { pos } => pos,
            XmlError::DuplicatedAttribute { pos, .. } => pos,
            XmlError::NoRootNode => TextPos::new(1, 1),
            XmlError::UnclosedRootNode => TextPos::new(1, 1),
            XmlError::UnexpectedDeclaration { pos } => pos,
            XmlError::DtdDetected => TextPos::new(1, 1),
            XmlError::NodesLimitReached => TextPos::new(1, 1),
            XmlError::AttributesLimitReached => TextPos::new(1, 1),
            XmlError::NamespacesLimitReached => TextPos::new(1, 1),
            XmlError::InvalidName { pos } => pos,
            XmlError::NonXmlChar { pos, .. } => pos,
            XmlError::InvalidChar { pos, .. } => pos,
            XmlError::InvalidChar2 { pos, .. } => pos,
            XmlError::InvalidString { pos, .. } => pos,
            XmlError::InvalidExternalID { pos } => pos,
            XmlError::InvalidComment { pos } => pos,
            XmlError::InvalidCharacterData { pos } => pos,
            XmlError::UnknownToken { pos } => pos,
            XmlError::UnexpectedEndOfStream => TextPos::new(1, 1),
        }
    }
}

impl core::fmt::Display for XmlError {
    fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
        match *self {
            XmlError::InvalidXmlPrefixUri { pos } => {
                write!(f, "'xml' namespace prefix mapped to wrong URI at {}", pos)
            }
            XmlError::UnexpectedXmlUri { pos } => {
                write!(
                    f,
                    "the 'xml' namespace URI is used for not 'xml' prefix at {}",
                    pos
                )
            }
            XmlError::UnexpectedXmlnsUri { pos } => {
                write!(
                    f,
                    "the 'xmlns' URI is used at {}, but it must not be declared",
                    pos
                )
            }
            XmlError::InvalidElementNamePrefix { pos } => {
                write!(
                    f,
                    "the 'xmlns' prefix is used at {}, but it must not be",
                    pos
                )
            }
            XmlError::DuplicatedNamespace { ref name, pos } => {
                write!(f, "namespace '{}' at {} is already defined", name, pos)
            }
            XmlError::UnknownNamespace { ref name, pos } => {
                write!(f, "an unknown namespace prefix '{}' at {}", name, pos)
            }
            XmlError::UnexpectedCloseTag {
                ref expected,
                ref actual,
                pos,
            } => {
                write!(
                    f,
                    "expected '{}' tag, not '{}' at {}",
                    expected, actual, pos
                )
            }
            XmlError::UnexpectedEntityCloseTag { pos } => {
                write!(f, "unexpected close tag at {}", pos)
            }
            XmlError::UnknownEntityReference { ref name, pos } => {
                write!(f, "unknown entity reference '{}' at {}", name, pos)
            }
            XmlError::MalformedEntityReference { pos } => {
                write!(f, "malformed entity reference at {}", pos)
            }
            XmlError::EntityReferenceLoop { pos } => {
                write!(f, "a possible entity reference loop is detected at {}", pos)
            }
            XmlError::InvalidAttributeValue { pos } => {
                write!(f, "unescaped '<' found at {}", pos)
            }
            XmlError::DuplicatedAttribute { ref name, pos } => {
                write!(f, "attribute '{}' at {} is already defined", name, pos)
            }
            XmlError::NoRootNode => {
                write!(f, "the document does not have a root node")
            }
            XmlError::UnclosedRootNode => {
                write!(f, "the root node was opened but never closed")
            }
            XmlError::UnexpectedDeclaration { pos } => {
                write!(f, "unexpected XML declaration at {}", pos)
            }
            XmlError::DtdDetected => {
                write!(f, "XML with DTD detected")
            }
            XmlError::NodesLimitReached => {
                write!(f, "nodes limit reached")
            }
            XmlError::AttributesLimitReached => {
                write!(f, "more than 2^32 attributes were parsed")
            }
            XmlError::NamespacesLimitReached => {
                write!(f, "more than 2^16 unique namespaces were parsed")
            }
            XmlError::InvalidName { pos } => {
                write!(f, "invalid name token at {}", pos)
            }
            XmlError::NonXmlChar { char, pos } => {
                write!(f, "a non-XML character {:?} found at {}", char, pos)
            }
            XmlError::InvalidChar {
                expected,
                actual,
                pos,
            } => {
                write!(
                    f,
                    "expected '{}' not '{}' at {}",
                    expected as char, actual as char, pos
                )
            }
            XmlError::InvalidChar2 {
                expected,
                actual,
                pos,
            } => {
                write!(
                    f,
                    "expected {} not '{}' at {}",
                    expected, actual as char, pos
                )
            }
            XmlError::InvalidString { expected, pos } => {
                write!(f, "expected '{}' at {}", expected, pos)
            }
            XmlError::InvalidExternalID { pos } => {
                write!(f, "invalid ExternalID at {}", pos)
            }
            XmlError::InvalidComment { pos } => {
                write!(f, "comment at {} contains '--'", pos)
            }
            XmlError::InvalidCharacterData { pos } => {
                write!(f, "']]>' at {} is not allowed inside a character data", pos)
            }
            XmlError::UnknownToken { pos } => {
                write!(f, "unknown token at {}", pos)
            }
            XmlError::UnexpectedEndOfStream => {
                write!(f, "unexpected end of stream")
            }
        }
    }
}

/// Position in text.
///
/// Position indicates a row/line and a column in the original text. Starting from 1:1.
#[allow(missing_docs)]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, serde::Serialize, specta::Type)]
pub struct TextPos {
    pub row: u32,
    pub col: u32,
}

impl TextPos {
    /// Constructs a new `TextPos`.
    pub fn new(row: u32, col: u32) -> TextPos {
        TextPos { row, col }
    }
}

impl fmt::Display for TextPos {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}:{}", self.row, self.col)
    }
}
