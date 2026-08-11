"""Generate CIVCO BTP presentation slides (16:9 PNG) — architecture, stack, before/after."""
from __future__ import annotations

import os

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Wedge
from matplotlib import patheffects as pe

OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "slides"))
W, H = 16, 9
DPI = 160

# EMSI-style palette (matches reference slides)
NAVY = "#1B4F8A"
SKY = "#5BA4D9"
SKY_LIGHT = "#D6EAF8"
ORANGE = "#E67E22"
TEAL = "#1ABC9C"
GREY = "#6B7280"
GREY_LIGHT = "#F3F4F6"
WHITE = "#FFFFFF"
TEXT = "#1F2937"


def setup_slide(title_suffix: str = ""):
    fig, ax = plt.subplots(figsize=(W, H), dpi=DPI)
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)
    return fig, ax


def draw_top_nav(ax, active_main: int, active_sub: int):
    """Main pills + sub-nav like reference slides."""
    mains = [
        "Présentation de l'entreprise",
        "Analyse des besoins",
        "Présentation de la solution",
        "Conduite du projet",
        "Conclusion et perspectives",
    ]
    subs = [
        "Architecture logicielle",
        "Technologies utilisées",
        "Comparaison des résultats avant/après",
        "Démonstration",
    ]

    pill_w = 2.85
    gap = 0.18
    start_x = 0.55
    y_main = 8.35

    for i, label in enumerate(mains):
        x = start_x + i * (pill_w + gap)
        fc = NAVY if i == active_main else SKY_LIGHT
        ec = NAVY if i == active_main else SKY
        tc = WHITE if i == active_main else NAVY
        pill = FancyBboxPatch(
            (x, y_main), pill_w, 0.55,
            boxstyle="round,pad=0.02,rounding_size=0.28",
            linewidth=1.2, edgecolor=ec, facecolor=fc,
        )
        ax.add_patch(pill)
        fs = 7.5 if len(label) < 28 else 6.8
        ax.text(x + pill_w / 2, y_main + 0.275, label, ha="center", va="center",
                fontsize=fs, color=tc, fontweight="bold" if i == active_main else "normal")

    sub_y = 7.55
    sub_positions = [2.0, 5.4, 8.8, 12.8]
    for i, (label, sx) in enumerate(zip(subs, sub_positions)):
        color = NAVY if i == active_sub else GREY
        weight = "bold" if i == active_sub else "normal"
        ax.text(sx, sub_y, label, ha="center", va="center", fontsize=9.5,
                color=color, fontweight=weight)
        if i == active_sub:
            ax.plot([sx - 1.5, sx + 1.5], [sub_y - 0.22, sub_y - 0.22],
                    color=NAVY, lw=2.5)
            ax.plot([sx, sx], [sub_y - 0.22, sub_y - 0.38], color=NAVY, lw=1.5)


def draw_footer(ax, page: int):
    ax.text(W - 0.45, 0.35, str(page), ha="right", va="center",
            fontsize=11, color=GREY)


def box(ax, x, y, w, h, title, subtitle=None, fc=SKY_LIGHT, ec=NAVY, fs=10):
    rect = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.5, edgecolor=ec, facecolor=fc,
    )
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h * 0.62, title, ha="center", va="center",
            fontsize=fs, fontweight="bold", color=TEXT)
    if subtitle:
        ax.text(x + w / 2, y + h * 0.28, subtitle, ha="center", va="center",
                fontsize=7.5, color=GREY)


def arrow(ax, x1, y1, x2, y2, color=NAVY):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.6,
                                shrinkA=4, shrinkB=4))


