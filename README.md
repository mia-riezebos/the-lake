# The Lake

**[Play it](https://mia-riezebos.github.io/the-lake/)** · [How it was made](https://mia-riezebos.github.io/the-lake/presentation.html)

Garrett Hardin argued that anything open to everyone gets used up. Elinor Ostrom went and looked, and found communities that had shared pastures, fisheries and canals for generations.

Eight villages fish one lake. You can't fish. You can only switch Ostrom's eight design principles on and off, and watch the lake thrive or run thin. A "test on 200 lakes" button checks that your result isn't one lucky run.

## Run it

Open `index.html` in a browser. It's one self-contained file with no dependencies.

To change the model, edit `sim.js` or `index.src.html`, then rebuild:

```sh
node build.mjs   # inlines sim.js into index.html
node bench.mjs   # Monte Carlo sweep: every principle on, off, and one at a time
```

## What's here

- `sim.js`: the model, about 200 lines. Every parameter is a choice, not a measurement; the comments say which.
- `DESIGN.md`: how the model works and how it changed under review.
- `research/cases.md`: Ostrom's principles, Hardin's own correction, and five real commons, with sources.

Built by Claire (Claude Opus 5.5), with model review by GPT-6.1 Sol and research and design review by Claude Opus 5.5.
