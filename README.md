# Clínica Vida+ — Projeto acadêmico

Aplicação web responsiva, em português, que reúne cinco passos de uma atividade acadêmica: gestão ágil, cadastro em Python, lógica proposicional, fila FIFO e modelagem de casos de uso. O projeto usa apenas informações fictícias.

> **Aviso:** esta é uma demonstração educacional, não um prontuário ou sistema clínico. Não use dados pessoais ou médicos reais. O quadro é inspirado no Trello, mas é local e **não está integrado nem foi criado no Trello**.

## Como abrir a aplicação

Não é necessário instalar dependências para usar a interface. Abra **`index.html`** em um navegador moderno. O arquivo contém os estilos, os scripts, o diagrama e uma cópia exata do programa Python incorporados.

Para uma experiência mais consistente de armazenamento, execute um servidor local na pasta do projeto:

```bash
python3 -m http.server 8000
```

No Windows, pode ser `py -m http.server 8000`. Em seguida, acesse <http://localhost:8000>. O servidor é opcional e não coleta nem transmite os dados do quadro para um servidor de aplicação.

### Funcionalidades

1. **Planejamento ágil:** quadro com Backlog, Sprint Atual, Em Progresso e Concluído. Crie, edite ou exclua sprints e tarefas; informe objetivo, status, datas e retrospectiva; mova cartões por arrastar ou pelo seletor; edite checklists e comentários. Selecione uma sprint e use **Relatório da sprint** para visualizar, imprimir ou baixar seu relatório em texto. A duração conta dias corridos, incluindo o primeiro e o último dia. O progresso é a quantidade de tarefas com status **Concluído** dividida pelo total da sprint; o status da sprint é definido manualmente.
2. **Cadastro em Python:** baixe `clinica_vida.py`, visualize o código e execute-o no terminal. É um programa Python real, não uma simulação JavaScript.
3. **Lógica proposicional:** duas tabelas-verdade de 16 linhas cada e um seletor de condições. Consulta normal: `(A ∧ B ∧ C) ∨ (B ∧ C ∧ D)`, liberada em **3** combinações. Emergência: `C ∧ (B ∨ D)`, liberada em **6**. Para A=F, B=V, C=V, D=F, a consulta normal é F e a emergência é V.
4. **Fila FIFO:** pseudocódigo que insere três pacientes com nome e CPF, atende o primeiro e lista os outros dois em ordem, além de uma demonstração interativa. Os CPFs exibidos são propositalmente inválidos.
5. **Casos de uso:** diagrama UML em SVG com Secretária e Médico, limite do sistema, associações e os três relacionamentos obrigatórios `«include»`. O diagrama também pode ser baixado separadamente.

O botão **Imprimir** produz uma versão com todas as seções, os relatórios de todas as sprints e o código Python. Para gerar PDF, selecione **Salvar como PDF** na janela de impressão do navegador. **Exportar projeto** gera um relatório em Markdown com os dados das sprints, o código, as tabelas e as demais etapas. O diagrama visual é disponibilizado como SVG separado. O arquivo `relatorio-demonstrativo.pdf` é um exemplo já gerado a partir dos dados iniciais; ele não é atualizado automaticamente quando o quadro é editado.

### Onde ficam os dados do quadro?

As alterações ficam no `localStorage` do navegador e não são sincronizadas entre dispositivos ou navegadores. Se o armazenamento estiver bloqueado, a página avisa que os dados duram apenas até seu fechamento. Limpar os dados do navegador também pode apagá-los. **Restaurar dados demonstrativos** substitui todas as sprints após confirmação. Exporte os relatórios para guardar os resultados; o arquivo de relatório não funciona como backup para reimportação.

### Como criar um quadro no Trello real

1. Entre em <https://trello.com/> e, no cabeçalho, escolha **Criar → Criar quadro**.
2. Defina o nome e o espaço de trabalho, escolha a visibilidade e crie o quadro.
3. Crie as listas **Backlog**, **Sprint Atual**, **Em Progresso** e **Concluído**.
4. Cadastre os cartões, datas, checklists e comentários desejados. O quadro local não envia nem sincroniza essas informações com o Trello.

