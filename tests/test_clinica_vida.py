"""Testes sem dependências externas para o programa de terminal e os arquivos."""

import os
from pathlib import Path
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import clinica_vida as cv  # noqa: E402


class TestCadastro(unittest.TestCase):
    def setUp(self):
        self.pacientes = [
            {"nome": "Paciente Ágata", "idade": 20, "telefone": "4100000000"},
            {"nome": "Paciente Bento", "idade": 40, "telefone": "41000000000"},
            {"nome": "Paciente Céu", "idade": 40, "telefone": "41000000000"},
        ]

    def test_lista_vazia(self):
        self.assertIsNone(cv.calcular_estatisticas([]))
        self.assertEqual(cv.buscar_pacientes([], "Paciente"), [])

    def test_estatisticas_e_empates(self):
        stats = cv.calcular_estatisticas(self.pacientes)
        self.assertEqual(stats["total"], 3)
        self.assertAlmostEqual(stats["media"], 100 / 3)
        self.assertEqual([p["nome"] for p in stats["mais_novos"]], ["Paciente Ágata"])
        self.assertEqual([p["nome"] for p in stats["mais_velhos"]], ["Paciente Bento", "Paciente Céu"])

    def test_busca_sem_acentos_com_parte_do_nome(self):
        self.assertEqual(cv.buscar_pacientes(self.pacientes, " aGaTA ")[0]["nome"], "Paciente Ágata")
        self.assertEqual(len(cv.buscar_pacientes(self.pacientes, "paciente")), 3)
        self.assertEqual(cv.buscar_pacientes(self.pacientes, "não existe"), [])
        self.assertEqual(cv.buscar_pacientes(self.pacientes, "   "), [])

    def test_fluxo_real_no_terminal_com_entradas_invalidas(self):
        entrada = "\n".join([
            "2", "3", "4", "9",  # lista vazia e opção inválida
            "1", "", "123", "Paciente Ágata", "abc", "-1", "131", "20", "abc", "4100000000",
            "1", "Paciente Bento", "40", "41000000000",
            "2", "3", "agata", "3", "inexistente", "4", "5", "",
        ])
        proc = subprocess.run([sys.executable, str(ROOT / "clinica_vida.py")], input=entrada,
                              text=True, capture_output=True, timeout=10, check=True)
        for trecho in ["Nenhum paciente cadastrado", "Opção inválida", "Nome inválido", "Idade inválida",
                       "Telefone inválido", "Total de pacientes: 2", "Idade média: 30,00 anos",
                       "Mais novo(s): Paciente Ágata (20 anos)", "Mais velho(s): Paciente Bento (40 anos)",
                       "Resultado(s) encontrado(s): 1", "Nenhum paciente encontrado", "Programa encerrado"]:
            self.assertIn(trecho, proc.stdout)
        self.assertEqual(proc.stderr, "")

    def test_fim_de_entrada_eh_tratado(self):
        proc = subprocess.run([sys.executable, str(ROOT / "clinica_vida.py")], input="",
                              text=True, capture_output=True, timeout=10, check=True)
        self.assertIn("Entrada encerrada", proc.stdout)
        self.assertNotIn("Traceback", proc.stdout + proc.stderr)

    def test_arquivo_executavel(self):
        if os.name != "nt":
            self.assertTrue(os.access(ROOT / "clinica_vida.py", os.X_OK))


class TestArtefatos(unittest.TestCase):
    def test_html_esta_atualizado(self):
        subprocess.run([sys.executable, str(ROOT / "build.py"), "--check"], check=True, timeout=10)

    def test_diagrama_tem_os_casos_e_os_tres_includes(self):
        root = ET.parse(ROOT / "assets/diagrama-casos.svg").getroot()
        ns = {"s": "http://www.w3.org/2000/svg"}
        texto = " ".join("".join(el.itertext()).strip() for el in root.findall('.//s:text', ns))
        for rotulo in ["Secretária", "Médico", "Cadastrar paciente", "Agendar consulta", "Confirmar consulta",
                       "Cancelar consulta", "Gerar receita", "Imprimir receita", "Verificar cadastro", "do paciente"]:
            self.assertIn(rotulo, texto)
        self.assertEqual(len(root.findall('.//s:ellipse', ns)), 7)
        self.assertEqual(texto.count('«include»'), 3)
        include_group = next(g for g in root.findall('.//s:g', ns) if g.get('marker-end') == 'url(#include-arrow)')
        self.assertEqual(len(include_group.findall('s:path', ns)), 3)
        self.assertEqual(include_group.get('stroke-dasharray'), '7 6')


if __name__ == '__main__':
    unittest.main()
