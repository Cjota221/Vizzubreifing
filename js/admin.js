// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
// Criar instância global única do Supabase
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Referência local (não const para evitar conflito)
var supabase = window.supabaseClient;

// --- CONSTANTS ---
const PLANS = {
    'iniciante': { name: 'Iniciante', price: 797, items: ['Redesign Visual', 'Filtro Inteligente', 'Barra Vantagens', 'Cupom One-Click'] },
    'elite': { name: 'Elite Total', price: 1661, items: ['2 Carrosséis (12 Vídeos)', '10 Widgets Completos', 'Entrega 7 Dias', 'Suporte VIP'] },
    'personalizado': { name: 'Personalizado', price: 2999, items: ['Projeto Sob Medida', 'Pesquisa de Mercado', 'Suporte Ilimitado'] },
    'avulso': { name: 'Itens Avulsos', price: 0, items: [] }
};

const WIDGETS = {
    'Redesign Visual': 450,
    'Carrossel Vitrine': 280,
    'Carrossel Institucional': 280,
    'Calc. Lucro': 380,
    'Oferta Scarcity': 310,
    'Cupom One-Click': 180,
    'Filtro Inteligente': 190,
    'Central de Links': 150,
    'Barra Vantagens': 150,
    'Barra Informativa': 120
};

// --- STATE ---
let allProjects = [];
let currentProject = null;
let currentTermo = null;

// --- INIT ---
// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    await loadProjects();
});

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
        const clientName = p.client_name || normalizeField(data.responsavel_nome) || 'Cliente Sem Nome';
        const storeName = normalizeField(data.nome_loja) || 'Loja Sem Nome';
        const status = p.status || 'Pendente';
        const planName = admin.plan_details?.name || 'Sem Plano';
        const logoUrl = data.logo_url;
        
        const card = document.createElement('div');
        card.className = 'project-card';
        card.onclick = () => openProject(p.id);
        
        let iconHtml = '<div class="card-icon"><i class="fas fa-folder"></i></div>';
        if (logoUrl) {
            iconHtml = `<div class="card-icon" style="padding:0; overflow:hidden;"><img src="${logoUrl}" style="width:100%; height:100%; object-fit:cover;"></div>`;
        }

        card.innerHTML = `
            ${iconHtml}
            <div class="card-info">
                <h3>${storeName}</h3>
                <p>${clientName}</p>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px;">${planName}</div>
                <span class="status-badge ${status.toLowerCase().replace(' ', '-')}">${status}</span>
            </div>
            <div class="card-meta" style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 0.5rem;">
                <small style="color: var(--text-muted);">${new Date(p.created_at).toLocaleDateString()}</small>
            </div>
        `;
        listEl.appendChild(card);
    });
}

// Navigation is handled by showSection() in admin.html
// These thin wrappers keep backward compatibility with any internal calls

// --- OPEN PROJECT ---
async function openProject(id) {
    currentProject = allProjects.find(p => p.id === id);
    if (!currentProject) return;

    // Hide all section views, show detail
    ['projetosView','propostasView','leadsView','cuponsView','bibliotecaView','pvView'].forEach(sid => {
        const el = document.getElementById(sid);
        if (el) el.style.display = 'none';
    });
    document.getElementById('projectDetailView').style.display = 'block';

    renderProjectDetails();
}

function closeProject() {
    currentProject = null;
    if (typeof showSection === 'function') showSection('projetos');
}

