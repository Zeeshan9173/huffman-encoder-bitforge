class Node {
    constructor(byte, freq, left = null, right = null) {
        this.byte = byte;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

let mode = 'compress';
let fileData = null;
let fileName = "";

document.addEventListener('DOMContentLoaded', () => {
    const btnCompress = document.getElementById('tab-compress');
    const btnDecompress = document.getElementById('tab-decompress');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const btnRun = document.getElementById('btn-run');
    const btnClear = document.getElementById('btn-clear');

    btnCompress.addEventListener('click', () => switchMode('compress'));
    btnDecompress.addEventListener('click', () => switchMode('decompress'));

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-emerald-500'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-emerald-500'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-emerald-500');
        if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) loadFile(e.target.files[0]);
    });

    btnRun.addEventListener('click', runApp);
    btnClear.addEventListener('click', clearTree);
});

function switchMode(newMode) {
    mode = newMode;
    const btnCompress = document.getElementById('tab-compress');
    const btnDecompress = document.getElementById('tab-decompress');
    const btnRun = document.getElementById('btn-run');

    btnCompress.className = mode === 'compress' ? "flex-1 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white transition-all cursor-pointer" : "flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    btnDecompress.className = mode === 'decompress' ? "flex-1 py-2 text-sm font-medium rounded-lg bg-cyan-600 text-white transition-all cursor-pointer" : "flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    
    document.getElementById('dropzone-text').innerHTML = mode === 'compress' ? `Drag file here, or <span class="text-emerald-400">browse</span>` : `Drag .huff file here, or <span class="text-cyan-400">browse</span>`;
    
    btnRun.innerText = mode === 'compress' ? "Execute Compression" : "Execute Decompression";
    btnRun.className = mode === 'compress' ? "w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" : "w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    
    fileData = null;
    document.getElementById('file-meta').classList.add('hidden');
    document.getElementById('metrics-card').classList.add('hidden');
    btnRun.disabled = true;
    clearTree();
}

function loadFile(file) {
    fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        fileData = e.target.result;
        document.getElementById('file-meta').classList.remove('hidden');
        document.getElementById('meta-name').innerText = file.name;
        document.getElementById('meta-size').innerText = formatSize(fileData.byteLength);
        document.getElementById('btn-run').disabled = false;
    };
    reader.readAsArrayBuffer(file);
}

function clearTree() {
    d3.select("#tree-svg").selectAll("*").remove();
    document.getElementById('placeholder').classList.remove('hidden');
}

function runApp() {
    if (!fileData) return;
    const t0 = performance.now();
    const inputBytes = new Uint8Array(fileData);

    if (mode === 'compress') {
        if (!inputBytes.length) return alert("Empty file.");

        let counts = new Map();
        for (let i = 0; i < inputBytes.length; i++) {
            counts.set(inputBytes[i], (counts.get(inputBytes[i]) || 0) + 1);
        }

        let nodes = [];
        counts.forEach((freq, byte) => nodes.push(new Node(byte, freq)));
        if (nodes.length === 1) nodes = [new Node(null, nodes[0].freq, nodes[0], null)];

        while (nodes.length > 1) {
            nodes.sort((a, b) => a.freq - b.freq);
            let left = nodes.shift();
            let right = nodes.shift();
            nodes.push(new Node(null, left.freq + right.freq, left, right));
        }
        let root = nodes[0];

        let dict = new Map();
        function getCodes(node, path) {
            if (node.byte !== null) { dict.set(node.byte, path); return; }
            if (node.left) getCodes(node.left, path + "0");
            if (node.right) getCodes(node.right, path + "1");
        }
        getCodes(root, "");

        let outBits = [];
        let byte = 0;
        let bitCount = 0;

        for (let i = 0; i < inputBytes.length; i++) {
            let bits = dict.get(inputBytes[i]);
            for (let j = 0; j < bits.length; j++) {
                byte = (byte << 1) | (bits[j] === '1' ? 1 : 0);
                bitCount++;
                if (bitCount === 8) { outBits.push(byte); byte = 0; bitCount = 0; }
            }
        }
        if (bitCount > 0) outBits.push(byte << (8 - bitCount));

        const headerSize = 10 + (counts.size * 5);
        let outBuffer = new ArrayBuffer(headerSize + outBits.length);
        let view = new DataView(outBuffer);
        let outBytes = new Uint8Array(outBuffer);

        view.setUint8(0, 72); view.setUint8(1, 85); view.setUint8(2, 70); view.setUint8(3, 70); // 'HUFF'
        view.setUint32(4, inputBytes.length, false);
        view.setUint16(8, counts.size, false);

        let offset = 10;
        counts.forEach((freq, b) => {
            view.setUint8(offset, b);
            view.setUint32(offset + 1, freq, false);
            offset += 5;
        });

        outBytes.set(new Uint8Array(outBits), headerSize);

        showStats(inputBytes.length, outBuffer.byteLength, performance.now() - t0);
        downloadFile(outBuffer, fileName + ".huff");
        drawTree(root);

    } else {
        if (inputBytes.length < 10) return alert("Invalid file.");
        let view = new DataView(fileData);
        
        if (view.getUint8(0) !== 72 || view.getUint8(1) !== 85 || view.getUint8(2) !== 70 || view.getUint8(3) !== 70) {
            return alert("Not a valid .huff file"); 
        }
        
        let origSize = view.getUint32(4, false);
        let dictSize = view.getUint16(8, false);

        let offset = 10;
        let counts = new Map();
        for (let i = 0; i < dictSize; i++) {
            counts.set(view.getUint8(offset), view.getUint32(offset + 1, false));
            offset += 5;
        }

        let nodes = [];
        counts.forEach((freq, b) => nodes.push(new Node(b, freq)));
        if (nodes.length === 1) nodes = [new Node(null, nodes[0].freq, nodes[0], null)];

        while (nodes.length > 1) {
            nodes.sort((a, b) => a.freq - b.freq);
            let left = nodes.shift();
            let right = nodes.shift();
            nodes.push(new Node(null, left.freq + right.freq, left, right));
        }
        let root = nodes[0];

        let outBytes = new Uint8Array(origSize);
        let outIdx = 0;
        let currNode = root;

        for (let i = offset; i < inputBytes.length && outIdx < origSize; i++) {
            let b = inputBytes[i];
            for (let bit = 7; bit >= 0; bit--) {
                currNode = ((b >> bit) & 1) === 0 ? currNode.left : currNode.right;
                if (currNode.byte !== null) {
                    outBytes[outIdx++] = currNode.byte;
                    currNode = root;
                    if (outIdx === origSize) break;
                }
            }
        }

        let outName = fileName.endsWith('.huff') ? fileName.slice(0, -5) : "decoded_" + fileName;
        showStats(inputBytes.length, outBytes.byteLength, performance.now() - t0);
        downloadFile(outBytes.buffer, outName);
        drawTree(root);
    }
}

