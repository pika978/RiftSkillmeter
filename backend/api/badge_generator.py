"""
Badge Image Generator using Pillow (PIL)
Generates premium-looking skill badge cards as PNG images.
"""
import io
from PIL import Image, ImageDraw, ImageFont


def generate_badge_image(
    skill_name: str,
    score: int,
    date_earned: str,
    asa_id: int = None,
    student_name: str = "",
) -> io.BytesIO:
    """
    Generate a premium skill badge card as a PNG image.
    Returns a BytesIO buffer containing the PNG data.
    """
    W, H = 600, 400
    img = Image.new("RGB", (W, H), "#0f172a")
    draw = ImageDraw.Draw(img)

    # ── Use default font (works everywhere, no .ttf needed) ──
    try:
        font_lg = ImageFont.truetype("arial.ttf", 36)
        font_md = ImageFont.truetype("arial.ttf", 22)
        font_sm = ImageFont.truetype("arial.ttf", 16)
        font_xs = ImageFont.truetype("arial.ttf", 13)
        font_score = ImageFont.truetype("arial.ttf", 56)
    except (IOError, OSError):
        font_lg = ImageFont.load_default()
        font_md = font_lg
        font_sm = font_lg
        font_xs = font_lg
        font_score = font_lg

    # ── Background gradient effect (dark navy → teal accent) ──
    for y in range(H):
        r = int(15 + (y / H) * 10)
        g = int(23 + (y / H) * 30)
        b = int(42 + (y / H) * 30)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # ── Accent bar (top) ──
    accent_color = "#10b981"  # emerald-500
    draw.rectangle([(0, 0), (W, 6)], fill=accent_color)

    # ── Side accent stripe ──
    draw.rectangle([(0, 0), (6, H)], fill=accent_color)

    # ── Badge icon area (circle) ──
    cx, cy, cr = 80, 80, 35
    draw.ellipse(
        [(cx - cr, cy - cr), (cx + cr, cy + cr)],
        fill="#10b981", outline="#34d399", width=3
    )
    # Star shape inside circle
    draw.text((cx - 12, cy - 16), "★", fill="#0f172a", font=font_lg)

    # ── Header ──
    draw.text((130, 50), "SKILL BADGE", fill="#94a3b8", font=font_sm)
    draw.text((130, 72), skill_name[:30], fill="#f1f5f9", font=font_md)

    # ── Divider line ──
    draw.line([(30, 130), (W - 30, 130)], fill="#334155", width=2)

    # ── Score Section ──
    score_text = f"{score}%"
    # Score color based on value
    if score >= 90:
        score_color = "#10b981"  # emerald
    elif score >= 80:
        score_color = "#22c55e"  # green
    elif score >= 70:
        score_color = "#eab308"  # yellow
    else:
        score_color = "#ef4444"  # red

    draw.text((50, 150), "SCORE", fill="#64748b", font=font_sm)
    draw.text((50, 175), score_text, fill=score_color, font=font_score)

    # ── Score bar ──
    bar_x, bar_y, bar_w, bar_h = 200, 195, 350, 20
    draw.rounded_rectangle(
        [(bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h)],
        radius=10, fill="#1e293b"
    )
    filled_w = int(bar_w * min(score, 100) / 100)
    if filled_w > 0:
        draw.rounded_rectangle(
            [(bar_x, bar_y), (bar_x + filled_w, bar_y + bar_h)],
            radius=10, fill=score_color
        )

    # ── Details Section ──
    draw.line([(30, 255), (W - 30, 255)], fill="#334155", width=1)

    y_pos = 270
    if student_name:
        draw.text((50, y_pos), "EARNED BY", fill="#64748b", font=font_xs)
        draw.text((160, y_pos), student_name[:25], fill="#e2e8f0", font=font_sm)
        y_pos += 28

    draw.text((50, y_pos), "DATE", fill="#64748b", font=font_xs)
    draw.text((160, y_pos), date_earned, fill="#e2e8f0", font=font_sm)
    y_pos += 28

    if asa_id:
        draw.text((50, y_pos), "ASA ID", fill="#64748b", font=font_xs)
        draw.text((160, y_pos), str(asa_id), fill="#10b981", font=font_sm)
        y_pos += 28

    # ── Footer ──
    draw.line([(30, H - 50), (W - 30, H - 50)], fill="#334155", width=1)
    draw.text(
        (50, H - 38),
        "SkillMeter × Algorand TestNet",
        fill="#475569", font=font_xs
    )
    if asa_id:
        draw.text(
            (W - 200, H - 38),
            "✓ Blockchain Verified",
            fill="#10b981", font=font_xs
        )

    # ── Corner accents ──
    # Top-right corner
    draw.line([(W - 40, 15), (W - 15, 15)], fill="#10b981", width=2)
    draw.line([(W - 15, 15), (W - 15, 40)], fill="#10b981", width=2)
    # Bottom-left corner
    draw.line([(15, H - 15), (40, H - 15)], fill="#10b981", width=2)
    draw.line([(15, H - 40), (15, H - 15)], fill="#10b981", width=2)

    # ── Save to buffer ──
    buffer = io.BytesIO()
    img.save(buffer, format="PNG", quality=95)
    buffer.seek(0)
    return buffer