// --- RENDER DETAILS ---
function renderProjectDetails() {
    const p = currentProject;
    const data = p.briefing_data || {};
    const admin = p.admin_data || {};

    // Header
    document.getElementById('detailTitle').textContent = normalizeField(data.nome_loja) || p.client_name || 'Projeto Sem Nome';
    document.getElementById('detailSubtitle').textContent = p.client_name || normalizeField(data.responsavel_nome) || 'Cliente';
    
    // Generate Briefing Link
    const link = `${window.location.origin}/briefing.html?id=${p.id}`;
    document.getElementById('briefingLinkInput').value = link;

    // Client Info (Editable)
    document.getElementById('infoName').value = p.client_name || normalizeField(data.responsavel_nome) || '';
    document.getElementById('infoStore').value = normalizeField(data.nome_loja) || '';
    document.getElementById('infoPhone').value = normalizeField(data.responsavel_whatsapp) || '';
    document.getElementById('infoEmail').value = normalizeField(data.responsavel_email) || '';
    
    // Logo Handling
    const logoUrl = data.logo_url || '';
    document.getElementById('infoLogoUrl').value = logoUrl;
    const logoPreview = document.getElementById('logoPreview');
    if (logoUrl) {
        logoPreview.innerHTML = `<img src="${logoUrl}" style="max-width: 100px; border-radius: 8px; border: 1px solid var(--border);">`;
    } else {
        logoPreview.innerHTML = '';
    }
    document.getElementById('infoLogoFile').value = ''; // Reset file input
    
    // WhatsApp Link
    const waLink = document.getElementById('waLink');
    const phone = normalizeField(data.responsavel_whatsapp) || '';
    if (phone) {
        const num = phone.replace(/\D/g, '');
        waLink.href = `https://wa.me/55${num}`;
        waLink.style.display = 'inline-flex';
    } else {
        waLink.style.display = 'none';
    }

    // Admin Fields
    document.getElementById('adminPayment').value = admin.payment || '';
    document.getElementById('adminStartDate').value = admin.start_date || '';
    document.getElementById('adminStatus').value = p.status || 'Pendente';

    // --- PLAN EDITING SETUP ---
    const planDetails = admin.plan_details || { name: 'Nenhum', price: 0, items: [] };
    
    // 1. Set Select Value (Try to match name to key)
    const planSelect = document.getElementById('editPlanSelect');
    let foundKey = '';
    for (const [key, val] of Object.entries(PLANS)) {
        if (val.name === planDetails.name) foundKey = key;
    }
    // If not found but has name, maybe it was custom or legacy. Default to 'avulso' or 'personalizado' if price is high?
    // Let's just try to set it. If empty, user selects.
    planSelect.value = foundKey || (planDetails.name ? 'personalizado' : '');

    // 2. Generate Checkboxes
    const itemsContainer = document.getElementById('editPlanItems');
    itemsContainer.innerHTML = '';
    
    // Helper to check if item is in current plan
    const hasItem = (itemName) => planDetails.items && planDetails.items.includes(itemName);

    for (const [wName, wPrice] of Object.entries(WIDGETS)) {
        const isChecked = hasItem(wName);
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; font-size:0.9rem; cursor:pointer;">
                <input type="checkbox" class="edit-item-check" value="${wPrice}" data-name="${wName}" ${isChecked ? 'checked' : ''} onchange="updateEditProjectTotal()">
                ${wName} (+ R$ ${wPrice})
            </label>
        `;
        itemsContainer.appendChild(div);
    }

    // 3. Update Total Display
    updateEditProjectTotal();

    // Briefing Content (Read Only)
    renderBriefingContent(data);

    // Reference Files
    renderReferenceFiles(data);

    // Code Snippets
    renderCodeSnippets(admin.snippets || []);

    // Termo de Aprovação
    loadTermoAprovacao();
}

function updateEditProjectTotal() {
    const planKey = document.getElementById('editPlanSelect').value;
    let total = 0;
    
    // Base Plan Price
    if (planKey && PLANS[planKey]) {
        total += PLANS[planKey].price;
    }

    // Add checked items
    document.querySelectorAll('.edit-item-check:checked').forEach(c => {
        total += parseFloat(c.value);
    });

    document.getElementById('editProjectTotal').value = `R$ ${total.toFixed(2)}`;
}

// Helper: normaliza campo que pode ser string ou array (quando cliente enviou 2x)
function normalizeField(value) {
    if (Array.isArray(value)) {
        // Retorna o último valor preenchido (mais recente)
        const filtered = value.filter(v => v && String(v).trim() !== '');
        return filtered.length > 0 ? filtered[filtered.length - 1] : '';
    }
    return value;
}

function renderBriefingContent(data) {
    const container = document.getElementById('briefingAnswers');
    container.innerHTML = '';

    // Helper to create fields — aceita string ou array
    const createField = (label, value) => {
        const normalized = normalizeField(value);
        if (!normalized && normalized !== 0) return '';
        let displayValue = normalized;
        if (typeof displayValue === 'object') {
            displayValue = JSON.stringify(displayValue, null, 2);
        }
        // Mostrar aviso se foi enviado mais de uma vez
        const isDuplicated = Array.isArray(value) && value.filter(v => v && String(v).trim() !== '').length > 1;
        const dupBadge = isDuplicated ? `<span style="font-size:0.7rem; color:#f0a500; margin-left:6px;" title="Formulário enviado mais de uma vez">⚠️ duplicado</span>` : '';
        return `
            <div class="briefing-item">
                <label>${label}${dupBadge}</label>
                <div class="value">${displayValue}</div>
            </div>
        `;
    };

    let html = '';

    // Aviso se o briefing ainda não foi enviado
    if (!data || Object.keys(data).filter(k => !['logo_url'].includes(k)).length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;"><i class="fas fa-clock"></i> Briefing ainda não foi preenchido pela cliente.</p>';
        return;
    }
    
    // Section 1: Dados & Acessos
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-user-check"></i> Dados & Acessos</h4>`;
    html += createField('Nome Responsável', data.responsavel_nome);
    html += createField('Nome da Loja', data.nome_loja);
    html += createField('WhatsApp (Contato)', data.responsavel_whatsapp);
    html += createField('E-mail (Contato)', data.responsavel_email);
    html += createField('Link da Loja', data.loja_url);
    html += createField('Login Colaborador', data.login_email);
    html += createField('Senha Provisória', data.senha_provisoria);

    // Section 2: Identidade
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-gem"></i> Identidade & Visual</h4>`;
    html += createField('Paleta de Cores', data.cores);
    html += createField('Vibe / Sensação da Loja', data.vibe);
    const logoStatuses = {
        alta_resolucao: 'Logo em alta resolução enviada nas referências',
        instagram: 'Usar a versão disponível no Instagram',
        sem_logo: 'Ainda não possui uma logo pronta'
    };
    html += createField('Status da Logo', logoStatuses[data.logo_status] || data.logo_status);
    html += createField('Obs. Referências Visuais', data.referencias_obs);
    
    // Section 3: Estratégia
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-bullseye"></i> Estratégia Comercial</h4>`;
    html += createField('Pedido Mínimo', data.pedido_minimo);
    html += createField('Regras de Frete', data.regras_frete);
    html += createField('Facilidades de Pagamento', data.pagamento);
    html += createField('Produto Estrela (Oferta Relâmpago)', data.produto_estrela);
    html += createField('Cupom de Primeira Compra', data.cupom);
    html += createField('Variações de Produtos', data.variacoes);

    // Section 4: Widgets
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-video"></i> Conteúdo dos Widgets</h4>`;
    html += createField('Destaque do Carrossel Vitrine', data.destaque_carrossel);

    // Vídeos disponíveis
    const videos = [];
    if (['on', 'sim', true].includes(data.video_fachada)) videos.push('Fachada / Estoque Cheio');
    if (['on', 'sim', true].includes(data.video_equipe)) videos.push('Equipe separando pedidos (Bastidores)');
    if (['on', 'sim', true].includes(data.video_processo)) videos.push('Processo de Fabricação / Detalhes');
    if (['on', 'sim', true].includes(data.video_dona)) videos.push('Apresentação da Dona / História');
    if (videos.length > 0) {
        html += createField('Vídeos Disponíveis', videos.join(', '));
    } else {
        html += createField('Vídeos Disponíveis', 'Nenhum vídeo marcado');
    }
    html += createField('Prova Social (Prints de Clientes)', data.prova_social === 'sim' ? 'Sim, enviou ou enviará nas referências' : data.prova_social === 'nao' ? 'Ainda não possui prints' : data.prova_social);

    // Section 5: Suporte
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-headset"></i> Suporte & Rodapé</h4>`;
    html += createField('WhatsApp da Loja', data.whatsapp);
    html += createField('Endereço Físico', data.endereco);
    html += createField('Horário de Atendimento', data.horario);

    // Section 6: Final
    html += `<h4 style="grid-column: 1/-1;"><i class="fas fa-rocket"></i> Expectativa Final</h4>`;
    html += createField('Fator UAU', data.fator_uau);

    container.innerHTML = html || '<p style="color: var(--text-muted); text-align: center; padding: 20px;"><i class="fas fa-clock"></i> Briefing ainda não foi preenchido.</p>';
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

    const payment = document.getElementById('adminPayment').value;
    const startDate = document.getElementById('adminStartDate').value;
    const status = document.getElementById('adminStatus').value;
    
    // Editable Client Info
    const clientName = document.getElementById('infoName').value;
    const storeName = document.getElementById('infoStore').value;
    const phone = document.getElementById('infoPhone').value;
    const email = document.getElementById('infoEmail').value;
    
    // Handle Logo Upload
    let logoUrl = document.getElementById('infoLogoUrl').value;
    const logoFile = document.getElementById('infoLogoFile').files[0];

    if (logoFile) {
        try {
            const fileName = `${currentProject.id}/${Date.now()}_${logoFile.name}`;
            const { data, error } = await supabase.storage
                .from('logos')
                .upload(fileName, logoFile);
            
            if (error) throw error;
            
            const { data: publicData } = supabase.storage
                .from('logos')
                .getPublicUrl(fileName);
                
            logoUrl = publicData.publicUrl;
        } catch (uploadError) {
            console.error('Erro upload logo:', uploadError);
            alert('Erro ao fazer upload da logo. Verifique se o bucket "logos" existe e é público.');
            // Continue saving other data even if upload fails
        }
    }

    // --- BUILD PLAN DETAILS ---
    const planKey = document.getElementById('editPlanSelect').value;
    let planDetails = { name: 'Personalizado/Avulso', price: 0, items: [] };

    if (planKey && PLANS[planKey]) {
        planDetails.name = PLANS[planKey].name;
        planDetails.price += PLANS[planKey].price;
        // Add base items from plan
        planDetails.items = [...PLANS[planKey].items];
    }

    // Add checked items (avoid duplicates if they are already in base plan)
    document.querySelectorAll('.edit-item-check:checked').forEach(c => {
        const itemName = c.getAttribute('data-name');
        planDetails.price += parseFloat(c.value);
        if (!planDetails.items.includes(itemName)) {
            planDetails.items.push(itemName);
        }
    });

    const newAdminData = {
        ...currentProject.admin_data,
        payment,
        start_date: startDate,
        plan_details: planDetails, // Save the new plan structure
        snippets: currentProject.admin_data?.snippets || []
    };
    
    const newBriefingData = {
        ...currentProject.briefing_data,
        responsavel_nome: clientName,
        nome_loja: storeName,
        responsavel_whatsapp: phone,
        responsavel_email: email,
        logo_url: logoUrl
    };

    const btn = document.getElementById('btnSaveAdmin');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('projects')
            .update({
                status: status,
                client_name: clientName, 
                admin_data: newAdminData,
                briefing_data: newBriefingData
            })
            .eq('id', currentProject.id);

        if (error) throw error;

        // Update local state
        currentProject.status = status;
        currentProject.client_name = clientName;
        currentProject.admin_data = newAdminData;
        currentProject.briefing_data = newBriefingData;
        
        // Update the item in the main list array
        const index = allProjects.findIndex(p => p.id === currentProject.id);
        if (index !== -1) {
            allProjects[index] = currentProject;
        }

        alert('Dados atualizados com sucesso!');
        
        // Refresh UI
        renderProjectDetails(); 
        renderProjectList(allProjects); // Refresh sidebar list immediately
        
        // Update Header Titles immediately
        document.getElementById('detailTitle').textContent = storeName || 'Loja Sem Nome';
        document.getElementById('detailSubtitle').textContent = clientName || 'Cliente';
        
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        btn.disabled = false;
    }
}

