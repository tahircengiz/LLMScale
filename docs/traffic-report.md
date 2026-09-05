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

The panel is tailnet-only by design and the public hostname allowlists only the
two ingest paths, so this runs on the analytics host itself. See the
`llmscale-analytics` memory for how that box is put together.

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
docker exec -i umami-db psql -U umami -d umami -f export.sql > rows.json
```

Then copy `rows.json` back and run the report against it.

## What it will not tell you

- **Individuals.** Umami sessions are anonymous and cookieless; there is no way
  back to a person, and nothing here tries.
- **Whether a number was acted on.** The report shows what people configured,
  not what they bought or deployed.
- **Bots.** Umami drops obvious bot user agents, but a headless browser that
  does not announce itself lands in the data like anyone else. A sudden spike in
  single-event sessions from one country is usually that, not interest.

## A note on what is collected

This report exists because the tracker receives the full URL, model and settings
included. The site's footer used to claim inputs never left the browser; that
was corrected rather than the collection stopped. What remains true, and is what
the footer now says, is that the **calculation** runs in the browser with no
account and no backend. Keep that distinction intact when editing the copy.