def slide_architecture():
    fig, ax = setup_slide()
    draw_top_nav(ax, active_main=2, active_sub=0)

    # Users
    ax.text(1.2, 6.8, "Admin / Équipes\nCIVCO BTP", ha="center", fontsize=9,
            color=TEXT, fontweight="bold")
    admin = Circle((1.2, 7.35), 0.28, fc=SKY_LIGHT, ec=NAVY, lw=1.5)
    ax.add_patch(admin)
    ax.text(1.2, 7.35, "A", ha="center", va="center", fontsize=11, fontweight="bold", color=NAVY)

    ax.text(1.2, 5.5, "Client\n(portail)", ha="center", fontsize=9, color=TEXT, fontweight="bold")
    client = Circle((1.2, 6.05), 0.28, fc="#E8F8F5", ec=TEAL, lw=1.5)
    ax.add_patch(client)
    ax.text(1.2, 6.05, "C", ha="center", va="center", fontsize=11, fontweight="bold", color=TEAL)

    # React SPA
    box(ax, 3.0, 5.85, 2.2, 1.35, "React 19 + Vite", "SPA · Port 5173", fc="#E8F4FD", fs=11)
    arrow(ax, 1.55, 7.35, 3.0, 6.55)
    arrow(ax, 1.55, 6.05, 3.0, 6.35)

    # Laravel API
    box(ax, 6.2, 5.85, 2.4, 1.35, "Laravel 13 API", "PHP 8.3 · Port 8000", fc="#FEF3E8", ec=ORANGE, fs=11)
    arrow(ax, 5.2, 6.55, 6.2, 6.55)

    # Sanctum
    box(ax, 6.35, 4.15, 2.1, 0.95, "Laravel Sanctum", "Auth SPA / sessions", fc=GREY_LIGHT, ec=GREY, fs=9)
    arrow(ax, 7.4, 5.85, 7.4, 5.1)

    # Database
    box(ax, 9.5, 5.85, 2.3, 1.35, "MySQL / PostgreSQL", "Données relationnelles", fc="#EAF4EE", ec=TEAL, fs=10)
    arrow(ax, 8.6, 6.55, 9.5, 6.55)

    # Modules métier (right column)
    modules = [
        "Projets & tâches",
        "Devis · Factures · BL",
        "Portail client",
        "RBAC & journal d'activité",
    ]
    box(ax, 12.3, 4.8, 3.0, 2.5, "Modules métier BTP", None, fc=WHITE, ec=SKY, fs=10)
    for i, mod in enumerate(modules):
        ax.text(12.55, 6.55 - i * 0.42, f"• {mod}", fontsize=8.5, color=TEXT, va="center")
    arrow(ax, 11.8, 6.55, 12.3, 6.55)

    # Three-tier label
    ax.text(W / 2, 3.55, "Architecture three-tier — CIVCO BTP",
            ha="center", fontsize=14, fontweight="bold", color=NAVY)
    tiers = ["Présentation\n(React SPA)", "Logique métier\n(Laravel REST)", "Données\n(MySQL / PostgreSQL)"]
    for i, (label, tx) in enumerate(zip(tiers, [3.5, 7.4, 11.3])):
        box(ax, tx, 1.85, 2.6, 1.15, label, None, fc=SKY_LIGHT if i == 1 else WHITE, fs=9)

    draw_footer(ax, 8)
    path = os.path.join(OUT_DIR, "slide_08_architecture.png")
    fig.savefig(path, bbox_inches="tight", facecolor=WHITE, pad_inches=0.05)
    plt.close(fig)
    return path


def slide_technologies():
    fig, ax = setup_slide()
    draw_top_nav(ax, active_main=2, active_sub=1)

    ax.text(2.0, 4.8, "Technologies\nutilisées", ha="center", fontsize=18,
            fontweight="bold", color=NAVY)
    ax.annotate("", xy=(4.8, 4.8), xytext=(3.2, 4.8),
                arrowprops=dict(arrowstyle="-|>", color=SKY, lw=3))

    # Main stack box
    outer = FancyBboxPatch(
        (5.0, 1.6), 10.5, 5.6,
        boxstyle="round,pad=0.02,rounding_size=0.06",
        linewidth=2, edgecolor=SKY, facecolor=WHITE,
    )
    ax.add_patch(outer)

    stacks = [
        ("Frontend", ["React 19", "Vite 8", "Tailwind CSS 4", "Leaflet · Recharts"], 5.4, SKY_LIGHT),
        ("Backend", ["PHP 8.3", "Laravel 13", "Sanctum 4", "REST API"], 8.3, "#FEF3E8"),
        ("Data & outils", ["MySQL / PostgreSQL", "Git · GitHub", "PHPUnit · ESLint"], 11.2, "#EAF4EE"),
    ]

    for title, items, x, fc in stacks:
        box(ax, x, 2.0, 2.8, 4.8, title, None, fc=fc, fs=12)
        for i, item in enumerate(items):
            ax.text(x + 1.4, 5.6 - i * 0.55, item, ha="center", va="center",
                    fontsize=10, color=TEXT)

    ax.text(W / 2, 1.15,
            "Stack full-stack dédiée à la gestion et planification des projets BTP — CIVCO BTP",
            ha="center", fontsize=10, color=GREY, style="italic")

    draw_footer(ax, 9)
    path = os.path.join(OUT_DIR, "slide_09_technologies.png")
    fig.savefig(path, bbox_inches="tight", facecolor=WHITE, pad_inches=0.05)
    plt.close(fig)
    return path


