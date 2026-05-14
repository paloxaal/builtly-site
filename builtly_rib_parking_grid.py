# -*- coding: utf-8 -*-
"""
builtly_rib_parking_grid.py
============================

Builtly RIB V21 — Parkeringskjeller-søyle-grid-generator.

PROBLEM
-------
`builtly_rib_load_engine.suggest_intermediate_columns()` foreslår søyler
basert på lange transfer-vegger (>12m spenn) på BOLIG-etasjer. Dette
fanger ikke opp parkeringskjeller-søyler, hvor søyler trengs i et
3m × 7,5m / 5m × 7,5m grid-mønster i åpne arealer mellom kjøreareal
og parkeringsplasser.

LØSNING
-------
Denne modulen genererer parkeringskjeller-søyler etter standard
parkeringspraksis:

1. **Detect parkeringsetasjer**: laveste z med vegger, eller storey
   navn matcher U1/U2/P1/parkering/kjeller/basement/garage.

2. **Per sub-bygg på etasjen**: bygg convex hull av alle vegg-endepunkter
   som sub-byggets perimeter.

3. **Generer grid**: 5m × 7,5m default (kan overstyres). Grid-orientering
   alignes med dominant vegg-retning (PCA).

4. **Klipping**:
   - Søyler innenfor hull (ingen utenfor)
   - Min 0,8m fra eksisterende vegg (ikke inni vegg)
   - Min 1,5m fra eksisterende søyle (ingen dubletter)

5. **Output**: liste med søyle-forslag formatert likt som
   `suggested_columns` i load_engine, slik at UI kan vise dem
   sammen med transfer-baserte forslag.

NS-EN BEGRUNNELSE
-----------------
- TEK17 § 12-7: Krav til parkeringsanlegg (bredde, manøvrering)
- NS 11001-1 § 7.4: Anbefalte parkeringsmål (2,5×5m + manøvrering)
- NS-EN 1991-1-1 § 6.3.3.1: Nyttelast Q på parkeringsdekker (2,5 kN/m²)

USAGE
-----
    from builtly_rib_parking_grid import generate_parking_columns_for_storey
    extra_cols = generate_parking_columns_for_storey(
        walls_on_storey=[...],         # geometry_3d walls med storey="Level U1"
        existing_cols_on_storey=[...], # for å unngå kolisjoner
        sub_buildings=[...],           # for per-bygg klipping
        grid_x_m=5.0,
        grid_y_m=7.5,
        min_dist_to_wall_m=0.8,
        min_dist_to_col_m=1.5,
    )
"""

from __future__ import annotations
from typing import Dict, List, Any, Optional, Tuple
import math


# Default grid-konfigurasjon
DEFAULT_GRID_X_M = 5.0   # parallell med kjøreareal (lengderetning)
DEFAULT_GRID_Y_M = 7.5   # tvers av kjøreareal (typisk 2 stk 2,5m + 2,5m kjøre)
DEFAULT_MIN_DIST_TO_WALL_M = 0.8  # ikke inni vegg
# V22.10.15: Økt fra 1.5 til 4.0m for mer systematisk grid.
# 1.5m var for tett — Saga hadde 16 IFC-søyler + grid la til 28 ekstra = 44
# totalt for én parkering, mye for tett. Med 4m kan grid-søyler ikke
# settes nær eksisterende IFC-søyler (typisk 5×7,5m grid = 4m clearance
# rundt eksisterende). Dette gjør at:
#   1. IFC-søyler "vinner" når de finnes (ingen overlapping grid)
#   2. Grid-søyler er minst 4m fra hverandre (systematisk pakking)
#   3. Færre, mer fornuftig plasserte søyler totalt
DEFAULT_MIN_DIST_TO_COL_M = 4.0


# ── Parkeringsetasje-detektering ──────────────────────────────────

PARKING_STOREY_NAME_PATTERNS = [
    "u1", "u2", "u3", "u-1", "u-2",                     # underetasje
    "p1", "p2", "p3", "p-1", "p-2",                     # parkering-nivå
    "k1", "k2", "k-1",                                   # kjeller-nivå
    "parkering", "garasje", "p-kjeller", "p kjeller",   # eksplisitt navn
    "basement", "parking", "garage", "subbasement",      # engelske navn
    "kjeller", "ub", "underbygg",                        # norske
    "untergeschoss", "u.g.",                             # tysk (sjeldent)
    "tg", "ug",                                          # forkortelser
]


def is_parking_storey(storey_name: str) -> bool:
    """Returner True hvis etasje-navn matcher kjent parkerings-mønster.

    Sjekker mot lista PARKING_STOREY_NAME_PATTERNS — case-insensitiv,
    matcher delstrenger (slik at "Level U1" matcher "u1").
    """
    if not storey_name:
        return False
    name_lower = str(storey_name).lower()
    for pattern in PARKING_STOREY_NAME_PATTERNS:
        if pattern in name_lower:
            return True
    return False