[Instruções oficiais para criar um quadro](https://support.atlassian.com/trello/docs/creating-a-new-board/).

## Executar o programa Python

Com Python 3 instalado, abra um terminal nesta pasta:

```bash
python3 clinica_vida.py
```

No Windows:

```powershell
py clinica_vida.py
```

Em macOS/Linux também é possível executar `./clinica_vida.py`; caso necessário, libere a execução com `chmod +x clinica_vida.py`.

O menu oferece cadastro, estatísticas, busca, listagem e saída. A busca aceita parte do nome, ignorando maiúsculas e acentos. O programa valida nome, idade inteira de 0 a 130 e telefone com DDD de 10 ou 11 dígitos; informa lista vazia e nomes não encontrados. Empates de mais novo ou mais velho são mostrados. Os registros ficam **somente na memória** e são descartados quando o programa termina.

## Publicar no GitHub

O projeto está preparado para publicação, mas a criação do repositório remoto depende de uma conta GitHub autenticada. Para publicar:

1. Em <https://github.com/new>, crie um repositório vazio, por exemplo `clinica-vida-plus`. Escolha se será público ou privado. Não inicialize com README, licença ou `.gitignore` para evitar conflitos com os arquivos locais.
2. Descompacte o projeto e, no terminal, abra a pasta que contém `index.html` e este README. Execute os comandos abaixo, substituindo `SEU-USUARIO` pelo usuário ou organização reais:

```bash
git init -b main
git add .
git commit -m "Projeto acadêmico Clínica Vida+"
git remote add origin https://github.com/SEU-USUARIO/clinica-vida-plus.git
git push -u origin main
```

Se o Git solicitar identidade, configure seu nome e e-mail de commit com `git config --global user.name` e `git config --global user.email`. A autenticação para o push deve seguir o método disponível em sua conta GitHub.

Alternativamente, na página do repositório vazio, use a opção de **enviar arquivos existentes** e envie o conteúdo do projeto, preservando as pastas `assets` e `tests` na raiz. Para disponibilizar a interface com GitHub Pages, ative Pages nas configurações do repositório, escolhendo a branch `main` e a pasta `/ (root)`, conforme as opções disponíveis na sua conta.

## Arquivos e manutenção

```text
index.html                 Aplicação pronta para abrir, com recursos embutidos
index.template.html        Estrutura-fonte da aplicação
styles.css                 Estilos e regras de impressão
core.js                    Cálculos, tabelas e geração dos relatórios
app.js                     Navegação e funcionalidades da interface
clinica_vida.py            Programa de terminal executável
relatorio-demonstrativo.pdf Exemplo estático da impressão do projeto
assets/diagrama-casos.svg  Diagrama de casos de uso independente
build.py                   Gera o index.html autossuficiente
tests/                     Testes de cálculos, Python, artefatos e interface
```

Se alterar qualquer arquivo-fonte, inclusive o Python ou o SVG, gere novamente o HTML e verifique a sincronização:

```bash
python3 build.py
python3 build.py --check
```

Nenhuma etapa de compilação é necessária para simplesmente usar o `index.html` já fornecido.

## Testes

Com Python 3 e Node.js 20 ou superior:

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/core.test.js
```

Os testes verificam, entre outros pontos, todas as combinações lógicas, os totais, datas, progresso, relatórios, fluxo real do programa Python, entradas inválidas e o SVG.

Opcionalmente, para testar a interface de ponta a ponta em Chromium, instale o Playwright **apenas para testes**:

```bash
npm install --no-save --no-package-lock playwright
npx playwright install chromium
# Em outro terminal, nesta pasta: python3 -m http.server 8000
node tests/ui.test.cjs
```

O teste verifica navegação, criação e edição de tarefas e sprints, arrastar cartões, persistência, relatórios, downloads, estilos de impressão, tabelas, fila, diagrama e layout móvel. Em alguns sistemas Linux, o Chromium pode exigir bibliotecas adicionais de sistema.

## Referências e ferramentas

- [Python 3 — estruturas de dados](https://docs.python.org/pt-br/3/tutorial/datastructures.html)
- [MDN — desenvolvimento web com HTML, CSS e JavaScript](https://developer.mozilla.org/pt-BR/docs/Learn_web_development)
- [Trello — criação de quadros](https://support.atlassian.com/trello/docs/creating-a-new-board/)
- [Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/)
- [Documentação Git](https://git-scm.com/doc)
