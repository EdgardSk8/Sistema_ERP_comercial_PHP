"""Centra y optimiza los fondos de avatar.

- Conserva la transparencia (PNG con alfa).
- Recorta el espacio vacío a partir del canal alfa.
- Coloca el dibujo centrado en un lienzo cuadrado con margen uniforme.
- Reduce a 512x512 para que pesen poco.
"""

from pathlib import Path

from PIL import Image

CARPETA = Path("website-supabase/imagenes/avatares/fondos")
TAMANO = 384
MARGEN = 0.86
UMBRAL_BLANCO = 245

for archivo in sorted(CARPETA.glob("fondo-*.*")):
    if archivo.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        continue

    original = Image.open(archivo).convert("RGBA")
    caja = original.getchannel("A").getbbox()

    if not caja:
        mascara = original.convert("L").point(lambda valor: 255 if valor < UMBRAL_BLANCO else 0)
        caja = mascara.getbbox()

    recortada = original.crop(caja) if caja else original

    lado_mayor = max(recortada.width, recortada.height)
    factor = (TAMANO * MARGEN) / lado_mayor
    destino = (
        max(1, round(recortada.width * factor)),
        max(1, round(recortada.height * factor)),
    )
    ajustada = recortada.resize(destino, Image.LANCZOS)

    lienzo = Image.new("RGBA", (TAMANO, TAMANO), (255, 255, 255, 0))
    lienzo.alpha_composite(ajustada, ((TAMANO - ajustada.width) // 2, (TAMANO - ajustada.height) // 2))

    if archivo.suffix.lower() == ".png":
        lienzo.save(archivo, optimize=True)
    elif archivo.suffix.lower() == ".webp":
        lienzo.save(archivo, quality=88, method=6)
    else:
        lienzo.convert("RGB").save(archivo, quality=88, optimize=True, progressive=True)

    print(f"{archivo.name}: {original.size} -> {lienzo.size} | {archivo.stat().st_size / 1024:.0f} KB")
