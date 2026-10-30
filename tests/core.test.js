const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('as 16 combinações são únicas e os resultados coincidem com os conjuntos esperados', () => {
  const rows = C.truthRows();
  assert.equal(rows.length, 16);
  const key = r => [r.a, r.b, r.c, r.d].map(C.vf).join('');
  assert.equal(new Set(rows.map(key)).size, 16);
  assert.deepEqual(rows.filter(r => r.normal).map(key).sort(), ['VVVV', 'VVVF', 'FVVV'].sort());
  assert.deepEqual(rows.filter(r => r.emergencia).map(key).sort(), ['VVVV', 'VVVF', 'VFVV', 'FVVV', 'FVVF', 'FFVV'].sort());
  for (const r of rows) {
    assert.equal(r.abc, r.a && r.b && r.c);
    assert.equal(r.bcd, r.b && r.c && r.d);
    assert.equal(r.borD, r.b || r.d);
    assert.equal(r.normal, r.abc || r.bcd);
    assert.equal(r.emergencia, r.c && r.borD);
  }
  const specific = rows.find(r => key(r) === 'FVVF');
  assert.equal(specific.normal, false);
  assert.equal(specific.emergencia, true);
});

test('duração inclusiva, anos bissextos e datas inválidas', () => {
  assert.equal(C.durationDays('2026-03-02', '2026-03-13'), 12);
  assert.equal(C.durationDays('2024-02-28', '2024-03-01'), 3);
  assert.equal(C.durationDays('2026-03-13', '2026-03-13'), 1);
  assert.equal(C.durationDays('2026-03-14', '2026-03-13'), null);
  assert.equal(C.durationDays('2026-02-30', '2026-03-01'), null);
  assert.equal(C.durationDays('', '2026-03-01'), null);
  assert.equal(C.formatDate('2026-03-02'), '02/03/2026');
});

test('progresso é baseado em tarefas concluídas e checklist é contado separadamente', () => {
  const sprint = {tasks: [
    {status: 'Concluído', checklist: [{done:true}, {done:false}]},
    {status: 'Em Progresso', checklist: [{done:true}]},
    {status: 'Backlog', checklist: []},
  ]};
  assert.deepEqual(C.sprintMetrics(sprint), {total:3, done:1, remaining:2, percent:33, checklistTotal:3, checklistDone:2});
  assert.deepEqual(C.sprintMetrics({tasks:[]}), {total:0, done:0, remaining:0, percent:0, checklistTotal:0, checklistDone:0});
});

test('relatório de sprint inclui status, resultados, retrospectiva e acompanhamento', () => {
  const sprint = {name:'Sprint teste', goal:'Validar', status:'Concluída', start:'2026-01-01', end:'2026-01-02',
    notes:{results:'Feito', challenges:'Prazo', positives:'Equipe', improvements:'Testar mais'},
    tasks:[{title:'Tarefa A', description:'Descrição', status:'Concluído', due:'2026-01-02', checklist:[{text:'Revisar',done:true}], comments:[{text:'Conferido',createdAt:'2026-01-01T12:00:00Z'}]}]};
  const report = C.sprintReport(sprint);
  for (const value of ['Sprint teste', 'Status da sprint: Concluída', '2 dia(s)', '1 de 1 tarefa(s)', 'RESULTADOS', 'DESAFIOS', 'PONTOS POSITIVOS', 'MELHORIAS', '[x] Revisar', 'Conferido']) assert.ok(report.includes(value), value);
  assert.match(C.sprintReport({...sprint, notes:{}, tasks:[]}), /Nenhuma tarefa nesta sprint/);
});

test('exportação do projeto contém as cinco etapas, as tabelas e o código Python', () => {
  const md = C.projectMarkdown([], 'print("python real")\n');
  for (const value of ['## Passo 1', '## Passo 2', '## Passo 3', '## Passo 4', '## Passo 5', 'print("python real")', '3 de 16', '6 de 16', 'A=F, B=V, C=V, D=F', 'Paciente B', '«include»']) assert.ok(md.includes(value), value);
  assert.equal(md.split('\n').filter(line => /^\| [VF] \| [VF] \| [VF] \| [VF] \|/.test(line)).length, 32);
});

test('escape HTML protege textos inseridos no quadro', () => {
  assert.equal(C.escapeHtml('<img src="x" onerror=\'x\'> &'), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt; &amp;');
});