function drawTree(rootNode) {
    clearTree();
    if (!rootNode) return;
    document.getElementById('placeholder').classList.add('hidden');

    function toD3(node) {
        if (!node) return null;
        let name = node.byte !== null ? 
            (node.byte >= 32 && node.byte <= 126 ? `'${String.fromCharCode(node.byte)}'` : `0x${node.byte.toString(16).toUpperCase()}`) + ` [${node.freq}]` : 
            `Σ:${node.freq}`;
        return { name, children: [toD3(node.left), toD3(node.right)].filter(n => n) };
    }

    const data = d3.hierarchy(toD3(rootNode));
    
    const leaves = data.leaves().length;
    const depth = data.height;
    
    const svgWidth = Math.max(800, leaves * 45); 
    const svgHeight = Math.max(600, depth * 80 + 100);

    const svg = d3.select("#tree-svg").attr("width", svgWidth).attr("height", svgHeight);
    const g = svg.append("g");

    const treeData = d3.tree().size([svgWidth - 60, svgHeight - 100])(data);

    g.attr("transform", "translate(30, 40)");

    let currentZoom = 1;
    d3.select("#btn-zoom-in").on("click", () => {
        currentZoom *= 1.2;
        g.transition().duration(200).attr("transform", `translate(30, 40) scale(${currentZoom})`);
    });
    d3.select("#btn-zoom-out").on("click", () => {
        currentZoom /= 1.2;
        g.transition().duration(200).attr("transform", `translate(30, 40) scale(${currentZoom})`);
    });

    g.selectAll(".link")
        .data(treeData.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

    const nodes = g.selectAll(".node")
        .data(treeData.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle").attr("r", 5);
    nodes.append("text")
        .attr("dy", d => d.children ? -10 : 15)
        .attr("text-anchor", "middle")
        .text(d => d.data.name);
}

function showStats(inBytes, outBytes, ms) {
    document.getElementById('metrics-card').classList.remove('hidden');
    document.getElementById('metric-out').innerText = formatSize(outBytes);
    document.getElementById('metric-time').innerText = ms.toFixed(1) + " ms";

    let ratio = mode === 'compress' ? ((inBytes - outBytes) / inBytes) * 100 : ((outBytes - inBytes) / inBytes) * 100;
    const ratioEl = document.getElementById('metric-ratio');
    ratioEl.innerText = (ratio >= 0) ? `${ratio.toFixed(1)}% Saved` : `${Math.abs(ratio).toFixed(1)}% Growth`;
    ratioEl.className = ratio >= 0 ? "text-lg font-bold font-mono text-emerald-400 mt-0.5" : "text-lg font-bold font-mono text-red-400 mt-0.5";
}

function downloadFile(buffer, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buffer], { type: "application/octet-stream" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}