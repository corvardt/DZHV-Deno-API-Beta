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
  let arb_liq = 0,
    eth_liq = 0,
    bsc_liq = 0,
    base_liq = 0,
    avax_liq = 0;
  let arb_vol = 0,
    eth_vol = 0,
    bsc_vol = 0,
    base_vol = 0,
    avax_vol = 0;
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0x3419875B4D3Bca7F3FddA2dB7a476A79fD31B4fE"
    );
    const data = response.body ? await response.json() : {};
    for (let i = 0; i < data.pairs.length; i++) {
      const fixedvalue = Number(data.pairs[i].priceUsd).toFixed(5);
      const fixedliq = Number(data.pairs[i].liquidity.usd).toFixed(2);
      switch (data.pairs[i].url) {
        case "https://dexscreener.com/ethereum/0xb7a71c2e31920019962cb62aeea1dbf502905b81":
          eth_price = Number(fixedvalue);
          eth_liq = Number(fixedliq);
          eth_vol = data.pairs[i].volume.h24;
          break;
        case "https://dexscreener.com/arbitrum/0x05c5bdbc7b3c64109ddcce058ce99f4515fe1c83":
          arb_price = Number(fixedvalue);
          arb_liq = Number(fixedliq);
          arb_vol = data.pairs[i].volume.h24;
          break;
        case "https://dexscreener.com/bsc/0x642089a5da2512db761d325a868882ece6e387f5":
          bsc_price = Number(fixedvalue);
          bsc_liq = Number(fixedliq);
          bsc_vol = data.pairs[i].volume.h24;
          break;
        case "https://dexscreener.com/base/0xb64dff20dd5c47e6dbb56ead80d23568006dec1e":
          base_price = Number(fixedvalue);
          base_liq = Number(fixedliq);
          base_vol = data.pairs[i].volume.h24;
          break;
        case "https://dexscreener.com/avalanche/0x523a04633b6c0c4967824471dda0abbce7c5e643":
          avax_price = Number(fixedvalue);
          avax_liq = Number(fixedliq);
          avax_vol = data.pairs[i].volume.h24;
          break;
        default:
          break;
      }
    }
    const timestamp = Date.now();
    const _data = [];
    const result = await kv.list({ prefix: ["full"] });
    for await (const { value } of result) {
      _data.push(value);
    }
    const firsttimestamp = _data[0].timestamp;

    // Remove the oldest entries to make space for the new one.
    if (_data.length >= MAX_ENTRIES) {
      await kv.delete(["tokens", firsttimestamp]);
      await kv.delete(["liquidities", firsttimestamp]);
      await kv.delete(["volumes", firsttimestamp]);
      await kv.delete(["arb", firsttimestamp]);
      await kv.delete(["eth", firsttimestamp]);
      await kv.delete(["bsc", firsttimestamp]);
      await kv.delete(["base", firsttimestamp]);
      await kv.delete(["avax", firsttimestamp]);
      console.log("Deleted oldest entries :",firsttimestamp);
    }
    await kv.set(
      ["arb", timestamp],
        {
          timestamp: timestamp,
          arb_price: arb_price,
          arb_liq: arb_liq,
          arb_vol: arb_vol,
        },
    );
    await kv.set(
      ["eth", timestamp],
        {
          timestamp: timestamp,
          eth_price: eth_price,
          eth_liq: eth_liq,
          eth_vol: eth_vol,
        },
    );
    await kv.set(
      ["bsc", timestamp],
        {
          timestamp: timestamp,
          bsc_price: bsc_price,
          bsc_liq: bsc_liq,
          bsc_vol: bsc_vol,
        },
    );
    await kv.set(
      ["base", timestamp],
        {
          timestamp: timestamp,
          base_price: base_price,
          base_liq: base_liq,
          base_vol: base_vol,
        },
    );
    await kv.set(
      ["avax", timestamp],
        {
          timestamp: timestamp,
          avax_price: avax_price,
          avax_liq: avax_liq,
          avax_vol: avax_vol,
        },
    );
    await kv.set(["liquidities", timestamp], {
      timestamp: timestamp,
      arb_liq: arb_liq,
      eth_liq: eth_liq,
      bsc_liq: bsc_liq,
      base_liq: base_liq,
      avax_liq: avax_liq,
    });
    await kv.set(["volumes", timestamp], {
      timestamp: timestamp,
      arb_vol: arb_vol,
      eth_vol: eth_vol,
      bsc_vol: bsc_vol,
      base_vol: base_vol,
      avax_vol: avax_vol,
    });
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
router.get("/v1/liquidities", async (ctx) => getDataByPrefix(ctx, "liquidities"));
router.get("/v1/volumes", async (ctx) => getDataByPrefix(ctx, "volumes"));
router.get("/v1/tokens/arb", async (ctx) => getDataByPrefix(ctx, "arb"));
router.get("/v1/tokens/eth", async (ctx) => getDataByPrefix(ctx, "eth"));
router.get("/v1/tokens/avax", async (ctx) => getDataByPrefix(ctx, "avax"));
router.get("/v1/tokens/base", async (ctx) => getDataByPrefix(ctx, "base"));
router.get("/v1/tokens/bsc", async (ctx) => getDataByPrefix(ctx, "bsc"));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8001 });
