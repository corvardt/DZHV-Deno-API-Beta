import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
const kv = await Deno.openKv();
const MAX_ENTRIES = 192;
const Fetch = async () => {
  let arb_price = 0,
    eth_price = 0,
    bsc_price = 0,
    base_price = 0,
    avax_price = 0;
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0x3419875B4D3Bca7F3FddA2dB7a476A79fD31B4fE"
    );
    const data = response.body ? await response.json() : {};
    for (let i = 0; i < data.pairs.length; i++) {
      const fixedvalue = Number(data.pairs[i].priceUsd).toFixed(5);
      switch (data.pairs[i].url) {
        case "https://dexscreener.com/ethereum/0xb7a71c2e31920019962cb62aeea1dbf502905b81":
          eth_price = Number(fixedvalue);
          break;
        case "https://dexscreener.com/arbitrum/0x05c5bdbc7b3c64109ddcce058ce99f4515fe1c83":
          arb_price = Number(fixedvalue);
          break;
        case "https://dexscreener.com/bsc/0x642089a5da2512db761d325a868882ece6e387f5":
          bsc_price = Number(fixedvalue);
          break;
        case "https://dexscreener.com/base/0xb64dff20dd5c47e6dbb56ead80d23568006dec1e":
          base_price = Number(fixedvalue);
          break;
        case "https://dexscreener.com/avalanche/0x523a04633b6c0c4967824471dda0abbce7c5e643":
          avax_price = Number(fixedvalue);
          break;
        default:
          break;
      }
    }
    const timestamp = Date.now();
    const _data = [];
    const result = await kv.list({ prefix: ["tokens"] });
    for await (const { value } of result) {
      _data.push(value);
    }
    const firsttimestamp = _data[0] ? _data[0].timestamp : null;
    // Remove the oldest entries to make space for the new one.
    if (_data.length >= MAX_ENTRIES) {
      await kv.delete(["tokens", firsttimestamp]);
      console.log("Deleted oldest entries :", firsttimestamp);
    }
    await kv.set(["tokens", timestamp], {
      timestamp: timestamp,
      arb_price: arb_price,
      eth_price: eth_price,
      bsc_price: bsc_price,
      base_price: base_price,
      avax_price: avax_price,
    });
    console.log(timestamp, ": Done");
  } catch (error) {
    const timestamp = Date.now();
    console.log(timestamp, ": error");
    console.error(error);
  }
};

Deno.cron("Run every fifteen minutes", "*/15 * * * *", () => {
  Fetch();
});

const app = new Application();
const router = new Router();
app.use(oakCors());

const getDataByPrefix = async (ctx, prefix) => {
  const data = [];
  const result = await kv.list({ prefix: [prefix] });
  for await (const { value } of result) {
    data.push(value);
  }
  return (ctx.response.body = data);
};
router.get("/v1/tokens", async (ctx) => getDataByPrefix(ctx, "tokens"));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8001 });
