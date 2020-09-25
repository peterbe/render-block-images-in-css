#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const httpServer = require("http-server");
const cheerio = require("cheerio");
const minimalcss = require("minimalcss");
const puppeteer = require("puppeteer");
const mime = require("mime-types");

const HTTP_SERVER_PORT = 8888;

async function run(root, prefix) {
  const browser = await puppeteer.launch();
  const server = httpServer.createServer({ root });
  server.listen(HTTP_SERVER_PORT);

  const paths = fs.readdirSync(root).filter((fn) => fn.endsWith(".html"));
  try {
    await Promise.all(
      paths.map(async (fn) => {
        const url = `http://localhost:${HTTP_SERVER_PORT}/${fn}`;
        const result = await minimalcss.minimize({
          url,
          styletags: true,
          skippable: (request) => {
            return new URL(request.url()).host !== new URL(url).host;
          },
        });
        const fp = path.join(root, fn);
        const $ = cheerio.load(fs.readFileSync(fp, "utf-8").trim());
        $(`<base href="${prefix}">`).insertAfter($("head meta").eq(-1));

        fs.writeFileSync(fp, $.html(), "utf-8");
        console.log("Wrote", fp);

        $("style").remove();
        $('link[rel="stylesheet"]').remove();
        let finalCss = result.finalCss.replace(
          /url\((.*?)\)/g,
          (match, uri) => {
            return `url(.${uri})`;
          }
        );
        $("<style>").text(finalCss).appendTo($("head"));
        const newFp = fp.replace("index.html", "inlined.html");
        fs.writeFileSync(newFp, $.html(), "utf-8");
        console.log("Wrote", newFp);

        const base64FinalCss = result.finalCss.replace(
          /url\((.*?)\)/g,
          (match, uri) => {
            const filePath = path.join(root, uri.slice(1));
            const base64Content = fs.readFileSync(filePath, "base64");
            const mimetype = mime.lookup(filePath);
            return `url(data:${mimetype};base64,${base64Content})`;
          }
        );
        $("style").text(base64FinalCss);
        const newFpB64 = fp.replace("index.html", "inlined-datauri.html");
        fs.writeFileSync(newFpB64, $.html(), "utf-8");
        console.log("Wrote", newFpB64);
      })
    );
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await browser.close();
    server.close();
  }
}

const root = process.argv[2];
console.assert(root);
const prefix = process.argv[3] || "/";
run(root, prefix);