def detect_parking_storeys_via_z(
    storeys_meta: List[Dict[str, Any]],
    walls_per_storey: Dict[str, List[Any]],
) -> List[str]:
    """Fallback hvis navn ikke avslører parkeringsetasje.

    Heuristikk: laveste etasje med vegger (typisk 116+ vegger pga.
    parkeringsbåser) er parkering. Returnerer alltid maks 1 etasje.
    """
    storeys_with_walls = [
        s.get("name") for s in (storeys_meta or [])
        if walls_per_storey.get(s.get("name"))
    ]
    if not storeys_with_walls:
        return []
    # Sortér etter z (laveste først)
    z_sorted = sorted(
        [(s.get("name"), float(s.get("elevation_mm", 0) or 0))
         for s in (storeys_meta or [])
         if s.get("name") in storeys_with_walls],
        key=lambda t: t[1],
    )
    if not z_sorted:
        return []
    return [z_sorted[0][0]]


# ── Geometri-helpers ──────────────────────────────────────────────

def _alpha_shape(
    points: List[Tuple[float, float]],
    alpha_m: float = 8.0,
) -> List[Tuple[float, float]]:
    """V22.10.15: Concave hull via Delaunay-trianguliering.

    Alpha-shape gir et MYE bedre bygnings-omriss enn convex hull for
    irregulære former (Saga's S/L-form, kurvede bygg). Convex hull
    "fyller ut" konkaviteter — alpha-shape FØLGER faktiske ytterveggene.

    Algoritme:
    1. Bygg Delaunay-trianguliering av punktene
    2. For hver trekant: beregn circumradius
    3. Behold trekanter der circumradius < alpha (lokal "tetthet")
    4. Outer edges (kanter i KUN én trekant) = concave hull-omriss
    5. Sortér kanter til lukket polygon

    Args:
        points: punkter å bygge concave hull av (vegg-endepunkter)
        alpha_m: max circumradius i meter. 8m fungerer bra for bygg
            (vanlig rom-bredde 3-6m, korridor-bredde 1-3m). For større
            åpne areal (parkeringskjeller) prøv 10-15m.

    Returns:
        Liste av hjørner i polygon-rekkefølge. Hvis algoritmen feiler
        eller scipy ikke er tilgjengelig, faller tilbake til convex hull.
    """
    if len(points) < 4:
        return _convex_hull(points)

    try:
        import numpy as _np
        from scipy.spatial import Delaunay as _Delaunay
    except ImportError:
        # Fallback hvis scipy ikke er installert
        return _convex_hull(points)

    pts_arr = _np.array(list(set((float(x), float(y)) for x, y in points)))
    if len(pts_arr) < 4:
        return _convex_hull(points)

    try:
        tri = _Delaunay(pts_arr)
    except Exception:
        # Kollinære punkter eller andre Delaunay-feil
        return _convex_hull(points)

    alpha_sq = alpha_m * alpha_m
    edges = {}  # (i, j) -> antall trekanter som har denne kanten
    for ia, ib, ic in tri.simplices:
        pa = pts_arr[ia]; pb = pts_arr[ib]; pc = pts_arr[ic]
        # Trekantens sider
        a = _np.linalg.norm(pb - pc)
        b = _np.linalg.norm(pa - pc)
        c = _np.linalg.norm(pa - pb)
        # Heron's formel for areal
        s = (a + b + c) / 2.0
        area_sq = s * (s - a) * (s - b) * (s - c)
        if area_sq <= 0:
            continue
        area = area_sq ** 0.5
        if area < 1e-9:
            continue
        # Circumradius² = (abc/4A)²
        circum_r_sq = (a * b * c / (4.0 * area)) ** 2
        if circum_r_sq > alpha_sq:
            continue  # For "rund" trekant — utenfor alpha-shape

        # Behold trekantens kanter
        for u, v in [(ia, ib), (ib, ic), (ia, ic)]:
            key = (min(u, v), max(u, v))
            edges[key] = edges.get(key, 0) + 1

    # Outer edges (kun i én trekant)
    outer_edges = [e for e, count in edges.items() if count == 1]
    if not outer_edges:
        return _convex_hull(points)

    # Bygg polygon ved å følge outer edges
    adj = {}
    for u, v in outer_edges:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)

    # Start fra et hjørne, følg kanter til vi kommer tilbake
    start = outer_edges[0][0]
    polygon_idx = [start]
    current = start
    prev = -1
    max_iter = len(outer_edges) + 10
    for _ in range(max_iter):
        neighbors = [n for n in adj.get(current, []) if n != prev]
        if not neighbors:
            break
        next_node = neighbors[0]
        if next_node == start:
            break
        polygon_idx.append(next_node)
        prev = current
        current = next_node

    if len(polygon_idx) < 3:
        return _convex_hull(points)

    return [(float(pts_arr[i][0]), float(pts_arr[i][1])) for i in polygon_idx]


