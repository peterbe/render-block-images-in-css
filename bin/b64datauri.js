#!/usr/bin/env node
const fs = require("fs");

const mime = require("mime-types");

function main(images) {
  const longest = Math.max(...images.map((f) => f.length));
  for (const image of images) {
    const bytes = fs.readFileSync(image).length;
    const b64 = fs.readFileSync(image, "base64");
    const dataUri = `data:${mime.lookup(image)};base64,${b64}`;
    const dataUriBytes = dataUri.length;
    const multiplier = dataUriBytes / bytes;
    console.log(
      image.padEnd(longest + 6),
      `${bytes.toLocaleString()}`.padEnd(10),
      `${dataUriBytes.toLocaleString()}`.padEnd(10),
      `${multiplier.toFixed(1)}x`.padEnd(10)
    );
  }
}
main(process.argv.slice(2));
