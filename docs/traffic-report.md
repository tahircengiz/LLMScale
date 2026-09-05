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

- the **first** is how they arrived — a bare visit carries the app's own
  defaults, a shared link carries someone else's configuration;
- the **last** is what they settled on, which is the interesting one.

A session with a single event never touched a control.

**Defaults are the trap, and it is bigger than it looks.** Measured over the
first two weeks: **36 of 60 sessions ended on a model the app had chosen for
them**, and only 8 ended on something that was never a default. A "top models"
chart built naively is mostly a picture of our own landing state.

Worse, the trap moves. Before 2026-09-05 the default was Llama 3.1 8B; picking
Qwen2.5 32B was then a real choice and was counted as one. The moment Qwen2.5
32B *became* the default, the identical behaviour stopped counting — so the same
metric measured different things either side of that date, and the two periods
were not comparable.

So the rule is deliberately strict: **a model or device the app has ever opened
on is never credited as a choice**, past defaults included. A deliberate pick of
the value we put in front of someone cannot be distinguished from inertia, and
excluding all of them keeps the metric stable when the default moves.

These lists therefore **undercount on purpose**. The honest engagement figures
are the tiles: how many sessions moved off the model we showed (16 of 60), off
the device (14), and how many simply took what they were given (36).

## Getting the export

Umami runs on **GTR9** (`~/projects/infra-umami`), containers `umami` and
`umami-db`. The panel is at `https://stats.lab.delix.dev` behind Traefik, which
resolves to GTR9's Tailscale address — reachable from the tailnet only. Public
ingest stays on `stats.delix.dev` via the Cloudflare tunnel, which routes
straight to the container and never touches Traefik.

Run the export on the host:

```sql
COPY (
  SELECT json_agg(t) FROM (
    SELECT e.session_id::text        AS session_id,
           e.created_at::text        AS created_at,
           e.url_path,
           e.url_query,
           e.referrer_domain,
           e.event_name,
           s.country,
           s.device
    FROM   website_event e
    JOIN   session s ON s.session_id = e.session_id
    WHERE  e.website_id = '22ee565e-f235-43fe-bd5e-3b693cbf86ca'
      AND  e.created_at >= now() - interval '30 days'
    ORDER  BY e.created_at
  ) t
) TO STDOUT;
```

```bash
ssh gtr9 "docker exec umami-db psql -U umami -d umami -tAc \"<the query above>\"" > rows.json
node scripts/report-traffic.ts rows.json report.html
```

## Defaults change, and the report has to know

`report-traffic.ts` carries a list of every configuration the app has opened on,
newest first. A report spanning a change of default must recognise the older one
too — otherwise every visitor from before the change is counted as arriving on a
shared link. Add the outgoing pair to that list whenever the default moves.

## The weekly mail

A digest goes out every **Monday 08:00 Europe/Istanbul**, driven by
`llmscale-report.timer` on GTR9.

- `deploy/llmscale-weekly-report.sh` → installed as
  `~/projects/infra-llmscale-report/run.sh`. It exports the last 7 days, renders
  the digest with `--markdown`, and POSTs it to the homelab mailer.
- The report needs Node and **GTR9 has none**, so it runs in a throwaway
  `node:22-alpine` container mounted over that directory. Copy the scripts there
  again whenever `scripts/traffic.ts`, `scripts/report-traffic.ts` or the
  `src/lib` files they import change — the box holds its own copy.
- Mail goes through **homelab-mailer** on `127.0.0.1:8091`, the single door for
  mail on that box. It takes **markdown** and does its own HTML rendering, so
  never send it HTML, and never add SMTP settings here.
- The timer is `Persistent=true`: if the box was down on Monday it sends when it
  comes back. A quiet week is still mailed — the point of a digest is that its
  *absence* means something broke.

```bash
sudo systemctl start llmscale-report.service   # send one now
systemctl list-timers llmscale-report.timer    # when is the next one
journalctl -u llmscale-report.service -n 20    # did it work
```

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
