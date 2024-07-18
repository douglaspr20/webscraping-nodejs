const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

(async () => {
  const url =
    'https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2334524.m570.l1313&_nkw=laptops+lenovo&_sacat=0&rt=nc&_odkw=laptops+lenovo&_osacat=0&_ipg=240';

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto(url);

  const title = await page.title();

  let products = [];
  let nextPage = true;

  while (nextPage) {
    const newProducts = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('.s-item.s-item__pl-on-bottom')
      );

      return cards.map((card) => {
        const title = card.querySelector('.s-item__title')?.innerText;
        const price = card.querySelector('.s-item__price')?.innerText;

        if (!price) {
          return {
            title,
            price: 'N/A',
          };
        }

        const priceCleaned = price.replace(/\n/g, '').trim();

        return {
          title,
          price: priceCleaned,
        };
      });
    });

    products = [...products, ...newProducts];

    nextPage = await page.evaluate(() => {
      const nextButton = document.querySelector('.pagination__next');

      if (nextButton && !nextButton.hasAttribute('disabled')) {
        nextButton.click();
        return true;
      }
      return false;
    });

    if (nextPage) {
      await page.waitForNavigation();
    }
  }

  console.log('products', products.length);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(products);
  const path = 'products.xlsx';
  xlsx.utils.book_append_sheet(wb, ws, 'Products');
  xlsx.writeFile(wb, path);

  await browser.close();
})();
