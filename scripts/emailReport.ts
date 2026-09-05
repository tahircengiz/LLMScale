// The weekly digest as HTML for e-mail.
//
// Deliberately NOT governed by DESIGN.md, which is why it lives in its own file.
// This document is rendered inside the homelab mailer's own 600px card, and has
// to match that card rather than the LLMScale site: its 14px base, its #344054
// ink, its light ground. Mail clients also strip <style> blocks and ignore grid
// and flex, and they handle rem unreliably — so this is tables, inline styles
// and px throughout, none of which the site's scale has an opinion about.
//
// The page renderer in report-traffic.ts is a different matter and does follow
// DESIGN.md.

import type { Report, Tally } from "./traffic.ts";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
const day = (iso: string) => (iso ? iso.slice(0, 10) : "—");

/**
 * The digest as HTML for e-mail. A different medium from the report page, not a
 * restyle of it: mail clients strip <style> blocks, ignore grid and flex, and
 * Gmail in particular keeps only inline attributes on tables. So this is tables
 * and inline styles all the way down, sized for the 548px the mailer's 600px
 * card leaves after padding, and light-themed to sit inside that white card
 * rather than fighting it.
 *
 * It returns the INNER content. The mailer wraps it in its own shell — subject
 * header, status badge, footer — so the homelab's mail identity stays intact.
 */
export function renderEmailHtml(r: Report): string {
  const s = r.sessions;
  const INK = "#101828", MUT = "#667085", LINE = "#eaecf0";
  const INDIGO = "#4a4cd4", GREEN = "#0b7d57", TRACK = "#eef0f4";

  const tile = (label: string, value: string | number, sub: string, colour = INK) => `
    <td width="50%" style="padding:0 6px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#f9fafb;border:1px solid ${LINE};border-radius:10px">
        <tr><td style="padding:10px 12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${MUT}">${esc(label)}</div>
          <div style="font-size:19px;font-weight:700;color:${colour};margin-top:2px">${esc(String(value))}</div>
          <div style="font-size:11px;color:${MUT}">${esc(sub)}</div>
        </td></tr>
      </table></td>`;

  const barRows = (rows: Tally[], empty: string, colour: string, limit = 6) => {
    if (!rows.length) {
      return `<tr><td style="padding:2px 0 8px;font-size:13px;color:${MUT};font-style:italic">${esc(empty)}</td></tr>`;
    }
    const top = rows[0].sessions || 1;
    return rows.slice(0, limit).map((x) => {
      const w = Math.max(4, Math.round((x.sessions / top) * 100));
      return `<tr><td style="padding:3px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="52%" style="font-size:13px;color:${INK};padding-right:8px">${esc(x.label)}</td>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="background:${TRACK};border-radius:4px"><tr>
              <td><table role="presentation" width="${w}%" cellpadding="0" cellspacing="0"><tr>
                <td style="background:${colour};border-radius:4px;font-size:0;line-height:8px;height:8px">&nbsp;</td>
              </tr></table></td>
            </tr></table>
          </td>
          <td width="34" align="right" style="font-size:12px;color:${MUT};padding-left:8px">${x.sessions}</td>
        </tr></table></td></tr>`;
    }).join("");
  };

  const section = (title: string, rows: Tally[], empty: string, colour = INDIGO) => `
    <tr><td style="padding:14px 0 2px;font-size:14px;font-weight:650;color:${INK};
                   border-top:1px solid ${LINE}">${esc(title)}</td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${barRows(rows, empty, colour)}</table></td></tr>`;

  const inline = (rows: Tally[], limit = 5) =>
    rows.slice(0, limit).map((x) => `${esc(x.label)} <span style="color:${MUT}">${x.sessions}</span>`).join(" &nbsp;·&nbsp; ") || "—";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <tr><td style="font-size:14px;color:${INK};padding-bottom:14px">
    <strong style="font-size:16px">${s} oturum</strong> · ${day(r.from)} → ${day(r.to)} · ${r.countries.length} ülke
  </td></tr>

  <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${tile("Modeli değiştirdi", r.changedModel, `${pct(r.changedModel, s)}% bizim gösterdiğimizin ötesine geçti`, INDIGO)}
    ${tile("Cihazı değiştirdi", r.changedDevice, `${pct(r.changedDevice, s)}%`, INDIGO)}
  </tr><tr>
    ${tile("Varsayılanı aldı", r.endedOnDefault, `${pct(r.endedOnDefault, s)}% verileni kabul etti`, MUT)}
    ${tile("Paylaşılan linkten", r.fromSharedLink, "başkasının ayarıyla geldi", GREEN)}
  </tr></table></td></tr>

  ${section("Aradıkları modeller", r.modelsChosen, "Bu hafta kimse varsayılan modelin dışına çıkmadı.")}
  ${section("Aradıkları donanım", r.devicesChosen, "Bu hafta kimse varsayılan cihazın dışına çıkmadı.")}
  ${section("Hangi araçlar", r.surfaces, "Sayfa görüntülemesi yok.", GREEN)}

  <tr><td style="padding:14px 0 2px;font-size:14px;font-weight:650;color:${INK};
                 border-top:1px solid ${LINE}">Nereden geldiler</td></tr>
  <tr><td style="font-size:13px;color:${INK};padding-bottom:6px">${inline(r.countries, 8)}</td></tr>

  <tr><td style="padding:12px 0 2px;font-size:14px;font-weight:650;color:${INK};
                 border-top:1px solid ${LINE}">Nasıl yapılandırdılar</td></tr>
  <tr><td style="font-size:13px;color:${INK};line-height:1.7;padding-bottom:6px">
    <span style="color:${MUT}">Context:</span> ${inline(r.contextBuckets, 4)}<br>
    <span style="color:${MUT}">Eşzamanlılık:</span> ${inline(r.concurrencyBuckets, 4)}<br>
    <span style="color:${MUT}">Hassasiyet:</span> ${inline(r.precision, 4)}
  </td></tr>

  <tr><td style="padding:14px 0 0;border-top:1px solid ${LINE};font-size:12px;
                 color:${MUT};line-height:1.55">
    Oturum başına sayılır, olay başına değil — ayar değiştiren bir ziyaretçi onlarca kayıt bırakır.
    &#8220;Aradıkları&#8221; listeleri, uygulamanın herhangi bir zamanda açıldığı model ve cihazları
    dışlar: çoğu oturum önüne konulanla bitirir ve bunu bilerek seçmekle ataletle kabul etmek
    ayırt edilemez. Yani bu listeler <strong>bilerek eksik sayar</strong>; üstteki yüzdeler dürüst ölçüdür.
  </td></tr>
</table>`;
}
