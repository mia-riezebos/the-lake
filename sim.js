// The Lake: a common-pool fishery under Ostrom's eight design principles.
// Pure engine, no DOM. `step` advances one fishing season and returns a new state.

/** The eight switches, keyed by short id, in Ostrom's order. */
export const PRINCIPLES = [
  "boundaries",
  "fit",
  "council",
  "monitoring",
  "sanctions",
  "mediation",
  "autonomy",
  "nested",
];

export const ALL_ON = Object.fromEntries(PRINCIPLES.map((k) => [k, true]));
export const ALL_OFF = Object.fromEntries(PRINCIPLES.map((k) => [k, false]));

export const P = {
  K0: 1000, // pristine carrying capacity
  r: 0.4, // intrinsic growth per season
  rNoise: 0.35, // environmental stochasticity: good and bad years
  allee: 0.15, // below allee·K, recruitment fails proportionally (depensation)
  q: 0.01, // catchability
  price: 1,
  cost: 2, // per unit effort; open-access equilibrium S* = cost/(price·q) = 200
  villages: 8,
  entryRate: 0.15, // open-access effort response to profit
  maxEffort: 8, // per village
  fixedCatch: 90, // a one-size catch limit written in a good year (MSY is 100 at full capacity)
  pull: 0.2, // adaptive quota's pull toward half capacity
  countNoise: 0.3, // log-sd of the stock estimate nobody checks
  privilege: [1.5, 1.36, 1.21, 1.07, 0.93, 0.79, 0.64, 0.5], // catch shares when the split isn't fair; sums to 8
  grievance: 0.04, // trust lost per season per unit of share shortfall
  humiliation: 0.2, // trust a village loses when hit with the flat fine
  whim: 0.15, // spread of each season's cheat-or-not decision
  trustCouncil: 0.65,
  trustImposed: 0.45,
  repairOn: 0.12,
  repairOff: 0.03,
  resentment: 0.05, // per neighbour caught cheating
  sucker: 0.02, // per unseen cheater, felt by those who complied
  overruled: 0.03, // per season a trawler fishes under an outside licence
  outsiderEffort: 2,
  outsiderEntry: 0.25,
  maxOutsiders: 8,
  trawlerEvery: 12,
  trawlerSeasons: 3,
  trawlerEffort: 10,
  refugium: 2, // fish that drift in from upstream each season, so an empty lake can recover
  detectOn: 0.8,
  detectOff: 0.05,
  flatFine: 1, // one ruinous fine for any offence, first or tenth
  enforceFlat: 0.3, // chance neighbours actually impose it (my assumption, not a measurement)
  ladder: [0.15, 0.4, 0.8, 1.2], // graduated sanctions; the last rung also suspends
  suspension: 2,
  forgive: 4, // clean seasons to drop one strike
  runoff: 0.02, // share of the gap to Kfloor lost each season
  recovery: 0.01,
  Kfloor: 600, // capacity runoff erodes toward
  collapse: 0.02,
};

/**
 * Seeded PRNG (mulberry32) whose state lives in the sim state, so `step` stays pure.
 * Two streams: `seed` for people's choices, `weather` for good and bad years, so the same
 * seed gives the same weather whatever the rules.
 */
