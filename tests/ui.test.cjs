/* Teste opcional de ponta a ponta. Requer Playwright e Chromium; ver README. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000/';

async function downloadByClick(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await pending;
  return { name: download.suggestedFilename(), data: await fs.readFile(await download.path(), 'utf8') };
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(BASE, { waitUntil: 'load' });
    assert.equal(await page.locator('.view.active').getAttribute('id'), 'inicio');
    assert.equal(await page.locator('#inicio .step-card').count(), 5);
    const direct = await context.newPage();
    await direct.goto(BASE + '#casos', { waitUntil: 'load' });
    await direct.waitForFunction(() => window.scrollY === 0);
    assert.equal(await direct.locator('.view.active').getAttribute('id'), 'casos');
    await direct.close();
    for (const route of ['sprints', 'python', 'logica', 'fila', 'casos', 'inicio']) {
      await page.locator(`[data-route="${route}"]`).click();
      await page.waitForFunction(value => document.querySelector('.view.active')?.id === value, route);
      assert.equal(await page.locator('.view.active').count(), 1);
    }

    // Quadro: movimentação acessível, arrastar e persistência entre recargas.
    await page.locator('[data-route="sprints"]').click();
    assert.equal(await page.locator('#sprint-percent').innerText(), '40%');
    assert.equal(await page.locator('#sprint-stage').innerText(), 'Em andamento');
    await page.locator('[data-move-task="t-01"]').selectOption({ label: 'Concluído' });
    assert.equal(await page.locator('#sprint-percent').innerText(), '60%');
    assert.equal(await page.locator('[data-column-status="Concluído"] [data-task-id="t-01"]').count(), 1);
    await page.locator('[data-task-id="t-02"]').dragTo(page.locator('[data-column-status="Em Progresso"]'));
    assert.equal(await page.locator('[data-column-status="Em Progresso"] [data-task-id="t-02"]').count(), 1);
    await page.reload();
    assert.equal(await page.locator('#sprint-percent').innerText(), '60%');
    assert.equal(await page.locator('[data-column-status="Concluído"] [data-task-id="t-01"]').count(), 1);

    // Edição real: checklist e comentário são mantidos junto à tarefa.
    await page.locator('[data-edit-task="t-02"]').first().click();
    await page.locator('#task-title-input').fill('Tarefa <segura>');
    await page.locator('#checklist-input').fill('Verificar o resultado');
    await page.locator('#add-checklist').click();
    await page.locator('#checklist-editor input[type="checkbox"]').last().check();
    await page.locator('#comment-input').fill('Comentário demonstrativo');
    await page.locator('#add-comment').click();
    await page.locator('#task-form button[type="submit"]').click();
    assert.equal(await page.getByRole('button', { name: 'Tarefa <segura>', exact: true }).count(), 1);
    assert.equal(await page.locator('#kanban-board img').count(), 0);
    await page.getByRole('button', { name: 'Tarefa <segura>', exact: true }).click();
    assert.ok(await page.locator('#checklist-editor').innerText().then(x => x.includes('Verificar o resultado')));
    assert.equal(await page.locator('#checklist-editor input[type="checkbox"]').last().isChecked(), true);
    assert.ok(await page.locator('#comments-editor').innerText().then(x => x.includes('Comentário demonstrativo')));
    await page.locator('#task-sprint-input').selectOption('sprint-02');
    await page.locator('#task-form button[type="submit"]').click();
    assert.equal(await page.locator('#sprint-select').inputValue(), 'sprint-02');
    assert.equal(await page.locator('[data-task-id="t-02"]').count(), 1);
    await page.getByRole('button', { name: 'Tarefa <segura>', exact: true }).click();
    await page.locator('#task-sprint-input').selectOption('sprint-01');
    await page.locator('#task-form button[type="submit"]').click();
    assert.equal(await page.locator('#sprint-select').inputValue(), 'sprint-01');

    // Sprint com status próprio, validação de datas e anotações de retrospectiva.
    await page.locator('#new-sprint').click();
    assert.equal(await page.locator('#delete-sprint').isVisible(), false);
    await page.locator('#sprint-name-input').fill('Sprint de teste');
    await page.locator('#sprint-goal-input').fill('Validar o fluxo completo.');
    await page.locator('#sprint-stage-input').selectOption('Concluída');
    await page.locator('#sprint-start-input').fill('2026-04-03');
    await page.locator('#sprint-end-input').fill('2026-04-01');
    await page.locator('#sprint-form button[type="submit"]').click();
    assert.match(await page.locator('#sprint-error').innerText(), /término/);
    await page.locator('#sprint-end-input').fill('2026-04-05');
    assert.match(await page.locator('#sprint-date-hint').innerText(), /3 dias corridos/);
    await page.locator('#sprint-results-input').fill('Entrega verificada.');
    await page.locator('#sprint-challenges-input').fill('Desafio fictício.');
    await page.locator('#sprint-positives-input').fill('Boa colaboração.');
    await page.locator('#sprint-improvements-input').fill('Antecipar testes.');
    await page.locator('#sprint-form button[type="submit"]').click();
    assert.equal(await page.locator('#sprint-stage').innerText(), 'Concluída');
    assert.equal(await page.locator('#sprint-percent').innerText(), '0%');
    assert.match(await page.locator('#sprint-duration').innerText(), /3 dias/);

    await page.locator('#new-task').click();
    assert.equal(await page.locator('#delete-task').isVisible(), false);
    await page.locator('#task-title-input').fill('Conferir entrega');
    await page.locator('#task-description-input').fill('Uma tarefa fictícia.');
    await page.locator('#task-status-input').selectOption('Concluído');
    await page.locator('#task-due-input').fill('2026-04-05');
    await page.locator('#checklist-input').fill('Revisão final');
    await page.locator('#add-checklist').click();
    await page.locator('#checklist-editor input[type="checkbox"]').check();
    await page.locator('#comment-input').fill('Tudo conferido.');
    await page.locator('#add-comment').click();
    await page.locator('#task-form button[type="submit"]').click();
    assert.equal(await page.locator('#sprint-percent').innerText(), '100%');
    await page.reload();
    assert.equal(await page.locator('#sprint-select').inputValue().then(Boolean), true);
    assert.equal(await page.locator('#sprint-percent').innerText(), '100%');

    await page.locator('#open-sprint-report').click();
    const report = await page.locator('#report-output').innerText();
    for (const text of ['Sprint de teste', 'Status da sprint: Concluída', 'Entrega verificada.', 'Desafio fictício.', 'Boa colaboração.', 'Antecipar testes.', 'Revisão final', 'Tudo conferido.', '1 de 1 tarefa(s)']) assert.ok(report.includes(text), text);
    const sprintDownload = await downloadByClick(page, '#download-sprint-report');
    assert.match(sprintDownload.name, /^relatorio-sprint-de-teste\.txt$/);
    assert.ok(sprintDownload.data.includes('Tudo conferido.'));
    await page.evaluate(() => { window.__prints = []; window.print = () => window.__prints.push({ report: document.body.classList.contains('printing-report'), text: document.querySelector('#print-report-content').textContent }); });
    await page.locator('#print-sprint-report').click();
    assert.equal(await page.evaluate(() => window.__prints[0].report), true);
    assert.match(await page.evaluate(() => window.__prints[0].text), /Sprint de teste/);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('#print-report').evaluate(el => getComputedStyle(el).display), 'block');
    assert.equal(await page.locator('#app-shell').evaluate(el => getComputedStyle(el).display), 'none');
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.locator('#report-dialog .close-modal').click();

    const projectDownload = await downloadByClick(page, '#export-project');
    assert.match(projectDownload.name, /\.md$/);
    for (const text of ['Sprint de teste', '## Passo 1', '## Passo 5', 'clinica_vida.py']) assert.ok(projectDownload.data.includes(text), text);
    assert.ok(projectDownload.data.includes('| F | V | V | F | F | F | F |'));
    assert.ok(projectDownload.data.includes('| F | V | V | F | V | V |'));
    assert.equal(projectDownload.data.split('\n').filter(line => /^\| [VF] \| [VF] \| [VF] \| [VF] \|/.test(line)).length, 32);
    await page.locator('#print-project').click();
    assert.equal(await page.evaluate(() => window.__prints[1].report), false);
    await page.emulateMedia({ media: 'print' });
    for (const route of ['inicio','sprints','python','logica','fila','casos']) assert.notEqual(await page.locator(`#${route}`).evaluate(el => getComputedStyle(el).display), 'none');
    assert.equal(await page.locator('#print-all-sprints').evaluate(el => getComputedStyle(el).display), 'block');
    assert.equal(await page.locator('#source-panel').evaluate(el => getComputedStyle(el).display), 'block');
    await page.emulateMedia({ media: 'screen' });

    // O botão baixa exatamente o arquivo Python real, sem simulação JavaScript.
    await page.locator('[data-route="python"]').click();
    await page.locator('#toggle-source').click();
    assert.equal(await page.locator('#toggle-source').getAttribute('aria-expanded'), 'true');
    const pythonDownload = await downloadByClick(page, '#download-python');
    assert.equal(pythonDownload.name, 'clinica_vida.py');
    assert.equal(pythonDownload.data, await fs.readFile(path.join(ROOT, 'clinica_vida.py'), 'utf8'));

    await page.locator('[data-route="logica"]').click();
    assert.equal(await page.locator('#normal-table-body tr').count(), 16);
    assert.equal(await page.locator('#emergency-table-body tr').count(), 16);
    assert.equal(await page.locator('#normal-table-body td.result-true').count(), 3);
    assert.equal(await page.locator('#emergency-table-body td.result-true').count(), 6);
    assert.equal(await page.locator('#scenario-normal').innerText(), 'Não liberada');
    assert.equal(await page.locator('#scenario-emergency').innerText(), 'Liberada');
    assert.equal(await page.locator('#normal-table-body tr.highlighted').getAttribute('data-combination'), 'FVVF');
    await page.locator('[data-variable="a"]').check();
    assert.equal(await page.locator('#scenario-normal').innerText(), 'Liberada');
    assert.equal(await page.locator('#normal-table-body tr.highlighted').getAttribute('data-combination'), 'VVVF');

    await page.locator('[data-route="fila"]').click();
    await page.locator('#queue-serve').click();
    assert.equal(await page.locator('.queue-person strong').allTextContents().then(xs => xs.join(' → ')), 'Paciente B → Paciente C');
    assert.match(await page.locator('#queue-feedback').innerText(), /Paciente A/);
    await page.locator('#queue-reset').click();
    assert.equal(await page.locator('.queue-person').count(), 3);

    await page.locator('[data-route="casos"]').click();
    assert.equal(await page.locator('#use-case-svg ellipse').count(), 7);
    const diagram = await downloadByClick(page, '#download-diagram');
    assert.equal(diagram.name, 'diagrama-casos-de-uso.svg');
    assert.match(diagram.data, /Verificar cadastro/);
    assert.match(diagram.data, /Gerar receita/);

    // Página autossuficiente e layout de celular sem rolagem horizontal no documento.
    const offline = await context.newPage();
    await offline.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil:'load' });
    assert.equal(await offline.locator('.view.active').getAttribute('id'), 'inicio');
    await offline.close();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ['inicio', 'sprints', 'python', 'logica', 'fila', 'casos']) {
        await page.goto(BASE + '#' + route);
        const sizes = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.document <= sizes.viewport + 1, `${route}: página com overflow ${JSON.stringify(sizes)}`);
      }
    }
    assert.deepEqual(errors, []);
    console.log('Teste de interface concluído: navegação, quadro, sprints, relatórios, downloads, impressão, lógica, fila, diagrama e celular.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
