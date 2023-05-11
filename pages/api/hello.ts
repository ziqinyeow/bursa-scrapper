// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import _ from "lodash";
// import chromium from "chrome-aws-lambda";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { docs } = req.body;

    const browser = await puppeteer.launch();
    // const browser = await chromium.puppeteer.launch({
    //   args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    //   defaultViewport: chromium.defaultViewport,
    //   executablePath: await chromium.executablePath,
    //   headless: true,
    //   ignoreHTTPSErrors: true,
    // });
    // const browser = await puppeteer.launch({
    //   args: chromium.args,
    //   defaultViewport: chromium.defaultViewport,
    //   // @ts-ignore
    //   executablePath: await chromium.executablePath(
    //     "https://github.com/Sparticuz/chromium/releases/download/v113.0.1/chromium-v113.0.1-pack.tar"
    //   ),
    //   headless: chromium.headless,
    // });
    const page = await browser.newPage();
    await page.goto(
      `https://www.bursamalaysia.com/market_information/equities_prices?page=${docs}`,
      {
        waitUntil: "networkidle0",
        timeout: 50000,
      }
    );

    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll("table tr td"));
      return tds.map((td) => td?.textContent?.replace(/^\s+|\s+$/g, ""));
    });
    const headers = [
      "NO",
      "NAME",
      "CODE",
      "REM",
      "LAST DONE",
      "LACP",
      "CHG",
      "%CHG",
      "VOL ('00)",
      "BUY VOL ('00)",
      "BUY",
      "SELL",
      "SELL VOL",
      "HIGH",
      "LOW",
      "CODE 2",
    ];
    const result = _.chunk(data, 16)?.map((d: any[]) => {
      const res = d?.reduce((p, v, i) => {
        return {
          ...p,
          [headers[i]]: v,
        };
      }, {});
      return res;
    });
    return res.status(200).json({ result });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error });
  }
}
