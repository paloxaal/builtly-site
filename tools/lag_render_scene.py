#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for Builtly Render-scenen på builtly.ai — «IFC-modell → Builtly Render».

Én isometrisk boligblokk tegnet to ganger i SAMME koordinater: som IFC-
wireframe (venstre) og som rendret bilde med materialer, glass, skygge og
omgivelser (høyre). Det rendrede laget klippes av en rect som flyttes av
skillelinja (håndtaket) — sveipet er animasjonen, ikke et bilde.

Kjør fra repo-rot:  python3 tools/lag_render_scene.py --suffix a > /tmp/scene.svg
  --suffix  gir unike id-er (clipPath/gradienter) så scenen kan stå to ganger
            på én side uten kollisjon.

Sjekket inn med vilje: en generert flate uten kilde kan ikke oppdateres,
bare skrives om. Geometrien er ren matematikk (ingen avhengigheter).
"""
import argparse
import math

UX, UY = math.cos(math.radians(30)), math.sin(math.radians(30))   # u: langs høyre fasade (opp mot høyre)
P0 = (318.0, 392.0)          # fremre (nærmeste) hjørne ved bakken — nederst i bildet
W, D = 168.0, 120.0          # bredde langs u (7 fag à 24) · dybde langs v (4 fag à 30)
FLOOR_H, FLOORS, PARAPET = 36.0, 4, 6.0
H = FLOOR_H * FLOORS + PARAPET
OUT = (UX * 12, UY * 12)     # utover fra høyre fasade (−v, mot betrakteren) · balkongdybde 12
VB = (640, 420)


def fr(s, t):
    """Punkt på høyre fasade: s langs u fra fremre hjørne (bakover = opp mot høyre), t opp."""
    return (P0[0] + UX * s, P0[1] - UY * s - t)


def fl(s, t):
    """Punkt på venstre fasade: s langs v fra fremre hjørne (bakover = opp mot venstre), t opp."""
    return (P0[0] - UX * s, P0[1] - UY * s - t)


def bk(su, sv, t):
    """Punkt i bygget: su langs u, sv langs v, t opp."""
    return (P0[0] + UX * su - UX * sv, P0[1] - UY * su - UY * sv - t)


def f(x):
    return ("%.1f" % x).rstrip("0").rstrip(".")


def pts(*p):
    return " ".join("%s,%s" % (f(x), f(y)) for x, y in p)


def poly(points, cls=None, **attrs):
    a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in attrs.items())
    c = ' class="%s"' % cls if cls else ""
    return '<polygon%s points="%s" %s/>' % (c, pts(*points), a)


def line(a, b, cls=None, **attrs):
    at = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in attrs.items())
    c = ' class="%s"' % cls if cls else ""
    return '<line%s x1="%s" y1="%s" x2="%s" y2="%s" %s/>' % (c, f(a[0]), f(a[1]), f(b[0]), f(b[1]), at)


# --- geometrien --------------------------------------------------------------
A, B, C = fr(0, 0), fr(W, 0), fl(0, 0)
DK = bk(W, D, 0)
At, Bt, Ct, Dt = fr(0, H), fr(W, H), fl(0, H), bk(W, D, H)
RIGHT = [A, B, Bt, At]
LEFT = [C, A, At, Ct]
ROOF = [At, Bt, Dt, Ct]
PAR_R = [fr(0, H - PARAPET), fr(W, H - PARAPET), Bt, At]
PAR_L = [fl(0, H - PARAPET), fl(D, H - PARAPET), Ct, At]


def windows_right():
    out = []
    for i in range(7):
        for fl_ in range(FLOORS):
            balc = i in (1, 3, 5) and fl_ >= 1
            s1, s2 = i * 24 + 5, i * 24 + 19
            t1 = fl_ * FLOOR_H + (2 if balc else 7)
            t2 = fl_ * FLOOR_H + 29
            if i == 0 and fl_ == 0:
                s1, s2, t1, t2 = 3, 21, 0, 30   # inngangsdør
            out.append(([fr(s1, t1), fr(s2, t1), fr(s2, t2), fr(s1, t2)], balc, i == 0 and fl_ == 0))
    return out


def windows_left():
    out = []
    for i in range(4):
        for fl_ in range(FLOORS):
            s1, s2 = i * 30 + 8, i * 30 + 22
            t1, t2 = fl_ * FLOOR_H + 7, fl_ * FLOOR_H + 29
            out.append([fl(s1, t1), fl(s2, t1), fl(s2, t2), fl(s1, t2)])
    return out


def balconies():
    out = []
    for i in (1, 3, 5):
        for fl_ in (1, 2, 3):
            s1, s2 = i * 24 + 1, i * 24 + 23
            t = fl_ * FLOOR_H
            p1, p2 = fr(s1, t), fr(s2, t)
            p3, p4 = (p2[0] + OUT[0], p2[1] + OUT[1]), (p1[0] + OUT[0], p1[1] + OUT[1])
            slab_top = [p1, p2, p3, p4]
            slab_front = [p4, p3, (p3[0], p3[1] + 3), (p4[0], p4[1] + 3)]
            slab_side = [p2, p3, (p3[0], p3[1] + 3), (p2[0], p2[1] + 3)]
            rail = [p4, p3, (p3[0], p3[1] - 13), (p4[0], p4[1] - 13)]
            rail_side = [p2, p3, (p3[0], p3[1] - 13), (p2[0], p2[1] - 13)]
            out.append((slab_top, slab_front, slab_side, rail, rail_side))
    return out


def shadow():
    d = (-62, -24)
    sh = lambda p: (p[0] + d[0], p[1] + d[1])
    return [sh(C), sh(A), A, B, DK, sh(DK)]


def ground_grid():
    ls = []
    for k in range(-2, 8):
        sv = k * 30
        ls.append((bk(-80, sv, 0), bk(260, sv, 0)))
    for k in range(-3, 11):
        su = k * 30
        ls.append((bk(su, -60, 0), bk(su, 190, 0)))
    return ls


def svg(suffix, card=False):
    sx = suffix
    o = []
    if card:
        # kortet på software.html er ÉN lenke — scenen sveiper selv, ingen dra/tastatur i den
        o.append('<svg class="rd-scene rd-scene-card" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid meet" data-wipe="auto" role="img" aria-label="IFC-modell mot ferdig rendering">' % (VB[0], VB[1]))
    else:
        o.append('<svg class="rd-scene" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid meet" data-wipe="1" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="IFC-modell mot ferdig rendering — dra i skillelinja eller bruk piltastene">' % (VB[0], VB[1]))
    # ---- defs
    o.append('<defs>')
    o.append('<clipPath id="wipe-%s"><rect class="wipe-rect" x="320" y="0" width="320" height="420"/></clipPath>' % sx)
    o.append('<linearGradient id="sky-%s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9DEEA"/><stop offset=".55" stop-color="#E6EFF3"/><stop offset="1" stop-color="#F3F4F0"/></linearGradient>' % sx)
    o.append('<linearGradient id="grd-%s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EBE4"/><stop offset="1" stop-color="#D9DDD3"/></linearGradient>' % sx)
    o.append('<linearGradient id="glass-%s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9DBDCB"/><stop offset=".48" stop-color="#C9DEE6"/><stop offset=".52" stop-color="#E4EFF3"/><stop offset="1" stop-color="#8FB0BF"/></linearGradient>' % sx)
    o.append('<linearGradient id="glassd-%s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6F8E9B"/><stop offset=".5" stop-color="#A9C3CC"/><stop offset="1" stop-color="#5E7A86"/></linearGradient>' % sx)
    o.append('<radialGradient id="sun-%s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DD" stop-opacity=".95"/><stop offset=".45" stop-color="#FFF1CC" stop-opacity=".45"/><stop offset="1" stop-color="#FFF1CC" stop-opacity="0"/></radialGradient>' % sx)
    o.append('<pattern id="brick-%s" patternUnits="userSpaceOnUse" width="14" height="6" patternTransform="rotate(30)"><rect width="14" height="6" fill="#A75F49"/><rect width="14" height="1" y="5" fill="#8E4B38" opacity=".8"/><rect width="1" height="3" x="6" y="0" fill="#8E4B38" opacity=".6"/><rect width="1" height="3" x="0" y="3" fill="#8E4B38" opacity=".6"/></pattern>' % sx)
    o.append('<pattern id="wood-%s" patternUnits="userSpaceOnUse" width="6" height="40"><rect width="6" height="40" fill="#C99E67"/><rect width="1" height="40" x="5" fill="#A8834F" opacity=".7"/><rect width="1" height="40" x="2" fill="#D9B27C" opacity=".35"/></pattern>' % sx)
    o.append('</defs>')

    # ---- WIREFRAME (IFC) — hele scenen, ligger under
    w = []
    for a, b in ground_grid():
        w.append(line(a, b, "rd-wg"))
    w.append(poly([C, A, B, DK], "rd-wh"))           # fotavtrykk (delvis skjult)
    w.append(line(DK, Dt, "rd-wh"))                  # skjult bakkant
    w.append(line(C, DK, "rd-wh"))
    w.append(line(B, DK, "rd-wh"))
    w.append(poly(LEFT, "rd-w"))
    w.append(poly(RIGHT, "rd-w"))
    w.append(poly(ROOF, "rd-w"))
    w.append(poly(PAR_R, "rd-w2"))
    w.append(poly(PAR_L, "rd-w2"))
    w.append(poly([bk(4, 4, H), bk(W - 4, 4, H), bk(W - 4, D - 4, H), bk(4, D - 4, H)], "rd-w2"))
    for su, sv, bw, bd, bh in ((96, 66, 40, 34, 14), (24, 84, 16, 12, 6), (48, 84, 16, 12, 6)):
        b = [bk(su, sv, H), bk(su + bw, sv, H), bk(su + bw, sv + bd, H), bk(su, sv + bd, H)]
        t = [bk(su, sv, H + bh), bk(su + bw, sv, H + bh), bk(su + bw, sv + bd, H + bh), bk(su, sv + bd, H + bh)]
        w.append(poly([b[3], b[0], t[0], t[3]], "rd-w2"))
        w.append(poly([b[0], b[1], t[1], t[0]], "rd-w2"))
        w.append(poly(t, "rd-w2"))
    w.append(poly([bk(30, 20, H), bk(62, 20, H), bk(62, 44, H), bk(30, 44, H)], "rd-w3"))
    for q in windows_left():
        w.append(poly(q, "rd-w2"))
    for q, balc, door in windows_right():
        w.append(poly(q, "rd-w2"))
    for slab_top, slab_front, slab_side, rail, rail_side in balconies():
        w.append(poly(slab_top, "rd-w2"))
        w.append(poly(slab_front, "rd-w2"))
        w.append(poly(slab_side, "rd-w2"))
        w.append(poly(rail, "rd-w3"))
    # noder i hjørnene
    for p in (A, B, C, At, Bt, Ct, Dt):
        w.append('<circle class="rd-wn" cx="%s" cy="%s" r="2.2"/>' % (f(p[0]), f(p[1])))
    # etiketter med ledelinje — kun på venstre side (wire-siden)
    lab = [
        ("IfcRoof",   fl(70, H - 2),  (150, 132)),
        ("IfcWall",   fl(96, 100),    (112, 222)),
        ("IfcWindow", fl(45, 88),     (118, 330)),
    ]
    for txt, anchor, at in lab:
        w.append(line(anchor, at, "rd-wl-line"))
        w.append('<circle class="rd-wl-dot" cx="%s" cy="%s" r="1.8"/>' % (f(anchor[0]), f(anchor[1])))
        w.append('<text class="rd-wl" x="%s" y="%s" text-anchor="end">%s</text>' % (f(at[0] - 4), f(at[1] + 3), txt))
    o.append('<g class="rd-wire">%s</g>' % "".join(w))

    # ---- RENDER — klippes av sveipet
    r = []
    r.append('<rect x="0" y="0" width="640" height="160" fill="url(#sky-%s)"/>' % sx)
    r.append('<rect x="0" y="160" width="640" height="260" fill="url(#grd-%s)"/>' % sx)
    r.append('<circle cx="548" cy="58" r="46" fill="url(#sun-%s)"/>' % sx)
    r.append('<ellipse cx="120" cy="86" rx="46" ry="9" fill="#FFFFFF" opacity=".55"/><ellipse cx="150" cy="80" rx="30" ry="7" fill="#FFFFFF" opacity=".5"/>')
    r.append('<ellipse cx="470" cy="118" rx="36" ry="7" fill="#FFFFFF" opacity=".45"/>')
    # fjern treline i horisonten
    r.append('<path d="M0 162 C60 152 110 158 170 154 S290 160 360 152 S470 158 530 150 S600 158 640 154 L640 172 L0 172 Z" fill="#B9C8B4" opacity=".55"/>')
    r.append(poly(shadow(), fill="#131820", opacity=".16"))
    # fasader
    r.append(poly(LEFT, fill="url(#brick-%s)" % sx))
    r.append(poly(LEFT, fill="#131820", opacity=".22"))          # skyggesiden
    r.append(poly(RIGHT, fill="url(#wood-%s)" % sx))
    r.append(poly(RIGHT, fill="#FFFFFF", opacity=".06"))
    r.append(poly(PAR_L, fill="#5E6168"))
    r.append(poly(PAR_R, fill="#7B7E85"))
    r.append(poly(ROOF, fill="#CFCFC8"))
    # brystningens topp: innerkant 4 px inn på begge aksene — taket leses som FLATT, ikke som en spiss
    inner = [bk(4, 4, H), bk(W - 4, 4, H), bk(W - 4, D - 4, H), bk(4, D - 4, H)]
    r.append(poly(inner, fill="#C4C5BE"))
    r.append(poly([fr(0, H), fr(W, H), fr(W, H - 1.2), fr(0, H - 1.2)], fill="#FFFFFF", opacity=".5"))
    r.append(poly([fl(0, H), fl(D, H), fl(D, H - 1.2), fl(0, H - 1.2)], fill="#FFFFFF", opacity=".35"))
    # takoppbygg: heissjakt + to ventilasjonsaggregater + takluke
    def box(su, sv, w, d, h, top="#DDDCD6", side_r="#B9BAB3", side_l="#8F9198"):
        b = [bk(su, sv, H), bk(su + w, sv, H), bk(su + w, sv + d, H), bk(su, sv + d, H)]
        t = [bk(su, sv, H + h), bk(su + w, sv, H + h), bk(su + w, sv + d, H + h), bk(su, sv + d, H + h)]
        return (poly([b[3], b[0], t[0], t[3]], fill=side_l) + poly([b[0], b[1], t[1], t[0]], fill=side_r)
                + poly(t, fill=top))
    r.append(box(96, 66, 40, 34, 14))
    r.append(box(24, 84, 16, 12, 6, top="#D3D4CE", side_r="#A9ABA5", side_l="#7D8087"))
    r.append(box(48, 84, 16, 12, 6, top="#D3D4CE", side_r="#A9ABA5", side_l="#7D8087"))
    r.append(poly([bk(30, 20, H + .1), bk(62, 20, H + .1), bk(62, 44, H + .1), bk(30, 44, H + .1)], fill="#9FB8C2", opacity=".7", stroke="#5E7A86", stroke_width=".6"))
    # vinduer venstre (skyggeside → mørkere glass)
    for q in windows_left():
        r.append(poly(q, fill="url(#glassd-%s)" % sx, stroke="#2E343B", stroke_width=".6"))
    for q, balc, door in windows_right():
        if door:
            r.append(poly(q, fill="#3A3F46", stroke="#2E343B", stroke_width=".6"))
            r.append(poly([q[0], q[1], (q[1][0], q[1][1] + 0), (q[0][0], q[0][1])], fill="none"))
        else:
            r.append(poly(q, fill="url(#glass-%s)" % sx, stroke="#2E343B", stroke_width=".6"))
            # sprosse/karm
            mx = ((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2)
            my = ((q[3][0] + q[2][0]) / 2, (q[3][1] + q[2][1]) / 2)
            r.append(line(mx, my, None, stroke="#2E343B", stroke_width=".5", opacity=".6"))
    # baldakin over inngangen
    c1, c2 = fr(0, 32), fr(24, 32)
    r.append(poly([c1, c2, (c2[0] + OUT[0], c2[1] + OUT[1]), (c1[0] + OUT[0], c1[1] + OUT[1])], fill="#8B8E95"))
    r.append(poly([(c1[0] + OUT[0], c1[1] + OUT[1]), (c2[0] + OUT[0], c2[1] + OUT[1]), (c2[0] + OUT[0], c2[1] + OUT[1] + 2), (c1[0] + OUT[0], c1[1] + OUT[1] + 2)], fill="#5E6168"))
    # balkonger
    for slab_top, slab_front, slab_side, rail, rail_side in balconies():
        r.append(poly(slab_top, fill="#E1E0DA"))
        r.append(poly(slab_front, fill="#8B8E95"))
        r.append(poly(slab_side, fill="#6C6F76"))
        r.append(poly(rail, fill="#C9DEE6", opacity=".55", stroke="#3F454C", stroke_width=".7"))
        r.append(poly(rail_side, fill="#9FB8C2", opacity=".5", stroke="#3F454C", stroke_width=".6"))
        r.append(line(rail[3], rail[2], None, stroke="#2E343B", stroke_width="1.2"))
    # vegetasjon
    trees = [(150, 300, 24, "#6E8F5E", "#4F6F45"), (98, 326, 19, "#7C9B6A", "#587A4C"),
             (572, 360, 30, "#5F8552", "#41633A"), (610, 300, 17, "#7A9868", "#557549"),
             (256, 214, 13, "#7A9868", "#557549")]
    for cx, cy, rr, ca, cb in trees:
        r.append('<rect x="%s" y="%s" width="4" height="%s" fill="#6B5237"/>' % (f(cx - 2), f(cy), f(rr + 8)))
        r.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(cx), f(cy), f(rr), ca))
        r.append('<circle cx="%s" cy="%s" r="%s" fill="%s" opacity=".9"/>' % (f(cx - rr * .35), f(cy + rr * .25), f(rr * .62), cb))
        r.append('<circle cx="%s" cy="%s" r="%s" fill="#FFFFFF" opacity=".16"/>' % (f(cx + rr * .3), f(cy - rr * .3), f(rr * .4)))
    for s in (44, 76, 108, 140):
        p = fr(s, 0)
        r.append('<ellipse cx="%s" cy="%s" rx="13" ry="6" fill="#7C9A6A"/>' % (f(p[0] + OUT[0] * .9), f(p[1] + OUT[1] * .9 + 3)))
        r.append('<ellipse cx="%s" cy="%s" rx="8" ry="4" fill="#5F7F52" opacity=".8"/>' % (f(p[0] + OUT[0] * .9 - 4), f(p[1] + OUT[1] * .9 + 4)))
    # to personer, illustrerte
    for px, py, sc in ((498, 392, 1.0), (510, 396, .9)):
        r.append('<circle cx="%s" cy="%s" r="%s" fill="#3A3F46"/><rect x="%s" y="%s" width="%s" height="%s" rx="2" fill="#3A3F46"/>' % (
            f(px), f(py - 18 * sc), f(3.2 * sc), f(px - 3 * sc), f(py - 14 * sc), f(6 * sc), f(14 * sc)))
    o.append('<g class="rd-render" clip-path="url(#wipe-%s)">%s</g>' % (sx, "".join(r)))

    # ---- skillelinje + håndtak + chips
    o.append('<g class="wipe-line" transform="translate(320 0)">'
             '<line x1="0" y1="0" x2="0" y2="420" class="wipe-halo"/>'
             '<line x1="0" y1="0" x2="0" y2="420" class="wipe-stroke"/>'
             '<g class="wipe-handle" transform="translate(0 214)"><circle r="17" class="wipe-knob"/>'
             '<path d="M-9 0 L-4 -4.5 M-9 0 L-4 4.5 M-9 0 H-2 M9 0 L4 -4.5 M9 0 L4 4.5 M9 0 H2" class="wipe-arrows"/></g></g>')
    # chipene: teksten måles av i18n-verdien (10–14 tegn mono 9,5 px + 0,12 em) — boksen holder den lengste, høyre chip ender 14 px fra kanten
    o.append('<g class="rd-chip rd-chip-l" transform="translate(14 14)"><rect width="92" height="22" rx="2"/><text x="10" y="15" data-i18n="rd.st.left">IFC-modell</text></g>')
    o.append('<g class="rd-chip rd-chip-r" transform="translate(506 14)"><rect width="120" height="22" rx="2"/><text x="10" y="15" data-i18n="rd.st.right">Builtly Render</text></g>')
    o.append('</svg>')
    return "".join(o)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--suffix", default="a")
    ap.add_argument("--card", action="store_true")
    args = ap.parse_args()
    print(svg(args.suffix, args.card))
