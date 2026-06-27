# BitForge: Huffman Binary Compressor

BitForge is a high-performance, fully client-side binary compressor and visualizer. It uses the **Huffman Coding algorithm** to parse raw byte arrays entirely within the browser, compressing files and dynamically rendering the resulting logic into an interactive Abstract Syntax Tree (AST).

##  Quick Start
1. Clone or download this repository.
2. Double-click `index.html` to launch the app instantly in any modern web browser.

---

##  Key Features
* **100% Local Processing:** Processes file data locally via `DataView` interfaces. Your data never leaves your machine.
* **Dual-Mode Engine:** 
  * **Compress:** Builds frequency maps, assigns variable-length bit paths, and generates a custom `.huff` file.
  * **Decompress:** Validates magic bytes, extracts the frequency table, reconstructs the tree, and identically restores the original file.
* **Dynamic AST Visualizer:** Uses **D3.js (v7)** to generate a scalable, interactive, and zoomable hierarchy tree of the Huffman bit distribution.
* **Real-Time Diagnostics:** Instantly displays execution time, payload output sizes, and overall compression ratios.

---

##  Technology Stack
* **Frontend:** HTML5, Tailwind CSS
* **Core Engine:** Native JavaScript Bitwise Operators (`<<`, `|`, `>>`, `&`)
* **Visualization:** D3.js Hierarchical Tree Layouts

---

##  The `.huff` Binary Format
BitForge encapsulates compressed data into a custom binary structure:

| Byte Offset | Data Type | Purpose |
| :--- | :--- | :--- |
| `0x00 - 0x03` | `Uint8[4]` | Magic Word (`72, 85, 70, 70` = `HUFF`) |
| `0x04 - 0x07` | `Uint32` | Original uncompressed file size (Big-Endian) |
| `0x08 - 0x09` | `Uint16` | Frequency dictionary size |
| `0x0A+` | `Map Array` | Dynamic blocks: `[1-byte char] + [4-byte Uint32 frequency]` |
| `Trailing` | `Bitstream` | The actual encoded, variable-length bit payload |

---

##  How the Algorithm Works
1. **Frequency Mapping:** Ingests the file as a `Uint8Array` and tallies every unique byte into a priority queue.
2. **Tree Building:** Sorts nodes by weight, recursively pairing the lowest frequencies under parent nodes until a single root remains.
3. **Prefix Bit Allocation:** Traverses the tree (Left = `0`, Right = `1`) to assign unique, ambiguity-free binary codes.
4. **Packing:** Bit-shifts literal binary strings into memory-efficient 8-bit integers to achieve true file size reduction.
