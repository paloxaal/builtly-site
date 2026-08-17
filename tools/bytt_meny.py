#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bytter hovedmeny, nav-CTA (Logg inn + Be om tilbud), mobilmeny-CTA og footer
på de eksisterende markedssidene til reposisjoneringens struktur.

Kjør fra repo-rot: python3 tools/bytt_meny.py
Idempotent: kjøres den to ganger, er andre kjøring en no-op.
"""
import os
import re
import sys

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SIDER = {
    "index.html": "",
    "about.html": "om",
    "industries.html": "software",
    "platform.html": "software",
    "verktoy.html": "software",
    "maps.html": "software",
    "bim-viewer.html": "software",
    "careers.html": "",
    "contact.html": "kontakt",
    "trust.html": "",
    "bli-kunde.html": "",
    "apenhetsloven.html": "",
    "etiske-retningslinjer.html": "",
}

NAV_ITEMS = [
    ("/tjenester.html", "nav.services", "Tjenester", "tjenester"),
    ("/software.html", "nav.software", "Software", "software"),
    ("/referanser.html", "nav.references", "Referanser", "referanser"),
    ("/slik-jobber-vi.html", "nav.method", "Slik jobber vi", "metode"),
    ("/about.html", "nav.aboutBuiltly", "Om Builtly", "om"),
    ("/contact.html", "nav.contact", "Kontakt", "kontakt"),
]


def nav_links(active):
    out = []
    for href, key, label, slug in NAV_ITEMS:
        cls = ' class="active"' if slug == active else ""
        out.append(f'<a href="{href}"{cls} data-i18n="{key}">{label}</a>')
    return "\n".join(out)


CTA_NY = (
    '<a href="https://portal.builtly.ai" class="btn"><span data-i18n="nav.openPortal">Åpne portalen</span> <span class="arr">→</span></a>'
)

MM_CTA_NY = (
    '<a href="https://portal.builtly.ai" class="btn mm-cta"><span data-i18n="nav.openPortal">Åpne portalen</span> <span class="arr">→</span></a>\n'
    '<a href="/bli-kunde.html" class="btn btn-ghost mm-cta" style="margin-top:10px"><span data-i18n="nav.quote">Be om tilbud</span></a>'
)

FOOTER_TOP_NY = """<div class="footer-top">
<div>
<div class="f-brand"><span class="lm"></span>Builtly</div>
<div class="f-tag" data-i18n="f2.tag">Rådgivende ingeniører og egenutviklet software for bygg, anlegg og eiendom.</div>
</div>
<div class="f-col">
<h5 data-i18n="f2.services.h">Tjenester</h5>
<ul>
<li><a href="/tjenester/geoteknikk.html" data-i18n="f2.services.geo">Geoteknikk</a></li>
<li><a href="/tjenester/konstruksjon.html" data-i18n="f2.services.str">Konstruksjon</a></li>
<li><a href="/tjenester/brannsikkerhet.html" data-i18n="f2.services.fire">Brannsikkerhet</a></li>
<li><a href="/tjenester/akustikk.html" data-i18n="f2.services.aco">Akustikk</a></li>
<li><a href="/tjenester/miljo.html" data-i18n="f2.services.env">Miljø og bærekraft</a></li>
<li><a href="/tjenester.html" data-i18n="f2.services.all">Alle tjenester →</a></li>
</ul>
</div>
<div class="f-col">
<h5 data-i18n="f2.software.h">Software</h5>
<ul>
<li><a href="/software.html" data-i18n="f2.software.overview">Softwareområdet</a></li>
<li><a href="/maps.html" data-i18n="f2.software.maps">Builtly Maps</a></li>
<li><a href="/bim-viewer.html" data-i18n="f2.software.bim">BIM Viewer</a></li>
<li><a href="/platform.html" data-i18n="f2.software.platform">Plattformen</a></li>
<li><a href="/verktoy.html" data-i18n="f2.software.tools">Verktøykassen</a></li>
<li><a href="https://portal.builtly.ai" data-i18n="f2.software.portal">Logg inn i portalen</a></li>
</ul>
</div>
<div class="f-col">
<h5 data-i18n="f2.company.h">Selskapet</h5>
<ul>
<li><a href="/about.html" data-i18n="f2.company.about">Om Builtly</a></li>
<li><a href="/slik-jobber-vi.html" data-i18n="f2.company.method">Slik jobber vi</a></li>
<li><a href="/referanser.html" data-i18n="f2.company.references">Referanser</a></li>
<li><a href="/careers.html" data-i18n="f2.company.careers">Karriere</a></li>
<li><a href="/contact.html" data-i18n="f2.company.contact">Kontakt</a></li>
<li><a href="/trust.html" data-i18n="f2.company.trust">Trust &amp; sikkerhet</a></li>
</ul>
</div>
</div>
<div class="footer-bot fbot2">
<style>
.fbot2{display:grid !important;grid-template-columns:1fr auto 1fr;gap:14px 24px;align-items:baseline}
.fbot2 .fb-mid{text-align:center;color:var(--ink,#131820);opacity:.8}
.fbot2 .fb-right{justify-self:end;opacity:.45;font-size:10px;letter-spacing:0.16em;text-transform:uppercase}
.fbot2 .fb-legal{grid-column:1 / -1;margin-top:6px;padding-top:16px;border-top:1px solid rgba(19,24,32,.07);display:grid;grid-template-columns:1fr auto;gap:8px 24px}
.fbot2 .fb-legal .footer-legal:last-child{text-align:right}
@media (max-width:760px){
.fbot2{grid-template-columns:1fr;text-align:center;gap:10px}
.fbot2 .fb-right{justify-self:center}
.fbot2 .fb-legal{grid-template-columns:1fr}
.fbot2 .fb-legal .footer-legal:last-child{text-align:center}
}
</style>
<span data-i18n="f2.bot.left">© 2026 Builtly Engineering</span>
<span class="fb-mid" data-i18n="f2.bot.right">Fremtidens ingeniørselskap. Allerede her.</span>
<a class="fb-right" href="/intern" title="Intern portal — styret og ansatte">Intern&nbsp;→</a>
<div class="fb-legal">
<span class="footer-legal">Builtly Engineering AS · Org.nr 837 694 892 · Bassengbakken 4, 7042 Trondheim</span>
<span class="footer-legal"><a href="/privacy">Personvern</a> · <a href="/terms">Vilkår</a> · <a href="/cookies">Informasjonskapsler</a> · <a href="/etiske-retningslinjer.html">Etiske retningslinjer</a> · <a href="/apenhetsloven.html">Åpenhetsloven</a></span>
</div>
</div>
</div>
</footer>"""

RE_NAVLINKS = re.compile(r'(<div class="nav-links">)(.*?)(</div>)', re.S)
# Maps-ghost (valgfri) + Open portal-knappen i nav-cta
RE_CTA = re.compile(
    r'(?:<a href="https://maps\.builtly\.ai/" class="btn btn-ghost"[^>]*>.*?</a>\s*)?'
    r'<a href="https://portal\.builtly\.ai" class="btn"><span data-i18n="nav\.openPortal">[^<]*</span>\s*<span class="arr">→</span></a>',
    re.S,
)
RE_MM_CTA = re.compile(
    r'<a href="https://portal\.builtly\.ai" class="btn mm-cta"><span data-i18n="nav\.openPortal">[^<]*</span>\s*<span class="arr">→</span></a>',
    re.S,
)
RE_FOOTER = re.compile(r'<div class="footer-top">.*?</footer>', re.S)


def bytt(fil, active):
    sti = os.path.join(ROT, fil)
    src = open(sti, encoding="utf-8").read()
    rapport = []

    ny, n = RE_NAVLINKS.subn(lambda m: m.group(1) + "\n" + nav_links(active) + "\n" + m.group(3), src, count=1)
    rapport.append(f"nav-links:{n}")
    src = ny

    ny, n = RE_CTA.subn(CTA_NY, src)
    rapport.append(f"nav-cta:{n}")
    src = ny

    ny, n = RE_MM_CTA.subn(MM_CTA_NY, src)
    rapport.append(f"mm-cta:{n}")
    src = ny

    ny, n = RE_FOOTER.subn(FOOTER_TOP_NY, src, count=1)
    rapport.append(f"footer:{n}")
    src = ny

    open(sti, "w", encoding="utf-8").write(src)
    return rapport


def main():
    feil = False
    for fil, active in SIDER.items():
        rapport = bytt(fil, active)
        merk = ""
        if any(r.endswith(":0") for r in rapport):
            merk = "   <-- SJEKK MANUELT"
            feil = True
        print(f"{fil:32s} {' '.join(rapport)}{merk}")
    sys.exit(1 if feil else 0)


if __name__ == "__main__":
    main()
