# The Lake

A playable argument: the tragedy of the commons is not a law of nature. Hardin (1968) said anything open to everyone gets used up; thirty years later he conceded he meant *unmanaged* commons. Elinor Ostrom (Nobel 2009) studied commons that lasted and distilled eight design principles. The player cannot fish. They switch the principles on and off and watch the lake.

One self-contained page (`index.html`, built from `index.src.html` + `sim.js` by `node build.mjs`). Research and sources: `research/cases.md`.

## Model (`sim.js`, one tick = one season)

- Stock `S`, capacity `K` (1000). Logistic regrowth `r = 0.4` with good and bad years (separate weather RNG stream, so a seed's weather is the same under any rules). Depensation below 0.15·K; a refugium adds 2 fish a season so an empty lake can recover.
- Schaefer harvest `q·E·S`; price 1, cost 2 per unit effort, so open access settles at `S* = 200`.
- No catch limit (switches 2 and 3 both off): villages adjust effort with profit, capped. From a full lake this overshoots and crashes, then settles thin at 200. A lake starting at 400 never empties: the crash is the opening boom-bust, not the steady state.
- Catch limits are in fish (an effort limit adapts to stock by itself, which made switch 2 inert). Adaptive: expected regrowth of the counted stock plus a pull toward K/2. Fixed: 90.
- Each season a village takes extra if `greed + noise > trust + detect·penalty`. Extra effort doesn't depend on the quota, so cheating persists under closures.
- Trust relaxes toward a legitimacy baseline (0.65 with council, 0.45 imposed). Shocks: neighbours caught, unseen cheating felt by compliers, short shares, trawler seasons, ruinous fines. Mediation softens shocks and speeds repair.

## The switches

1. **Boundaries**: off, outsider boats enter while fishing pays (capped at 8).
2. **Rules that fit**: adaptive limit and fair shares; off, fixed 90 and skewed shares that cost the short-changed villages trust.
3. **Shared decisions**: higher trust baseline.
4. **Monitoring**: detection 0.8 vs 0.05, and an accurate stock count; off, the adaptive limit works from a guess.
5. **Graduated sanctions**: warning, fines, suspension, strikes forgiven after clean seasons. Off: one ruinous fine, imposed only 30% of the time (assumption) and leaving a grudge. If it were always imposed, a flat fine would deter as well; that is disclosed on the page.
6. **Conflict resolution**: softer shocks, faster repair.
7. **Right to organise**: off, the capital licenses a trawler every 12 seasons; on, any licence is void at once.
8. **Nested governance**: off, runoff erodes K toward 600.

## Evidence (`node bench.mjs`, 200 seeds × 300 seasons)

All on never empties (stock about 438, catch 92). All off empties in 99% of runs, all during the opening rush, then catches about 47. Removing any single switch from all-on costs stock and catch; council and mediation least, which matches the meta-analyses (Cox et al. 2010). Some principles hurt alone (boundaries + nested without a catch limit give boom-bust cycles); Baggio et al. 2016 found no principle sufficient on its own, so this is kept.

## Review history

- Sol 6.1 round 1: effort quotas redundant, justice bonus perverse, caps needed. Adopted.
- Opus research: monitoring covers the stock, harsh flat fines, fair shares, framing. Adopted.
- Sol 6.1 round 2: crash is a startup transient, weather stream, trawler under autonomy. Adopted. Scripts in `critique/` (ignored).
