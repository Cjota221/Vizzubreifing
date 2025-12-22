// --- TECH LIBRARY (GLOBAL SNIPPETS) ---
// Usa a instância do supabase criada em admin.js
const supabase = window.supabaseClient;

let globalSnippets = [];
let currentFilter = 'all';
let editingGlobalSnippetId = null;

async function loadTechLibrary() {
    try {
        const { data, error } = await supabase
            .from('global_snippets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        globalSnippets = data || [];
        renderTechLibrary();
    } catch (e) {
        console.error('Erro ao carregar biblioteca:', e);
        document.getElementById('techLibraryList').innerHTML = '<p style="color: var(--text-muted);">Erro ao carregar códigos. Verifique se a tabela "global_snippets" existe no banco.</p>';
    }
}

function renderTechLibrary() {
    const container = document.getElementById('techLibraryList');
    container.innerHTML = '';

    let filtered = currentFilter === 'all' 
        ? globalSnippets 
        : globalSnippets.filter(s => s.category === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 3rem;">Nenhum código nesta categoria ainda.</p>';
        return;
    }

    // Group by category
    const categories = {};
    filtered.forEach(snip => {
        const cat = snip.category || 'Outros';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(snip);
    });

    Object.keys(categories).sort().forEach(cat => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.marginBottom = '2rem';
        
        const categoryHeader = document.createElement('h4');
        categoryHeader.style.cssText = 'color: var(--secondary); font-size: 1.1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.5rem;';
        categoryHeader.innerHTML = `<i class="fas fa-folder-open"></i> ${cat} (${categories[cat].length})`;
        categoryDiv.appendChild(categoryHeader);

        categories[cat].forEach(snip => {
            const card = document.createElement('div');
            card.className = 'snippet-item';
            
            // Verificar se é HTML/CSS/JS para mostrar preview
            const hasPreview = ['HTML', 'CSS', 'JavaScript'].includes(snip.type);
            
            card.innerHTML = `
                <div class="snippet-header" onclick="toggleGlobalSnippet('${snip.id}')">
                    <div style="display:flex; align-items:center; gap:10px; flex: 1;">
                        <strong>${snip.title}</strong>
                        <small style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${snip.type}</small>
                    </div>
                    <div onclick="event.stopPropagation()" style="display: flex; gap: 5px;">
                        <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="editGlobalSnippet('${snip.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteGlobalSnippet('${snip.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="snippet-body" id="global-snip-${snip.id}" style="display:none;">
                    ${snip.description ? `<p style="color: var(--text-muted); margin-bottom: 1rem; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;">${snip.description}</p>` : ''}
                    
                    ${hasPreview ? `
                    <div class="snippet-tabs">
                        <button class="snippet-tab active" onclick="switchGlobalSnippetTab('${snip.id}', 'code')">
                            <i class="fas fa-code"></i> Ver Código
                        </button>
                        <button class="snippet-tab" onclick="switchGlobalSnippetTab('${snip.id}', 'preview')">
                            <i class="fas fa-eye"></i> Ver Resultado
                        </button>
                    </div>
                    ` : ''}
                    
                    <div class="snippet-content active" id="global-snip-code-${snip.id}">
                        <textarea readonly>${snip.code}</textarea>
                        <button class="btn-copy" onclick="copyCode(this)">Copiar</button>
                    </div>
                    
                    ${hasPreview ? `
                    <div class="snippet-content" id="global-snip-preview-${snip.id}">
                        <div class="preview-container">
                            <div class="preview-info">
                                <i class="fas fa-info-circle"></i>
                                <strong>Preview Isolado:</strong> Este código está renderizado em um ambiente isolado (iframe) para não interferir nos estilos da página.
                            </div>
                            <iframe class="snippet-preview" srcdoc="${escapeHtmlForTechLib(snip.code)}"></iframe>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            categoryDiv.appendChild(card);
        });

        container.appendChild(categoryDiv);
    });
}

