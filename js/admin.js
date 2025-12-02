// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE ---
let allProjects = [];
let currentProject = null;

// --- INIT ---
window.onload = async function() {
    await loadProjects();
};

// --- LOAD PROJECTS ---
async function loadProjects() {
    const listEl = document.getElementById('projectList');
    if (!listEl) return; 
    
    listEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando projetos...</div>';

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProjects = data;
        renderProjectList(data);

    } catch (error) {
        console.error('Erro ao carregar:', error);
        listEl.innerHTML = '<div class="error">Erro ao carregar projetos.</div>';
    }
}

function renderProjectList(projects) {
    const listEl = document.getElementById('projectList');
    listEl.innerHTML = '';

    if (projects.length === 0) {
        listEl.innerHTML = '<div class="empty">Nenhum projeto encontrado.</div>';
        return;
    }

    projects.forEach(p => {
        const data = p.briefing_data || {};
        const admin = p.admin_data || {};
        const clientName = p.client_name || data.responsavel_nome || 'Cliente Sem Nome';
        const storeName = data.nome_loja || 'Loja Sem Nome';
        const status = p.status || 'Pendente';
        
        const card = document.createElement('div');
        card.className = 'project-card';
        card.onclick = () => openProject(p.id);
        
        card.innerHTML = `
            <div class="card-icon"><i class="fas fa-folder"></i></div>
            <div class="card-info">
                <h3>${storeName}</h3>
                <p>${clientName}</p>
                <span class="status-badge ${status.toLowerCase().replace(' ', '-')}">${status}</span>
            </div>
            <div class="card-meta">
                <small>${new Date(p.created_at).toLocaleDateString()}</small>
            </div>
        `;
        listEl.appendChild(card);
    });
}

// --- OPEN PROJECT ---
async function openProject(id) {
    currentProject = allProjects.find(p => p.id === id);
    if (!currentProject) return;

    // Hide List, Show Detail
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('projectDetailView').style.display = 'block';

    renderProjectDetails();
}

function closeProject() {
    currentProject = null;
    document.getElementById('projectDetailView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    loadProjects(); // Refresh list
}

// --- RENDER DETAILS ---
function renderProjectDetails() {
    const p = currentProject;
    const data = p.briefing_data || {};
    const admin = p.admin_data || {};

    // Header
    document.getElementById('detailTitle').textContent = data.nome_loja || 'Projeto Sem Nome';
    document.getElementById('detailSubtitle').textContent = p.client_name || data.responsavel_nome || 'Cliente';
    
    // Generate Briefing Link
    const link = `${window.location.href.replace('index.html', '').replace(/\/$/, '')}/briefing.html?id=${p.id}`;
    document.getElementById('briefingLinkInput').value = link;

    // Client Info
    document.getElementById('infoName').value = data.responsavel_nome || '';
    document.getElementById('infoStore').value = data.nome_loja || '';
    document.getElementById('infoPhone').value = data.responsavel_whatsapp || '';
    document.getElementById('infoEmail').value = data.responsavel_email || '';
    
    // WhatsApp Link
    const waLink = document.getElementById('waLink');
    if (data.responsavel_whatsapp) {
        const num = data.responsavel_whatsapp.replace(/\D/g, '');
        waLink.href = `https://wa.me/55${num}`;
        waLink.style.display = 'inline-flex';
    } else {
        waLink.style.display = 'none';
    }

    // Admin Fields
    document.getElementById('adminPlan').value = admin.plan || '';
    document.getElementById('adminPayment').value = admin.payment || '';
    document.getElementById('adminStartDate').value = admin.start_date || '';
    document.getElementById('adminStatus').value = p.status || 'Pendente';

    // Briefing Content (Read Only)
    renderBriefingContent(data);

    // Reference Files
    renderReferenceFiles(data);

    // Code Snippets
    renderCodeSnippets(admin.snippets || []);
}

function renderBriefingContent(data) {
    const container = document.getElementById('briefingAnswers');
    container.innerHTML = '';

    // Helper to create fields
    const createField = (label, value) => {
        if (!value) return '';
        let displayValue = value;
        if (typeof value === 'object') {
            displayValue = JSON.stringify(value, null, 2);
        }
        return `
            <div class="briefing-item">
                <label>${label}</label>
                <div class="value">${displayValue}</div>
            </div>
        `;
    };

    let html = '';
    
    // Section 1: Acessos
    html += `<h4><i class="fas fa-lock"></i> Acessos</h4>`;
    html += createField('Link da Loja', data.loja_url);
    html += createField('Login', data.login_email);
    html += createField('Senha', data.senha_provisoria);

    // Section 2: Identidade
    html += `<h4><i class="fas fa-gem"></i> Identidade</h4>`;
    html += createField('Cores', data.cores);
    html += createField('Vibe', data.vibe);
    html += createField('Logo Status', data.logo_status);
    
    // Section 3: Estratégia
    html += `<h4><i class="fas fa-bullseye"></i> Estratégia</h4>`;
    html += createField('Pedido Mínimo', data.pedido_minimo);
    html += createField('Frete', data.regras_frete);
    html += createField('Pagamento', data.pagamento);
    
    // Variações
    if (data.variacoes) {
        html += createField('Variações de Produtos', data.variacoes);
    }

    // Section 4: Widgets
    html += `<h4><i class="fas fa-video"></i> Widgets</h4>`;
    html += createField('Destaque Carrossel', data.destaque_carrossel);
    html += createField('Prova Social', data.prova_social);

    // Section 5: Suporte
    html += `<h4><i class="fas fa-headset"></i> Suporte</h4>`;
    html += createField('WhatsApp Loja', data.whatsapp);
    html += createField('Endereço', data.endereco);
    html += createField('Horário', data.horario);

    // Section 6: Final
    html += `<h4><i class="fas fa-rocket"></i> Expectativa</h4>`;
    html += createField('Fator UAU', data.fator_uau);

    container.innerHTML = html;
}

function renderReferenceFiles(data) {
    const container = document.getElementById('refFilesContainer');
    container.innerHTML = '';

    const files = data.referencias_arquivos || [];
    
    if (files.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum arquivo enviado.</p>';
        return;
    }

    files.forEach(url => {
        const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
        const el = document.createElement('a');
        el.href = url;
        el.target = '_blank';
        el.className = 'file-preview';
        
        if (isImg) {
            el.innerHTML = `<img src="${url}" alt="Referência">`;
        } else {
            el.innerHTML = `<i class="fas fa-file-alt"></i> <span>Arquivo</span>`;
        }
        container.appendChild(el);
    });
}

// --- ADMIN ACTIONS ---

async function saveAdminInfo() {
    if (!currentProject) return;

    const plan = document.getElementById('adminPlan').value;
    const payment = document.getElementById('adminPayment').value;
    const startDate = document.getElementById('adminStartDate').value;
    const status = document.getElementById('adminStatus').value;

    const newAdminData = {
        ...currentProject.admin_data,
        plan,
        payment,
        start_date: startDate,
        snippets: currentProject.admin_data?.snippets || []
    };

    const btn = document.getElementById('btnSaveAdmin');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('projects')
            .update({
                status: status,
                admin_data: newAdminData
            })
            .eq('id', currentProject.id);

        if (error) throw error;

        // Update local state
        currentProject.status = status;
        currentProject.admin_data = newAdminData;
        
        alert('Dados atualizados com sucesso!');

    } catch (error) {
        console.error(error);
        alert('Erro ao salvar.');
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        btn.disabled = false;
    }
}

