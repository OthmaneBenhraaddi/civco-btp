"""Generate Figure 1.2 preview — CIVCO BTP functional org chart."""
import os

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = os.path.join(os.path.dirname(__file__), "..", "img", "departments_preview.png")

BLUE = "#00467F"
BLUE_LIGHT = "#E8F1F8"
GREEN = "#2F7C52"
GREEN_LIGHT = "#EAF4EE"
TEXT = "#1A1A1A"
MUTED = "#555555"
HIGHLIGHT = "#FFF8E7"
HIGHLIGHT_BORDER = "#C8922A"


def draw_box(ax, x, y, w, h, title, subtitle=None, fc=BLUE_LIGHT, ec=BLUE, lw=1.8,
             title_size=10.5, sub_size=8, highlight=False):
    if highlight:
        fc, ec, lw = HIGHLIGHT, HIGHLIGHT_BORDER, 2.4
    rect = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        linewidth=lw, edgecolor=ec, facecolor=fc,
    )
    ax.add_patch(rect)
    if subtitle:
        ax.text(x + w / 2, y + h * 0.64, title, ha="center", va="center",
                fontsize=title_size, fontweight="bold", color=TEXT)
        ax.text(x + w / 2, y + h * 0.28, subtitle, ha="center", va="center",
                fontsize=sub_size, color=MUTED, style="italic")
    else:
        ax.text(x + w / 2, y + h / 2, title, ha="center", va="center",
                fontsize=title_size, fontweight="bold", color=TEXT)


def main():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=200)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis("off")
    fig.patch.set_facecolor("white")

    banner = FancyBboxPatch(
        (1.2, 8.0), 11.6, 0.75,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=0, facecolor=GREEN,
    )
    ax.add_patch(banner)
    ax.text(7, 8.37, "CIVCO BTP — Organisation fonctionnelle", ha="center", va="center",
            fontsize=16, fontweight="bold", color="white")
    ax.text(7, 7.72, "CivCo Building & Engineering — Casablanca", ha="center", va="center",
            fontsize=10, color=MUTED)

    draw_box(
        ax, 4.75, 6.55, 4.5, 0.95,
        "Direction Générale",
        "Stratégie · Supervision · Développement commercial",
        fc=GREEN_LIGHT, ec=GREEN, title_size=13,
    )

    services = [
        (0.35, "Service Études\nTechniques", "Conception · Calculs · Plans", False),
        (2.95, "Service Suivi\ndes Travaux", "Exécution · Délais · Chantiers", False),
        (5.55, "Service Administration\net Finance", "RH · Comptabilité · Achats", False),
        (8.15, "Service Qualité\net Sécurité", "Normes · Contrôle · Sécurité", False),
        (10.75, "Service Informatique,\nRéseaux et Développement",
         "Applications · Réseaux · Digitalisation", True),
    ]

    bw, bh = 2.35, 1.35
    y_bot = 4.35
    hub_y = 5.95

    for x, title, sub, highlight in services:
        draw_box(ax, x, y_bot, bw, bh, title, sub, highlight=highlight)
        cx = x + bw / 2
        ax.plot([cx, cx], [y_bot + bh, hub_y], color=BLUE, lw=1.5)

    dg_cx = 7.0
    ax.plot([dg_cx, dg_cx], [6.55, hub_y], color=BLUE, lw=1.8)
    ax.plot([services[0][0] + bw / 2, services[-1][0] + bw / 2], [hub_y, hub_y],
            color=BLUE, lw=1.8)

    note_y = 2.85
    note = FancyBboxPatch(
        (0.35, note_y), 13.3, 0.95,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        linewidth=1.2, edgecolor=HIGHLIGHT_BORDER, facecolor=HIGHLIGHT,
    )
    ax.add_patch(note)
    ax.text(7, note_y + 0.60,
            "Stage PFE réalisé au sein du Service Informatique, Réseaux et Développement",
            ha="center", va="center", fontsize=10.5, color=TEXT, fontweight="bold")
    ax.text(7, note_y + 0.23,
            "En collaboration avec les équipes métier — gestion des projets BTP",
            ha="center", va="center", fontsize=9, color=MUTED)

    ax.set_ylim(2.2, 9)

    plt.tight_layout(pad=0.2)
    out_path = os.path.normpath(OUT)
    fig.savefig(out_path, bbox_inches="tight", facecolor="white", edgecolor="none")
    print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")


if __name__ == "__main__":
    main()
