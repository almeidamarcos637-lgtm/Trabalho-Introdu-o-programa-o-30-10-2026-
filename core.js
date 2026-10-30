/* Núcleo independente da interface: também pode ser testado no Node.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATUS = ['Backlog', 'Sprint Atual', 'Em Progresso', 'Concluído'];
  const PSEUDOCODE = `INÍCIO
    fila ← lista vazia

    PARA i DE 1 ATÉ 3 FAÇA
        LEIA nome
        LEIA cpf
        ENFILEIRE(fila, { nome: nome, cpf: cpf })
    FIM PARA

    paciente_atendido ← DESENFILEIRE(fila)
    ESCREVA "Paciente em atendimento: ", paciente_atendido
    ESCREVA "Pacientes restantes, em ordem:"
    PARA CADA paciente EM fila FAÇA
        ESCREVA paciente.nome, paciente.cpf
    FIM PARA
FIM`;

  function normal(a, b, c, d) {
    return (a && b && c) || (b && c && d);
  }

  function emergencia(a, b, c, d) {
    return c && (b || d);
  }

  function truthRows() {
    const rows = [];
    for (const a of [true, false]) {
      for (const b of [true, false]) {
        for (const c of [true, false]) {
          for (const d of [true, false]) {
            rows.push({ a, b, c, d, abc: a && b && c, bcd: b && c && d,
              borD: b || d, normal: normal(a, b, c, d), emergencia: emergencia(a, b, c, d) });
          }
        }
      }
    }
    return rows;
  }

  function toDay(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 100 || year > 9999) return null;
    const value = Date.UTC(year, month - 1, day);
    const check = new Date(value);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    return Math.floor(value / 86400000);
  }

  function durationDays(start, end) {
    const first = toDay(start);
    const last = toDay(end);
    return first === null || last === null || last < first ? null : last - first + 1;
  }

  function formatDate(iso) {
    const day = toDay(iso);
    if (day === null) return 'Não definida';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(day * 86400000));
  }

  function formatDateTime(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  function sprintMetrics(sprint) {
    const tasks = Array.isArray(sprint.tasks) ? sprint.tasks : [];
    const done = tasks.filter(task => task.status === 'Concluído').length;
    const checks = tasks.flatMap(task => Array.isArray(task.checklist) ? task.checklist : []);
    return { total: tasks.length, done, remaining: tasks.length - done,
      percent: tasks.length ? Math.round(done * 100 / tasks.length) : 0,
      checklistTotal: checks.length, checklistDone: checks.filter(item => item.done).length };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function textOrFallback(value) {
    return String(value ?? '').trim() || 'Não informado.';
  }

  function sprintReport(sprint) {
    const stats = sprintMetrics(sprint);
    const duration = durationDays(sprint.start, sprint.end);
    const notes = sprint.notes || {};
    const lines = [
      `RELATÓRIO DE SPRINT — ${sprint.name}`,
      'Clínica Vida+ · Projeto acadêmico · Dados fictícios',
      '',
      `Objetivo: ${textOrFallback(sprint.goal)}`,
      `Status da sprint: ${textOrFallback(sprint.status)}`,
      `Período: ${formatDate(sprint.start)} a ${formatDate(sprint.end)}`,
      `Duração: ${duration === null ? 'Não definida' : `${duration} dia(s) corrido(s), incluindo as duas datas`}`,
      `Progresso: ${stats.done} de ${stats.total} tarefa(s) concluída(s) (${stats.percent}%).`,
      `Checklist: ${stats.checklistDone} de ${stats.checklistTotal} item(ns) concluído(s).`,
      '',
      'RESULTADOS',
      `Tarefas concluídas: ${stats.done}. Tarefas ainda não concluídas: ${stats.remaining}.`,
      textOrFallback(notes.results),
      '',
      'DESAFIOS', textOrFallback(notes.challenges),
      '',
      'PONTOS POSITIVOS', textOrFallback(notes.positives),
      '',
      'MELHORIAS', textOrFallback(notes.improvements),
      '',
      'TAREFAS E ACOMPANHAMENTO',
    ];
    if (!sprint.tasks || !sprint.tasks.length) lines.push('Nenhuma tarefa nesta sprint.');
    (sprint.tasks || []).forEach((task, index) => {
      const checklist = task.checklist || [];
      const comments = task.comments || [];
      lines.push('', `${index + 1}. ${task.title}`, `   Status: ${task.status}`,
        `   Prazo: ${task.due ? formatDate(task.due) : 'Não definido'}`,
        `   Descrição: ${textOrFallback(task.description)}`,
        '   Checklist:');
      if (!checklist.length) lines.push('   • Nenhum item.');
      checklist.forEach(item => lines.push(`   • [${item.done ? 'x' : ' '}] ${item.text}`));
      lines.push('   Comentários:');
      if (!comments.length) lines.push('   • Nenhum comentário.');
      comments.forEach(comment => lines.push(`   • ${formatDateTime(comment.createdAt)} — ${comment.text}`));
    });
    return lines.join('\n');
  }

  function vf(value) { return value ? 'V' : 'F'; }

  function projectMarkdown(sprints, pythonSource) {
    const rows = truthRows();
    const normalTable = rows.map(r => `| ${vf(r.a)} | ${vf(r.b)} | ${vf(r.c)} | ${vf(r.d)} | ${vf(r.abc)} | ${vf(r.bcd)} | ${vf(r.normal)} |`).join('\n');
    const emergencyTable = rows.map(r => `| ${vf(r.a)} | ${vf(r.b)} | ${vf(r.c)} | ${vf(r.d)} | ${vf(r.borD)} | ${vf(r.emergencia)} |`).join('\n');
    const sprintText = sprints.map(s => sprintReport(s).split('\n').map(line => `    ${line}`).join('\n')).join('\n\n');
    return `# Clínica Vida+ — projeto acadêmico

Relatório exportado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}. Dados exclusivamente fictícios.

## Introdução
A Clínica Vida+ é um cenário acadêmico para aplicar planejamento ágil, programação, lógica, estruturas de dados e modelagem de sistemas. A aplicação não é um sistema clínico real.

## Objetivos
- Organizar sprints e acompanhar tarefas em um quadro visual.
- Implementar um cadastro de pacientes em Python com listas e dicionários.
- Avaliar regras de atendimento por meio de tabelas-verdade completas.
- Representar uma fila FIFO e os casos de uso do sistema de consultas.

## Passo 1 — Planejamento ágil
Quadro inspirado no Trello; ele não é um quadro do Trello real. Progresso = tarefas concluídas ÷ total de tarefas. A duração conta os dias corridos de início e fim, inclusive. O status da sprint é definido manualmente.

${sprintText || 'Nenhuma sprint cadastrada.'}

## Passo 2 — Cadastro em Python
O arquivo executável clinica_vida.py é um programa de terminal, feito com listas e dicionários. Os dados existem apenas durante a execução; não use dados reais.

\`\`\`python
${pythonSource.trimEnd()}
\`\`\`

## Passo 3 — Lógica proposicional
A = tem agendamento; B = documentos válidos; C = médico disponível; D = pagamentos em dia.

Consulta normal: (A ∧ B ∧ C) ∨ (B ∧ C ∧ D). Liberação em ${rows.filter(r => r.normal).length} de 16 combinações.

| A | B | C | D | A ∧ B ∧ C | B ∧ C ∧ D | Normal |
|---|---|---|---|---|---|---|
${normalTable}

Emergência: C ∧ (B ∨ D). Liberação em ${rows.filter(r => r.emergencia).length} de 16 combinações.

| A | B | C | D | B ∨ D | Emergência |
|---|---|---|---|---|---|
${emergencyTable}

Para A=F, B=V, C=V, D=F: a consulta normal não é liberada (ambos os termos da disjunção são falsos); a emergência é liberada (C é verdadeiro e B ∨ D também é verdadeiro).

## Passo 4 — Fila FIFO
O primeiro paciente inserido é o primeiro removido para atendimento; os dois restantes permanecem na ordem de entrada.

\`\`\`text
${PSEUDOCODE}
\`\`\`

Exemplo com CPFs propositalmente inválidos: entra Paciente A (000.000.000-00), depois Paciente B (111.111.111-11), depois Paciente C (222.222.222-22). Atende-se A; restam B e C, nessa ordem.

## Passo 5 — Casos de uso
O diagrama visual está disponível no arquivo assets/diagrama-casos.svg e pode ser baixado na aplicação.

- Secretária: cadastrar paciente, agendar consulta, confirmar consulta e cancelar consulta.
- Médico: cancelar consulta e gerar receita.
- Agendar consulta «include» Verificar cadastro do paciente.
- Confirmar consulta «include» Verificar cadastro do paciente.
- Gerar receita «include» Imprimir receita.

Os atores ficam fora dos limites do sistema; os casos de uso ficam dentro. Os casos incluídos são obrigatórios.

## Conclusão
O projeto conecta a organização do trabalho à implementação e à análise formal. A lógica libera a consulta normal em 3 combinações e a emergência em 6; a fila preserva a ordem de chegada e o diagrama explicita responsabilidades e dependências obrigatórias.

## Ferramentas e referências
- Python 3 — estruturas de dados: https://docs.python.org/pt-br/3/tutorial/datastructures.html
- HTML, CSS e JavaScript — MDN: https://developer.mozilla.org/pt-BR/docs/Learn_web_development
- Trello — criação de quadros: https://support.atlassian.com/trello/docs/creating-a-new-board/
- Scrum Guide: https://scrumguides.org/scrum-guide.html
- UML 2.5.1 — Object Management Group: https://www.omg.org/spec/UML/2.5.1/
- Git — documentação: https://git-scm.com/doc
`;
  }

  return { STATUS, PSEUDOCODE, normal, emergencia, truthRows, durationDays, formatDate,
    formatDateTime, sprintMetrics, sprintReport, projectMarkdown, escapeHtml, vf };
});
