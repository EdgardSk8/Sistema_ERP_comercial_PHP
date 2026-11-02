"""Optimiza las imágenes de la tienda web (website-supabase).

- Reduce logos, fotos de producto, variaciones y fondos de avatar.
- Mantiene nombres y formatos para no tocar las rutas guardadas en la base.
- Uso:
    python scripts/optimizar_imagenes_tienda.py --dry-run
    python scripts/optimizar_imagenes_tienda.py
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent / "website-supabase"

# (ruta, lado máximo, formato de salida)
OBJETIVOS = {
    "logos": [
        ("img/logonavidad-mini.png", 144),
        ("img/minilogo.png", 120),
        ("img/apple-touch-navidad.png", 180),
        ("imagenes/logo/tellezsoftware.png", 136),
    ],
    "productos": ("imagenes/productos", 600),
    "variaciones": ("imagenes/productosvariaciones", 1000),
    "avatares": ("imagenes/avatares/fondos", 160),
}


def peso_kb(ruta: Path) -> float:
    return ruta.stat().st_size / 1024


def guardar_png(imagen: Image.Image, ruta: Path, dry_run: bool) -> tuple[int, int]:
    """Guarda PNG optimizado; prueba cuantización si conserva bien el alfa."""
    antes = ruta.stat().st_size
    destino = ruta

    if dry_run:
        temporal = ruta.with_name(f"__tmp_{ruta.name}")
        destino = temporal

    imagen.save(destino, format="PNG", optimize=True)
    mejor = destino.stat().st_size

    if imagen.mode in ("RGBA", "LA"):
        cuantizada = imagen.quantize(
            colors=256,
            method=Image.Quantize.FASTOCTREE,
            dither=Image.Dither.FLOYDSTEINBERG,
        )
        cuantizada.save(destino, format="PNG", optimize=True)
        if destino.stat().st_size < mejor:
            mejor = destino.stat().st_size

    if dry_run:
        destino.unlink(missing_ok=True)

    return antes, mejor


def optimizar(ruta: Path, lado_max: int, dry_run: bool) -> tuple[int, int]:
    original = Image.open(ruta)
    original.load()

    # Respeta la orientación EXIF y no agranda imágenes.
    imagen = original.convert("RGBA") if original.mode in ("RGBA", "LA", "P") else original.convert("RGB")
    if max(imagen.size) > lado_max:
        imagen.thumbnail((lado_max, lado_max), Image.Resampling.LANCZOS)

    extension = ruta.suffix.lower()

    if extension == ".png":
        return guardar_png(imagen, ruta, dry_run)

    antes = ruta.stat().st_size
    destino = ruta.with_name(f"__tmp_{ruta.name}") if dry_run else ruta

    if extension in (".jpg", ".jpeg"):
        imagen.convert("RGB").save(
            destino,
            format="JPEG",
            quality=82,
            optimize=True,
            progressive=True,
        )
    elif extension == ".webp":
        imagen.save(destino, format="WEBP", quality=82, method=6)
    else:
        return antes, antes

    despues = destino.stat().st_size
    if dry_run:
        destino.unlink(missing_ok=True)

    return antes, despues


def archivos_de(carpeta: Path, extensiones: set[str]) -> list[Path]:
    return sorted(
        ruta
        for ruta in carpeta.rglob("*")
        if ruta.is_file() and ruta.suffix.lower() in extensiones
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    total_antes = 0
    total_despues = 0

    print(f"{'ARCHIVO':<58} {'ANTES':>9} {'DESPUÉS':>9} {'AHORRO':>8}")
    print("-" * 88)

    for relativa, lado in OBJETIVOS["logos"]:
        ruta = RAIZ / relativa
        if not ruta.exists():
            continue
        antes, despues = optimizar(ruta, lado, args.dry_run)
        total_antes += antes
        total_despues += despues
        print(f"{relativa:<58} {antes / 1024:>8.1f}K {despues / 1024:>8.1f}K {(1 - despues / antes) * 100:>7.0f}%")

    for nombre, valor in OBJETIVOS.items():
        if nombre == "logos":
            continue

        carpeta_rel, lado = valor
        carpeta = RAIZ / carpeta_rel
        if not carpeta.exists():
            continue
        for ruta in archivos_de(carpeta, {".jpg", ".jpeg", ".png", ".webp"}):
            antes, despues = optimizar(ruta, lado, args.dry_run)
            total_antes += antes
            total_despues += despues
            relativa = ruta.relative_to(RAIZ)
            print(f"{str(relativa):<58} {antes / 1024:>8.1f}K {despues / 1024:>8.1f}K {(1 - despues / antes) * 100:>7.0f}%")

    print("-" * 88)
    print(
        f"TOTAL: {total_antes / 1024 / 1024:.2f} MB -> "
        f"{total_despues / 1024 / 1024:.2f} MB "
        f"({(1 - total_despues / total_antes) * 100:.0f}% menos)"
    )


if __name__ == "__main__":
    main()
