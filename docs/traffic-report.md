# Traffic report

Turns the Umami event log into a readable summary of who came, what they sized,
and on which hardware. Private tooling — it is not part of the site and is never
deployed.

```bash
node scripts/report-traffic.ts rows.json report.html
node scripts/report-traffic.ts --demo            # synthetic rows, to see the shape
```

## Why the raw data needs interpreting

The app keeps its entire state in the URL, and **every setting a visitor changes
rewrites that URL, which fires another pageview**. One person tuning context and
concurrency for ten minutes produces dozens of rows carrying their model, their
precision and their device. Counting rows would make the report describe whoever
fiddled the most, so everything is aggregated **per session**.

Two events in a session matter, and they mean different things:

- the **first** is how they arrived — a bare visit carries no model and no
  device, a shared link carries someone else's configuration;
- the **last** is what they settled on, which is the interesting one.

Both mean *the first and last event that actually carries configuration*, not
the literal first and last row. `decode.html` and `learn.html` write no query at
all and `fit.html` writes only `task`, so taking the literal last row threw away
the whole configuration whenever a visitor finished by clicking a nav link.

**Defaults were the trap, and they are gone from the sizing page.** Measured over
the first two weeks under the old behaviour: **36 of 60 sessions ended on a model
the app had chosen for them**, and only 8 ended on something that was never a
default. A "top models" chart built naively was mostly a picture of our own
landing state — and every crawler that runs JavaScript contributed to it, because
rendering the page was enough to emit a model and a device.

Filtering that out at this end never really worked. It could not tell a
deliberate pick of the default from inertia, so it discarded both — including the
people who genuinely wanted that model. And the trap moved: before 2026-09-05 the
default was Llama 3.1 8B, so picking Qwen2.5 32B was a real choice and counted as
one; the moment Qwen2.5 32B *became* the default, identical behaviour stopped
counting.

**So the sizing page now opens on nothing** (2026-09-07) — no model, no device.
There is no default left to be confused with a choice, and a crawler that never
interacts contributes a blank arrival instead of a fabricated preference.

The report decides the rule **per session**, from the data rather than from a
date:

- a session that **opened the sizing page** carrying neither a model, nor an
  architecture, nor a device saw the blank page. What it settles on there was
  put there by a person, and is credited in full.
- a session arriving with a value the app **has ever opened on** is from before
  the change (or from a page that still seeds one — see below). For those, no
  such value is credited, because inertia and a deliberate pick are still
  indistinguishable.

Both halves are scoped by **surface**. "Landed empty" counts only sessions that
actually opened the calculator — otherwise every LLM-101 reader counted as
someone who saw the empty page and walked away. And a seed is only filtered on
the page that writes it: `h100-80` is the vLLM helper's own default, but on the
sizing page it is an ordinary card someone chose.

A hand-entered architecture counts as arriving on something. The Custom tab
shares `p`/`L`/… with no model id, and its recipient still lands on a populated
page — `isBlankStart()` in `src/lib/urlState.ts` and the report agree on this,
and should be kept in step.

Two tiles carry the honest picture: **Landed empty** (how many arrivals saw the
blank page at all) and **Then picked something** (how many of those went on to
choose). Read the second as a trend, not as an absolute: crawlers land in the
denominator, so it understates human activation by an unknown amount.

`Engaged` means the state actually moved. It is not "more than one pageview" —
the app rewrites the URL as soon as it boots, so even a visitor who touches
nothing produces a second row.

### The other pages still seed a default

`vllm.html` and `train.html` have no useful output without a model and a device,
so they still open on one (`Qwen2.5 32B` with `h100-80` and `rtx4090-24`
respectively). Those rows are **not** blank starts, and their seeded pairs are
listed in `report-traffic.ts` — tagged with their own surface — so they are never
credited as choices *on those pages*, while the same cards stay creditable on the
sizing page.

This is a deliberate choice, not an oversight: unlike the calculator — whose VRAM
breakdown is computed from the model alone and needs no card — those two pages
produce nothing at all without both, so a blank start there would leave the
visitor with an empty screen and no way to understand the page. The surface tag
is what keeps the report honest about them.

Two consequences to keep in mind when reading a report: "Landed empty" is counted
against **calculator visits** (`sizingSessions`), not all traffic, because those
two pages can never arrive blank; and a crawler hitting them still contributes a
model and a device nobody selected, which lands in "Took a default we showed
them" rather than in any of the choice lists.

### Events, and why the report does not read them

The app also emits interaction events that a default can never produce:
`model-view` and `device-select` (fired only from a click), `activated` (the
first pick of a session) and `landed` (every arrival, tagged blank or shared).
They are readable directly in Umami.

The report does **not** use them. Umami keeps event properties in a separate
`event_data` table, and the export below is a single flat query over
`website_event`; deriving the blank start from the URL instead keeps that query
unchanged and works retroactively on rows collected before the events existed.
The events are the cross-check, not the source.

## Getting the export

The report reads a JSON array of `website_event` rows joined to `session` —
`session_id`, `created_at`, `url_path`, `url_query`, `referrer_domain`,
`event_name`, `country`, `device`. Any Umami instance can produce it:

```sql
SELECT json_agg(t) FROM (
  SELECT e.session_id::text AS session_id, e.created_at::text AS created_at,
         e.url_path, e.url_query, e.referrer_domain, e.event_name,
         s.country, s.device
  FROM   website_event e
  JOIN   session s ON s.session_id = e.session_id
  WHERE  e.website_id = '<your website id>'
    AND  e.created_at >= now() - interval '30 days'
  ORDER  BY e.created_at
) t;
```

```bash
node scripts/report-traffic.ts rows.json report.html      # the full page
node scripts/report-traffic.ts rows.json --markdown       # a digest
node scripts/report-traffic.ts rows.json --email          # HTML for e-mail
node scripts/report-traffic.ts --demo                     # synthetic, to see the shape
```

Deployment of the weekly job is environment-specific and lives with the
infrastructure that runs it, not here.

## The historical default list

`report-traffic.ts` carries every configuration the app has ever opened on,
newest first, **each tagged with the page that opened on it**. Nothing is ever
removed: a report spanning a change of default must recognise the older one, or
every visitor from before the change is counted as arriving on a shared link and
their inertia is counted as a choice.

Add the outgoing pair whenever a default moves, tag it with its surface, and
never delete an entry. Leaving the surface off makes the entry match everywhere,
which silently deletes that card from the report for the whole site.

## What it will not tell you

- **Individuals.** Umami sessions are anonymous and cookieless; there is no way
  back to a person, and nothing here tries.
- **Whether a number was acted on.** The report shows what people configured,
  not what they bought or deployed.
- **Bots.** Umami drops obvious bot user agents, but a headless browser that
  does not announce itself lands in the data like anyone else. A sudden spike in
  single-event sessions from one country is usually that, not interest.
- **Your own testing.** Driving the live site from a browser lands in the data
  like any other visitor. Filter by date when you have just spent a session on
  it.
- **Compare-page rows.** `compare.html` puts several models in one `m` parameter,
  so those appear as one comma-joined label rather than as separate models.

## A note on what is collected

This report exists because the tracker receives the full URL, model and settings
included. The site's footer used to claim inputs never left the browser; that
was corrected rather than the collection stopped. What remains true, and is what
the footer now says, is that the **calculation** runs in the browser with no
account and no backend. Keep that distinction intact when editing the copy.