function toggleGlobalSnippet(id) {
    const el = document.getElementById(`global-snip-${id}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function filterTechLibrary(category) {
    currentFilter = category;
    
    // Update button styles
    document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--secondary)';
    });
    const activeBtn = document.getElementById(`filter-${category}`);
    if (activeBtn) {
        activeBtn.style.background = 'rgba(213, 0, 249, 0.15)';
        activeBtn.style.borderColor = 'var(--secondary)';
    }
    
    renderTechLibrary();
}

function showAddGlobalSnippetModal() {
    editingGlobalSnippetId = null;
    document.getElementById('globalSnipCategory').value = 'Carrinho';
    document.getElementById('globalSnipTitle').value = '';
    document.getElementById('globalSnipDescription').value = '';
    document.getElementById('globalSnipType').value = 'HTML';
    document.getElementById('globalSnipCode').value = '';
    document.querySelector('#globalSnippetModal h3').textContent = 'Adicionar Código Global';
    document.getElementById('globalSnippetModal').style.display = 'flex';
}

function editGlobalSnippet(id) {
    const snip = globalSnippets.find(s => s.id === id);
    if (!snip) return;

    editingGlobalSnippetId = id;
    document.getElementById('globalSnipCategory').value = snip.category || 'Outros';
    document.getElementById('globalSnipTitle').value = snip.title;
    document.getElementById('globalSnipDescription').value = snip.description || '';
    document.getElementById('globalSnipType').value = snip.type;
    document.getElementById('globalSnipCode').value = snip.code;
    document.querySelector('#globalSnippetModal h3').textContent = 'Editar Código Global';
    document.getElementById('globalSnippetModal').style.display = 'flex';
}

function closeGlobalSnippetModal() {
    document.getElementById('globalSnippetModal').style.display = 'none';
}

async function saveGlobalSnippet() {
    const category = document.getElementById('globalSnipCategory').value;
    const title = document.getElementById('globalSnipTitle').value;
    const description = document.getElementById('globalSnipDescription').value;
    const type = document.getElementById('globalSnipType').value;
    const code = document.getElementById('globalSnipCode').value;

    if (!title || !code) return alert('Preencha pelo menos título e código');

    try {
        if (editingGlobalSnippetId) {
            // Update
            const { error } = await supabase
                .from('global_snippets')
                .update({ category, title, description, type, code, updated_at: new Date().toISOString() })
                .eq('id', editingGlobalSnippetId);
            
            if (error) throw error;
            alert('Código atualizado!');
        } else {
            // Insert
            const { error } = await supabase
                .from('global_snippets')
                .insert([{ category, title, description, type, code }]);
            
            if (error) throw error;
            alert('Código adicionado à biblioteca!');
        }
        
        closeGlobalSnippetModal();
        loadTechLibrary();
    } catch (e) {
        console.error('Erro ao salvar:', e);
        alert('Erro ao salvar código: ' + e.message);
    }
}

async function deleteGlobalSnippet(id) {
    if (!confirm('Tem certeza que deseja EXCLUIR este código da biblioteca?')) return;
    
    try {
        const { error } = await supabase
            .from('global_snippets')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Código excluído!');
        loadTechLibrary();
    } catch (e) {
        console.error('Erro ao excluir:', e);
        alert('Erro ao excluir código');
    }
}

// ============================================
// PREVIEW SYSTEM - Tab Switching & HTML Escape
// ============================================

function switchGlobalSnippetTab(id, tab) {
    // Remove active class from all tabs and contents for this snippet
    const tabButtons = document.querySelectorAll(`#global-snip-${id} .snippet-tab`);
    const contents = document.querySelectorAll(`#global-snip-${id} .snippet-content`);
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    // Activate selected tab
    if (tab === 'code') {
        tabButtons[0].classList.add('active');
        document.getElementById(`global-snip-code-${id}`).classList.add('active');
    } else if (tab === 'preview') {
        tabButtons[1].classList.add('active');
        document.getElementById(`global-snip-preview-${id}`).classList.add('active');
    }
}

function escapeHtmlForTechLib(text) {
    // Escape HTML para uso seguro em atributos
    // Mas mantém o código executável no iframe
    const map = {
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/["']/g, m => map[m]);
}