async function deleteProject() {
    if (!currentProject) return;
    if (!confirm('Tem certeza que deseja EXCLUIR este projeto? Esta ação não pode ser desfeita.')) return;

    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', currentProject.id);

        if (error) throw error;

        alert('Projeto excluído.');
        closeProject();

    } catch (error) {
        console.error(error);
        alert('Erro ao excluir projeto.');
    }
}

// --- CODE SNIPPETS ---

function renderCodeSnippets(snippets) {
    const container = document.getElementById('codeSnippetsList');
    container.innerHTML = '';

    if (!snippets || snippets.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Nenhum código salvo.</p>';
        return;
    }

    // Organizar por categoria
    const categories = {};
    snippets.forEach((snip, index) => {
        const cat = snip.category || 'Outros';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ ...snip, originalIndex: index });
    });

    // Renderizar por categoria
    Object.keys(categories).sort().forEach(cat => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.marginBottom = '2rem';
        
        const categoryHeader = document.createElement('h4');
        categoryHeader.style.cssText = 'color: var(--secondary); font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.5rem;';
        categoryHeader.innerHTML = `<i class="fas fa-folder-open"></i> ${cat} (${categories[cat].length})`;
        categoryDiv.appendChild(categoryHeader);

        categories[cat].forEach(snip => {
            const div = document.createElement('div');
            div.className = 'snippet-item';
            
            // Verificar se é HTML/CSS/JS para mostrar preview
            const hasPreview = ['HTML', 'CSS', 'JavaScript'].includes(snip.type);
            
            div.innerHTML = `
                <div class="snippet-header" onclick="toggleSnippet(${snip.originalIndex})">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <strong>${snip.title}</strong>
                        <small style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${snip.type}</small>
                    </div>
                    <div onclick="event.stopPropagation()">
                        <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="editSnippet(${snip.originalIndex})"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger" style="padding: 4px 10px; font-size: 0.75rem; margin-left: 5px;" onclick="deleteSnippet(${snip.originalIndex})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="snippet-body" id="snip-${snip.originalIndex}" style="display:none;">
                    ${hasPreview ? `
                    <div class="snippet-tabs">
                        <button class="snippet-tab active" onclick="switchSnippetTab(${snip.originalIndex}, 'code')">
                            <i class="fas fa-code"></i> Ver Código
                        </button>
                        <button class="snippet-tab" onclick="switchSnippetTab(${snip.originalIndex}, 'preview')">
                            <i class="fas fa-eye"></i> Ver Resultado
                        </button>
                    </div>
                    ` : ''}
                    
                    <div class="snippet-content active" id="snip-code-${snip.originalIndex}">
                        <textarea readonly>${snip.code}</textarea>
                        <button class="btn-copy" onclick="copyCode(this)">Copiar</button>
                    </div>
                    
                    ${hasPreview ? `
                    <div class="snippet-content" id="snip-preview-${snip.originalIndex}">
                        <div class="preview-container">
                            <div class="preview-info">
                                <i class="fas fa-info-circle"></i>
                                <strong>Preview Isolado:</strong> Este código está renderizado em um ambiente isolado (iframe) para não interferir nos estilos da página.
                            </div>
                            <iframe class="snippet-preview" srcdoc="${escapeHtml(snip.code)}"></iframe>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            categoryDiv.appendChild(div);
        });

        container.appendChild(categoryDiv);
    });
}

