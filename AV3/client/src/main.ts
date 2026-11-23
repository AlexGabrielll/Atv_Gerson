import './style.css';

type JsonRecord = Record<string, unknown>;

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento da interface ausente: ${id}`);
  return element as T;
};

const value = (id: string) => (byId<HTMLInputElement | HTMLSelectElement>(id).value);
const notice = byId<HTMLDivElement>('notice');
const analyticsOutput = byId<HTMLPreElement>('analytics-output');
const reportOutput = byId<HTMLPreElement>('report-output');

async function request<T>(url: string, method = 'GET', body?: JsonRecord, admin = false): Promise<T> {
  const headers: Record<string, string> = {};
  const apiKey = value('api-key').trim();
  const adminToken = value('admin-token').trim();
  if (apiKey) headers['x-api-key'] = apiKey;
  if (admin) headers['x-admin-token'] = adminToken;
  if (body) headers['content-type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const result = contentType.includes('application/json')
    ? await response.json() as T
    : await response.text() as T;
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result
      ? String((result as { error: unknown }).error)
      : `Falha HTTP ${response.status}`;
    throw new Error(message);
  }
  return result;
}

function showNotice(message: string, error = false): void {
  notice.textContent = message;
  notice.classList.toggle('error', error);
}

function showJson(target: HTMLPreElement, result: unknown): void {
  target.textContent = JSON.stringify(result, null, 2);
  target.classList.remove('empty');
}

function handleForm(id: string, action: (event: SubmitEvent) => Promise<void>): void {
  byId<HTMLFormElement>(id).addEventListener('submit', (event) => {
    event.preventDefault();
    void action(event as SubmitEvent).catch((error: unknown) => {
      showNotice(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', true);
    });
  });
}

handleForm('key-form', async () => {
  const selectedScopes = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="scope"]:checked'))
    .map((checkbox) => checkbox.value);
  const created = await request<{ id: string; key: string; warning: string }>(
    '/api/v1/internal/api-keys',
    'POST',
    {
      organizationId: value('organization-id').trim(),
      label: value('key-label').trim(),
      scopes: selectedScopes
    },
    true
  );
  byId<HTMLInputElement>('api-key').value = created.key;
  byId<HTMLInputElement>('api-key-id').value = created.id;
  showNotice(`${created.warning} A chave foi ativada nesta sessão.`);
});

byId<HTMLButtonElement>('revoke-key').addEventListener('click', () => {
  const id = value('api-key-id').trim();
  if (!id) {
    showNotice('Informe o ID da chave que deseja revogar.', true);
    return;
  }
  void request(`/api/v1/internal/api-keys/${encodeURIComponent(id)}`, 'DELETE', undefined, true)
    .then(() => {
      byId<HTMLInputElement>('api-key').value = '';
      showNotice('Chave revogada. As requisições com essa chave serão recusadas.');
    })
    .catch((error: unknown) => showNotice(error instanceof Error ? error.message : 'Falha ao revogar chave.', true));
});

handleForm('lot-form', async () => {
  const result = await request<{
    code: string;
    equipment: Array<{ id: string }>;
  }>('/api/v1/public/lots', 'POST', {
    code: value('lot-code').trim(),
    operatorName: value('operator').trim() || undefined,
    equipment: {
      category: value('category').trim(),
      brand: value('brand').trim(),
      model: value('model').trim(),
      physicalCondition: value('condition'),
      estimatedRecoveryValue: Number(value('recovery-value')),
      ageMonths: Number(value('age-months'))
    }
  });
  byId<HTMLInputElement>('status-code').value = result.code;
  byId<HTMLInputElement>('tracking-code').value = result.code;
  byId<HTMLInputElement>('condition-code').value = result.code;
  if (result.equipment[0]) byId<HTMLInputElement>('equipment-id').value = result.equipment[0].id;
  showNotice(`Lote ${result.code} cadastrado. Atualize a etapa ou consulte a rastreabilidade.`);
});

handleForm('status-form', async () => {
  const code = value('status-code').trim();
  const result = await request(
    `/api/v1/public/lots/${encodeURIComponent(code)}/status`,
    'PATCH',
    { status: value('lot-status'), operatorName: value('status-operator').trim() || undefined }
  );
  showNotice(`Etapa do lote ${code} atualizada.`);
  showJson(analyticsOutput, result);
});

handleForm('tracking-form', async () => {
  const code = value('tracking-code').trim();
  const result = await request(`/api/v1/public/lots/${encodeURIComponent(code)}/tracking`);
  showJson(analyticsOutput, result);
  showNotice(`Rastreabilidade do lote ${code} carregada.`);
});

handleForm('condition-form', async () => {
  const code = value('condition-code').trim();
  const equipmentId = value('equipment-id').trim();
  const result = await request(
    `/api/v1/public/lots/${encodeURIComponent(code)}/equipment/${encodeURIComponent(equipmentId)}/condition`,
    'POST',
    { ageMonths: Number(value('condition-age')), physicalCondition: value('condition-value') }
  );
  showJson(analyticsOutput, result);
  showNotice('Observação histórica adicionada; a previsão de vida útil passa a considerar este dado.');
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-analytics]')) {
  button.addEventListener('click', () => {
    const type = button.dataset.analytics;
    if (!type) return;
    void request(`/api/v1/public/analytics/${type}`)
      .then((result) => {
        showJson(analyticsOutput, result);
        showNotice('Análise atualizada.');
      })
      .catch((error: unknown) => showNotice(error instanceof Error ? error.message : 'Falha na análise.', true));
  });
}

async function pollReport(reportId: string): Promise<void> {
  const statusElement = byId<HTMLDivElement>('report-status');
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const report = await request<{
      status: string;
      result: unknown;
      error: string | null;
    }>(`/api/v1/public/reports/${encodeURIComponent(reportId)}`);
    statusElement.textContent = `Relatório ${reportId}: ${report.status}`;
    if (report.status === 'COMPLETED') {
      showJson(reportOutput, report.result);
      showNotice('Relatório pronto para consulta.');
      return;
    }
    if (report.status === 'FAILED') throw new Error(report.error ?? 'O processamento do relatório falhou.');
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }
  statusElement.textContent = `Relatório ${reportId}: ainda em processamento. Consulte novamente mais tarde.`;
}

handleForm('report-form', async () => {
  reportOutput.textContent = '';
  reportOutput.classList.add('empty');
  const statusElement = byId<HTMLDivElement>('report-status');
  let result: { reportId: string; status: string };
  try {
    result = await request<{ reportId: string; status: string }>(
      '/api/v1/public/reports',
      'POST',
      { type: value('report-type') }
    );
  } catch (error) {
    statusElement.textContent = error instanceof Error ? `Falha ao enfileirar: ${error.message}` : 'Falha ao enfileirar relatório.';
    throw error;
  }
  statusElement.textContent = `Relatório ${result.reportId}: ${result.status}. Aguardando worker...`;
  showNotice('Relatório enfileirado. O painel atualizará o status automaticamente.');
  await pollReport(result.reportId);
});

void fetch('/health')
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('Backend indisponível.')))
  .then(() => {
    if (notice.textContent?.startsWith('Conecte')) showNotice('Backend conectado. Informe uma chave ou gere uma chave de parceiro.');
  })
  .catch(() => showNotice('Não foi possível conectar ao backend.', true));
