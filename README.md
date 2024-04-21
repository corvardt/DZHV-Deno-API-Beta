# DZHV API
#### Uses deno kv & cron.
##### New data points every 15 minutes



## url: //

## endpoints: 
- ##### /v1/tokens/{chain} (eth,arb,avax,base,bsc) => timestamp, token_price, token_liq, token_vol.
- ##### /v1/tokens => pure prices : timestamp, arb_price, eth_price, bsc_price, base_price, avax_price.
- ##### /v1/liquidities => pure liq : timestamp, arb_liq, eth_liq, bsc_liq, base_liq, avax_liq.
- ##### /v1/volumes => pure vol : timestamp, arb_vol, eth_vol, bsc_vol, base_vol, avax_vol.
