#!/usr/bin/env python3
"""Add an optional `html` field to homelab-mailer's /send.

Strictly additive: when the field is absent every existing caller behaves
exactly as before, because md_to_html(body) stays the default. `body` is still
required and becomes the plain-text alternative, so a client that cannot render
HTML still gets something readable.
"""
import pathlib, re, shutil, sys, datetime

P = pathlib.Path("/usr/local/bin/homelab-mailer.py")
src = P.read_text(encoding="utf-8")
edits = 0

# 1. render() takes the pre-rendered HTML and uses it in place of the converter.
old = "def render(subject, body, status=None, source=None):"
new = "def render(subject, body, status=None, source=None, html=None):"
if old in src:
    src = src.replace(old, new, 1); edits += 1

old = "<tr><td style=\"padding:18px 26px 22px\">{md_to_html(body)}</td></tr>"
new = "<tr><td style=\"padding:18px 26px 22px\">{html or md_to_html(body)}</td></tr>"
if old in src:
    src = src.replace(old, new, 1); edits += 1

# 2. send_mail() carries it through both transports.
old = "def send_mail(subject, body, status=None, source=None, to=None):"
new = "def send_mail(subject, body, status=None, source=None, to=None, html=None):"
if old in src:
    src = src.replace(old, new, 1); edits += 1

src2 = re.sub(r"render\(subject, body, status, source\)",
              "render(subject, body, status, source, html)", src)
if src2 != src:
    edits += len(re.findall(r"render\(subject, body, status, source, html\)", src2))
    src = src2

# 3. The handler reads it off the request.
old = 'rcpt = send_mail(subject, body, d.get("status"), d.get("source"), d.get("to"))'
new = ('rcpt = send_mail(subject, body, d.get("status"), d.get("source"), d.get("to"),\n'
       '                             d.get("html"))')
if old in src:
    src = src.replace(old, new, 1); edits += 1

# 4. Document it where the contract is stated.
old = '                "to": "a@b.c"}                    (opsiyonel, varsayilan MAIL_TO)'
new = ('                "to": "a@b.c",                   (opsiyonel, varsayilan MAIL_TO)\n'
       '                "html": "<table>..."}            (opsiyonel; verilirse body\n'
       '                                                  yerine bu basilir, body\n'
       '                                                  duz metin yedegi olur)')
if old in src:
    src = src.replace(old, new, 1); edits += 1

if edits < 6:
    print(f"only {edits} edits applied — refusing to write", file=sys.stderr)
    sys.exit(1)

stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
shutil.copy2(P, f"{P}.bak.{stamp}")
P.write_text(src, encoding="utf-8")
print(f"patched ({edits} edits), backup at {P}.bak.{stamp}")
