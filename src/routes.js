import { createPuppeteerRouter, Dataset } from "crawlee";

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  log.debug(`Enqueueing categories from page: ${request.url}`);

  await page.waitForSelector(".collection-block-item");
  await enqueueLinks({
    selector: ".collection-block-item",
    label: "CATEGORY",
  });
});

router.addHandler("CATEGORY", async ({ page, enqueueLinks, request, log }) => {
  log.debug(`Enqueueing pagination for: ${request.url}`);

  await page.waitForSelector(".product-item > a");
  await enqueueLinks({
    selector: ".product-item > a",
    label: "DETAIL",
  });

  const nextButton = await page.$("a.pagination__next");
  if (nextButton) {
    await enqueueLinks({
      selector: "a.pagination__next",
      label: "CATEGORY",
    });
  }
});

router.addHandler("DETAIL", async ({ request, page, log }) => {
  log.debug(`Extracting data: ${request.url}`);

  const urlPart = request.url.split("/").slice(-1);
  const manufacturer = urlPart[0].split("-")[0];

  //extract text content
  const title = await page.$eval(".product-meta h1", (el) => el.textContent);
  const sku = await page.$eval(
    "span.product-meta__sku-number",
    (el) => el.textContent
  );

  // Extracting the price
  const priceElement = await page.$("span.price");
  const currentPriceString = priceElement
    ? await page.evaluate((el) => el.textContent, priceElement)
    : null;
  const rawPrice = currentPriceString ? currentPriceString.split("$")[1] : null;
  const price = rawPrice ? Number(rawPrice.replaceAll(",", "")) : null;

  // Extracting 'In stock' information
  const inStockElement = await page.$("span.product-form__inventory");
  const inStock = inStockElement
    ? await page.evaluate(
        (el) => el.textContent.includes("In stock"),
        inStockElement
      )
    : false;

  const results = {
    url: request.url,
    manufacturer,
    title,
    sku,
    currentPrice: price,
    availableInStock: inStock,
  };

  log.debug(`Saving data: ${request.url}`);
  await Dataset.pushData(results);
});
