"""Genera una versión reducida de Bootstrap Icons con solo los iconos usados.

- Descarga el CSS y la fuente oficial de Bootstrap Icons.
- Detecta los iconos `bi-*` usados en HTML y JS de la tienda.
- Crea `website-supabase/fonts/bootstrap-icons-subset.woff2`.
- Crea `website-supabase/css/base/bootstrap-icons-subset.css`.
"""

from __future__ import annotations

import re
import urllib.request
from pathlib import Path

from fontTools import subset

RAIZ = Path(__file__).resolve().parent.parent
TIENDA = RAIZ / "website-supabase"
CSS_DESTINO = TIENDA / "css" / "base" / "bootstrap-icons-subset.css"
FUENTE_DESTINO = TIENDA / "fonts" / "bootstrap-icons-subset.woff2"

CSS_URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
FUENTE_URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2?dd67030699838ea613ee6dbda90effa6"

BASE = """[class^="bi-"]::before,
[class*=" bi-"]::before {
  display: inline-block;
  font-family: bootstrap-icons !important;
  font-style: normal;
  font-weight: normal !important;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: -.125em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
"""


def descargar(url: str) -> bytes:
    peticion = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(peticion) as respuesta:
        return respuesta.read()


def iconos_usados() -> set[str]:
    patron = re.compile(r"\bbi-[a-z0-9-]+")
    usados: set[str] = set()

    for ruta in [*TIENDA.glob("*.html"), *TIENDA.glob("js/*.js")]:
        usados.update(patron.findall(ruta.read_text(encoding="utf-8", errors="ignore")))

    return usados


def main() -> None:
    print("Descargando Bootstrap Icons…")
    css = descargar(CSS_URL).decode("utf-8")
    fuente = descargar(FUENTE_URL)

    mapa = {
        clase: codigo
        for clase, codigo in re.findall(
            r'\.(bi-[a-z0-9-]+)::before\{content:"\\([0-9a-fA-F]+)"\}',
            css,
        )
    }

    usados = sorted(iconos_usados())
    disponibles = [icono for icono in usados if icono in mapa]
    faltantes = [icono for icono in usados if icono not in mapa]

    if faltantes:
        print(f"AVISO: sin glifo en Bootstrap Icons: {', '.join(faltantes)}")

    codigos = sorted({mapa[icono] for icono in disponibles})
    unicode_points = [int(codigo, 16) for codigo in codigos]

    print(f"Iconos usados: {len(usados)} · con glifo: {len(disponibles)} · glifos: {len(unicode_points)}")

    opciones = subset.Options()
    opciones.flavor = "woff2"
    opciones.desubroutinize = True
    opciones.layout_features = ["*"]
    opciones.name_IDs = ["*"]
    opciones.notdef_outline = True

    fuente_temporal = RAIZ / "bootstrap-icons.woff2"
    fuente_temporal.write_bytes(fuente)

    fuente_obj = subset.load_font(str(fuente_temporal), opciones)
    subsetter = subset.Subsetter(options=opciones)
    subsetter.populate(unicodes=unicode_points)
    subsetter.subset(fuente_obj)

    FUENTE_DESTINO.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(fuente_obj, str(FUENTE_DESTINO), opciones)
    fuente_obj.close()
    fuente_temporal.unlink(missing_ok=True)

    reglas = "\n".join(
        f'.{icono}::before{{content:"\\{mapa[icono]}"}}'
        for icono in disponibles
    )

    CSS_DESTINO.parent.mkdir(parents=True, exist_ok=True)

    CSS_DESTINO.write_text(
        "/* Bootstrap Icons v1.11.3 · subconjunto generado solo con los iconos usados.\n"
        "   Copyright 2019-2024 The Bootstrap Authors · Licencia MIT. */\n"
        "@font-face{font-display:block;font-family:bootstrap-icons;"
        "src:url('../../fonts/bootstrap-icons-subset.woff2') format('woff2')}\n"
        f"{BASE}{reglas}\n",
        encoding="utf-8",
    )

    print(f"CSS: {CSS_DESTINO.stat().st_size / 1024:.1f} KB")
    print(f"Fuente: {FUENTE_DESTINO.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
