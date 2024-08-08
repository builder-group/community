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

We removed the Rust implementation to improve maintainability and because it didn't provide the expected performance boost.

Calling a TypeScript function from Rust on every token event (`wasmMix` benchmark) results in slow communication, negating Rust's performance benefits. Parsing XML entirely in Rust (`wasm` benchmark) avoids frequent communication but is still too slow due to the overhead of serializing and deserializing data between JavaScript and Rust (mainly the resulting XML-Object). While Rust parsing without returning results is faster than any JavaScript XML parser, needing results in the JavaScript layer makes this approach impractical.

The `roxmltree` package with the Rust implementation can be found in the `_deprecated` folder (`packages/deprecated/roxmltree_wasm`).

### Why Port `tokenizer.rs` to TypeScript?

We ported [`tokenizer.rs`](https://github.com/RazrFalcon/roxmltree/blob/master/src/tokenizer.rs) to TypeScript because frequent communication between Rust and TypeScript negated Rust's performance benefits. The stream architecture required constant interaction between Rust and TypeScript via the `tokenCallback`, reducing overall efficiency.

### Why removed Byte-Based implementation?

We removed the byte-based implementation to enhance maintainability and because it didn't provide the expected performance improvement.

Decoding `Uint8Array` snippets to JavaScript strings is frequently necessary, nearly on every token event. This decoding process is slow, making this approach less efficient than working directly with strings.

```
// [roxmltree:byte]     12.4869  78.6583  83.2979  80.0840  80.4702  83.2979  83.2979  83.2979  ±1.27%       10
// [roxmltree:text]     58.8184  15.6937  19.1283  17.0015  17.0783  19.1283  19.1283  19.1283  ±1.51%       30
```

The `roxmltree` package with the Byte-Based implementation can be found in the `_deprecated` folder (`packages/deprecated/roxmltree_byte-only`).