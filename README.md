# arielbodik.com

Eleven working tools for accounting, audit, AI controls and sports finance —
built, tested and shipped by one person. Live at **[arielbodik.com](https://arielbodik.com)**.

I'm a B.S. Accounting student at Fairleigh Dickinson University (December 2026,
CPA track). I build these because reading about a control is not the same as
implementing one, and because a spreadsheet can hide an assumption that code
has to state out loud.

---

## The tools

### Audit & accounting

**LedgerLens** — Benford's Law anomaly detection. Paste a column of financial
figures and it compares the leading-digit distribution against the expected
curve, flagging the digits whose frequency departs far enough to be worth a
second look. Benford's is a *screening* test, not evidence of fraud, and the
tool says so.

**TieOut** — bank reconciliation in three passes. Exact match, then amount
match inside a date window, then fuzzy proposals ranked by description
similarity. The third pass is the interesting one: a proposal is only a
hypothesis, and it clears only if the amounts agree exactly and the dates fall
inside a widened window. Similarity buys a longer date window, because a strong
name match is real evidence about *identity*; it never buys an amount
exception, because a description says nothing about *magnitude*. Ends in a
reconciliation statement that proves out to the penny, or names the residual
that doesn't.

**ClarityCheck** — writing analyzer. Scores clarity and suggests tighter
phrasing.

### AI controls

The theme across these three: **model output is untrusted input.** A model's
own confidence is untrusted too — LLMs are badly calibrated at saying "I'm 90%
sure," so a tool that simply prints a confidence score has moved the problem
rather than solved it. What holds up is external checks the model cannot fake:
arithmetic that must tie, schemas that must parse, records that must agree with
a second and third independent source.

**IntakeGate** — AP invoice intake under ten deterministic controls. Line items
must foot to the subtotal, extensions must recompute from quantity × unit
price, subtotal plus tax must equal the total, the tax rate must recompute and
stay inside policy, the vendor must match an approved master, the PO must match
a format, the date must fall in an open period, and the invoice must not
already be in the duplicate register. Clean documents post straight through;
anything that fails is held with the reason attached. Six sample documents each
carry a planted defect and each trips exactly the control that should catch it.

Two parser bugs found during development are the honest illustration of the
whole idea: a `Total:` pattern silently matched inside `Sub**total**:`, and a
single-space column broke line parsing. Both produced confident, wrong output.
The arithmetic controls caught both.

**CalibrationLab** — an evaluation harness that asks whether a model deserves
the trust. It bins predictions by stated confidence, compares each bin against
measured accuracy, and reports expected calibration error. Then it sweeps the
auto-approve threshold and shows the real tradeoff: on the sample run, a 60%
cutoff automates everything at a 9.8% error rate, while 95% cuts errors to 1.0%
but automates only 41.6% and sends 286 items to review. Field-level results
carry the sharper point — `invoice_number` is 98.6% accurate while
`line_description` is 68.6%, so one global threshold over-polices the easy
fields and under-polices the hard one.

**MatchPoint** — three-way match: invoice against purchase order against
receiving report. This exists because IntakeGate cannot catch a defect that is
internally consistent. An invoice for goods never received foots perfectly.
Only a second and third independent record can answer *was it ordered, was it
received, was it billed at the agreed price* — and every discrepancy is priced,
which turns a list of differences into a recovery number.

### Sports finance

**CapRoom** — NBA salary cap and luxury tax simulator. Bracketed tax
computation against CBA thresholds, apron restrictions, and **all 30 teams
loaded contract by contract** — 360 contracts, every roster summing exactly to
its team's stated total. A $199M non-repeater roster computes to $12,460,000 of
tax, which ties to the CBA formula exactly. Delete a contract and watch a roster
fall from over the first apron to under the cap.

Dead money is modelled, which is where it gets interesting: $64.9M of it across
eight teams, including $22.5M Milwaukee still owes Damian Lillard while he plays
in Portland at $13.4M, and $19.4M Phoenix owes Bradley Beal while he plays for
the Clippers at $5.6M. The same contract appears on two teams' books at once
because the model is built on real contracts rather than tidy examples.

