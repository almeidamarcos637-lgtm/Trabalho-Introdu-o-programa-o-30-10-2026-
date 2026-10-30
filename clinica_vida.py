#!/usr/bin/env python3
"""Cadastro acadêmico de pacientes da Clínica Vida+.

Os dados ficam apenas na memória e são descartados ao sair. Utilize somente
informações fictícias: este programa não oferece persistência nem segurança
para dados pessoais ou médicos reais.
"""

import re
import unicodedata


MENU = """
================================================
          CLÍNICA VIDA+ | CADASTRO
================================================
1. Cadastrar paciente
2. Ver estatísticas
3. Buscar paciente pelo nome
4. Listar todos os pacientes
5. Sair
------------------------------------------------"""


def normalizar(texto):
    """Ignora caixa e acentos nas buscas por nome."""
    decomposicao = unicodedata.normalize("NFKD", texto.strip().casefold())
    return "".join(caractere for caractere in decomposicao
                   if not unicodedata.combining(caractere))


def solicitar_nome():
    while True:
        nome = input("Nome: ").strip()
        if nome and any(caractere.isalpha() for caractere in nome):
            return nome
        print("Nome inválido. Informe um nome que contenha letras.")


def solicitar_idade():
    while True:
        texto = input("Idade (0 a 130): ").strip()
        try:
            idade = int(texto)
        except ValueError:
            print("Idade inválida. Digite um número inteiro entre 0 e 130.")
            continue
        if 0 <= idade <= 130:
            return idade
        print("Idade inválida. Digite um número inteiro entre 0 e 130.")


def solicitar_telefone():
    while True:
        telefone = input("Telefone com DDD (10 ou 11 dígitos): ").strip()
        digitos = re.sub(r"\D", "", telefone)
        if re.fullmatch(r"[0-9()+\-\s]+", telefone) and len(digitos) in (10, 11):
            return telefone
        print("Telefone inválido. Informe 10 ou 11 dígitos, incluindo o DDD.")


def cadastrar_paciente(pacientes):
    print("\n--- CADASTRAR PACIENTE ---")
    nome = solicitar_nome()
    idade = solicitar_idade()
    telefone = solicitar_telefone()
    pacientes.append({"nome": nome, "idade": idade, "telefone": telefone})
    print(f"Paciente '{nome}' cadastrado(a) com sucesso.")


def calcular_estatisticas(pacientes):
    """Retorna os indicadores ou None quando não há pacientes."""
    if not pacientes:
        return None
    menor_idade = min(paciente["idade"] for paciente in pacientes)
    maior_idade = max(paciente["idade"] for paciente in pacientes)
    return {
        "total": len(pacientes),
        "media": sum(paciente["idade"] for paciente in pacientes) / len(pacientes),
        "mais_novos": [p for p in pacientes if p["idade"] == menor_idade],
        "mais_velhos": [p for p in pacientes if p["idade"] == maior_idade],
    }


def nomes_e_idades(pacientes):
    return "; ".join(f"{p['nome']} ({p['idade']} anos)" for p in pacientes)


def mostrar_estatisticas(pacientes):
    print("\n--- ESTATÍSTICAS ---")
    estatisticas = calcular_estatisticas(pacientes)
    if estatisticas is None:
        print("Nenhum paciente cadastrado. Cadastre um paciente para ver as estatísticas.")
        return
    media = f"{estatisticas['media']:.2f}".replace(".", ",")
    print(f"Total de pacientes: {estatisticas['total']}")
    print(f"Idade média: {media} anos")
    print(f"Mais novo(s): {nomes_e_idades(estatisticas['mais_novos'])}")
    print(f"Mais velho(s): {nomes_e_idades(estatisticas['mais_velhos'])}")


def buscar_pacientes(pacientes, termo):
    """Busca parcial sem diferenciar maiúsculas ou acentos."""
    chave = normalizar(termo)
    if not chave:
        return []
    return [p for p in pacientes if chave in normalizar(p["nome"])]


def exibir_pacientes(pacientes):
    for indice, paciente in enumerate(pacientes, start=1):
        print(f"{indice}. Nome: {paciente['nome']} | Idade: {paciente['idade']} "
              f"| Telefone: {paciente['telefone']}")


def buscar_por_nome(pacientes):
    print("\n--- BUSCAR PACIENTE ---")
    if not pacientes:
        print("Nenhum paciente cadastrado para buscar.")
        return
    termo = input("Nome ou parte do nome: ").strip()
    if not termo:
        print("Busca inválida. Informe um nome.")
        return
    encontrados = buscar_pacientes(pacientes, termo)
    if not encontrados:
        print("Nenhum paciente encontrado para esse nome.")
        return
    print(f"Resultado(s) encontrado(s): {len(encontrados)}")
    exibir_pacientes(encontrados)


def listar_pacientes(pacientes):
    print("\n--- TODOS OS PACIENTES ---")
    if not pacientes:
        print("Nenhum paciente cadastrado.")
        return
    exibir_pacientes(pacientes)


def main():
    pacientes = []  # Lista de dicionários; os dados existem apenas nesta execução.
    print("Use apenas dados fictícios. Os dados são apagados ao sair.")
    while True:
        print(MENU)
        opcao = input("Escolha uma opção: ").strip()
        if opcao == "1":
            cadastrar_paciente(pacientes)
        elif opcao == "2":
            mostrar_estatisticas(pacientes)
        elif opcao == "3":
            buscar_por_nome(pacientes)
        elif opcao == "4":
            listar_pacientes(pacientes)
        elif opcao == "5":
            print("Programa encerrado. Até mais!")
            break
        else:
            print("Opção inválida. Escolha um número de 1 a 5.")


if __name__ == "__main__":
    try:
        main()
    except (EOFError, KeyboardInterrupt):
        print("\nEntrada encerrada. Programa finalizado sem salvar dados.")
