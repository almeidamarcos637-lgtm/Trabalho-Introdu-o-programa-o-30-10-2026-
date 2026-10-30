/* Interface local do projeto acadêmico Clínica Vida+. Sem dependências externas. */
(function () {
  'use strict';

  const C = window.AppCore;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const escape = C.escapeHtml;
  const KEY = 'clinica-vida-plus:quadro:v1';
  const SPRINT_STAGES = ['Planejada', 'Em andamento', 'Concluída'];
  const ROUTES = { inicio: 'Visão geral', sprints: 'Planejamento ágil', python: 'Cadastro em Python', logica: 'Lógica proposicional', fila: 'Fila de pacientes', casos: 'Casos de uso' };
  let storageAvailable = true;
  let toastTimer;
  let taskDraft = null;
  let taskOriginSprintId = null;
  let editingSprintId = null;

  function check(id, text, done) { return { id, text, done }; }
  function comment(text, createdAt) { return { id: `demo-${createdAt}-${text.slice(0, 3)}`, text, createdAt }; }
  const DEMO = {
    version: 1,
    selectedSprintId: 'sprint-01',
    sprints: [
      {
        id: 'sprint-01', name: 'Sprint 01 — Planejamento', status: 'Em andamento',
        goal: 'Compreender o cenário da clínica e transformar os requisitos em um plano de trabalho.',
        start: '2026-03-02', end: '2026-03-13',
        notes: {
          results: 'Requisitos iniciais organizados e quadro de trabalho preparado para a equipe fictícia.',
          challenges: 'Detalhar os critérios de aceite sem perder de vista o escopo da atividade.',
          positives: 'A divisão das tarefas facilitou a visualização das prioridades.',
          improvements: 'Revisar riscos e estimativas com antecedência na próxima sprint.'
        },
        tasks: [
          { id: 't-01', title: 'Planejar testes de aceitação', description: 'Definir cenários para validar as entregas de cada etapa.', status: 'Backlog', due: '2026-03-13', category: 'Qualidade', checklist: [check('c-01', 'Identificar cenários de borda', false), check('c-02', 'Revisar critérios de aceite', false)], comments: [comment('Listar casos de erro e lista vazia.', '2026-03-05T12:00:00Z')] },
          { id: 't-02', title: 'Detalhar critérios de aceite', description: 'Descrever como verificar as funcionalidades obrigatórias.', status: 'Sprint Atual', due: '2026-03-11', category: 'Requisitos', checklist: [check('c-03', 'Registrar requisitos funcionais', true), check('c-04', 'Revisar critérios com a equipe', false)], comments: [] },
          { id: 't-03', title: 'Modelar fluxos de consulta', description: 'Definir atores, interações e dependências do sistema.', status: 'Em Progresso', due: '2026-03-12', category: 'Modelagem', checklist: [check('c-05', 'Identificar atores', true), check('c-06', 'Desenhar casos de uso', false)], comments: [comment('Representar as inclusões obrigatórias.', '2026-03-09T14:30:00Z')] },
          { id: 't-04', title: 'Levantar os requisitos', description: 'Separar os cinco passos e suas entregas.', status: 'Concluído', due: '2026-03-04', category: 'Planejamento', checklist: [check('c-07', 'Ler a atividade', true), check('c-08', 'Listar entregáveis', true)], comments: [comment('Escopo inicial consolidado.', '2026-03-04T13:00:00Z')] },
          { id: 't-05', title: 'Montar o quadro da sprint', description: 'Organizar as atividades nas quatro listas de acompanhamento.', status: 'Concluído', due: '2026-03-06', category: 'Gestão ágil', checklist: [check('c-09', 'Criar listas de status', true), check('c-10', 'Distribuir tarefas', true)], comments: [] }
        ]
      },
      {
        id: 'sprint-02', name: 'Sprint 02 — Desenvolvimento', status: 'Em andamento',
        goal: 'Construir as soluções e validar os cálculos e as entregas do projeto.',
        start: '2026-03-16', end: '2026-03-27',
        notes: {
          results: 'Protótipo de cadastro elaborado e regras de atendimento organizadas para verificação.',
          challenges: 'Conferir todas as combinações e os casos de entrada inválida.',
          positives: 'As verificações foram divididas em pequenas tarefas independentes.',
          improvements: 'Automatizar mais cenários antes da apresentação final.'
        },
        tasks: [
          { id: 't-06', title: 'Revisar a apresentação final', description: 'Conferir documentação e impressão de todos os passos.', status: 'Backlog', due: '2026-03-27', category: 'Entrega', checklist: [check('c-11', 'Revisar referências', false), check('c-12', 'Conferir versão para impressão', false)], comments: [] },
          { id: 't-07', title: 'Validar tabelas-verdade', description: 'Conferir as 16 combinações para cada modalidade.', status: 'Sprint Atual', due: '2026-03-23', category: 'Lógica', checklist: [check('c-13', 'Gerar combinações', true), check('c-14', 'Revisar contagem', false)], comments: [comment('Verificar o caso sem agendamento e sem pagamento.', '2026-03-20T12:00:00Z')] },
          { id: 't-08', title: 'Construir diagrama de casos de uso', description: 'Associar atores e relacionamentos include.', status: 'Em Progresso', due: '2026-03-25', category: 'Modelagem', checklist: [check('c-15', 'Desenhar limite do sistema', true), check('c-16', 'Revisar setas include', false)], comments: [] },
          { id: 't-09', title: 'Criar cadastro de pacientes', description: 'Implementar menu e operações no terminal usando Python.', status: 'Concluído', due: '2026-03-20', category: 'Python', checklist: [check('c-17', 'Criar menu em loop', true), check('c-18', 'Tratar entradas inválidas', true)], comments: [comment('Dados mantidos somente em memória.', '2026-03-20T15:20:00Z')] }
        ]
      }
    ]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function validStoredState(value) {
    return value && value.version === 1 && Array.isArray(value.sprints) && value.sprints.length > 0 && value.sprints.every(s =>
      s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.goal === 'string' &&
      C.durationDays(s.start, s.end) !== null && Array.isArray(s.tasks) && s.tasks.every(t =>
        t && typeof t.id === 'string' && typeof t.title === 'string' && C.STATUS.includes(t.status) && Array.isArray(t.checklist) && Array.isArray(t.comments)));
  }
  function loadState() {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validStoredState(parsed)) {
          parsed.sprints.forEach(sprint => { if (!SPRINT_STAGES.includes(sprint.status)) sprint.status = 'Planejada'; });
          if (!parsed.sprints.some(s => s.id === parsed.selectedSprintId)) parsed.selectedSprintId = parsed.sprints[0].id;
          return parsed;
        }
      }
    } catch (error) { storageAvailable = false; }
    return clone(DEMO);
  }
  let state = loadState();

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 3600);
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageAvailable = true;
      return true;
    } catch (error) {
      storageAvailable = false;
      toast('Não foi possível salvar no navegador. As alterações durarão somente até fechar a página.');
      return false;
    }
  }
  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function selectedSprint() { return state.sprints.find(s => s.id === state.selectedSprintId) || state.sprints[0]; }
  function findTask(sprint, taskId) { return sprint && sprint.tasks.find(t => t.id === taskId); }
  function displayCount(number, singular, plural) { return `${number} ${number === 1 ? singular : plural}`; }
  function svgIcon(id) { return `<svg class="icon" aria-hidden="true"><use href="#i-${id}"></use></svg>`; }
  function success(message) { if (storageAvailable) toast(message); }

  function currentHash() {
    try { return decodeURIComponent(location.hash.slice(1)); } catch (error) { return ''; }
  }
  function activateRoute() {
    const hash = currentHash();
    const overviewAnchor = hash === 'sobre-projeto' || hash === 'passos';
    const route = Object.prototype.hasOwnProperty.call(ROUTES, hash) ? hash : 'inicio';
    $$('.view').forEach(view => view.classList.toggle('active', view.id === route));
    $$('[data-route]').forEach(link => {
      const active = link.dataset.route === route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    $('#current-page').textContent = ROUTES[route];
    document.title = `${ROUTES[route]} | Clínica Vida+`;
    if (overviewAnchor) requestAnimationFrame(() => document.getElementById(hash).scrollIntoView());
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }
  window.addEventListener('hashchange', activateRoute);
  // Ao abrir um link direto, o navegador pode rolar para o ID depois da
  // inicialização. Reposiciona após o carregamento para não esconder o título.
  window.addEventListener('load', () => {
    const hash = currentHash();
    if (hash !== 'sobre-projeto' && hash !== 'passos') {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
  }, { once: true });

  function statusOptions(selected) {
    return C.STATUS.map(status => `<option value="${escape(status)}"${status === selected ? ' selected' : ''}>${escape(status)}</option>`).join('');
  }
  function sprintOptions(selected) {
    return state.sprints.map(sprint => `<option value="${escape(sprint.id)}"${sprint.id === selected ? ' selected' : ''}>${escape(sprint.name)}</option>`).join('');
  }
  function taskMarkup(task) {
    const checks = task.checklist || [];
    const complete = checks.filter(item => item.done).length;
    const commentCount = (task.comments || []).length;
    const category = task.category && task.category.trim() ? task.category : 'Geral';
    return `<article class="task-card" draggable="true" data-task-id="${escape(task.id)}" aria-label="Tarefa: ${escape(task.title)}">
      <div class="task-topline"><span class="task-category">${escape(category)}</span><button class="task-edit" type="button" data-edit-task="${escape(task.id)}" aria-label="Editar tarefa ${escape(task.title)}">${svgIcon('edit')}</button></div>
      <button class="task-title" type="button" data-edit-task="${escape(task.id)}">${escape(task.title)}</button>
      ${task.description ? `<p class="task-description">${escape(task.description)}</p>` : ''}
      <div class="task-meta"><span>${svgIcon('calendar')} ${task.due ? escape(C.formatDate(task.due)) : 'Sem prazo'}</span><span>${svgIcon('check-circle')} ${complete}/${checks.length}</span><span>${svgIcon('chat')} ${commentCount}</span></div>
      <label class="task-move-label">Mover para <select data-move-task="${escape(task.id)}" aria-label="Mover ${escape(task.title)} para outro status">${statusOptions(task.status)}</select></label>
    </article>`;
  }
  function renderBoard() {
    const sprint = selectedSprint();
    const metrics = C.sprintMetrics(sprint);
    $('#sprint-select').innerHTML = sprintOptions(sprint.id);
    $('#sprint-goal').textContent = sprint.goal;
    $('#sprint-stage').textContent = sprint.status;
    $('#sprint-period').textContent = `${C.formatDate(sprint.start)} a ${C.formatDate(sprint.end)}`;
    const days = C.durationDays(sprint.start, sprint.end);
    $('#sprint-duration').textContent = `${days} ${days === 1 ? 'dia corrido' : 'dias corridos'} (inclusive)`;
    $('#sprint-percent').textContent = `${metrics.percent}%`;
    $('#sprint-progress').setAttribute('aria-valuenow', String(metrics.percent));
    $('#sprint-progress span').style.width = `${metrics.percent}%`;
    $('#sprint-progress-caption').textContent = `${metrics.done} de ${metrics.total} concluídas`;
    $('#sprint-checklist-caption').textContent = `${metrics.checklistDone}/${metrics.checklistTotal} itens do checklist`;
    $('#task-total').textContent = displayCount(metrics.total, 'tarefa', 'tarefas');
    $('#kanban-board').innerHTML = C.STATUS.map(status => {
      const tasks = sprint.tasks.filter(task => task.status === status);
      return `<div class="board-column" data-column-status="${escape(status)}"><div class="column-heading" data-status="${escape(status)}"><span class="column-dot"></span><strong>${escape(status)}</strong><span class="column-count">${tasks.length}</span></div><div class="task-list">${tasks.length ? tasks.map(taskMarkup).join('') : '<div class="empty-column">Nenhuma tarefa por aqui.</div>'}</div></div>`;
    }).join('');
    const notice = $('.board-bottom p');
    notice.innerHTML = storageAvailable
      ? '<span class="status-dot"></span> Alterações salvas apenas neste navegador. Use dados fictícios.'
      : '<span class="status-dot"></span> Armazenamento indisponível: as alterações durarão somente nesta página.';
    renderPrintSprints();
  }
  function renderPrintSprints() {
    $('#print-all-sprints').innerHTML = `<h2>Relatórios de todas as sprints</h2>${state.sprints.map(s => `<article class="print-sprint"><pre>${escape(C.sprintReport(s))}</pre></article>`).join('')}`;
  }
  function moveTask(taskId, newStatus) {
    if (!C.STATUS.includes(newStatus)) return;
    const task = findTask(selectedSprint(), taskId);
    if (!task || task.status === newStatus) return;
    task.status = newStatus;
    save(); renderBoard(); success(`Tarefa movida para ${newStatus}.`);
  }

  $('#sprint-select').addEventListener('change', event => { state.selectedSprintId = event.target.value; save(); renderBoard(); });
  const board = $('#kanban-board');
  board.addEventListener('click', event => {
    const trigger = event.target.closest('[data-edit-task]');
    if (trigger) openTask(trigger.dataset.editTask);
  });
  board.addEventListener('change', event => {
    const select = event.target.closest('[data-move-task]');
    if (select) moveTask(select.dataset.moveTask, select.value);
  });
  board.addEventListener('dragstart', event => {
    const card = event.target.closest('.task-card');
    if (!card || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', card.dataset.taskId);
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  board.addEventListener('dragend', () => { $$('.dragging,.drag-over', board).forEach(node => node.classList.remove('dragging', 'drag-over')); });
  board.addEventListener('dragover', event => {
    const column = event.target.closest('.board-column');
    if (!column) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    column.classList.add('drag-over');
  });
  board.addEventListener('dragleave', event => {
    const column = event.target.closest('.board-column');
    if (column && !column.contains(event.relatedTarget)) column.classList.remove('drag-over');
  });
  board.addEventListener('drop', event => {
    const column = event.target.closest('.board-column');
    if (!column) return;
    event.preventDefault();
    column.classList.remove('drag-over');
    const id = event.dataTransfer && event.dataTransfer.getData('text/plain');
    if (id) moveTask(id, column.dataset.columnStatus);
  });
  $('#reset-demo').addEventListener('click', () => {
    if (!window.confirm('Restaurar os dados demonstrativos? Todas as sprints e tarefas alteradas neste navegador serão substituídas.')) return;
    state = clone(DEMO); save(); renderBoard(); success('Dados demonstrativos restaurados.');
  });

  function localDate(offsetDays) {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offsetDays);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function updateDateHint() {
    const start = $('#sprint-start-input').value, end = $('#sprint-end-input').value;
    const days = C.durationDays(start, end);
    $('#sprint-date-hint').textContent = days === null
      ? 'Informe datas válidas; o término não pode ser anterior ao início.'
      : `Duração: ${days} ${days === 1 ? 'dia corrido' : 'dias corridos'}, incluindo início e término.`;
  }
  function openSprint(id) {
    const sprint = id ? state.sprints.find(item => item.id === id) : null;
    editingSprintId = sprint ? sprint.id : null;
    $('#sprint-dialog-title').textContent = sprint ? 'Editar sprint' : 'Nova sprint';
    $('#sprint-name-input').value = sprint ? sprint.name : '';
    $('#sprint-goal-input').value = sprint ? sprint.goal : '';
    $('#sprint-stage-input').value = sprint ? sprint.status : 'Planejada';
    $('#sprint-start-input').value = sprint ? sprint.start : localDate(0);
    $('#sprint-end-input').value = sprint ? sprint.end : localDate(13);
    $('#sprint-results-input').value = sprint ? (sprint.notes?.results || '') : '';
    $('#sprint-challenges-input').value = sprint ? (sprint.notes?.challenges || '') : '';
    $('#sprint-positives-input').value = sprint ? (sprint.notes?.positives || '') : '';
    $('#sprint-improvements-input').value = sprint ? (sprint.notes?.improvements || '') : '';
    $('#sprint-error').textContent = '';
    $('#delete-sprint').hidden = !sprint;
    updateDateHint();
    $('#sprint-dialog').showModal();
    $('#sprint-name-input').focus();
  }
  $('#new-sprint').addEventListener('click', () => openSprint(null));
  $('#edit-sprint').addEventListener('click', () => openSprint(selectedSprint().id));
  $('#sprint-start-input').addEventListener('input', updateDateHint);
  $('#sprint-end-input').addEventListener('input', updateDateHint);
  $('#sprint-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#sprint-name-input').value.trim();
    const goal = $('#sprint-goal-input').value.trim();
    const status = $('#sprint-stage-input').value;
    const start = $('#sprint-start-input').value, end = $('#sprint-end-input').value;
    if (!name || !goal || !SPRINT_STAGES.includes(status)) { $('#sprint-error').textContent = 'Preencha o nome, o objetivo e o status da sprint.'; return; }
    if (C.durationDays(start, end) === null) { $('#sprint-error').textContent = 'Informe datas válidas e um término igual ou posterior ao início.'; return; }
    const notes = { results: $('#sprint-results-input').value.trim(), challenges: $('#sprint-challenges-input').value.trim(), positives: $('#sprint-positives-input').value.trim(), improvements: $('#sprint-improvements-input').value.trim() };
    if (editingSprintId) {
      const sprint = state.sprints.find(s => s.id === editingSprintId);
      if (!sprint) return;
      Object.assign(sprint, { name, goal, status, start, end, notes });
      state.selectedSprintId = sprint.id;
    } else {
      const sprint = { id: uid(), name, goal, status, start, end, notes, tasks: [] };
      state.sprints.push(sprint); state.selectedSprintId = sprint.id;
    }
    save(); renderBoard(); $('#sprint-dialog').close(); success('Sprint salva com sucesso.');
  });
  $('#delete-sprint').addEventListener('click', () => {
    const sprint = state.sprints.find(s => s.id === editingSprintId);
    if (!sprint) return;
    if (state.sprints.length === 1) { $('#sprint-error').textContent = 'Mantenha pelo menos uma sprint no quadro.'; return; }
    if (!window.confirm(`Excluir a sprint “${sprint.name}” e suas ${sprint.tasks.length} tarefa(s)? Esta ação não pode ser desfeita.`)) return;
    state.sprints = state.sprints.filter(s => s.id !== sprint.id); state.selectedSprintId = state.sprints[0].id;
    save(); renderBoard(); $('#sprint-dialog').close(); success('Sprint excluída.');
  });

  function renderTaskDraft() {
    $('#checklist-editor').innerHTML = taskDraft.checklist.length ? taskDraft.checklist.map(item => `<div class="editor-item"><input type="checkbox" data-check-id="${escape(item.id)}" aria-label="Concluir ${escape(item.text)}"${item.done ? ' checked' : ''}><span class="editor-content">${escape(item.text)}</span><button type="button" class="remove-item" data-remove-check="${escape(item.id)}" aria-label="Excluir item ${escape(item.text)}">${svgIcon('trash')}</button></div>`).join('') : '<p class="editor-empty">Nenhum item adicionado.</p>';
    $('#comments-editor').innerHTML = taskDraft.comments.length ? taskDraft.comments.map(item => `<div class="editor-item"><div class="editor-content">${escape(item.text)}<small>${escape(C.formatDateTime(item.createdAt))}</small></div><button type="button" class="remove-item" data-remove-comment="${escape(item.id)}" aria-label="Excluir comentário">${svgIcon('trash')}</button></div>`).join('') : '<p class="editor-empty">Nenhum comentário adicionado.</p>';
  }
  function openTask(id) {
    const sprint = selectedSprint();
    const task = id ? findTask(sprint, id) : null;
    taskOriginSprintId = task ? sprint.id : null;
    taskDraft = task ? clone(task) : { id: uid(), title: '', description: '', status: 'Backlog', due: '', category: '', checklist: [], comments: [] };
    $('#task-dialog-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
    $('#task-title-input').value = taskDraft.title;
    $('#task-description-input').value = taskDraft.description || '';
    $('#task-sprint-input').innerHTML = sprintOptions(sprint.id);
    $('#task-status-input').innerHTML = statusOptions(taskDraft.status);
    $('#task-due-input').value = taskDraft.due || '';
    $('#task-category-input').value = taskDraft.category || '';
    $('#checklist-input').value = ''; $('#comment-input').value = '';
    $('#delete-task').hidden = !task;
    renderTaskDraft();
    $('#task-dialog').showModal();
    $('#task-title-input').focus();
  }
  $('#new-task').addEventListener('click', () => openTask(null));
  function addChecklist() {
    const input = $('#checklist-input'), text = input.value.trim();
    if (!text) { input.focus(); return; }
    taskDraft.checklist.push({ id: uid(), text, done: false }); input.value = ''; renderTaskDraft(); input.focus();
  }
  function addComment() {
    const input = $('#comment-input'), text = input.value.trim();
    if (!text) { input.focus(); return; }
    taskDraft.comments.push({ id: uid(), text, createdAt: new Date().toISOString() }); input.value = ''; renderTaskDraft(); input.focus();
  }
  $('#add-checklist').addEventListener('click', addChecklist);
  $('#add-comment').addEventListener('click', addComment);
  [['#checklist-input', addChecklist], ['#comment-input', addComment]].forEach(([selector, add]) => $(selector).addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }));
  $('#checklist-editor').addEventListener('change', event => {
    const input = event.target.closest('[data-check-id]');
    if (!input) return;
    const item = taskDraft.checklist.find(entry => entry.id === input.dataset.checkId);
    if (item) item.done = input.checked;
  });
  $('#checklist-editor').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-check]');
    if (!button) return;
    taskDraft.checklist = taskDraft.checklist.filter(item => item.id !== button.dataset.removeCheck); renderTaskDraft();
  });
  $('#comments-editor').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-comment]');
    if (!button) return;
    taskDraft.comments = taskDraft.comments.filter(item => item.id !== button.dataset.removeComment); renderTaskDraft();
  });
  $('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('#task-title-input').value.trim();
    const titleInput = $('#task-title-input');
    if (!title) { titleInput.setCustomValidity('Informe um título para a tarefa.'); titleInput.reportValidity(); titleInput.setCustomValidity(''); return; }
    const target = state.sprints.find(s => s.id === $('#task-sprint-input').value);
    const status = $('#task-status-input').value;
    if (!target || !C.STATUS.includes(status)) return;
    Object.assign(taskDraft, { title, description: $('#task-description-input').value.trim(), status, due: $('#task-due-input').value, category: $('#task-category-input').value.trim() });
    if (taskOriginSprintId) {
      const old = state.sprints.find(s => s.id === taskOriginSprintId);
      if (old) old.tasks = old.tasks.filter(task => task.id !== taskDraft.id);
    }
    target.tasks.push(taskDraft); state.selectedSprintId = target.id;
    save(); renderBoard(); $('#task-dialog').close(); success('Tarefa salva com sucesso.');
  });
  $('#delete-task').addEventListener('click', () => {
    if (!taskOriginSprintId || !taskDraft) return;
    if (!window.confirm(`Excluir a tarefa “${taskDraft.title}”? Esta ação não pode ser desfeita.`)) return;
    const sprint = state.sprints.find(s => s.id === taskOriginSprintId);
    if (sprint) sprint.tasks = sprint.tasks.filter(task => task.id !== taskDraft.id);
    save(); renderBoard(); $('#task-dialog').close(); success('Tarefa excluída.');
  });
  $$('.close-modal').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; link.style.display = 'none'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function slug(text) {
    return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sprint';
  }
  $('#open-sprint-report').addEventListener('click', () => {
    $('#report-output').textContent = C.sprintReport(selectedSprint());
    $('#report-dialog').showModal();
  });
  $('#download-sprint-report').addEventListener('click', () => {
    downloadFile(`relatorio-${slug(selectedSprint().name)}.txt`, C.sprintReport(selectedSprint()), 'text/plain;charset=utf-8');
    toast('Relatório da sprint exportado.');
  });
  $('#print-sprint-report').addEventListener('click', () => {
    $('#print-report-content').textContent = C.sprintReport(selectedSprint());
    document.body.classList.add('printing-report');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-report'));
  $('#print-project').addEventListener('click', () => {
    renderPrintSprints(); document.body.classList.remove('printing-report'); window.print();
  });
  $('#export-project').addEventListener('click', () => {
    downloadFile('clinica-vida-mais-relatorio.md', C.projectMarkdown(state.sprints, window.PYTHON_SOURCE), 'text/markdown;charset=utf-8');
    toast('Relatório do projeto exportado em Markdown.');
  });
  $('#download-python').addEventListener('click', () => {
    downloadFile('clinica_vida.py', window.PYTHON_SOURCE, 'text/x-python;charset=utf-8');
    toast('Arquivo Python preparado para download.');
  });
  $('#download-diagram').addEventListener('click', () => {
    downloadFile('diagrama-casos-de-uso.svg', '<?xml version="1.0" encoding="UTF-8"?>\n' + $('#use-case-svg').outerHTML, 'image/svg+xml;charset=utf-8');
    toast('Diagrama SVG preparado para download.');
  });
  $('#python-source').textContent = window.PYTHON_SOURCE;
  $('#toggle-source').addEventListener('click', () => {
    const panel = $('#source-panel'); panel.hidden = !panel.hidden;
    $('#toggle-source').setAttribute('aria-expanded', String(!panel.hidden));
    $('#toggle-source').innerHTML = `${panel.hidden ? 'Visualizar código' : 'Ocultar código'} ${svgIcon('chevron')}`;
  });

  const rows = C.truthRows();
  function tableRow(row, fields, resultKey) {
    return `<tr data-combination="${[row.a,row.b,row.c,row.d].map(C.vf).join('')}">${fields.map(field => `<td${field === resultKey ? ` class="${row[field] ? 'result-true' : 'result-false'}"` : ''}>${C.vf(row[field])}</td>`).join('')}</tr>`;
  }
  function renderTruthTables() {
    $('#normal-table-body').innerHTML = rows.map(row => tableRow(row, ['a','b','c','d','abc','bcd','normal'], 'normal')).join('');
    $('#emergency-table-body').innerHTML = rows.map(row => tableRow(row, ['a','b','c','d','borD','emergencia'], 'emergencia')).join('');
    const n = rows.filter(row => row.normal).length, e = rows.filter(row => row.emergencia).length;
    $('#normal-count').textContent = n; $('#emergency-count').textContent = e;
    $('#normal-table-count').textContent = `${n} liberadas`; $('#emergency-table-count').textContent = `${e} liberadas`;
    $('#normal-table-footer').textContent = `${n} situações liberadas`; $('#emergency-table-footer').textContent = `${e} situações liberadas`;
  }
  function updateScenario() {
    const v = {};
    $$('[data-variable]').forEach(input => { v[input.dataset.variable] = input.checked; $(`[data-var-value="${input.dataset.variable}"]`).textContent = C.vf(input.checked); });
    const normal = C.normal(v.a, v.b, v.c, v.d), emergency = C.emergencia(v.a, v.b, v.c, v.d);
    const n = $('#scenario-normal'), e = $('#scenario-emergency');
    n.textContent = normal ? 'Liberada' : 'Não liberada'; n.classList.toggle('positive', normal);
    e.textContent = emergency ? 'Liberada' : 'Não liberada'; e.classList.toggle('positive', emergency);
    $('#scenario-normal-explanation').textContent = `(A ∧ B ∧ C) = ${C.vf(v.a && v.b && v.c)} · (B ∧ C ∧ D) = ${C.vf(v.b && v.c && v.d)}`;
    $('#scenario-emergency-explanation').textContent = `C = ${C.vf(v.c)} · (B ∨ D) = ${C.vf(v.b || v.d)}`;
    const combination = [v.a,v.b,v.c,v.d].map(C.vf).join('');
    $$('.truth-card tbody tr').forEach(tr => tr.classList.toggle('highlighted', tr.dataset.combination === combination));
  }
  $$('[data-variable]').forEach(input => input.addEventListener('change', updateScenario));

  const INITIAL_QUEUE = [
    { name: 'Paciente A', cpf: '000.000.000-00' },
    { name: 'Paciente B', cpf: '111.111.111-11' },
    { name: 'Paciente C', cpf: '222.222.222-22' }
  ];
  let queue = clone(INITIAL_QUEUE), lastServed = null;
  function renderQueue() {
    $('#queue-count').textContent = displayCount(queue.length, 'na fila', 'na fila');
    $('#queue-items').innerHTML = queue.length ? queue.map((person, index) => `<div class="queue-item"><span class="queue-index">0${index + 1}</span><div class="queue-person"><strong>${escape(person.name)}</strong><span>CPF ${escape(person.cpf)}</span></div>${index === 0 ? '<span class="queue-first">PRÓXIMO</span>' : ''}</div>`).join('') : '<div class="queue-empty">A fila está vazia.</div>';
    if (lastServed) $('#queue-feedback').textContent = `${lastServed.name} foi encaminhado(a). ${queue.length ? 'Permanecem: ' + queue.map(person => person.name).join(' → ') + '.' : 'Não há mais pacientes na fila.'}`;
    else $('#queue-feedback').textContent = 'Paciente A será atendido primeiro.';
    $('#queue-serve').disabled = queue.length === 0;
  }
  $('#queue-serve').addEventListener('click', () => { if (queue.length) { lastServed = queue.shift(); renderQueue(); } });
  $('#queue-reset').addEventListener('click', () => { queue = clone(INITIAL_QUEUE); lastServed = null; renderQueue(); });

  $('#pseudocode').textContent = C.PSEUDOCODE;
  renderBoard(); renderTruthTables(); updateScenario(); renderQueue();
  document.documentElement.classList.add('js-ready');
  activateRoute();
})();
