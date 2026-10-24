# Usage (depuis nutripanier/) : python3 scripts/make-icons.py
# Icône originale NutriPanier : panier stylisé surmonté d'une feuille (dessin géométrique, aucun logo tiers).
from PIL import Image, ImageDraw
GREEN = (27, 107, 58); LEAF = (111, 207, 151); WHITE = (255, 255, 255)

def draw_mark(size, color_basket, color_leaf, scale=1.0):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    s = size * scale; ox = (size - s) / 2; oy = (size - s) / 2
    P = lambda x, y: (ox + x * s, oy + y * s)
    w = max(2, int(s * 0.055))
    # anse
    d.arc([P(0.30, 0.26), P(0.70, 0.66)], start=180, end=360, fill=color_basket, width=w)
    # corps du panier (trapèze)
    d.polygon([P(0.16, 0.46), P(0.84, 0.46), P(0.74, 0.84), P(0.26, 0.84)], fill=color_basket)
    # bande du bord
    d.rectangle([P(0.12, 0.42), P(0.88, 0.50)], fill=color_basket)
    # feuille
    d.ellipse([P(0.47, 0.10), P(0.69, 0.36)], fill=color_leaf)
    d.line([P(0.50, 0.40), P(0.62, 0.17)], fill=GREEN if color_leaf != GREEN else WHITE, width=max(1, w // 2))
    # tressage : rainures dans le panier
    hole = (0, 0, 0, 0)
    for x in (0.36, 0.50, 0.64):
        d.rounded_rectangle([P(x - 0.025, 0.56), P(x + 0.025, 0.76)], radius=s * 0.02, fill=hole)
    return im

out = 'assets/images/'
icon = Image.new('RGB', (1024, 1024), GREEN)
icon.paste(draw_mark(1024, WHITE, LEAF, 0.78), (0, 0), draw_mark(1024, WHITE, LEAF, 0.78))
icon.save(out + 'icon.png')
draw_mark(512, WHITE, LEAF, 0.60).save(out + 'android-icon-foreground.png')  # zone sûre ~66 %
Image.new('RGBA', (512, 512), GREEN + (255,)).save(out + 'android-icon-background.png')
draw_mark(432, WHITE, WHITE, 0.62).save(out + 'android-icon-monochrome.png')
draw_mark(512, GREEN, LEAF, 1.0).save(out + 'splash-icon.png')
fav = Image.new('RGBA', (48, 48), GREEN + (255,)); m = draw_mark(48, WHITE, LEAF, 0.85); fav.paste(m, (0, 0), m); fav.save(out + 'favicon.png')
print('ok')

# Éléments Google Play : icône 512×512 et image de présentation 1024×500.
icon.resize((512, 512), Image.LANCZOS).save('store/play-icon-512.png')
feature = Image.new('RGB', (1024, 500), GREEN)
mark = draw_mark(420, WHITE, LEAF, 0.9)
feature.paste(mark, (60, 40), mark)
ImageDraw.Draw(feature).text((520, 200), 'NutriPanier', fill=WHITE, font_size=84)
ImageDraw.Draw(feature).text((524, 310), 'Calories & courses', fill=LEAF, font_size=44)
feature.save('store/play-feature-1024x500.png')
