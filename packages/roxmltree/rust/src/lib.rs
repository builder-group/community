mod bindgen;
pub mod error;
pub mod tokenizer;

use error::XmlError;
use tokenizer::{parse, XmlEvents};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

#[wasm_bindgen]
pub fn parse_xml(text: &str, allow_dtd: bool, callback: &js_sys::Function) -> Result<(), JsValue> {
    let mut context = XmlContext::new(callback);
    return match parse(&text, allow_dtd, &mut context) {
        Ok(_) => Ok(()),
        Err(err) => Err(serde_wasm_bindgen::to_value(&err).unwrap_or(JsValue::from_str(""))),
    };
}

struct XmlContext<'input> {
    callback: &'input js_sys::Function,
}

impl<'input> XmlContext<'input> {
    pub fn new(callback: &'input js_sys::Function) -> Self {
        XmlContext { callback }
    }
}

impl<'input> XmlEvents<'input> for XmlContext<'input> {
    fn token(&mut self, token: tokenizer::Token<'input>) -> Result<(), XmlError> {
        let js_value = serde_wasm_bindgen::to_value(&token);
        let _ = self.callback.call1(&JsValue::NULL, &js_value.unwrap());
        return Ok(());
    }
}
