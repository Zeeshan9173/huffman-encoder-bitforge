BitForge - Huffman Binary Compressor

BitForge is a high-performance, fully client-side binary compressor and decompressor that utilizes the **Huffman Coding Algorithm**. Built with a focus on speed and visual clarity, BitForge parses raw byte arrays entirely in the browser sandbox and dynamically maps the resulting compression scheme into an interactive Abstract Syntax Tree (AST).


-> How to Run Locally:
1. Clone or download this repository.
2. Double-click `index.html` to launch the app instantly in any modern web browser.

----------------------------------------------------------------------------------------------------------------------------------------

-> Features

* **WASM/JS Sandbox Architecture:** Processes file data locally as an `ArrayBuffer` via `DataView` interfaces. Your data never leaves your machine.
* **Dual-Mode Processing Engine:** * **Compress:** Analyzes frequency distributions, assigns variable-length bit paths, builds a structured bitstream, and appends a custom `.huff` header mapping.
  * **Decompress:** Parses the magic byte validation sequences, extracts the frequency table, reconstructs the tree, and decodes the stream down to its original integrity.
* **Dynamic AST Visualizer:** Powered by **D3.js (v7)**. Generates highly scalable, anti-aliased hierarchy trees of the Huffman bit distribution with custom programmatic zoom configurations.
* **Real-Time Diagnostics:** Provides immediate performance benchmarking reporting on payload outputs, absolute execution times (ms), and data reduction storage efficiency metrics.

----------------------------------------------------------------------------------------------------------------------------------------

-> The Technology Stack

* **Structure:** HTML5 Semantic Markup
* **Styling:** Tailwind CSS (via CDN) + Custom SVG rendering engines
* **Data Processing Architecture:** Native JavaScript Bitwise Operators (`<<`, `|`, `>>`, `&`)
* **Visualization Layer:** D3.js Hierarchical Tree Layout Engines

----------------------------------------------------------------------------------------------------------------------------------------

-> Custom Binary Format Specs (`.huff`)

BitForge outputs file arrays encapsulated in a custom binary structural wrapper:

| Byte Offset | Data Type | Purpose |
| :--- | :--- | :--- |
| `0x00 - 0x03` | `Uint8[4]` | Magic Word Check (`72, 85, 70, 70` -> ASCII for `HUFF`) |
| `0x04 - 0x07` | `Uint32` | Original uncompressed file payload size (Big-Endian) |
| `0x08 - 0x09` | `Uint16` | Frequency dictionary table size count |
| `0x0A+` | `Map Array` | Dynamic blocks mapping `[1-byte character] + [4-byte Uint32 Frequency]` |
| `Trailing` | `Bitstream` | Padded data payload containing the encoded variable-length codes |

----------------------------------------------------------------------------------------------------------------------------------------

-> How the Algorithm Works

1. **Frequency Mapping:** The file is ingested as a `Uint8Array`. Every unique byte value's occurrence is logged into a priority queue map.
2. **Tree Building:** The nodes are continually sorted by weight. The lowest weights are paired together under a structural parent recursively until a single `root` node dominates.
3. **Prefix Bit Allocation:** Traversal paths to the left evaluate as `0`, and paths to the right evaluate as `1`. No code is a prefix of another, ensuring ambiguity-free decompression.
4. **Packing:** Literal binary strings are bit-shifted into memory-efficient integer chunks to guarantee true file layout reduction.