mod bindgen;
pub mod error;
pub mod tokenizer;

use std::collections::HashMap;

use error::XmlError;
use tokenizer::{parse, ElementEnd, Token, XmlEvents};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

#[wasm_bindgen(js_name = parseXml)]
pub fn parse_xml(text: &str, allow_dtd: bool, callback: &js_sys::Function) -> Result<(), JsValue> {
    let mut context = ParseXmlContext { callback };
    return match parse(&text, allow_dtd, &mut context) {
        Ok(_) => Ok(()),
        Err(err) => Err(serde_wasm_bindgen::to_value(&err).unwrap_or(JsValue::from_str(""))),
    };
}

struct ParseXmlContext<'input> {
    callback: &'input js_sys::Function,
}

impl<'input> XmlEvents<'input> for ParseXmlContext<'input> {
    fn token(&mut self, token: tokenizer::Token<'input>) -> Result<(), XmlError> {
        let js_value = serde_wasm_bindgen::to_value(&token);
        let _ = self.callback.call1(&JsValue::NULL, &js_value.unwrap());
        return Ok(());
    }
}

#[wasm_bindgen(js_name = xmlToObject)]
pub fn xml_to_object(text: &str, allow_dtd: bool) -> Result<JsValue, JsValue> {
    let mut context = XmlToObjectContext {
        root: XMLNode {
            tag_name: "root".to_string(),
            attributes: HashMap::new(),
            children: Vec::new(),
            text: None,
        },
        stack: Vec::new(),
    };

    match parse(text, allow_dtd, &mut context) {
        // Ok(_) => serde_wasm_bindgen::to_value(&context.root)
        //     .map_err(|e| JsValue::from_str(&format!("Serialization error: {:?}", e))),
        Ok(_) => Ok(JsValue::NULL),
        Err(err) => Err(JsValue::from_str(&format!("XML parsing error: {:?}", err))),
    }
}

#[derive(Clone, Debug, serde::Serialize, specta::Type)]
pub struct XMLNode {
    tag_name: String,
    attributes: HashMap<String, String>,
    children: Vec<XMLNode>,
    text: Option<String>,
}

struct XmlToObjectContext {
    root: XMLNode,
    stack: Vec<XMLNode>,
}

impl<'input> XmlEvents<'input> for XmlToObjectContext {
    fn token(&mut self, token: Token<'input>) -> Result<(), XmlError> {
        match token {
            Token::ElementStart { prefix, local, .. } => {
                let tag_name = if prefix.is_empty() {
                    local.to_string()
                } else {
                    format!("{}:{}", prefix, local)
                };
                let new_node = XMLNode {
                    tag_name,
                    attributes: HashMap::new(),
                    children: Vec::new(),
                    text: None,
                };
                self.stack.push(new_node);
            }
            Token::Attribute {
                prefix,
                local,
                value,
                ..
            } => {
                if let Some(current_node) = self.stack.last_mut() {
                    let attr_name = if prefix.is_empty() {
                        local.to_string()
                    } else {
                        format!("{}:{}", prefix, local)
                    };
                    current_node
                        .attributes
                        .insert(attr_name, value.as_str().to_string());
                }
            }
            Token::ElementEnd { end, .. } => {
                if let ElementEnd::Close { .. } | ElementEnd::Empty = end {
                    if let Some(completed_node) = self.stack.pop() {
                        if self.stack.is_empty() {
                            self.root = completed_node;
                        } else if let Some(parent) = self.stack.last_mut() {
                            parent.children.push(completed_node);
                        }
                    }
                }
            }
            Token::Text { text, .. } | Token::Cdata { text, .. } => {
                let trimmed_text = text.trim();
                if !trimmed_text.is_empty() {
                    if let Some(current_node) = self.stack.last_mut() {
                        current_node.text = Some(trimmed_text.to_string());
                    }
                }
            }
            Token::ProcessingInstruction { .. }
            | Token::Comment { .. }
            | Token::EntityDeclaration { .. } => {
                // Ignoring these tokens
            }
        }
        Ok(())
    }
}