def slide_before_after():
    fig, ax = setup_slide()
    draw_top_nav(ax, active_main=2, active_sub=2)

    # Dashed frame
    frame = FancyBboxPatch(
        (0.6, 1.2), W - 1.2, 5.85,
        boxstyle="round,pad=0.02,rounding_size=0.04",
        linewidth=1.2, edgecolor=GREY, facecolor="none", linestyle="--",
    )
    ax.add_patch(frame)

    # Center donut
    center = (W / 2, 4.1)
    ax.add_patch(Wedge(center, 1.05, 90, 270, width=0.35, fc=ORANGE, ec=WHITE, lw=2))
    ax.add_patch(Wedge(center, 1.05, -90, 90, width=0.35, fc=TEAL, ec=WHITE, lw=2))
    ax.text(center[0], center[1] + 0.15, "CIVCO", ha="center", fontsize=11, fontweight="bold", color=TEXT)
    ax.text(center[0], center[1] - 0.2, "BTP", ha="center", fontsize=11, fontweight="bold", color=TEXT)

    before = [
        "Outils dispersés (Excel, Word, WhatsApp)",
        "Aucune vue consolidée des projets",
        "Documents commerciaux non centralisés",
        "Absence de contrôle d'accès (RBAC)",
        "Processus manuels et ressaisies",
        "Suivi chantier peu traçable",
    ]
    after = [
        "Plateforme web unique CIVCO BTP",
        "Tableau de bord & carte Leaflet",
        "Devis, factures, BL numériques",
        "Rôles et permissions configurables",
        "Portail client & messagerie interne",
        "Journal d'activité & traçabilité",
    ]

    def draw_side(items, side, color, x_num, x_text, ha):
        for i, text in enumerate(items):
            y = 6.2 - i * 0.72
            num = f"{i + 1:02d}"
            circ = Circle((x_num, y), 0.22, fc=color, ec=color)
            ax.add_patch(circ)
            ax.text(x_num, y, num, ha="center", va="center", fontsize=8,
                    fontweight="bold", color=WHITE)
            pill = FancyBboxPatch(
                (x_text - (2.8 if ha == "right" else 0), y - 0.22),
                2.8, 0.44,
                boxstyle="round,pad=0.02,rounding_size=0.2",
                linewidth=0, facecolor=GREY_LIGHT,
            )
            ax.add_patch(pill)
            ax.text(x_text, y, text, ha=ha, va="center", fontsize=8.2, color=TEXT)
            ax.plot([x_num + (0.25 if side == "right" else -0.25), x_text + (-0.05 if side == "right" else 0.05)],
                    [y, y], color=color, lw=1.2)

    draw_side(before, "left", ORANGE, 2.55, 2.35, "right")
    draw_side(after, "right", TEAL, W - 2.55, W - 2.35, "left")

    ax.text(2.35, 6.75, "Avant", ha="center", fontsize=12, fontweight="bold", color=ORANGE)
    ax.text(W - 2.35, 6.75, "Après", ha="center", fontsize=12, fontweight="bold", color=TEAL)

    draw_footer(ax, 10)
    path = os.path.join(OUT_DIR, "slide_10_comparaison.png")
    fig.savefig(path, bbox_inches="tight", facecolor=WHITE, pad_inches=0.05)
    plt.close(fig)
    return path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    paths = [
        slide_architecture(),
        slide_technologies(),
        slide_before_after(),
    ]
    for p in paths:
        print(f"Saved: {p} ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
