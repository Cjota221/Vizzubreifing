const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
const N8N_WEBHOOK_URL = 'https://cjota-n8n.9eo9b2.easypanel.host/webhook/vizzu-briefing';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
const supabase = window.supabaseClient;

let currentBriefingId = null;
let projectData = null;
let currentStep = 1;
const totalSteps = 6;
let selectedColors = [];
let selectedFiles = [];
const previewUrls = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    currentBriefingId = new URLSearchParams(window.location.search).get('id');
    setupColorPicker();
    setupUploadZone();
    setupMasks();
    document.getElementById('briefingForm').addEventListener('submit', submitBriefing);
    updateBriefingUI(false);

    if (!currentBriefingId) {
        showError();
        return;
    }
    await loadProjectData(currentBriefingId);
});

async function loadProjectData(id) {
    try {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error || !data) throw error || new Error('Projeto não encontrado');
        projectData = data;
        document.getElementById('briefingTitle').textContent = data.client_name ? `Briefing de ${data.client_name}` : 'Seu projeto começa aqui';
        document.title = `Briefing | ${data.client_name || 'VIZZU'}`;
        document.getElementById('loadingBriefing').hidden = true;
        document.getElementById('briefingContent').hidden = false;
    } catch (error) {
        console.error('[VIZZU] Erro ao carregar projeto:', error);
        showError();
    }
}

function showError() {
    document.getElementById('loadingBriefing').hidden = true;
    document.getElementById('briefingContent').hidden = true;
    document.getElementById('errorBriefing').hidden = false;
}

function nextStep() {
    if (!validateCurrentStep() || currentStep >= totalSteps) return;
    currentStep += 1;
    updateBriefingUI();
}

function prevStep() {
    if (currentStep <= 1) return;
    currentStep -= 1;
    updateBriefingUI();
}

function updateBriefingUI(scroll = true) {
    document.querySelectorAll('.form-step').forEach((step) => step.classList.toggle('active', Number(step.dataset.step) === currentStep));
    const percentage = Math.round((currentStep / totalSteps) * 100);
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `Etapa ${currentStep} de ${totalSteps}`;
    document.getElementById('progressPercent').textContent = `${percentage}%`;
    document.querySelectorAll('.step-label').forEach((label, index) => {
        label.classList.toggle('active', index + 1 === currentStep);
        label.classList.toggle('completed', index + 1 < currentStep);
    });
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    const step = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!step) return true;
    const requiredFields = [...step.querySelectorAll('[required]')];
    const invalidFields = requiredFields.filter((field, index, fields) => {
        if (field.id === 'finalColorsInput') return selectedColors.length === 0;
        if (field.type === 'radio') {
            if (fields.findIndex((item) => item.name === field.name) !== index) return false;
            return !step.querySelector(`input[name="${field.name}"]:checked`);
        }
        return !field.checkValidity();
    });

    step.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
    invalidFields.forEach((field) => {
        const target = field.id === 'finalColorsInput' ? field.previousElementSibling?.previousElementSibling : (field.type === 'radio' ? field.closest('.selection-grid') : field);
        target?.classList.add('is-invalid');
    });
    if (invalidFields.length) {
        const firstTarget = invalidFields[0].id === 'finalColorsInput' ? document.getElementById('hexInput') : invalidFields[0];
        firstTarget.focus({ preventScroll: true });
        firstTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }
    return true;
}

function setupColorPicker() {
    const picker = document.getElementById('colorPickerInput');
    const hexInput = document.getElementById('hexInput');
    picker.addEventListener('input', () => { hexInput.value = picker.value.toUpperCase(); });
    hexInput.addEventListener('input', () => {
        const value = hexInput.value.toUpperCase();
        hexInput.value = value;
        if (/^#[0-9A-F]{6}$/.test(value)) picker.value = value;
    });
}

function addColorFromPicker() {
    const input = document.getElementById('hexInput');
    const color = (input.value || document.getElementById('colorPickerInput').value).toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(color)) {
        input.setCustomValidity('Digite uma cor no formato #RRGGBB.');
        input.reportValidity();
        return;
    }
    input.setCustomValidity('');
    if (!selectedColors.includes(color)) selectedColors.push(color);
    input.value = '';
    renderSelectedColors();
}

function removeColor(color) {
    selectedColors = selectedColors.filter((item) => item !== color);
    renderSelectedColors();
}

function renderSelectedColors() {
    const list = document.getElementById('selectedColorsList');
    list.replaceChildren();
    selectedColors.forEach((color) => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';
        const swatch = document.createElement('span');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        const code = document.createElement('span');
        code.textContent = color;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'color-remove';
        remove.setAttribute('aria-label', `Remover cor ${color}`);
        remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>';
        remove.addEventListener('click', () => removeColor(color));
        chip.append(swatch, code, remove);
        list.appendChild(chip);
    });
    document.getElementById('finalColorsInput').value = selectedColors.join(', ');
}

function setupUploadZone() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('refUpload');
    const selectButton = document.getElementById('selectFilesButton');
    ['dragenter', 'dragover'].forEach((eventName) => zone.addEventListener(eventName, (event) => {
        event.preventDefault();
        zone.classList.add('drag-over');
    }));
    ['dragleave', 'drop'].forEach((eventName) => zone.addEventListener(eventName, (event) => {
        event.preventDefault();
        zone.classList.remove('drag-over');
    }));
    zone.addEventListener('drop', (event) => addFiles([...event.dataTransfer.files]));
    selectButton.addEventListener('click', (event) => { event.stopPropagation(); input.click(); });
    zone.addEventListener('click', (event) => {
        if (!event.target.closest('.file-thumb') && event.target !== selectButton) input.click();
    });
    input.addEventListener('change', () => {
        addFiles([...input.files]);
        input.value = '';
    });
}

