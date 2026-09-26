// Starts headless Chromium for the scripts. Behind an HTTPS proxy (e.g. a
// cloud dev box) the browser can't verify the proxy's certificate, so web
// requests are fetched from Node instead, which does trust it.
import { chromium } from 'playwright';

export async function launch() {
  const proxy = process.env.HTTPS_PROXY;
  const browser = await chromium.launch();
  return {
    browser,
    async newPage(options = {}) {
      const page = await browser.newPage(options);
      if (proxy) await page.route(/^https:/, async (route) => route.fulfill({ response: await route.fetch() }));
      return page;
    },
    close: () => browser.close(),
  };
}
