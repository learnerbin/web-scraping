import { PuppeteerCrawler, log } from "crawlee";
import { router } from "./routes.js";

log.setLevel(log.LEVELS.DEBUG);

log.debug("Setting up crawler.");
const crawler = new PuppeteerCrawler({
  requestHandler: router,
  maxRequestsPerCrawl: 50,
  //headless: false,
});

await crawler.run(["https://warehouse-theme-metal.myshopify.com/collections"]);