function addFiles(files) {
    const rejected = [];
    files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
            rejected.push(file.name);
            return;
        }
        const duplicate = selectedFiles.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!duplicate) selectedFiles.push(file);
    });
    renderFilePreviews();
    if (rejected.length) alert(`Estes arquivos excedem 10MB:\n${rejected.join('\n')}`);
}

function removeFile(index) {
    const [removed] = selectedFiles.splice(index, 1);
    if (removed && previewUrls.has(removed)) {
        URL.revokeObjectURL(previewUrls.get(removed));
        previewUrls.delete(removed);
    }
    renderFilePreviews();
}

function renderFilePreviews() {
    const grid = document.getElementById('filePreviewGrid');
    const placeholder = document.getElementById('uploadPlaceholder');
    grid.replaceChildren();
    placeholder.hidden = selectedFiles.length > 0;
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-thumb';
        if (file.type.startsWith('image/')) {
            if (!previewUrls.has(file)) previewUrls.set(file, URL.createObjectURL(file));
            const image = document.createElement('img');
            image.src = previewUrls.get(file);
            image.alt = '';
            item.appendChild(image);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-type-icon';
            icon.innerHTML = file.type.startsWith('video/')
                ? '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2"/></svg>'
                : '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
            item.appendChild(icon);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'file-thumb-remove';
        remove.setAttribute('aria-label', `Remover ${file.name}`);
        remove.textContent = '×';
        remove.addEventListener('click', (event) => { event.stopPropagation(); removeFile(index); });
        const name = document.createElement('div');
        name.className = 'file-thumb-name';
        name.textContent = file.name;
        item.append(remove, name);
        grid.appendChild(item);
    });
}

async function uploadFilesToSupabase(projectId) {
    if (!selectedFiles.length) return [];
    const progressBar = document.querySelector('.upload-progress-bar');
    const progressFill = document.querySelector('.upload-progress-fill');
    progressBar.style.display = 'block';
    progressBar.setAttribute('aria-hidden', 'false');
    const urls = [];
    for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${projectId}/${Date.now()}_${index}_${safeName}`;
        const { error } = await supabase.storage.from('briefing-files').upload(fileName, file, { upsert: false, contentType: file.type });
        if (error) throw new Error(`Não foi possível enviar "${file.name}": ${error.message}`);
        const { data } = supabase.storage.from('briefing-files').getPublicUrl(fileName);
        if (data?.publicUrl) urls.push(data.publicUrl);
        progressFill.style.width = `${Math.round(((index + 1) / selectedFiles.length) * 100)}%`;
    }
    return urls;
}

async function disparaWebhookN8N(payload) {
    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`n8n respondeu ${response.status}`);
        console.info('[VIZZU] Webhook n8n disparado com sucesso.');
    } catch (error) {
        console.warn('[VIZZU] Falha no webhook n8n (não crítico):', error.message);
    }
}

async function submitBriefing(event) {
    event.preventDefault();
    if (!currentBriefingId || !validateCurrentStep()) return;
    const button = document.querySelector('.btn-submit');
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="button-loader" aria-hidden="true"></span> Enviando...';

    try {
        const uploadedUrls = await uploadFilesToSupabase(currentBriefingId);
        const rawData = new FormData(document.getElementById('briefingForm'));
        const previousFiles = Array.isArray(projectData.briefing_data?.referencias_arquivos)
            ? projectData.briefing_data.referencias_arquivos
            : [];
        const dataObj = {};
        rawData.forEach((value, key) => {
            if (key !== 'refUpload') dataObj[key] = value;
        });
        ['video_fachada', 'video_equipe', 'video_processo', 'video_dona'].forEach((key) => {
            dataObj[key] = rawData.has(key) ? 'sim' : 'nao';
        });
        if (previousFiles.length || uploadedUrls.length) dataObj.referencias_arquivos = [...previousFiles, ...uploadedUrls];

        const completedAt = new Date().toISOString();
        const { error } = await supabase.from('projects').update({ briefing_data: dataObj, status: 'Concluído', completed_at: completedAt }).eq('id', currentBriefingId);
        if (error) throw error;

        await disparaWebhookN8N({
            evento: 'briefing_enviado',
            timestamp: completedAt,
            projeto: { id: currentBriefingId, client_name: projectData.client_name, status: 'Concluído' },
            cliente: { nome: dataObj.responsavel_nome, loja: dataObj.nome_loja, whatsapp: dataObj.responsavel_whatsapp, email: dataObj.responsavel_email },
            resumo: { vibe: dataObj.vibe, pedido_minimo: dataObj.pedido_minimo, produto_estrela: dataObj.produto_estrela, total_arquivos_enviados: uploadedUrls.length },
            link_admin: `https://vizzu-briefing.netlify.app/index.html#projeto=${currentBriefingId}`
        });

        document.getElementById('briefingForm').hidden = true;
        document.getElementById('successModal').hidden = false;
        document.body.classList.add('modal-open');
    } catch (error) {
        console.error('[VIZZU] Erro ao enviar briefing:', error);
        alert(`Não foi possível concluir o envio. ${error.message || 'Tente novamente.'}`);
        button.disabled = false;
        button.innerHTML = originalContent;
    }
}

function setupMasks() {
    document.querySelectorAll('.phone-mask').forEach((input) => input.addEventListener('input', () => {
        const match = input.value.replace(/\D/g, '').slice(0, 11).match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        input.value = !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }));
    document.querySelectorAll('.money-mask').forEach((input) => input.addEventListener('input', () => {
        const cents = Number(input.value.replace(/\D/g, '')) / 100;
        input.value = cents.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }));
}
