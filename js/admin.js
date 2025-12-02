// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// --- NAVIGATION ---
function showDashboard() {
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('plansView').style.display = 'none';
    document.getElementById('projectDetailView').style.display = 'none';
    loadProjects();
}

function showPlans() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('plansView').style.display = 'block';
    document.getElementById('projectDetailView').style.display = 'none';
    initPvCreator();
}

// --- OPEN PROJECT ---
async function openProject(id) {
    currentProject = allProjects.find(p => p.id === id);
    if (!currentProject) return;

    // Hide List, Show Detail
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('plansView').style.display = 'none';
    document.getElementById('projectDetailView').style.display = 'block';

    renderProjectDetails();
}

function closeProject() {
    currentProject = null;
    showDashboard();
}

// --- RENDER DETAILS ---
function renderProjectDetails() {
    const p = currentProject;
    const data = p.briefing_data || {};
    const admin = p.admin_data || {};

    // Header
    document.getElementById('detailTitle').textContent = data.nome_loja || p.client_name || 'Projeto Sem Nome';
    document.getElementById('detailSubtitle').textContent = p.client_name || data.responsavel_nome || 'Cliente';
    
    // Generate Briefing Link
    const link = `${window.location.href.replace('index.html', '').replace(/\/$/, '')}/briefing.html?id=${p.id}`;
    document.getElementById('briefingLinkInput').value = link;

    // Client Info (Editable)
    document.getElementById('infoName').value = p.client_name || data.responsavel_nome || '';
    document.getElementById('infoStore').value = data.nome_loja || '';
    document.getElementById('infoPhone').value = data.responsavel_whatsapp || '';
    document.getElementById('infoEmail').value = data.responsavel_email || '';
    document.getElementById('infoLogo').value = data.logo_url || '';
    
    // WhatsApp Link
    const waLink = document.getElementById('waLink');
    const phone = data.responsavel_whatsapp || '';
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

    const payment = document.getElementById('adminPayment').value;
    const startDate = document.getElementById('adminStartDate').value;
    const status = document.getElementById('adminStatus').value;
    
    // Editable Client Info
    const clientName = document.getElementById('infoName').value;
    const storeName = document.getElementById('infoStore').value;
    const phone = document.getElementById('infoPhone').value;
    const email = document.getElementById('infoEmail').value;
    const logoUrl = document.getElementById('infoLogo').value;

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
