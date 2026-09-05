#!/usr/bin/env bash
# One-shot reminder that the prj_HomeLab junk archive has served its hold.
# Mails through homelab-mailer, then disables its own timer so it never repeats.
set -euo pipefail

ARCHIVE="/home/blue/archive/prj_HomeLab-junk-2026-09-05.tar.gz"
ENV_FILE="${MAILER_ENV:-/etc/homelab-mail/mail.env}"

if [ ! -f "$ARCHIVE" ]; then
  echo "archive already gone — nothing to remind about"
  systemctl disable archive-reminder.timer || true
  exit 0
fi

size=$(du -h "$ARCHIVE" | cut -f1)
body=$(cat <<EOF
İki hafta önce (5 Eylül) \`~/projects/prj_HomeLab\` içindeki bozuk dosyalar
arşivlenip silinmişti. O günden beri bir sorun çıkmadıysa arşiv artık gereksiz.

**Arşiv:** \`$ARCHIVE\` ($size)

İçindekiler: kabuk yönlendirmesi kazasından doğan 9 girdi — \`plex.yml\`,
\`docker-compose.yml\` ve \`deploy_services.sh\` kopyaları, artı iki adet
\`\$functions.write...\$\` dosyası.

**Dikkat:** arşivde düz metin bir parola var (\`blue@192.168.7.188\`). Aynı parola
\`siftly-deploy.sh\`, \`generate-report.sh\`, \`deploy-siftly.sh\` ve
\`temp_check.sh\` içinde de duruyor — arşivi silmek onu kutudan kaldırmaz.

Silmek için:

\`\`\`
rm $ARCHIVE
sudo systemctl disable archive-reminder.timer
\`\`\`
EOF
)

python3 - "$body" "$ENV_FILE" <<'PY'
import json, sys, urllib.request, pathlib
body, env_file = sys.argv[1:3]
token = ""
p = pathlib.Path(env_file)
if p.exists():
    for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.strip().startswith("MAILER_TOKEN="):
            token = line.split("=", 1)[1].strip().strip("'\"")
payload = json.dumps({
    "subject": "Hatırlatma · prj_HomeLab arşivi silinebilir",
    "body": body,
    "status": "DIKKAT",
    "source": "archive-reminder",
}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8091/send", data=payload,
                             headers={"Content-Type": "application/json"})
if token:
    req.add_header("X-Mailer-Token", token)
with urllib.request.urlopen(req, timeout=30) as r:
    print(f"mailer {r.status}: {r.read().decode('utf-8','replace')[:150]}")
PY

systemctl disable archive-reminder.timer || true
