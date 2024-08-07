<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/roxmltree/.github/banner.svg" alt="roxmltree banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/roxmltree">
        <img src="https://img.shields.io/bundlephobia/minzip/roxmltree.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/roxmltree">
        <img src="https://img.shields.io/npm/dt/roxmltree.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`roxmltree` is a Typescript implementation of the [`roxmltree`](https://github.com/RazrFalcon/roxmltree) Rust crate.

### 🌟 Motivation

Create a type-safe, straightforward, and lightweight [XML](https://de.wikipedia.org/wiki/Extensible_Markup_Language) parser. Many existing parsers either lack TypeScript support, aren't actively maintained, or exceed 20kB gzipped.

My goal was to develop an efficient & flexible alternative by porting [roxmltree](https://github.com/RazrFalcon/roxmltree) to TypeScript or integrating it via WASM. While it functions well and is quite flexible due to its streaming approach, it's too slow.

### ⚖️ Alternatives
- [txml](https://github.com/TobiasNickel/tXml)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [saxen](https://github.com/nikku/saxen)

## 📖 Usage

```ts
import { xmlToObject, parseString } from 'roxmltree';

const result = xmlToObject("<p>Hello World</p>");

parseString("<p>Hello World</p>", false, (token) => { /* Token callback */ })
```

## 🚀 Benchmark

The performance of `roxmltree`, was benchmarked against other popular XML parsers. 

### XML to Object Conversion

| Parser              | Operations per Second (ops/sec) | Min Time (ms) | Max Time (ms) | Mean Time (ms) | Relative Margin of Error (rme) |
|---------------------|---------------------------------|---------------|---------------|----------------|--------------------------------|
| roxmltree:text      | 67.12                           | 14.33         | 16.45         | 14.90          | ±1.15%                         | 
| roxmltree:wasmMix   | 28.17                           | 34.83         | 36.71         | 35.49          | ±0.91%                         | 
| roxmltree:wasm      | 109.30                          | 8.30          | 13.16         | 9.15           | ±3.31%                         | 
| fast-xml-parser     | 63.39                           | 15.30         | 18.61         | 15.78          | ±1.38%                         |
| txml                | 267.55                          | 3.58          | 4.33          | 3.74           | ±0.80%                         |
| xml2js              | 33.85                           | 27.86         | 37.15         | 29.55          | ±4.37%                         |

### Node Counting

| Parser              | Operations per Second (ops/sec) | Min Time (ms) | Max Time (ms) | Mean Time (ms) | Relative Margin of Error (rme) |
|---------------------|---------------------------------|---------------|---------------|----------------|--------------------------------|
| roxmltree:text      | 369.08                          | 2.65          | 3.56          | 2.71           | ±0.50%                         |
| saxen               | 3,381.10                        | 0.29          | 0.54          | 0.30           | ±0.32%                         |
| sax                 | 359.97                          | 2.65          | 4.74          | 2.78           | ±1.17%                         |

## ❓ FAQ

### Why removed Rust implementation (WASM)?

To improve maintainability and because it lacked the hoped performance boost.

In the implementation where a TypeScript function is called from Rust on every token event (`wasmMix` benchmark), slow communication between Rust and Typescript negates Rust's performance benefits.

Parsing XML entirely in Rust (`wasm` benchmark) avoids this frequent communication issue but is still too slow. Also here the primary bottleneck is the serialization and deserialization of data between JavaScript and Rust. While parsing without returning results is faster than any other JavaScript XML parser, the necessity of retrieving results in the JavaScript layer renders this approach impractical.

The `roxmltree` package with the Rust implementation can be found in the `_deprecated` folder.

### Why `tokenizer.rs` was ported to TypeScript?

The port of [`tokenizer.rs`](https://github.com/RazrFalcon/roxmltree/blob/master/src/tokenizer.rs) to TypeScript was necessary because the frequent communication between Rust and TypeScript negated Rust's performance benefits. The stream architecture required constant interaction between Rust and TypeScript via the `tokenCallback`, which reduced overall efficiency.

For token streaming, the TypeScript implementation is twice as fast as a mixed Rust-TypeScript approach. However, for complete parsing tasks (e.g., converting XML to objects), Rust is faster.

