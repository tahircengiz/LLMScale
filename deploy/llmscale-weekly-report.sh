#!/usr/bin/env bash
# Weekly LLMScale traffic digest, mailed through the homelab mailer.
#
# Runs on GTR9, where Umami lives. There is no Node on the host, so the report
# runs in a throwaway node container over the same directory.
#
# Installed at ~/projects/infra-llmscale-report/ and driven by the
# llmscale-report.timer systemd unit. Mail goes through homelab-mailer on
# 127.0.0.1:8091 — the one door for mail on this box; never add SMTP here.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_ID="22ee565e-f235-43fe-bd5e-3b693cbf86ca"
DAYS="${DAYS:-7}"
MAILER="${MAILER:-http://127.0.0.1:8091/send}"
ENV_FILE="${MAILER_ENV:-/etc/homelab-mail/mail.env}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 1. Export the week. json_agg gives one line, which is all the report wants.
docker exec umami-db psql -U umami -d umami -tAc "
  select coalesce(json_agg(t)::text,'[]') from (
    select e.session_id::text as session_id, e.created_at::text as created_at,
           e.url_path, e.url_query, e.referrer_domain, e.event_name,
           s.country, s.device
    from website_event e join session s on s.session_id = e.session_id
    where e.website_id = '${WEBSITE_ID}'
      and e.created_at >= now() - interval '${DAYS} days'
    order by e.created_at
  ) t" > "$work/rows.json"

rows=$(wc -c < "$work/rows.json")
if [ "$rows" -lt 10 ]; then
  echo "export looks empty (${rows} bytes) — not mailing" >&2
  exit 1
fi

# 2. Render it twice. The mailer prints `html` when given one and converts `body`
#    when not, so the markdown doubles as the plain-text alternative.
cp "$work/rows.json" "$DIR/rows.json"
render() {
  docker run --rm -v "$DIR:/app" -w /app node:22-alpine \
    node scripts/report-traffic.ts rows.json "$1"
}
render --email > "$work/body.html"
render --markdown > "$work/body.md"
rm -f "$DIR/rows.json"

# An empty render must not become an empty e-mail.
for f in body.html body.md; do
  if [ ! -s "$work/$f" ]; then
    echo "renderer produced no $f — not mailing" >&2
    exit 1
  fi
done

# 3. Hand it to the one door. A quiet week is still worth sending; the point of
#    a digest is that its absence means something is broken, not that nothing
#    happened.
subject="LLMScale · son ${DAYS} gün"
python3 - "$work/body.md" "$subject" "$MAILER" "$ENV_FILE" "$work/body.html" <<'PY'
import json, sys, urllib.request, pathlib
body_path, subject, mailer, env_file, html_path = sys.argv[1:6]
body = pathlib.Path(body_path).read_text(encoding="utf-8")
html = pathlib.Path(html_path).read_text(encoding="utf-8")

token = ""
p = pathlib.Path(env_file)
if p.exists():
    for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line.startswith("MAILER_TOKEN="):
            token = line.split("=", 1)[1].strip().strip("'\"")

payload = json.dumps({
    "subject": subject,
    "body": body,   # plain-text alternative
    "html": html,   # what actually gets read
    "status": "NORMAL",
    "source": "llmscale-report",
}).encode("utf-8")

req = urllib.request.Request(mailer, data=payload,
                             headers={"Content-Type": "application/json"})
if token:
    req.add_header("X-Mailer-Token", token)
with urllib.request.urlopen(req, timeout=30) as r:
    print(f"mailer {r.status}: {r.read().decode('utf-8', 'replace')[:200]}")
PY
