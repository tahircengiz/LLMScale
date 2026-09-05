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

**Defaults are the trap.** A visitor who does nothing still emits the default
model and device, indistinguishable from someone who picked them deliberately.
So a value is credited under "chose" only when it *differs from what they arrived
with*. "Models seen" keeps the unfiltered view for comparison — the gap between
the two lists is how much of your traffic is people versus your own defaults.

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