const rand = (s, stream = "seed") => {
  s[stream] = (s[stream] + 0x6d2b79f5) | 0;
  let t = s[stream];
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (s, stream) => Math.sqrt(-2 * Math.log(1 - rand(s, stream))) * Math.cos(2 * Math.PI * rand(s, stream));
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

export function createState(seed = 1) {
  const s = { seed, weather: seed ^ 0x9e3779b9, season: 0, S: P.K0 * 0.8, K: P.K0, outsiders: 0, trawler: 0, collapsed: false, last: null };
  s.villages = Array.from({ length: P.villages }, (_, i) => ({
    greed: 0.2 + (0.7 * i) / (P.villages - 1),
    trust: 0.6,
    effort: 2,
    strikes: 0,
    clean: 0,
    suspended: 0,
    cheated: false,
    ruined: false,
    caught: false,
    catch: 0,
  }));
  return s;
}

/** Restock an emptied lake without resetting its institutions or its people. */
export function restock(state) {
  return { ...structuredClone(state), S: state.K * 0.5, collapsed: false };
}

/** Advance one season under the given switches. Returns a new state with `events` for the renderer. */
export function step(state, sw) {
  const s = structuredClone(state);
  const events = [];
  const { villages: vs } = s;
  const margin = P.price * P.q * s.S - P.cost; // profit per unit effort at the current stock
  const hasQuota = sw.fit || sw.council;

  // 1. Effort. Quotas are in fish, not effort: a fixed effort limit would adapt to the stock on its own.
  // Adaptive: expected regrowth of the *counted* stock, plus a pull toward half capacity; without
  // monitoring the count is a guess. Fixed: one number written in a good year.
  // Fitting rules also share the catch fairly; otherwise old privileges skew it.
  const counted = sw.monitoring ? s.S : s.S * Math.exp(P.countNoise * gauss(s));
  const regrowth = P.r * counted * (1 - counted / s.K);
  const quota = sw.fit ? clamp(regrowth + P.pull * (counted - s.K / 2), 0, 0.9 * s.S) : P.fixedCatch;
  const detect = sw.monitoring ? P.detectOn : P.detectOff;
  const eMSY = P.r / (2 * P.q);
  vs.forEach((v, i) => (v.share = sw.fit ? 1 : P.privilege[i]));
  for (const v of vs) {
    v.cheated = v.caught = v.ruined = false;
    if (v.suspended > 0) {
      v.suspended--;
      v.effort = 0;
      continue;
    }
    if (!hasQuota) {
      v.effort = clamp(v.effort + P.entryRate * margin * (0.5 + v.greed), 0, P.maxEffort);
      continue;
    }
    // Fish the share only while it pays; cheating adds effort on top, even under a closure.
    const share = margin > 0 ? (quota * v.share) / vs.length / (P.q * s.S) : 0;
    const fine = sw.sanctions ? P.ladder[Math.min(v.strikes, P.ladder.length - 1)] : P.flatFine * P.enforceFlat;
    v.cheated = margin > 0 && v.greed + P.whim * gauss(s) > v.trust + detect * fine;
    v.effort = Math.min(P.maxEffort, share + (v.cheated ? (v.greed * eMSY) / vs.length : 0));
  }
  if (!sw.boundaries) {
    s.outsiders = clamp(s.outsiders + P.outsiderEntry * margin - (margin < 0 ? 0.2 * s.outsiders : 0), 0, P.maxOutsiders);
  } else s.outsiders = 0;
  if (sw.autonomy) s.trawler = 0; // local rules stand: any outside licence is void at once
  if (!sw.autonomy && s.trawler === 0 && s.season > 0 && s.season % P.trawlerEvery === 0) {
    s.trawler = P.trawlerSeasons;
    events.push({ type: "trawler" });
  }
  const trawling = s.trawler > 0 ? P.trawlerEffort : 0;
  if (s.trawler > 0) s.trawler--;

  // 2. Harvest, pro-rated so the catch never exceeds 90% of the stock.
  const memberEffort = vs.reduce((a, v) => a + v.effort, 0);
  const totalEffort = memberEffort + s.outsiders * P.outsiderEffort + trawling;
  const wanted = P.q * totalEffort * s.S;
  const caught = Math.min(wanted, 0.9 * s.S);
  const perEffort = totalEffort > 0 ? caught / totalEffort : 0;
  for (const v of vs) v.catch = v.effort * perEffort;
  s.S -= caught;

  // 3. Detection, sanctions, trust. A clean record slowly earns strikes back.
  for (const v of vs) {
    v.clean = v.cheated ? 0 : v.clean + 1;
    if (v.clean >= P.forgive && v.strikes > 0) {
      v.strikes--;
      v.clean = 0;
    }
  }
  const cheaters = vs.filter((v) => v.cheated);
  for (const v of cheaters) {
    if (rand(s) >= detect) continue;
    v.caught = true;
    // Neighbours rarely bring themselves to ruin a neighbour, so the flat fine is often waived.
    v.ruined = !sw.sanctions && rand(s) < P.enforceFlat;
    // rung: index into P.ladder of the sanction applied (the top rung suspends); -1 flat fine; -2 waived.
    const rung = sw.sanctions ? Math.min(v.strikes, P.ladder.length - 1) : v.ruined ? -1 : -2;
    events.push({ type: "caught", village: vs.indexOf(v), rung });
    if (sw.sanctions) {
      v.strikes++;
      if (v.strikes >= P.ladder.length) {
        v.suspended = P.suspension;
        v.strikes = 1;
      }
    }
  }
  const caughtCount = cheaters.filter((v) => v.caught).length;
  const unseen = cheaters.length - caughtCount;
  // Trust relaxes toward a baseline set by legitimacy (rules you helped make), and shocks push it around.
  // Mediation both softens resentment and speeds repair.
  const baseline = sw.council ? P.trustCouncil : P.trustImposed;
  const repair = sw.mediation ? P.repairOn : P.repairOff;
  for (const v of vs) {
    const others = caughtCount - (v.caught ? 1 : 0);
    const soften = sw.mediation ? 0.3 : 1;
    let dt = repair * (baseline - v.trust);
    dt -= others * P.resentment * soften;
    if (v.ruined) dt -= P.humiliation * soften; // a ruinous fine breeds a grudge
    if (hasQuota) dt -= P.grievance * Math.max(0, 1 - v.share); // short-changed by the split
    if (!v.cheated) dt -= unseen * P.sucker;
    if (trawling) dt -= P.overruled;
    v.trust = clamp(v.trust + dt);
  }

  // 4. Regrowth with good/bad years and depensation.
  const rt = P.r * Math.max(0.1, 1 + P.rNoise * gauss(s, "weather"));
  const recruit = Math.min(1, s.S / (P.allee * s.K));
  s.S = Math.max(0, s.S + rt * s.S * (1 - s.S / s.K) * recruit) + P.refugium;

  // 5. Watershed.
  s.K = sw.nested ? Math.min(P.K0, s.K + P.recovery * P.K0) : s.K - P.runoff * (s.K - P.Kfloor);

  s.season++;
  const collapsed = s.S < P.collapse * s.K;
  if (collapsed && !s.collapsed) events.push({ type: "collapse" });
  s.collapsed = collapsed;
  s.last = { S: s.S, K: s.K, catch: caught, cheaters: cheaters.length, caught: caughtCount, outsiders: s.outsiders };
  s.events = events;
  return s;
}
