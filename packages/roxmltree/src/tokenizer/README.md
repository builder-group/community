Port of [`tokenizer.rs`](https://github.com/RazrFalcon/roxmltree/blob/master/src/tokenizer.rs) to TypeScript. This port was necessary because the frequent communication between Rust and TypeScript negated Rust's performance benefits. The stream architecture required constant interaction between Rust and TypeScript via the `tokenCallback`, which reduced overall efficiency.

For token streaming, the TypeScript implementation is twice as fast as a mixed Rust-TypeScript approach. However, for complete parsing tasks (e.g., converting XML to objects), Rust is faster and it only requires two data exchanges between Rust and Typescript: The arguments and the return value.

