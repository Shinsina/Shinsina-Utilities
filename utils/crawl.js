import puppeteer from 'puppeteer';

export default async function crawl({ url, root, enableJS }) {
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
