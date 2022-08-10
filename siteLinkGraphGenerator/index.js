import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function crawl({ url, root, enableJS }) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(enableJS);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1800, height: 900 });
  const article = await page.$(root);
  const html = await page.evaluate((a) => a.innerHTML, article);
  await browser.close();
  return { url, html };
}

const main = async () => {
  const crawled = await crawl({ url: 'https://www.google.com', root: 'body', enableJS: true });
  const { html } = crawled;
  const $ = cheerio.load(html, {}, false);
  const uniqueURL = new Set();
  $('*').each(function fn() {
    if (!['script', 'style'].includes(this.name)) {
      if (['img', 'a', 'iframe'].includes(this.name)) {
        uniqueURL.add(this.attribs['data-src'] || this.attribs.href || this.attribs.src);
        if (this.attribs['data-src'] || this.attribs.src) {
          $(this).replaceWith(
            $(
              `<a href="${
                this.attribs['data-src'] || this.attribs.src
              }" target="_blank">Link</a> `,
            ),
          );
        }
      }
    } else {
      $(this).replaceWith('');
    }
  });
};

main();