let editingSnippetIndex = -1;

function toggleSnippet(index) {
    const el = document.getElementById(`snip-${index}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function showAddSnippetModal() {
    editingSnippetIndex = -1;
    document.getElementById('snipCategory').value = 'Carrinho';
    document.getElementById('snipTitle').value = '';
    document.getElementById('snipType').value = 'HTML';
    document.getElementById('snipCode').value = '';
    document.querySelector('#snippetModal h3').textContent = 'Adicionar Código';
    document.getElementById('snippetModal').style.display = 'flex';
}

function editSnippet(index) {
    const snippets = currentProject.admin_data?.snippets || [];
    const snip = snippets[index];
    if (!snip) return;

    editingSnippetIndex = index;
    document.getElementById('snipCategory').value = snip.category || 'Outros';
    document.getElementById('snipTitle').value = snip.title;
    document.getElementById('snipType').value = snip.type;
    document.getElementById('snipCode').value = snip.code;
    document.querySelector('#snippetModal h3').textContent = 'Editar Código';
    document.getElementById('snippetModal').style.display = 'flex';
}

function closeSnippetModal() {
    document.getElementById('snippetModal').style.display = 'none';
}

async function saveSnippet() {
    const category = document.getElementById('snipCategory').value;
    const title = document.getElementById('snipTitle').value;
    const type = document.getElementById('snipType').value;
    const code = document.getElementById('snipCode').value;

    if (!title || !code) return alert('Preencha título e código');

    const snippets = currentProject.admin_data?.snippets || [];
    
    if (editingSnippetIndex >= 0) {
        // Update existing
        snippets[editingSnippetIndex] = { ...snippets[editingSnippetIndex], category, title, type, code, updated_at: new Date().toISOString() };
    } else {
        // Add new
        snippets.push({ category, title, type, code, date: new Date().toISOString() });
    }

    const newAdminData = {
        ...currentProject.admin_data,
        snippets
    };

    try {
        await supabase.from('projects').update({ admin_data: newAdminData }).eq('id', currentProject.id);
        currentProject.admin_data = newAdminData;
        renderCodeSnippets(snippets);
        closeSnippetModal();
        document.getElementById('snipCategory').value = 'Carrinho';
        document.getElementById('snipTitle').value = '';
        document.getElementById('snipCode').value = '';
        alert('Código salvo com sucesso!');
    } catch (e) {
        alert('Erro ao salvar snippet');
    }
}

async function deleteSnippet(index) {
    if (!confirm('Tem certeza que deseja EXCLUIR este código?')) return;
    
    const snippets = currentProject.admin_data?.snippets || [];
    snippets.splice(index, 1);
    
    const newAdminData = {
        ...currentProject.admin_data,
        snippets
    };
    
    try {
        await supabase.from('projects').update({ admin_data: newAdminData }).eq('id', currentProject.id);
        currentProject.admin_data = newAdminData;
        renderCodeSnippets(snippets);
        alert('Código excluído!');
    } catch (e) {
        alert('Erro ao excluir snippet');
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

// --- TERMO DE APROVAÇÃO ---

function renderTermoBox() {
    const box = document.getElementById('termoStatusBox');
    const linkRow = document.getElementById('termoLinkRow');
    const btnGerar = document.getElementById('btnGerarTermo');
    if (!box || !linkRow || !btnGerar) return;

    if (!currentTermo) {
        box.innerHTML = '';
        linkRow.style.display = 'none';
        btnGerar.style.display = 'block';
        btnGerar.disabled = false;
        btnGerar.textContent = 'Gerar Termo de Aprovação';
        return;
    }

    const link = `${window.location.origin}/aprovacao.html?id=${currentTermo.id}`;
    document.getElementById('termoLinkInput').value = link;
    linkRow.style.display = 'flex';
    btnGerar.style.display = 'none';

    if (currentTermo.status === 'aceito') {
        const dt = currentTermo.aceito_em ? new Date(currentTermo.aceito_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
        box.innerHTML = `<span class="status-badge concluido">Aceito em ${dt}</span> <a href="${link}" target="_blank" style="font-size:.78rem;margin-left:8px;">Ver termo aceito</a>`;
    } else {
        box.innerHTML = `<span class="status-badge pendente">Pendente de aceite</span>`;
    }
}

async function loadTermoAprovacao() {
    currentTermo = null;
    if (!currentProject) { renderTermoBox(); return; }

    try {
        const { data, error } = await supabase
            .from('termos_aprovacao')
            .select('*')
            .eq('projeto_id', currentProject.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        currentTermo = (data && data[0]) || null;
    } catch (e) {
        console.error('Erro ao carregar termo de aprovação:', e);
    }

    renderTermoBox();
}

async function gerarTermoAprovacao() {
    if (!currentProject || currentTermo) return;

    const clienteNome = document.getElementById('infoName').value || currentProject.client_name || 'Cliente';
    const projetoNome = document.getElementById('infoStore').value || 'Projeto';

    const btn = document.getElementById('btnGerarTermo');
    btn.disabled = true;
    btn.textContent = 'Gerando...';

    try {
        const { data, error } = await supabase
            .from('termos_aprovacao')
            .insert([{ projeto_id: currentProject.id, cliente_nome: clienteNome, projeto_nome: projetoNome }])
            .select()
            .single();

        if (error) throw error;

        currentTermo = data;
        renderTermoBox();
    } catch (e) {
        console.error(e);
        alert('Erro ao gerar termo de aprovação.');
        btn.disabled = false;
        btn.textContent = 'Gerar Termo de Aprovação';
    }
}

function copyTermoLink() {
    const input = document.getElementById('termoLinkInput');
    input.select();
    document.execCommand('copy');
    alert('Link copiado!');
}

// --- NEW PROJECT & LINKING ---

function openNewProjectModal() {
    document.getElementById('newProjectModal').style.display = 'flex';
    document.getElementById('newClientName').value = '';
    document.getElementById('newStoreName').value = '';
    document.getElementById('newPlanSelect').value = '';
    document.querySelectorAll('.new-item-check').forEach(c => c.checked = false);
    updateNewProjectTotal();
}

function closeNewProjectModal() {
    document.getElementById('newProjectModal').style.display = 'none';
}

function updateNewProjectTotal() {
    const planKey = document.getElementById('newPlanSelect').value;
    let total = 0;
    
    if (planKey && PLANS[planKey]) {
        total += PLANS[planKey].price;
    }

    document.querySelectorAll('.new-item-check:checked').forEach(c => {
        total += parseFloat(c.value);
    });

    document.getElementById('newProjectTotal').textContent = `R$ ${total.toFixed(2)}`;
}

async function confirmCreateProject() {
    const clientName = document.getElementById('newClientName').value;
    const storeName = document.getElementById('newStoreName').value;
    const planKey = document.getElementById('newPlanSelect').value;
    
    if (!clientName) return alert('Nome do cliente é obrigatório');

    // Build Plan Details
    let planDetails = { name: 'Personalizado/Avulso', price: 0, items: [] };
    
    if (planKey && PLANS[planKey]) {
        planDetails.name = PLANS[planKey].name;
        planDetails.price += PLANS[planKey].price;
        planDetails.items = [...PLANS[planKey].items];
    }

    document.querySelectorAll('.new-item-check:checked').forEach(c => {
        planDetails.price += parseFloat(c.value);
        planDetails.items.push(c.getAttribute('data-name'));
    });

    // Initial Briefing Data (to show store name immediately)
    const initialBriefingData = {
        nome_loja: storeName,
        responsavel_nome: clientName
    };

    const initialAdminData = {
        plan_details: planDetails,
        payment: '',
        start_date: '',
        snippets: []
    };

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ 
                client_name: clientName, 
                status: 'Link Gerado',
                briefing_data: initialBriefingData,
                admin_data: initialAdminData
            }])
            .select();
            
        if(error) throw error;
        
        alert('Projeto criado com sucesso!');
        closeNewProjectModal();
        loadProjects();
    } catch(e) {
        console.error(e);
        alert('Erro ao criar projeto.');
    }
}

// --- LINK EXISTING ID ---

function openLinkProjectModal() {
    document.getElementById('linkIdModal').style.display = 'flex';
    document.getElementById('linkProjectId').value = '';
}

function closeLinkIdModal() {
    document.getElementById('linkIdModal').style.display = 'none';
}

async function confirmLinkProject() {
    const id = document.getElementById('linkProjectId').value.trim();
    if (!id) return alert('Digite um ID válido');

    try {
        // Check if exists
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            alert('Projeto não encontrado com este ID.');
            return;
        }

        // If found, we just reload the list (it should be there) and open it
        // If it wasn't showing up, maybe it was a RLS issue or filter issue, but loadProjects fetches all.
        // We will force open it.
        
        // If it's not in our local list yet (e.g. pagination in future), add it
        if (!allProjects.find(p => p.id === id)) {
            allProjects.push(data);
            renderProjectList(allProjects);
        }

        closeLinkIdModal();
        openProject(id);
        alert('Projeto encontrado! Você pode editar os dados agora.');

    } catch (e) {
        console.error(e);
        alert('Erro ao buscar projeto.');
    }
}

// --- PV / ORDER CREATOR LOGIC ---

function initPvCreator() {
    // Generate Checkboxes for PV
    const itemsContainer = document.getElementById('pvItemsContainer');
    itemsContainer.innerHTML = '';
    
    for (const [wName, wPrice] of Object.entries(WIDGETS)) {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; font-size:0.9rem; cursor:pointer; color: var(--text-main);">
                <input type="checkbox" class="pv-item-check" value="${wPrice}" data-name="${wName}" onchange="updatePvTotal()">
                ${wName} (+ R$ ${wPrice})
            </label>
        `;
        itemsContainer.appendChild(div);
    }
    updatePvTotal();
}