// --- CODE SNIPPETS ---

function renderCodeSnippets(snippets) {
    const container = document.getElementById('codeSnippetsList');
    container.innerHTML = '';

    if (!snippets || snippets.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum código salvo.</p>';
        return;
    }

    snippets.forEach((snip, index) => {
        const div = document.createElement('div');
        div.className = 'snippet-item';
        div.innerHTML = `
            <div class="snippet-header" onclick="toggleSnippet(${index})">
                <strong>${snip.title}</strong>
                <small>${snip.type}</small>
            </div>
            <div class="snippet-body" id="snip-${index}" style="display:none;">
                <textarea readonly>${snip.code}</textarea>
                <button class="btn-copy" onclick="copyCode(this)">Copiar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleSnippet(index) {
    const el = document.getElementById(`snip-${index}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function showAddSnippetModal() {
    document.getElementById('snippetModal').style.display = 'flex';
}

function closeSnippetModal() {
    document.getElementById('snippetModal').style.display = 'none';
}

async function saveSnippet() {
    const title = document.getElementById('snipTitle').value;
    const type = document.getElementById('snipType').value;
    const code = document.getElementById('snipCode').value;

    if (!title || !code) return alert('Preencha título e código');

    const snippets = currentProject.admin_data?.snippets || [];
    snippets.push({ title, type, code, date: new Date().toISOString() });

    const newAdminData = {
        ...currentProject.admin_data,
        snippets
    };

    try {
        await supabase.from('projects').update({ admin_data: newAdminData }).eq('id', currentProject.id);
        currentProject.admin_data = newAdminData;
        renderCodeSnippets(snippets);
        closeSnippetModal();
        document.getElementById('snipTitle').value = '';
        document.getElementById('snipCode').value = '';
    } catch (e) {
        alert('Erro ao salvar snippet');
    }
}

function copyCode(btn) {
    const txt = btn.previousElementSibling.value;
    navigator.clipboard.writeText(txt);
    btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = 'Copiar', 2000);
}

function copyLink() {
    const input = document.getElementById('briefingLinkInput');
    input.select();
    document.execCommand('copy');
    alert('Link copiado!');
}

// --- NEW PROJECT ---
async function createNewProject() {
    const clientName = prompt("Nome do Cliente (para gerar link):");
    if(!clientName) return;
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ client_name: clientName, status: 'Link Gerado' }])
            .select();
            
        if(error) throw error;
        
        alert('Projeto criado! Atualizando lista...');
        loadProjects();
    } catch(e) {
        alert('Erro ao criar projeto.');
    }
}