def _convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Andrew's monotone chain — O(n log n)."""
    pts = sorted(set((float(x), float(y)) for x, y in points))
    if len(pts) < 2:
        return pts
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def _point_in_polygon(px: float, py: float,
                       poly: List[Tuple[float, float]]) -> bool:
    """Ray-casting punkt-i-polygon."""
    if len(poly) < 3:
        return False
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and \
           (px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def _dist_point_to_segment(px: float, py: float,
                             x1: float, y1: float,
                             x2: float, y2: float) -> float:
    """Korteste avstand fra punkt (px,py) til linjesegment."""
    dx = x2 - x1
    dy = y2 - y1
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq < 1e-12:
        # degenerert: punkt-til-punkt
        return math.hypot(px - x1, py - y1)
    # Normaliser projeksjon til [0, 1]
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / seg_len_sq))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def _erode_hull(poly: List[Tuple[float, float]],
                  inset_m: float) -> List[Tuple[float, float]]:
    """Krymp polygon med 'inset_m' meter innover (forenklet — bruker
    centroid-basert skalering, IKKE ekte buffer/erosion).

    OK fordi vi senere klipper hver søyle individuelt mot vegger.
    Dette er bare for å hindre at søyler havner helt på perimeteren.
    """
    if not poly or len(poly) < 3 or inset_m <= 0:
        return list(poly)
    cx = sum(p[0] for p in poly) / len(poly)
    cy = sum(p[1] for p in poly) / len(poly)
    eroded = []
    for x, y in poly:
        dx = x - cx
        dy = y - cy
        d = math.hypot(dx, dy)
        if d < 1e-6:
            eroded.append((x, y))
            continue
        scale = max(0.0, (d - inset_m) / d)
        eroded.append((cx + dx * scale, cy + dy * scale))
    return eroded


# ── Grid-generering ──────────────────────────────────────────────

def _dominant_wall_angle(walls: List[Dict[str, Any]]) -> float:
    """Finn dominant vegg-retning via histogram av vegg-vinkler.

    Returnerer rotasjons-vinkel (rad) som grid skal alignes etter.
    Default: 0 (akse-aligned grid) hvis ingen klar dominant retning.
    """
    if not walls:
        return 0.0
    # Vinkler i [0, π) — vegger som peker motsatt vei er samme retning
    angles_weighted: List[Tuple[float, float]] = []
    for w in walls:
        x1, y1 = float(w.get("x1", 0)), float(w.get("y1", 0))
        x2, y2 = float(w.get("x2", 0)), float(w.get("y2", 0))
        L = math.hypot(x2 - x1, y2 - y1)
        if L < 0.5:
            continue
        ang = math.atan2(y2 - y1, x2 - x1)
        # Normaliser til [0, π)
        ang = ang % math.pi
        angles_weighted.append((ang, L))

    if not angles_weighted:
        return 0.0

    # Histogram: 18 bins (10° hver). Tell vekter (lengder).
    bins = [0.0] * 18
    for ang, L in angles_weighted:
        bin_idx = int(ang / (math.pi / 18))
        bin_idx = min(bin_idx, 17)
        bins[bin_idx] += L

    # Velg dominante bin
    max_bin = max(range(18), key=lambda i: bins[i])
    dominant_angle = (max_bin + 0.5) * (math.pi / 18)

    # Hvis vinkelen er nær 0/90°, snap til akse-alignment (vanligst i bygg)
    if dominant_angle < math.radians(10) or dominant_angle > math.radians(170):
        return 0.0
    if math.radians(80) <= dominant_angle <= math.radians(100):
        return math.pi / 2

    return dominant_angle


