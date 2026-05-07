# avif-to-png

A tiny **Node.js** command‑line utility that converts **AVIF** images to **PNG**.

## Install & run
```bash
# create the project directory (already done)
cd avif-to-png

# install dependencies
npm install

# make the command globally available (once per machine)
npm link   # registers "avif-to-png" in your PATH
```

## Usage
```bash
# Convert a single file
avif-to-png ./photo.avif

# Convert a whole folder (recursively) into ./png-output
avif-to-png ./pictures -r -o ./png-output
```

### Options
- `-o, --out <dir>` – Destination folder (default: same folder as source file).
- `-r, --recursive` – Walk sub‑directories when a folder is supplied.
- `-q, --quiet` – Only show final summary.

## How it works
- **`sharp`** does the heavy lifting – it reads AVIF, decodes it, and writes PNG.
- **`commander`** parses CLI arguments.
- The script walks directories (optionally recursively) and processes every `*.avif` it finds.

## Publishing (optional)
If you want to share this on npm:
```bash
npm publish
```
Make sure the `name` field in `package.json` is unique.

---
This tool works on Windows, macOS, and Linux (as long as the `sharp` binaries are available for your platform).
