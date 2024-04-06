import axios from "axios";
import { CronJob } from "cron";
import * as dotenv from "dotenv";
import * as twitterApi from "twitter-api-v2";
dotenv.config();

let cachedPrice: number = 11.99;

async function getTIAPrice() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=celestia&vs_currencies=usd";

  const tweet: string = await axios.get(url).then(function (response) {
    let lastPrice = response.data.celestia.usd;

    let percentageChange = Math.abs((lastPrice - cachedPrice) / cachedPrice);
    let direction = lastPrice > cachedPrice ? "more" : "less";

    const date = new Date();
    const dateString = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;

    const tweet = `The data is ${(percentageChange * 100).toFixed(
      2
    )}% ${direction} available today (${dateString}). @celestiaorg`;

    cachedPrice = lastPrice;
    return tweet;
  });
  return tweet;
}

// Initialize Twitter API client
const twitterClient = new twitterApi.TwitterApi({
  appKey: process.env.APP_KEY || "",

  appSecret: process.env.APP_SECRET || "",

  accessSecret: process.env.ACCESS_SECRET || "",
  accessToken: process.env.ACCESS_TOKEN || "",
});

// Read+Write level

const rwClient = twitterClient.readWrite;

async function main() {
  const logs = await getTIAPrice();
  console.log(logs);

  if (logs) {
    await tweetTIAPrices(logs);
  }
}

main();

// Schedule the script to run every 24 hours
const job = new CronJob("0 9 * * *", main, null, true, "America/New_York");
job.start();

async function tweetTIAPrices(tweet: string) {
  try {
    await rwClient.v2.tweet({
      text: tweet,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
  }
}
