"""Slides: méthodologie Trello (Kanban) + diagramme de Gantt 4 mois — CIVCO BTP."""
from __future__ import annotations

import os

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "slides"))
W, H = 16, 9
DPI = 160

# ── Theme (change PRIMARY to match your Canva deck) ───────────
PRIMARY = "#70ad47"
PRIMARY_DARK = "#5a8f38"
PRIMARY_LIGHT = "#e2efda"
PRIMARY_MID = "#8fbc63"

# Legacy blue (Trello slide — update PRIMARY above to recolor Gantt only)
NAVY = "#1B4F8A"
SKY = "#5BA4D9"
SKY_LIGHT = "#D6EAF8"
GREY = "#6B7280"
GREY_LIGHT = "#F3F4F6"
WHITE = "#FFFFFF"
TEXT = "#1F2937"
GREEN = "#27AE60"
AMBER = "#F39C12"

# Gantt bar shades — all derived from PRIMARY green
GANTT_BAR_COLORS = [
    PRIMARY_DARK,
    "#648c3a",
    PRIMARY,
    PRIMARY_MID,
    "#9bc46e",
    "#b5d48f",
    "#4d7a32",
]


def setup():
    fig, ax = plt.subplots(figsize=(W, H), dpi=DPI)
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)
    return fig, ax


def draw_nav(ax, active_sub: str, *, theme: str = "blue"):
    """theme: 'blue' | 'green' (uses PRIMARY for Conduite du projet section)."""
    if theme == "green":
        active_fc = PRIMARY_DARK
        inactive_fc = PRIMARY_LIGHT
        accent = PRIMARY_DARK
        inactive_text = PRIMARY_DARK
    else:
        active_fc = NAVY
        inactive_fc = SKY_LIGHT
        accent = NAVY
        inactive_text = NAVY

    mains = [
        "Présentation de l'entreprise",
        "Analyse des besoins",
        "Présentation de la solution",
        "Conduite du projet",
        "Conclusion et perspectives",
    ]
    y = 8.35
    for i, label in enumerate(mains):
        x = 0.55 + i * 3.03
        fc = active_fc if i == 3 else inactive_fc
        ec = accent
        tc = WHITE if i == 3 else inactive_text
        pill = FancyBboxPatch(
            (x, y), 2.85, 0.55,
            boxstyle="round,pad=0.02,rounding_size=0.28",
            linewidth=1.2, edgecolor=ec, facecolor=fc,
        )
        ax.add_patch(pill)
        ax.text(x + 1.425, y + 0.275, label, ha="center", va="center",
                fontsize=7.2, color=tc, fontweight="bold" if i == 3 else "normal")

    subs = [
        "Méthodologie agile",
        "Outil Trello (Kanban)",
        "Diagramme de Gantt",
        "Suivi encadrement",
    ]
    positions = [2.2, 5.5, 8.8, 12.2]
    for label, sx in zip(subs, positions):
        active = label == active_sub
        ax.text(sx, 7.55, label, ha="center", fontsize=9.5,
                color=accent if active else GREY,
                fontweight="bold" if active else "normal")
        if active:
            ax.plot([sx - 1.35, sx + 1.35], [7.33, 7.33], color=accent, lw=2.5)


def slide_trello():
    fig, ax = setup()
    draw_nav(ax, "Outil Trello (Kanban)", theme="green")

    ax.text(W / 2, 6.85, "Méthodologie de travail — Trello (Kanban)",
            ha="center", fontsize=16, fontweight="bold", color=PRIMARY_DARK)

    columns = [
        ("À faire", GREY_LIGHT, GREY, [
            "Module portail client",
            "Carte Leaflet chantiers",
            "Tests PHPUnit rôles",
        ]),
        ("En cours", "#f4f9ef", PRIMARY_MID, [
            "API devis & factures",
            "Tableau de bord React",
        ]),
        ("En revue", PRIMARY_LIGHT, PRIMARY, [
            "Module clients CRUD",
            "Auth Sanctum SPA",
        ]),
        ("Terminé", "#d5e8c4", PRIMARY_DARK, [
            "Modèle de données",
            "Login & navigation",
            "Seeders démo CIVCO",
        ]),
    ]

    col_w = 3.5
    col_h = 4.2
    start_x = 1.0
    y0 = 1.35

    for i, (title, bg, border, cards) in enumerate(columns):
        x = start_x + i * (col_w + 0.25)
        col = FancyBboxPatch(
            (x, y0), col_w, col_h,
            boxstyle="round,pad=0.02,rounding_size=0.06",
            linewidth=1.5, edgecolor=border, facecolor=bg,
        )
        ax.add_patch(col)
        ax.text(x + col_w / 2, y0 + col_h - 0.35, title, ha="center", va="center",
                fontsize=11, fontweight="bold", color=TEXT)

        for j, card in enumerate(cards):
            cy = y0 + col_h - 0.85 - j * 0.95
            card_box = FancyBboxPatch(
                (x + 0.15, cy - 0.32), col_w - 0.3, 0.64,
                boxstyle="round,pad=0.02,rounding_size=0.08",
                linewidth=1, edgecolor="#CCCCCC", facecolor=WHITE,
            )
            ax.add_patch(card_box)
            ax.text(x + col_w / 2, cy, card, ha="center", va="center",
                    fontsize=8, color=TEXT, wrap=True)

    ax.text(W / 2, 0.55,
            "Complémentaire à Git/GitHub : Trello = planification & suivi métier  ·  Git = versionnement du code",
            ha="center", fontsize=9, color=GREY, style="italic")

    path = os.path.join(OUT_DIR, "slide_trello_kanban.png")
    fig.savefig(path, bbox_inches="tight", facecolor=WHITE, pad_inches=0.05)
    plt.close(fig)
    return path


