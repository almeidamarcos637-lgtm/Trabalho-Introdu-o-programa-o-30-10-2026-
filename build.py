#!/usr/bin/env python3
"""Gera index.html autossuficiente a partir dos arquivos-fonte locais."""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def gerar_html():
    template = (ROOT / "index.template.html").read_text(encoding="utf-8")
    fontes = {
        "<!-- INJETAR_CSS -->": (ROOT / "styles.css").read_text(encoding="utf-8"),
        "<!-- INJETAR_DIAGRAMA -->": (ROOT / "assets/diagrama-casos.svg").read_text(encoding="utf-8"),
        "/* INJETAR_CORE */": (ROOT / "core.js").read_text(encoding="utf-8"),
        "/* INJETAR_APP */": (ROOT / "app.js").read_text(encoding="utf-8"),
        "__FONTE_PYTHON__": json.dumps(
            (ROOT / "clinica_vida.py").read_text(encoding="utf-8"),
            ensure_ascii=False,
        ).replace("<", "\\u003c"),
    }
    for marcador, conteudo in fontes.items():
        if template.count(marcador) != 1:
            raise ValueError(f"Marcador ausente ou repetido no template: {marcador}")
        template = template.replace(marcador, conteudo)
    return template


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verifica se index.html está atualizado")
    args = parser.parse_args()
    destino = ROOT / "index.html"
    novo = gerar_html()
    if args.check:
        if not destino.exists() or destino.read_text(encoding="utf-8") != novo:
            print("index.html está desatualizado. Execute: python3 build.py")
            return 1
        print("index.html está atualizado.")
        return 0
    destino.write_text(novo, encoding="utf-8")
    print("index.html gerado com todos os recursos embutidos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
