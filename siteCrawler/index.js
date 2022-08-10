import * as cheerio from 'cheerio';
import striptags from 'striptags';
import inquirer from 'inquirer';
import fs from 'fs';
import crawl from '../utils/crawl.js';

const main = async () => {
  const { urlListFileName, root } = await inquirer.prompt([
    {
      type: 'input',
      name: 'urlListFileName',
      message: 'Enter the relative path to the list of page URLs',
      default: './urls.json',
    },
    {
      type: 'input',
      name: 'root',
      message: 'Enter the document.querySelector value to start the crawl from',
      default: 'body',
    },
  ]);
  const fileData = fs.readFileSync(urlListFileName);
  const urls = Array.isArray(JSON.parse(fileData)) ? [...JSON.parse(fileData)] : [];
  urls.forEach(async (url, index) => {
    const crawled = await crawl({ url, root, enableJs: false });
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
    const articleData = {
      body: striptags(String($.html()), ['a', 'table', 'tr', 'td', 'th'])
        .replace(/\n/g, '<br/>')
        .replace(/ {2}/g, '')
        .replace(/(<br\/>)+/g, '<br/>'),
      URLS: Array.from(uniqueURL),
      url,
    };
    fs.writeFileSync(`./Article-${index + 1}.txt`, articleData.body);
  });
};

main();
