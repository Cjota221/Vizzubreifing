// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://khoyztycmrryrkbsvhja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZyR1Q69Dg7sIkTR7AhnXeg_5CDqKWsZ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let VIZZU_USER = null;

// --- AUTH & INIT ---

// Check auth status on load
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        VIZZU_USER = session.user;
        showDashboard();
    } else {
        showLogin();
    }
});

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        VIZZU_USER = session.user;
        showDashboard();
    } else {
        VIZZU_USER = null;
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('dashboardView').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('adminUsername').textContent = VIZZU_USER.email;
    loadBriefings();
}

// --- AUTH FUNCTIONS ---

async function handleLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const msgEl = document.getElementById('authMessage');
    
    msgEl.textContent = 'Autenticando...';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(error);
        msgEl.textContent = 'Erro no Login: ' + error.message;
    } else {
        msgEl.textContent = '';
    }
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao sair:', error);
    }
}

// --- DASHBOARD FUNCTIONS ---

async function createNewBriefingProject() {
    const { data: { session } } = await supabase.auth.getSession();
    const VIZZU_USER_ID = session?.user?.id;
    
    if (!VIZZU_USER_ID) {
        await logout();
        alert('Sessão expirada. Faça login novamente.');
        return;
    }
    
    const clientName = document.getElementById('clientName').value;
    const driveLink = document.getElementById('driveLink').value;
    const msgEl = document.getElementById('creationMessage');

    if (!clientName) {
        msgEl.textContent = 'Por favor, insira o nome do cliente.';
        return;
    }
    if (!driveLink) {
        msgEl.textContent = 'Por favor, insira o link da pasta do Drive.';
        return;
    }

    msgEl.textContent = 'Gerando projeto...';

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([
                { 
                    client_name: clientName, 
                    vizzu_user_id: VIZZU_USER_ID,
                    status: 'Link Gerado',
                    briefing_data: {
                        admin_drive_link: driveLink // Store the drive link here
                    }
                }
            ])
            .select();

        if (error) throw error;
        
        const newBriefingId = data[0].id;
        
        // Generate link to briefing.html
        // Robust URL generation for both local file:// and server http://
        let currentUrl = window.location.href;
        let newUrl;
        
        if (currentUrl.indexOf('index.html') > -1) {
            newUrl = currentUrl.replace('index.html', 'briefing.html');
        } else {
            // Assume we are at root
            let path = currentUrl.split('?')[0];
            if (!path.endsWith('/')) path += '/';
            newUrl = path + 'briefing.html';
        }
        
        const newLink = `${newUrl}?id=${newBriefingId}`;
        
        document.getElementById('clientName').value = '';
        document.getElementById('driveLink').value = '';
        
        msgEl.innerHTML = `Link gerado para <strong>${clientName}</strong>!<br>
                           <div class="copy-input" onclick="copyLink('${newLink}')">${newLink}</div>`;
        
        loadBriefings();
    } catch (error) {
        console.error('Erro ao criar projeto:', error);
        if (error.code === '42501') {
            msgEl.textContent = 'Erro de Permissão (RLS).';
        } else {
            msgEl.textContent = 'Erro ao criar projeto: ' + error.message;
        }
    }
}

async function loadBriefings() {
    if (!VIZZU_USER) return;

    const listContainer = document.getElementById('briefingsList');
    listContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);"><i class="fas fa-spinner fa-spin"></i> Buscando projetos...</p>';
    
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('vizzu_user_id', VIZZU_USER.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (projects.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Nenhum projeto gerado ainda.</p>';
            return;
        }

        let html = '';
        projects.forEach(project => {
            // Reconstruct link
            let currentUrl = window.location.href;
            let newUrl;
            
            if (currentUrl.indexOf('index.html') > -1) {
                newUrl = currentUrl.replace('index.html', 'briefing.html');
            } else {
                let path = currentUrl.split('?')[0];
                if (!path.endsWith('/')) path += '/';
                newUrl = path + 'briefing.html';
            }
            const link = `${newUrl}?id=${project.id}`;
            
            const isCompleted = project.status === 'Concluído';
            
            html += `
                <div class="briefing-card" style="border-color: ${isCompleted ? 'var(--neon-green)' : 'var(--glass-border)'};">
                    <h3><i class="fas fa-store"></i> ${project.client_name} <span style="font-size: 0.8em; color: ${isCompleted ? 'var(--neon-green)' : 'var(--neon-purple)'};">(${project.status})</span></h3>
                    <div class="briefing-info"><strong>ID:</strong> ${project.id.substring(0, 8)} | <strong>Criado:</strong> ${new Date(project.created_at).toLocaleDateString()}</div>
                    
                    ${isCompleted ? `
                        <div class="briefing-info" style="color: var(--text-white);">
                            <strong>Email Cliente:</strong> ${project.briefing_data.login_email || 'Não informado'}
                        </div>
                    ` : ''}

                    <div class="briefing-actions">
                        <button class="btn btn-primary-neon" onclick="copyLink('${link}')">
                            <i class="fas fa-copy"></i> Copiar Link
                        </button>
                        ${isCompleted ? 
                            `<button class="btn btn-secondary" onclick="viewBriefingData('${project.id}')">
                                <i class="fas fa-eye"></i> Ver Respostas
                            </button>` : 
                            `<button class="btn btn-secondary" style="opacity: 0.5; cursor: not-allowed;">
                                <i class="fas fa-clock"></i> Aguardando
                            </button>`
                        }
                    </div>
                </div>
            `;
        });
        
        listContainer.innerHTML = html;

    } catch (error) {
        console.error('Erro ao carregar briefings:', error);
        listContainer.innerHTML = `<p style="text-align: center; color: red;">Erro ao carregar briefings: ${error.message}</p>`;
    }
}