def _generate_aligned_grid_points(
    bbox: Tuple[float, float, float, float],
    grid_x_m: float,
    grid_y_m: float,
    rotation_rad: float = 0.0,
) -> List[Tuple[float, float]]:
    """Generer grid-punkter i bbox, eventuelt rotert."""
    x_min, y_min, x_max, y_max = bbox
    # Utvid bbox for å fange grid-punkter som ligger på kanten
    pad = max(grid_x_m, grid_y_m)
    cx = (x_min + x_max) / 2
    cy = (y_min + y_max) / 2

    # I rotert frame: grid-punkter
    # Diagonalen er maks-diameter etter rotasjon
    half_diag = math.hypot(x_max - x_min, y_max - y_min) / 2 + pad

    rotated_pts: List[Tuple[float, float]] = []
    # Iterér i lokalt frame
    n_x = int(math.ceil(2 * half_diag / grid_x_m)) + 1
    n_y = int(math.ceil(2 * half_diag / grid_y_m)) + 1

    for i in range(-n_x // 2 - 1, n_x // 2 + 2):
        for j in range(-n_y // 2 - 1, n_y // 2 + 2):
            local_x = i * grid_x_m
            local_y = j * grid_y_m
            # Roter
            cos_r = math.cos(rotation_rad)
            sin_r = math.sin(rotation_rad)
            world_x = cx + local_x * cos_r - local_y * sin_r
            world_y = cy + local_x * sin_r + local_y * cos_r
            # Innenfor bbox?
            if x_min - pad <= world_x <= x_max + pad and \
               y_min - pad <= world_y <= y_max + pad:
                rotated_pts.append((world_x, world_y))

    return rotated_pts


# ── Hovedfunksjon ──────────────────────────────────────────────────

def _has_systematic_ifc_grid(
    existing_cols_on_storey: Optional[List[Dict[str, Any]]],
    walls_on_storey: List[Dict[str, Any]],
    min_cols: int = 8,
    expected_spacing_min_m: float = 4.0,
    expected_spacing_max_m: float = 10.0,
) -> bool:
    """V22.10.15: Detekter om IFC allerede har et systematisk søyle-grid.

    Saga's parkering har 16 IFC-søyler systematisk plassert av ARK.
    Når dette er tilfelle, skal IKKE parking-grid legge til ekstra
    forslag — det dobler antall søyler og forstyrrer den fine ARK-planen.

    Strategi: hvis det er ≥ min_cols IFC-søyler på etasjen, og minst
    50% av søylene har en nabo innenfor expected_spacing_min..max,
    så er det allerede et fornuftig grid. Skip P-grid.

    Args:
        existing_cols_on_storey: IFC-søyler på etasjen
        walls_on_storey: vegger (brukes for areal-estimat)
        min_cols: minimum antall søyler for å vurderes som "grid"
        expected_spacing_min_m: typisk min parkering-grid spacing
        expected_spacing_max_m: typisk max parkering-grid spacing

    Returns:
        True hvis IFC har et systematisk grid (skip P-grid).
    """
    if not existing_cols_on_storey or len(existing_cols_on_storey) < min_cols:
        return False

    import math as _math
    # Hent søyle-posisjoner
    positions = []
    for c in existing_cols_on_storey:
        x = c.get("x_m") if c.get("x_m") is not None else c.get("x")
        y = c.get("y_m") if c.get("y_m") is not None else c.get("y")
        if x is None or y is None:
            continue
        try:
            positions.append((float(x), float(y)))
        except (TypeError, ValueError):
            continue

    if len(positions) < min_cols:
        return False

    # For hver søyle: har den minst én nabo innenfor expected spacing?
    cols_with_neighbor = 0
    for i, (xi, yi) in enumerate(positions):
        has_neighbor = False
        for j, (xj, yj) in enumerate(positions):
            if i == j:
                continue
            d = _math.hypot(xi - xj, yi - yj)
            if expected_spacing_min_m <= d <= expected_spacing_max_m:
                has_neighbor = True
                break
        if has_neighbor:
            cols_with_neighbor += 1

    fraction = cols_with_neighbor / len(positions)
    return fraction >= 0.5  # >50% har grid-nabo = systematisk


def _looks_like_residential_storey(
    walls_on_storey: List[Dict[str, Any]],
    existing_cols_on_storey: Optional[List[Dict[str, Any]]] = None,
) -> bool:
    """V21.9.2: Detekter om en etasje ser ut som BOLIGETASJE (ingen parkering)
    vs PARKERINGSETASJE (åpne arealer som trenger søyler).

    Saga Park U1 lærer oss at parkeringskjellere har BÅDE:
    - Korte vegger (boder, sluser, teknisk-rom, trapperom)
    - Lange vegger (parkerings-yttervegger, kjørerampe-skiller, parkeringsbåser)
    - Eksisterende IFC-søyler i åpne formasjoner

    En boligetasje har stort sett bare korte og medium vegger,
    INGEN parkerings-typiske lange vegger (> 12m) og INGEN åpne
    rastere av søyler.

    Riktig signaler å bruke:
    - Lange vegger (> 12m): parkering har MANGE, bolig har få/ingen
    - IFC-søyler ≥ 8 i åpen formasjon: parkering-tegn
    - Veldig lange vegger (> 20m): parkering-perimeter

    Args:
        walls_on_storey: alle vegger på etasjen
        existing_cols_on_storey: eksisterende IFC-søyler (gjør deteksjonen
            mye sterkere — parkeringskjellere har søyler i raster)

    Returns:
        True hvis dette ligner BOLIG (og P-grid skal SKIPPES).
    """
    if not walls_on_storey or len(walls_on_storey) < 10:
        return False  # for lite data — la P-grid prøve

    import math as _math
    lengths = []
    for w in walls_on_storey:
        try:
            x1 = float(w.get("x1", 0))
            y1 = float(w.get("y1", 0))
            x2 = float(w.get("x2", 0))
            y2 = float(w.get("y2", 0))
            L = _math.hypot(x2 - x1, y2 - y1)
            if L > 0:
                lengths.append(L)
        except (TypeError, ValueError):
            continue

    if not lengths:
        return False

    n_long = sum(1 for L in lengths if L > 12.0)
    n_very_long = sum(1 for L in lengths if L > 20.0)
    n_cols = len(existing_cols_on_storey or [])

    # V21.9.2: Parkering-indikatorer (sterke signaler)
    has_parking_walls = n_long >= 5  # ≥ 5 vegger > 12m
    has_perimeter_walls = n_very_long >= 2  # ≥ 2 vegger > 20m (yttervegger)
    has_column_grid = n_cols >= 8  # ≥ 8 IFC-søyler i åpen formasjon

    # Hvis NOEN av parking-signalene er sterke, IKKE klassifiser som bolig
    if has_parking_walls or has_perimeter_walls or has_column_grid:
        return False

    # Ellers, sjekk bolig-mønster (gammel heuristikk)
    lengths.sort()
    n = len(lengths)
    median = lengths[n // 2]
    n_short = sum(1 for L in lengths if L < 2.5)
    short_pct = n_short / n if n > 0 else 0

    # Bolig: median < 5m OG > 30% korte vegger OG ingen lange-vegg-tegn
    is_bolig = median < 5.0 and short_pct > 0.30
    return is_bolig



def _point_in_building_polygon(
    px: float, py: float,
    walls: List[Dict[str, Any]],
    n_test_directions: int = 8,
) -> bool:
    """V22.10.14: Sjekk om punktet er INNE i bygnings-formen.

    Bruker ray-casting: send stråler i N retninger fra punktet og tell
    hvor mange ganger hver stråle krysser en vegg. Et punkt INNE har
    odd antall krysninger fra en "uendelig" stråle (Jordan curve thm).

    Vi bruker MAJORITETS-vote over flere retninger for robusthet — hvis
    minst 6 av 8 stråler indikerer "inne", returnerer vi True. Dette
    håndterer kanttilfeller med dobbel-vegger eller veggsegmenter som
    nesten-treffer en stråle nøyaktig.

    Args:
        px, py: kandidat-punkt
        walls: vegger som potensielt danner bygnings-omriss
        n_test_directions: antall stråler å teste i (default 8)

    Returns:
        True hvis punktet er antagelig inne i bygnings-form.
    """
    import math as _math
    if not walls:
        return False

    inside_votes = 0
    for k in range(n_test_directions):
        # Stråle i retning theta
        theta = k * (2 * _math.pi / n_test_directions)
        dx = _math.cos(theta) * 10000  # Lang stråle
        dy = _math.sin(theta) * 10000
        rx = px + dx
        ry = py + dy

        # Tell krysninger av denne strålen med vegger
        crossings = 0
        for w in walls:
            try:
                x1 = float(w.get("x1", 0))
                y1 = float(w.get("y1", 0))
                x2 = float(w.get("x2", 0))
                y2 = float(w.get("y2", 0))
            except (TypeError, ValueError):
                continue

            # Segment-segment intersection: (px,py)→(rx,ry) vs (x1,y1)→(x2,y2)
            d1x = rx - px
            d1y = ry - py
            d2x = x2 - x1
            d2y = y2 - y1
            denom = d1x * d2y - d1y * d2x
            if abs(denom) < 1e-9:
                continue  # Parallelle
            tx = px - x1
            ty = py - y1
            t1 = (tx * d2y - ty * d2x) / denom
            t2 = (tx * d1y - ty * d1x) / denom
            # Begge t-parametere må være i [0, 1] for at segmentene
            # krysser hverandre
            if 0.0 < t1 < 1.0 and 0.0 < t2 < 1.0:
                crossings += 1

        if crossings % 2 == 1:
            inside_votes += 1

    # Krev majoritets-vote (mer enn halvparten av strålene må indikere
    # "inne"). 75% var for streng — strålene som er nesten-parallelle
    # med vegger kan ha numerisk usikkerhet. Majoritets-vote er mer
    # robust mot kanttilfeller.
    return inside_votes > n_test_directions // 2


def _wall_density_around_point(
    px: float, py: float,
    walls: List[Dict[str, Any]],
    radius_m: float = 10.0,
    require_sectors: int = 3,
    n_sectors: int = 4,
) -> bool:
    """Sjekk om et grid-punkt er omkranset av vegger.

    PROBLEM: Convex hull av et L-formet eller buet bygg "fyller ut"
    områder mellom byggets fløyer. Søyler plasseres da i tomme
    gårdsrom eller utearealer, ikke innendørs.

    LØSNING: Krever at det finnes vegger i minst `require_sectors`
    av `n_sectors` sektorer rundt punktet. Et punkt midt i et rom
    har vegger på alle 4 sider (4/4 sektorer). Et punkt i et
    gårdsrom har vegger bare i én retning (≤ 1/4 sektor).

    V21.9.2: Bruker NÆRMESTE PUNKT PÅ VEGGEN (ikke midtpunkt) for å
    bestemme sektor og avstand. Dette håndterer lange yttervegger
    riktig — en 50m vegg som ligger 5m unna har midtpunkt 25m unna,
    men nærmeste punkt 5m unna i en bestemt sektor.

    Args:
        px, py: kandidat-punkt
        walls: vegger å sjekke mot
        radius_m: hvor langt fra punktet vi ser etter vegger
        require_sectors: minimum antall sektorer som må ha en vegg
        n_sectors: total antall sektorer rundt punktet (4 = N/S/Ø/V)

    Returns:
        True hvis punktet er "inne i bygget" (omkranset av vegger),
        False hvis det er i et gårdsrom / uteareal.
    """
    import math as _math
    sector_has_wall = [False] * n_sectors
    radius_sq = radius_m * radius_m

    for w in walls:
        try:
            x1 = float(w.get("x1", 0))
            y1 = float(w.get("y1", 0))
            x2 = float(w.get("x2", 0))
            y2 = float(w.get("y2", 0))
        except (TypeError, ValueError):
            continue

        # Finn NÆRMESTE PUNKT på vegg-segmentet til (px, py)
        wx = x2 - x1
        wy = y2 - y1
        wlen_sq = wx * wx + wy * wy
        if wlen_sq < 1e-9:
            # Degenerert vegg (punkt) — bruk endepunktet
            nx, ny = x1, y1
        else:
            t = ((px - x1) * wx + (py - y1) * wy) / wlen_sq
            t = max(0.0, min(1.0, t))  # klipp til [0,1] for segment
            nx = x1 + t * wx
            ny = y1 + t * wy

        dx = nx - px
        dy = ny - py
        dist_sq = dx * dx + dy * dy
        if dist_sq > radius_sq:
            continue

        # Hvilken sektor er nærmeste punkt på veggen i?
        angle = _math.atan2(dy, dx)  # [-π, π]
        if angle < 0:
            angle += 2 * _math.pi
        sector = int(angle / (2 * _math.pi / n_sectors))
        if 0 <= sector < n_sectors:
            sector_has_wall[sector] = True

    return sum(sector_has_wall) >= require_sectors


def generate_parking_columns_for_storey(
    walls_on_storey: List[Dict[str, Any]],
    existing_cols_on_storey: Optional[List[Dict[str, Any]]] = None,
    storey_name: str = "?",
    grid_x_m: float = DEFAULT_GRID_X_M,
    grid_y_m: float = DEFAULT_GRID_Y_M,
    min_dist_to_wall_m: float = DEFAULT_MIN_DIST_TO_WALL_M,
    min_dist_to_col_m: float = DEFAULT_MIN_DIST_TO_COL_M,
    align_to_walls: bool = True,
    inset_m: float = 0.5,
    # V22.10.14: Strengere wall-density-filter for irregulære bygg-former.
    # Saga har snake-like/kurvet form — convex hull dekker store områder
    # UTENFOR bygnings-omriss. Med require_sectors=2 slipper søyler i
    # gårdsrom og kantsoner gjennom. Med require_sectors=3 krever vi
    # vegger i 3 av 4 retninger — mer robust for irregulære former.
    # Tidligere default var require_sectors=2 (V21.9.2).
    enforce_wall_density: bool = True,
    density_radius_m: float = 10.0,   # var 12.0 — strammere for irregulære former
    density_require_sectors: int = 3,  # var 2 — krever vegger i 3 av 4 retninger
    # V22.10.14: enforce_in_building_polygon DISABLED som default — point-in-
    # polygon ray-casting er ustabilt for L/S-formede bygg pga numerisk
    # presisjon når stråler er nær-parallelle med vegger. Density-filteret
    # (3-of-4 sektorer) gir bedre resultater i praksis.
    enforce_in_building_polygon: bool = False,
) -> List[Dict[str, Any]]:
    """Generer foreslåtte parkeringskjeller-søyler i grid-mønster.

    Args:
        walls_on_storey: alle vegger på etasjen (for hull og vegg-klipping).
            Forventet format: {x1, y1, x2, y2, building_id, ...}
        existing_cols_on_storey: eksisterende søyler (klippe nær-koll)
            Forventet format: {x, y, ...} eller {x_m, y_m, ...}
        storey_name: navnet på etasjen (for label/logging)
        grid_x_m, grid_y_m: grid-spacing i meter
        min_dist_to_wall_m: min avstand til vegg (klipping)
        min_dist_to_col_m: min avstand til eksisterende søyle (klipping)
        align_to_walls: hvis True, roter grid etter dominant vegg-retning
        inset_m: krym hull med dette før grid-klipping (avstand fra
            ytterkant)

    Returns:
        Liste med søyle-forslag. Hver dict inneholder:
            - x_m, y_m: koordinater i meter
            - x_mm, y_mm: koordinater i mm (IFC-konvensjon)
            - storey: etasje-navn
            - building: bygg-id (basert på vegg-tilhørighet)
            - source: "parking_grid_v21"
            - grid_x_m, grid_y_m: grid-konfig brukt
            - suggested_profile: foreslått profil (HEB-300 default for
              parkering — kan overstyres senere når laster er beregnet)
    """
    if not walls_on_storey:
        return []

    existing_cols_on_storey = existing_cols_on_storey or []

    # Steg 1: Per sub-bygg, samle vegger
    from collections import defaultdict
    walls_by_building: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for w in walls_on_storey:
        bid = w.get("building_id") or w.get("building") or "?"
        walls_by_building[bid].append(w)

    all_suggestions: List[Dict[str, Any]] = []

    for bid, ws in walls_by_building.items():
        if not ws:
            continue
        # Steg 2: Bygg hull av yttervegg-endepunkter
        all_pts = []
        for w in ws:
            all_pts.append((float(w.get("x1", 0)), float(w.get("y1", 0))))
            all_pts.append((float(w.get("x2", 0)), float(w.get("y2", 0))))
        if len(all_pts) < 3:
            continue
        # V22.10.15: Bruk ALPHA-SHAPE (concave hull) istedenfor convex hull.
        # Convex hull dekker store områder utenfor irregulære bygg (Saga's
        # S-form). Alpha-shape følger faktiske ytterveggene. Fallback til
        # convex hull hvis alpha-shape feiler eller scipy mangler.
        hull = _alpha_shape(all_pts, alpha_m=8.0)
        if len(hull) < 3:
            hull = _convex_hull(all_pts)
            if len(hull) < 3:
                continue
        # Krymp hull innover for å unngå søyler helt på perimeteret
        hull_eroded = _erode_hull(hull, inset_m)

        # Steg 3: Beregn grid-rotasjon
        rotation_rad = 0.0
        if align_to_walls:
            rotation_rad = _dominant_wall_angle(ws)

        # Steg 4: Generer grid-punkter i bbox
        xs = [p[0] for p in hull]
        ys = [p[1] for p in hull]
        bbox = (min(xs), min(ys), max(xs), max(ys))
        grid_pts = _generate_aligned_grid_points(
            bbox, grid_x_m, grid_y_m, rotation_rad
        )

        # Steg 5: Klipp mot hull og vegger og eksisterende søyler
        bid_walls = ws  # samme bygg
        bid_existing_cols = [
            c for c in existing_cols_on_storey
            if (c.get("building_id") or c.get("building") or "?") == bid
        ]

        for px, py in grid_pts:
            # 5a: Innenfor hull?
            if not _point_in_polygon(px, py, hull_eroded):
                continue
            # 5b: For nær eksisterende vegg?
            too_close_to_wall = False
            for w in bid_walls:
                d = _dist_point_to_segment(
                    px, py,
                    float(w.get("x1", 0)), float(w.get("y1", 0)),
                    float(w.get("x2", 0)), float(w.get("y2", 0)),
                )
                if d < min_dist_to_wall_m:
                    too_close_to_wall = True
                    break
            if too_close_to_wall:
                continue
            # 5c: For nær eksisterende søyle?
            too_close_to_col = False
            for c in bid_existing_cols:
                cx = float(c.get("x", c.get("x_m", 0)) or 0)
                cy = float(c.get("y", c.get("y_m", 0)) or 0)
                if math.hypot(px - cx, py - cy) < min_dist_to_col_m:
                    too_close_to_col = True
                    break
            if too_close_to_col:
                continue

            # 5d: For nær søyle vi nettopp har lagt til?
            too_close_to_new = False
            for s in all_suggestions:
                sx, sy = float(s["x_m"]), float(s["y_m"])
                if math.hypot(px - sx, py - sy) < min_dist_to_col_m:
                    too_close_to_new = True
                    break
            if too_close_to_new:
                continue

            # 5e: V21.9 wall-density-filter — er punktet faktisk
            # omkranset av vegger? (forhindrer søyler i gårdsrom for
            # L-formede eller buete bygg som Saga Park)
            if enforce_wall_density:
                if not _wall_density_around_point(
                    px, py, ws,
                    radius_m=density_radius_m,
                    require_sectors=density_require_sectors,
                    n_sectors=4,
                ):
                    continue

            # V22.10.14: Point-in-polygon test mot faktisk bygnings-
            # polygon. _wall_density håndterer åpne areal-flekker, men
            # for irregulære former (Saga's S/L-form) kan punkter midt
            # i en konkavitet passere density-filteret men være utenfor
            # selve bygnings-kroppen. Vi bygger en concave hull (alpha-
            # shape approximation) fra vegg-endepunkter og krever at
            # punktet er innenfor.
            if enforce_in_building_polygon:
                if not _point_in_building_polygon(px, py, ws):
                    continue

            # OK, foreslå søyle her
            all_suggestions.append({
                "x_m": round(px, 3),
                "y_m": round(py, 3),
                "x_mm": round(px * 1000.0, 1),
                "y_mm": round(py * 1000.0, 1),
                "storey": storey_name,
                "building": bid,
                "building_id": bid,
                "source": "parking_grid_v21",
                "source_label": "P-grid",
                "grid_x_m": grid_x_m,
                "grid_y_m": grid_y_m,
                "rotation_deg": round(math.degrees(rotation_rad), 1),
                # Default profil: HEB-300 — parkeringskjeller har normalt
                # 800-1500 kN per søyle (boligbygg over). Brukeren kan
                # endre profil eller løpe load-beregning manuelt.
                "suggested_profile": "HEB-300",
                "auto_suggested_profile": "HEB-300",
                "tributary_m2": round(grid_x_m * grid_y_m, 1),
                # Markør slik at UI kan vise dem distinkt
                "column_id": f"P{len(all_suggestions) + 1:03d}",
                "is_parking_grid": True,
            })

    return all_suggestions


def add_parking_grid_to_load_calculation(
    lc_result: Dict[str, Any],
    walls: List[Dict[str, Any]],
    columns: List[Dict[str, Any]],
    storeys_meta: List[Dict[str, Any]],
    walls_per_storey: Dict[str, List[Any]],
    grid_x_m: float = DEFAULT_GRID_X_M,
    grid_y_m: float = DEFAULT_GRID_Y_M,
) -> Dict[str, Any]:
    """High-level: tar lc_result fra run_load_calculation og legger til
    parkeringskjeller-grid-søyler.

    Søker først etter etasjer som matcher PARKING_STOREY_NAME_PATTERNS.
    Hvis ingen match, faller tilbake til z-basert deteksjon (laveste).

    Returns:
        Modifisert lc_result med ekstra felter:
            - parking_grid_columns: liste over genererte søyler
            - suggested_columns: utvidet med parking_grid (eksisterende
              transfer-baserte søyler beholdes)
    """
    if not isinstance(lc_result, dict):
        return lc_result

    # Steg 1: Finn parkeringsetasjer
    parking_storeys: List[str] = []

    for s in (storeys_meta or []):
        sname = s.get("name", "")
        if is_parking_storey(sname):
            parking_storeys.append(sname)

    # Fallback: z-basert hvis navn ikke avslørte noe
    if not parking_storeys:
        parking_storeys = detect_parking_storeys_via_z(
            storeys_meta, walls_per_storey,
        )

    if not parking_storeys:
        # Ingen parkeringsetasje funnet — returner uendret
        lc_result["parking_grid_columns"] = []
        return lc_result

    # Steg 2: For hver parkeringsetasje, generer grid
    all_parking_suggestions: List[Dict[str, Any]] = []

    for storey_name in parking_storeys:
        walls_here = [w for w in walls if w.get("storey") == storey_name]
        cols_here = [c for c in columns if c.get("storey") == storey_name]
        if not walls_here:
            continue

        # V21.9.2: Forbedret bolig-vs-parkering deteksjon som tar med
        # eksisterende IFC-søyler. Saga Park U1 har 16 IFC-søyler i et
        # raster — det er en parkeringskjeller, selv om navnet "Level U1"
        # er tvetydig og noen vegger er korte (boder, sluser, trapperom).
        if _looks_like_residential_storey(walls_here, cols_here):
            continue

        # V22.10.15: Hvis IFC allerede har et systematisk søyle-grid,
        # skip P-grid for denne etasjen. ARK har plassert søyler riktig,
        # og det er ingen verdi i å foreslå flere søyler ovenpå.
        if _has_systematic_ifc_grid(cols_here, walls_here):
            print(f"[PARKING-GRID] Skip {storey_name}: IFC har allerede "
                  f"systematisk grid ({len(cols_here)} søyler)", flush=True)
            continue

        suggestions = generate_parking_columns_for_storey(
            walls_on_storey=walls_here,
            existing_cols_on_storey=cols_here,
            storey_name=storey_name,
            grid_x_m=grid_x_m,
            grid_y_m=grid_y_m,
        )
        all_parking_suggestions.extend(suggestions)

    # Steg 3: Lagre i lc_result
    lc_result["parking_grid_columns"] = all_parking_suggestions
    lc_result["parking_grid_storeys"] = parking_storeys
    lc_result["parking_grid_config"] = {
        "grid_x_m": grid_x_m,
        "grid_y_m": grid_y_m,
        "min_dist_to_wall_m": DEFAULT_MIN_DIST_TO_WALL_M,
        "min_dist_to_col_m": DEFAULT_MIN_DIST_TO_COL_M,
    }

    # Steg 4: Utvid suggested_columns slik at UI viser dem ALLE sammen
    # NB: Eksisterende transfer-baserte søyler beholdes uendret. Parkings-
    # forslagene har is_parking_grid=True markør slik at UI kan filtrere
    # dem og vise dem i distinkt farge hvis ønsket.
    existing_suggested = lc_result.get("suggested_columns") or []
    lc_result["suggested_columns"] = list(existing_suggested) + all_parking_suggestions

    return lc_result


__all__ = [
    "generate_parking_columns_for_storey",
    "add_parking_grid_to_load_calculation",
    "is_parking_storey",
    "detect_parking_storeys_via_z",
    "PARKING_STOREY_NAME_PATTERNS",
    "DEFAULT_GRID_X_M",
    "DEFAULT_GRID_Y_M",
]