An audit of this tool caught a bug worth recording: salaries loaded into a
"millions" input rounded to two decimals, so a $57,078,728 contract became
$57,080,000. Small per player, but the tax brackets multiply the error by up to
4.75x, and seven teams' tax bills were wrong. The tool now carries exact dollar
values on each input and drops them the moment the user types. The bug was
invisible until the engine was reimplemented independently and compared.

**GateDay** — event-day P&L for an arena. Gate less the rights-holder split,
premium seating, concessions and merchandise at the venue's *retained* share
(arenas outsource F&B and keep a commission on gross — modelling it as simple
COGS gets the economics wrong), parking, sponsorship, then variable and fixed
event cost. The bottom line is deliberately called event-level contribution,
not operating income: payroll, media rights, revenue sharing, overhead and
depreciation all sit outside a single event.

**SuiteLine** — premium seating optimizer. The key move is normalising every
tier to dollars per seat per event, which makes a $1.1M suite and a $9,500 club
seat comparable on one axis. Benchmarks each tier against its own market comp
rather than one global number — my first version used a single benchmark and
wrongly flagged club seats as underpriced against suite pricing.

### Utilities

**PromptLab** — prompt-engineering workbench. **TimeBlock** — time-blocking
planner. **SpacePlanner** — drag-and-drop room sketcher.

---

## How it's built

No framework, no build step. Every tool is a single self-contained HTML file
with its own CSS and vanilla JavaScript, which means any of them can be opened
locally with no toolchain and read end to end by anyone evaluating the code.

```
index.html              homepage
nyc-home.html           interactive 8-bit landing scene (canvas)
core-theme.css          light "Core" theme layered over the tool pages
snow.js                 pixel snow
a11y.js                 accessibility widget (text size, contrast, motion)
spotifyplayer.js        floating music player
netlify/functions/      serverless backend for the AI assistant
tools/                  the eleven tools
```

Deployed from GitHub to Netlify on push, custom domain through Cloudflare DNS.

**The landing page** (`nyc-home.html`) is a hand-drawn pixel New York rendered
on a 288-pixel-tall canvas and scaled up with `image-rendering: pixelated`, so
every building, boat and star is a genuine chunky pixel rather than a filter.
Five layers parallax against the mouse at different rates; the camera floats on
the Hudson with a ferry, tug, sailboats, jet skis, and fish and dolphins that
surface on a timer. Landmark buildings carry the tool names and are hoverable
and clickable. The chiptune under AUDIO.WAV is synthesised live with the Web
Audio API — a square-wave arpeggio over a triangle bass, no audio file.

Accessibility: reduced-motion is respected throughout (animation stops, the
scene stays legible), the a11y widget controls text size and contrast, and
interactive elements keep visible focus states.

---

## What I'd want a reviewer to notice

**The math is verified, not asserted.** Every calculation in these tools was
checked against an independent implementation before shipping. CapRoom's tax
brackets, GateDay's contribution and break-even, SuiteLine's yield and renewal
exposure, CalibrationLab's accuracy and expected calibration error, MatchPoint's
priced exposure, TieOut's reconciliation — each was computed a second way and
compared. Several bugs surfaced that way, which is the point of doing it.

**Every tool states its own limits.** GateDay's presets are illustrative
assumptions shaped by published league benchmarks, not any club's financials.
CapRoom's team payrolls are a dated snapshot, not live. IntakeGate's extractor
is a local parser standing in for a model. CalibrationLab's sample run is
synthetic. These disclaimers are on the pages, not buried here, because a model
whose boundaries are stated is more useful than one that looks authoritative
and isn't — and knowing the difference is itself an accounting skill.

**The AI is architected, not bolted on.** In IntakeGate the controls are pure
functions that never consult the extractor's opinion of its own accuracy; swap
in a model and not one control changes. In MatchPoint and TieOut, the fuzzy
layer proposes and deterministic tests dispose. That separation is just
internal controls applied to a model, and it's the part I'd most want to talk
about.

---

## Contact

**Ariel Bodik** · bodika24@gmail.com ·
[linkedin.com/in/ariel-bodik](https://www.linkedin.com/in/ariel-bodik) ·
[arielbodik.com](https://arielbodik.com)