// Mapeamento de campos para visualização
const FIELD_MAP = {
    loja_url: '1. Link da Loja FácilZap/Plataforma',
    login_email: '2. Login Criado (E-mail de Colaborador)',
    senha_provisoria: '3. Senha Provisória',
    upload_check: '4. Upload de Arquivos Concluído',
    cores: '5. Paleta de Cores',
    logo_status: '6. Logo em Alta Resolução',
    vibe: '7. Sensação da Loja (Vibe)',
    referencias: '8. Referências Visuais',
    pedido_minimo: '9. Valor do Pedido Mínimo',
    regras_frete: '10. Regras de Frete',
    pagamento: '11. Facilidades de Pagamento',
    produto_estrela: '12. Produto Estrela (Oferta Relâmpago)',
    cupom: '13. Cupom de Primeira Compra',
    destaque_carrossel: '14. Destaque do Carrossel Vitrine',
    video_fachada: '15. Vídeo: Fachada da Loja / Estoque',
    video_equipe: '15. Vídeo: Equipe separando pedidos',
    video_processo: '15. Vídeo: Processo de Fabricação',
    video_dona: '15. Vídeo: Apresentação da Dona',
    prova_social: '16. Prova Social (Feedback de Clientes)',
    whatsapp: '17. WhatsApp de Atendimento',
    endereco: '18. Endereço Físico Completo',
    horario: '19. Horário de Atendimento',
    fator_uau: '20. O Fator UAU (Expectativa Final)',
};

async function viewBriefingData(id) {
    const modal = document.getElementById('briefingDetailsModal');
    const container = document.getElementById('briefingDataContainer');
    
    container.innerHTML = '<p style="text-align: center; color: var(--text-gray);"><i class="fas fa-spinner fa-spin"></i> Buscando dados do briefing...</p>';
    modal.style.display = 'flex';
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('client_name, briefing_data')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        document.getElementById('modalClientName').textContent = data.client_name;
        
        const briefingData = data.briefing_data;
        let html = '';
        
        const sortedKeys = Object.keys(FIELD_MAP);

        sortedKeys.forEach(key => {
            if (briefingData.hasOwnProperty(key)) {
                const title = FIELD_MAP[key];
                let value = briefingData[key];
                
                if (key.startsWith('video_') || key === 'upload_check') {
                    value = value === 'on' || value === 'sim' || (Array.isArray(value) && value.includes('on')) ? 
                        `<span style="color: var(--neon-green); font-weight: 600;">SIM <i class="fas fa-check"></i></span>` : 
                        `<span style="color: var(--neon-purple); font-weight: 600;">NÃO <i class="fas fa-times"></i></span>`;
                } else if (key === 'logo_status') {
                    value = value === 'drive' ? 'No Drive' : 'Pegar do Instagram';
                } else if (key === 'vibe') {
                    const vibeMap = { 'luxo': 'Luxo/Sofisticação', 'preco': 'Preço Baixo/Oportunidade', 'tradicional': 'Confiança/Tradicional', 'moderno': 'Moderno/Jovem' };
                    value = vibeMap[value] || value;
                }

                value = Array.isArray(value) ? value.join(', ') : value;
                
                html += `
                    <div class="detail-item">
                        <div class="detail-title">${title}</div>
                        <div class="detail-value">${value}</div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        container.innerHTML = `<p style="color: red; text-align: center;">Erro: ${error.message}</p>`;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function copyLink(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Link copiado!');
}
