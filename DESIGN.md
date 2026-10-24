# The Lake (working title)

A playable simulation that argues one thing: the tragedy of the commons is not a law of nature. Hardin (1968) said a shared resource gets overused until it dies. Elinor Ostrom (Nobel 2009) went and looked at real commons, and found communities that had run fisheries, pastures and irrigation for centuries. What separated the survivors from the collapses was institutions, which she distilled into eight design principles.

The player cannot fish. They can only switch Ostrom's eight principles on and off and watch the lake live or die.

One self-contained HTML file: canvas lake on top, a stock-over-time chart, eight switches, two presets ("Hardin" = all off, "Ostrom" = all on), and short real-world case notes.

## Model (one tick = one fishing season)

Stock `S`, carrying capacity `K` (starts 1000). Logistic regrowth `S += r·S·(1 − S/K)`, `r = 0.4`.
Schaefer harvest: village `i` with effort `e_i` catches `h_i = q·e_i·S`, `q = 0.01`. Profit `p·h_i − c·e_i`.
Total catch can never exceed `S` (pro-rated). Stock below 2% of K = collapse (regrowth halts for a few seasons, then very slow recovery).

8 member villages around the shore. Each has `greed_i ∈ [0.2, 0.9]` (fixed) and `trust_i ∈ [0, 1]` (dynamic, starts 0.6).

Without a quota, each village picks its open-access best response: effort rises while marginal profit is positive (`p·q·S > c`), so stock is pushed to the open-access equilibrium `S* = c/(p·q)`, set well below MSY (`K/2`), with noise that tips it into collapse.

### The eight switches

1. **Clear boundaries** — off: outsider boats enter when the fishery is profitable (entry ∝ profit per boat), leave slowly when it is not. On: members only.
2. **Rules fit local conditions** — on: the quota tracks the measured stock (target effort that holds S near K/2). Off: one fixed quota that ignores stock, set for a good year.
3. **Collective choice** — on: villages set the quota together at a council, so complying feels legitimate (+trust each season the council meets). Off: no council; quota (if any) is imposed, a smaller legitimacy bonus. Without 2 and 3 both off there is no quota at all.
4. **Monitoring** — probability a village that over-fishes is detected: 0.8 on, 0.05 off.
5. **Graduated sanctions** — on: fines escalate per repeat offence (warning, small, large, suspension). Off: a single flat fine that is either trivial or ruinous (we use trivial).
6. **Conflict resolution** — on: detected cheating triggers mediation; trust loss among others is halved and recovers. Off: detection spreads resentment; others' trust drops sharply ("if they cheat, why shouldn't I").
7. **Right to organise** — off: every N seasons an outside authority overrides local rules (licenses a trawler for a few seasons). On: local rules stand.
8. **Nested enterprises** — off: upstream farms erode K a little each season (runoff), nobody coordinates. On: watershed council caps runoff; K slowly recovers toward 1000.

### Compliance decision (when a quota exists)

Village cheats (fishes `1 + greed_i` × its quota share) when
`greed_i · gain > detect · expectedFine + trust_i · conscience`.
Trust moves: +legitimacy when council meets, −resentment when cheating is seen without mediation, +small when sanctions are applied (justice seen to be done), −when a village notices stock falling while it complied.

## Visual

Top-down lake on a dusk palette, fish as shimmer particles (count ∝ S), villages as huts on the shore, boats rowing out each season, outsider boats in a different colour, a detected cheater flashes. The trawler is large and ugly. Collapse greys out the water.

Below: line chart of stock (and K) over seasons, with MSY marked.

## Open questions for review

- Does the model produce the right qualitative result without being rigged? All-off should collapse; all-on should sustain; partial sets should be interesting (e.g. monitoring without conflict resolution sustains but with a resentment spiral; quota without monitoring fails).
- Are any principles redundant or doing nothing in this formulation?
- Are there degenerate parameter regimes (oscillations, trivially stable no-matter-what)?