def slide_gantt():
    fig, ax = setup()
    draw_nav(ax, "Diagramme de Gantt", theme="green")

    ax.text(W / 2, 6.85, "Planification du stage — 4 mois (avril – juillet 2026)",
            ha="center", fontsize=15, fontweight="bold", color=PRIMARY_DARK)

    months = ["Avril 2026", "Mai 2026", "Juin 2026", "Juillet 2026"]
    tasks = [
        ("Analyse & cahier des charges", 0, 1),
        ("Conception UML & architecture", 0.6, 1.6),
        ("Développement backend (Laravel API)", 1.2, 2.8),
        ("Développement frontend (React SPA)", 1.8, 3.4),
        ("Modules métier (devis, projets, clients)", 2.2, 3.6),
        ("Tests, corrections & démonstrations", 2.8, 3.8),
        ("Rédaction rapport & préparation soutenance", 3.0, 4.0),
    ]

    table_x = 0.7
    table_y = 1.15
    label_w = 4.8
    month_w = 2.55
    row_h = 0.62
    header_h = 0.55

    n_rows = len(tasks)
    table_w = label_w + len(months) * month_w
    table_h = header_h + n_rows * row_h

    outer = FancyBboxPatch(
        (table_x, table_y), table_w, table_h,
        boxstyle="round,pad=0.01,rounding_size=0.04",
        linewidth=1.5, edgecolor=PRIMARY_DARK, facecolor=WHITE,
    )
    ax.add_patch(outer)

    # Header row
    ax.add_patch(Rectangle((table_x, table_y + table_h - header_h), table_w, header_h,
                           facecolor=PRIMARY_DARK, edgecolor=PRIMARY_DARK))
    ax.text(table_x + label_w / 2, table_y + table_h - header_h / 2, "Activité / Phase",
            ha="center", va="center", fontsize=9, fontweight="bold", color=WHITE)
    for i, month in enumerate(months):
        mx = table_x + label_w + i * month_w
        ax.text(mx + month_w / 2, table_y + table_h - header_h / 2, month,
                ha="center", va="center", fontsize=8.5, fontweight="bold", color=WHITE)

    month_start = table_x + label_w
    month_end = table_x + table_w

    for r, (name, start, end) in enumerate(tasks):
        bar_color = GANTT_BAR_COLORS[r % len(GANTT_BAR_COLORS)]
        row_y = table_y + table_h - header_h - (r + 1) * row_h
        if r % 2 == 0:
            ax.add_patch(Rectangle((table_x, row_y), table_w, row_h, facecolor=GREY_LIGHT, edgecolor="none"))

        ax.plot([table_x, table_x + table_w], [row_y, row_y], color="#DDDDDD", lw=0.8)
        ax.text(table_x + 0.12, row_y + row_h / 2, name, ha="left", va="center", fontsize=8, color=TEXT)

        # Grid lines for months
        for i in range(len(months) + 1):
            gx = month_start + i * month_w
            ax.plot([gx, gx], [row_y, row_y + row_h], color="#E5E7EB", lw=0.6)

        # Gantt bar (map 0-4 months to pixel range)
        bar_x1 = month_start + (start / 4) * (month_end - month_start)
        bar_x2 = month_start + (end / 4) * (month_end - month_start)
        bar_y = row_y + row_h * 0.22
        bar_h = row_h * 0.56
        ax.add_patch(FancyBboxPatch(
            (bar_x1, bar_y), bar_x2 - bar_x1, bar_h,
            boxstyle="round,pad=0.01,rounding_size=0.06",
            linewidth=0, facecolor=bar_color, alpha=0.95,
        ))

    ax.text(W / 2, 0.45,
            "Jalons de démonstration validés avec l'encadrant professionnel à la fin de chaque mois",
            ha="center", fontsize=9, color=GREY, style="italic")

    path = os.path.join(OUT_DIR, "slide_gantt_4_mois.png")
    fig.savefig(path, bbox_inches="tight", facecolor=WHITE, pad_inches=0.05)
    plt.close(fig)
    return path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for p in (slide_trello(), slide_gantt()):
        print(f"Saved: {p} ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