function updatePvTotal() {
    const planKey = document.getElementById('pvPlanSelect').value;
    let planPrice = 0;
    let addonsPrice = 0;
    
    // Base Plan Price
    if (planKey && PLANS[planKey]) {
        planPrice = PLANS[planKey].price;
    }

    // Addons Price
    document.querySelectorAll('.pv-item-check:checked').forEach(c => {
        addonsPrice += parseFloat(c.value);
    });

    const total = planPrice + addonsPrice;

    // Update UI
    document.getElementById('pvSummaryPlan').textContent = `R$ ${planPrice.toFixed(2)}`;
    document.getElementById('pvSummaryAddons').textContent = `R$ ${addonsPrice.toFixed(2)}`;
    document.getElementById('pvTotalDisplay').textContent = `R$ ${total.toFixed(2)}`;
}

function sendPvToWhatsApp() {
    const name = document.getElementById('pvName').value;
    const phone = document.getElementById('pvPhone').value;
    const email = document.getElementById('pvEmail').value;
    const payment = document.getElementById('pvPayment').value;
    const planKey = document.getElementById('pvPlanSelect').value;
    
    if (!name || !planKey) {
        alert('Por favor, preencha pelo menos o Nome e selecione um Plano.');
        return;
    }

    const planName = PLANS[planKey].name;
    const planPrice = PLANS[planKey].price;
    
    let itemsList = [];
    // Add Plan Items
    if (PLANS[planKey].items.length > 0) {
        itemsList.push(`*Plano ${planName}:*`);
        PLANS[planKey].items.forEach(i => itemsList.push(`- ${i}`));
    }

    // Add Addons
    const addons = [];
    let addonsTotal = 0;
    document.querySelectorAll('.pv-item-check:checked').forEach(c => {
        const n = c.getAttribute('data-name');
        const p = parseFloat(c.value);
        addons.push(`${n} (R$ ${p})`);
        addonsTotal += p;
    });

    if (addons.length > 0) {
        itemsList.push(``);
        itemsList.push(`*Adicionais:*`);
        addons.forEach(a => itemsList.push(`- ${a}`));
    }

    const total = planPrice + addonsTotal;

    // Format Message
    let msg = `Olá *${name}*, tudo bem?%0A%0A`;
    msg += `Aqui está o resumo do seu pedido na *Vizzu*: %0A%0A`;
    msg += `--------------------------------%0A`;
    msg += itemsList.join('%0A');
    msg += `%0A--------------------------------%0A%0A`;
    msg += `*Valor Total:* R$ ${total.toFixed(2)}%0A`;
    
    if (payment) {
        msg += `*Forma de Pagamento:* ${payment}%0A`;
    }
    
    msg += `%0AFico no aguardo para darmos início! 🚀`;

    // Open WhatsApp
    let targetUrl = `https://wa.me/`;
    if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        targetUrl += `55${cleanPhone}?text=${msg}`;
    } else {
        targetUrl += `?text=${msg}`;
    }
    
    window.open(targetUrl, '_blank');
}

// ============================================
// PREVIEW SYSTEM - Tab Switching & HTML Escape
// ============================================

function switchSnippetTab(index, tab) {
    // Remove active class from all tabs and contents for this snippet
    const tabButtons = document.querySelectorAll(`#snip-${index} .snippet-tab`);
    const contents = document.querySelectorAll(`#snip-${index} .snippet-content`);
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    // Activate selected tab
    if (tab === 'code') {
        tabButtons[0].classList.add('active');
        document.getElementById(`snip-code-${index}`).classList.add('active');
    } else if (tab === 'preview') {
        tabButtons[1].classList.add('active');
        document.getElementById(`snip-preview-${index}`).classList.add('active');
    }
}

function escapeHtml(text) {
    // Escape HTML para uso seguro em atributos
    // Mas mantém o código executável no iframe
    const map = {
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/["']/g, m => map[m]);
}

// ============================================
// CUSTOM CATEGORIES MANAGEMENT
// ============================================

// Array global para armazenar categorias customizadas
let customCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');

function showNewCategoryInput(type) {
    const inputDiv = document.getElementById(`newCategory${type === 'snip' ? 'Snip' : 'Global'}`);
    inputDiv.style.display = 'block';
    document.getElementById(`newCategoryName${type === 'snip' ? 'Snip' : 'Global'}`).focus();
}

function cancelNewCategory(type) {
    const inputDiv = document.getElementById(`newCategory${type === 'snip' ? 'Snip' : 'Global'}`);
    const inputField = document.getElementById(`newCategoryName${type === 'snip' ? 'Snip' : 'Global'}`);
    inputDiv.style.display = 'none';
    inputField.value = '';
}

function addNewCategory(type) {
    const inputField = document.getElementById(`newCategoryName${type === 'snip' ? 'Snip' : 'Global'}`);
    const categoryName = inputField.value.trim();
    
    if (!categoryName) {
        alert('Por favor, digite o nome da categoria');
        return;
    }
    
    // Verificar se já existe
    const selectId = type === 'snip' ? 'snipCategory' : 'globalSnipCategory';
    const select = document.getElementById(selectId);
    const existingOptions = Array.from(select.options).map(opt => opt.value.toLowerCase());
    
    if (existingOptions.includes(categoryName.toLowerCase())) {
        alert('Esta categoria já existe!');
        return;
    }
    
    // Adicionar ao array de categorias customizadas
    if (!customCategories.includes(categoryName)) {
        customCategories.push(categoryName);
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
    }
    
    // Adicionar ao select (antes da opção "Outros")
    const newOption = document.createElement('option');
    newOption.value = categoryName;
    newOption.textContent = categoryName;
    
    // Inserir antes da última opção (Outros)
    const lastOption = select.options[select.options.length - 1];
    select.insertBefore(newOption, lastOption);
    
    // Selecionar a nova categoria
    select.value = categoryName;
    
    // Atualizar também o outro select se existir
    const otherSelectId = type === 'snip' ? 'globalSnipCategory' : 'snipCategory';
    const otherSelect = document.getElementById(otherSelectId);
    if (otherSelect) {
        const otherNewOption = document.createElement('option');
        otherNewOption.value = categoryName;
        otherNewOption.textContent = categoryName;
        const otherLastOption = otherSelect.options[otherSelect.options.length - 1];
        otherSelect.insertBefore(otherNewOption, otherLastOption);
    }
    
    // Limpar e esconder input
    cancelNewCategory(type);
    
    alert(`Categoria "${categoryName}" criada com sucesso!`);
}

// Carregar categorias customizadas ao iniciar
function loadCustomCategories() {
    const selects = ['snipCategory', 'globalSnipCategory'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        customCategories.forEach(categoryName => {
            // Verificar se já existe
            const existingOptions = Array.from(select.options).map(opt => opt.value);
            if (existingOptions.includes(categoryName)) return;
            
            // Adicionar antes da última opção (Outros)
            const newOption = document.createElement('option');
            newOption.value = categoryName;
            newOption.textContent = categoryName;
            const lastOption = select.options[select.options.length - 1];
            select.insertBefore(newOption, lastOption);
        });
    });
}

// Chamar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadCustomCategories, 100);
});
