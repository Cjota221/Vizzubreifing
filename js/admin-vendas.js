// admin-vendas.js — Propostas, Leads, Cupons (dbVendas)
var dbVendas = window.dbVendas;

const WPP_NUMBER = '5562982237075';

var allPropostas = [];
var allLeads = [];
var allCupons = [];

// ============================
// PROPOSTAS
// ============================

async function loadPropostas() {
    const body = document.getElementById('propostasBody');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Carregando...</td></tr>';

    try {
        const { data, error } = await dbVendas
            .from('propostas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allPropostas = data || [];
        renderPropostas();
    } catch (e) {
        console.error('[VENDAS] Erro propostas:', e);
        body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Erro ao carregar. Verifique a tabela "propostas" no Supabase.</td></tr>';
    }
}

function renderPropostas() {
    const body = document.getElementById('propostasBody');
    if (!body) return;

    // Stats
    const total = allPropostas.length;
    const pendentes = allPropostas.filter(p => !p.status || p.status === 'Pendente').length;
    const aprovadas = allPropostas.filter(p => p.status === 'Aprovada').length;
    const valor = allPropostas.reduce((sum, p) => sum + (p.valor_final || 0), 0);

    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('pStatTotal', total);
    setEl('pStatPendentes', pendentes);
    setEl('pStatAprovadas', aprovadas);
    setEl('pStatValor', 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 }));

    if (!allPropostas.length) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma proposta ainda.</td></tr>';
        return;
    }

    body.innerHTML = allPropostas.map(p => {
        const status = p.status || 'Pendente';
        const statusColor = status === 'Aprovada' ? 'var(--secondary)' : status === 'Recusada' ? 'var(--orange)' : '#9A5A00';
        const statusBg = status === 'Aprovada' ? 'rgba(200,255,61,.2)' : status === 'Recusada' ? 'rgba(255,90,54,.1)' : '#FFF4DB';
        const data = new Date(p.created_at).toLocaleDateString('pt-BR');
        const valor = (p.valor_final || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const desconto = p.desconto_total ? `− ${p.desconto_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '—';
        const phone = (p.whatsapp || '').replace(/\D/g, '');

        return `<tr>
            <td><strong>${p.nome_cliente || '—'}</strong></td>
            <td><a href="https://wa.me/55${phone}" target="_blank" style="color:var(--secondary);text-decoration:none;">${p.whatsapp || '—'}</a></td>
            <td style="font-weight:700;color:var(--secondary);">${valor}</td>
            <td style="color:var(--orange);">${desconto}</td>
            <td><span class="status-badge" style="background:${statusBg};color:${statusColor};">${status}</span></td>
            <td style="color:var(--text-muted);">${data}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-wpp" onclick="enviarPropostaWpp('${p.id}')" title="WhatsApp">
                        <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;display:inline;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                        WPP
                    </button>
                    <button onclick="marcarStatus('${p.id}', 'Aprovada')" title="Aprovar">✓</button>
                    <button class="del-btn" onclick="excluirProposta('${p.id}')" title="Excluir">✕</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openNovaPropostaModal() {
    document.getElementById('novaPropostaModal').classList.add('open');
    document.getElementById('npNome').value = '';
    document.getElementById('npPhone').value = '';
    document.getElementById('npPlano').value = '';
    document.getElementById('npCupom').value = '';
    document.getElementById('npPix').checked = false;
    document.querySelectorAll('.np-item').forEach(c => c.checked = false);
    updatePropostaTotal();
}

function updatePropostaTotal() {
    const planoEl = document.getElementById('npPlano');
    const planoPrice = planoEl.options[planoEl.selectedIndex]?.dataset?.price || 0;
    let subtotal = parseFloat(planoPrice);

    document.querySelectorAll('.np-item:checked').forEach(c => {
        subtotal += parseFloat(c.value);
    });

    let desconto = 0;
    const cupom = document.getElementById('npCupom').value.trim().toUpperCase();
    const pix = document.getElementById('npPix').checked;

    // Check coupon
    if (cupom) {
        const found = allCupons.find(c => c.codigo && c.codigo.toUpperCase() === cupom);
        if (found && found.desconto_pct) {
            desconto += subtotal * (found.desconto_pct / 100);
        }
    }
    if (pix) desconto += subtotal * 0.05;

    const total = Math.max(0, subtotal - desconto);

    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('npSubtotal', fmt(subtotal));
    setEl('npDesconto', '— ' + fmt(desconto));
    setEl('npTotal', fmt(total));

    window._propostaCalc = { subtotal, desconto, total, cupom, pix };
}

async function salvarProposta() {
    const nome = document.getElementById('npNome').value.trim();
    const phone = document.getElementById('npPhone').value.trim();
    if (!nome) return alert('Nome do cliente é obrigatório.');

    const planoEl = document.getElementById('npPlano');
    const plano = planoEl.options[planoEl.selectedIndex]?.text || '';
    const itens = [...document.querySelectorAll('.np-item:checked')].map(c => c.dataset.name);
    const calc = window._propostaCalc || { subtotal: 0, desconto: 0, total: 0 };

    try {
        const { error } = await dbVendas.from('propostas').insert([{
            nome_cliente: nome,
            whatsapp: phone,
            plano,
            itens,
            valor_subtotal: calc.subtotal,
            desconto_total: calc.desconto,
            valor_final: calc.total,
            cupom_usado: calc.cupom || null,
            pix: calc.pix,
            status: 'Pendente'
        }]);
        if (error) throw error;
        alert('Proposta salva!');
        document.getElementById('novaPropostaModal').classList.remove('open');
        loadPropostas();

        // Increment coupon usage
        if (calc.cupom) {
            const found = allCupons.find(c => c.codigo && c.codigo.toUpperCase() === calc.cupom);
            if (found) {
                await dbVendas.from('cupons').update({ usos: (found.usos || 0) + 1, valor_gerado: (found.valor_gerado || 0) + calc.total }).eq('id', found.id);
            }
        }
    } catch (e) {
        console.error('[VENDAS] Erro salvar proposta:', e);
        alert('Erro ao salvar: ' + e.message);
    }
}

function salvarPropostaWpp() {
    const nome = document.getElementById('npNome').value.trim();
    const phone = (document.getElementById('npPhone').value || '').replace(/\D/g, '');
    const planoEl = document.getElementById('npPlano');
    const plano = planoEl.options[planoEl.selectedIndex]?.text || '';
    const itens = [...document.querySelectorAll('.np-item:checked')].map(c => c.dataset.name);
    const calc = window._propostaCalc || { subtotal: 0, desconto: 0, total: 0 };
    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let msg = `Olá *${nome || 'cliente'}*, tudo bem?%0A%0A`;
    msg += `Segue o resumo da sua proposta *VIZZU Digital*:%0A%0A`;
    msg += `*Plano:* ${plano}%0A`;
    if (itens.length) msg += `*Adicionais:* ${itens.join(', ')}%0A`;
    msg += `*Subtotal:* ${fmt(calc.subtotal)}%0A`;
    if (calc.desconto > 0) msg += `*Desconto:* − ${fmt(calc.desconto)}%0A`;
    msg += `%0A*TOTAL: ${fmt(calc.total)}* 🎯%0A%0AFico no aguardo para darmos início! 🚀`;

    const target = phone ? `55${phone}` : WPP_NUMBER;
    window.open(`https://wa.me/${target}?text=${msg}`, '_blank');
}

async function enviarPropostaWpp(id) {
    const p = allPropostas.find(x => x.id === id);
    if (!p) return;
    const phone = (p.whatsapp || '').replace(/\D/g, '');
    const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let msg = `Olá *${p.nome_cliente}*, tudo bem?%0A%0A`;
    msg += `Segue o resumo da sua proposta *VIZZU Digital*:%0A%0A`;
    msg += `*Plano:* ${p.plano || ''}%0A`;
    if (p.itens?.length) msg += `*Adicionais:* ${p.itens.join(', ')}%0A`;
    msg += `*Total:* ${fmt(p.valor_final)} 🎯%0A%0AFico no aguardo! 🚀`;

    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
}

async function marcarStatus(id, status) {
    try {
        await dbVendas.from('propostas').update({ status }).eq('id', id);
        const p = allPropostas.find(x => x.id === id);
        if (p) p.status = status;
        renderPropostas();
    } catch (e) {
        alert('Erro: ' + e.message);
    }
}

async function excluirProposta(id) {
    if (!confirm('Excluir esta proposta?')) return;
    try {
        await dbVendas.from('propostas').delete().eq('id', id);
        allPropostas = allPropostas.filter(p => p.id !== id);
        renderPropostas();
    } catch (e) {
        alert('Erro: ' + e.message);
    }
}

// ============================
// LEADS
// ============================

async function loadLeads() {
    const el = document.getElementById('leadsList');
    if (!el) return;
    el.innerHTML = '<div class="loading-state">Carregando leads...</div>';

    try {
        const { data, error } = await dbVendas
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allLeads = data || [];
        renderLeads(allLeads);
    } catch (e) {
        console.error('[VENDAS] Erro leads:', e);
        el.innerHTML = '<div class="empty-state">Erro ao carregar leads. Verifique a tabela "leads" no Supabase.</div>';
    }
}

function renderLeads(leads) {
    const el = document.getElementById('leadsList');
    if (!el) return;

    if (!leads.length) {
        el.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>Nenhum lead capturado ainda.</p></div>';
        return;
    }

    el.innerHTML = leads.map(l => {
        const initials = (l.nome || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        const phone = (l.telefone || l.whatsapp || '').replace(/\D/g, '');
        const data = l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '';

        return `<div class="lead-item">
            <div class="lead-avatar">${initials}</div>
            <div class="lead-info">
                <strong>${l.nome || '—'}</strong>
                <span>${l.telefone || l.whatsapp || ''} ${l.email ? '· ' + l.email : ''}</span>
            </div>
            <div class="lead-date">${data}</div>
            <div class="table-actions" style="margin-left:12px;">
                ${phone ? `<button class="btn-wpp" onclick="window.open('https://wa.me/55${phone}','_blank')">WPP</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function filterLeads() {
    const q = (document.getElementById('leadSearch')?.value || '').toLowerCase();
    if (!q) { renderLeads(allLeads); return; }
    const filtered = allLeads.filter(l =>
        (l.nome || '').toLowerCase().includes(q) ||
        (l.telefone || '').toLowerCase().includes(q) ||
        (l.whatsapp || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
    );
    renderLeads(filtered);
}

function exportLeadsCSV() {
    if (!allLeads.length) return alert('Nenhum lead para exportar.');
    const headers = ['Nome', 'Telefone', 'Email', 'Cupom', 'Data'];
    const rows = allLeads.map(l => [
        l.nome || '', l.telefone || l.whatsapp || '', l.email || '', l.cupom || '',
        l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_vizzu_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================
// CUPONS
// ============================

async function loadCupons() {
    const el = document.getElementById('cuponsList');
    if (!el) return;
    el.innerHTML = '<div class="loading-state">Carregando cupons...</div>';

    try {
        const { data, error } = await dbVendas
            .from('cupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allCupons = data || [];
        renderCupons();
    } catch (e) {
        console.error('[VENDAS] Erro cupons:', e);
        el.innerHTML = '<div class="empty-state">Erro ao carregar. Verifique a tabela "cupons" no Supabase.</div>';
    }
}

function renderCupons() {
    const el = document.getElementById('cuponsList');
    if (!el) return;

    if (!allCupons.length) {
        el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Nenhum cupom criado ainda.</p></div>';
        return;
    }

    el.innerHTML = allCupons.map(c => `
        <div class="coupon-card">
            <div class="coupon-code">${c.codigo || '—'}</div>
            <div class="coupon-detail">${c.desconto_pct || 0}% de desconto${c.indicador ? ' · Indicação: ' + c.indicador : ''}</div>
            <div class="coupon-stats">
                <div class="coupon-stat">
                    <div class="label">Usos</div>
                    <div class="value">${c.usos || 0}</div>
                </div>
                <div class="coupon-stat">
                    <div class="label">Valor Gerado</div>
                    <div class="value">${(c.valor_gerado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
            </div>
            <div style="margin-top:14px;display:flex;gap:8px;">
                <button onclick="copiarCupom('${c.codigo}')" style="flex:1;padding:8px;background:rgba(200,255,61,.15);border:1px solid rgba(74,122,0,.2);border-radius:9999px;font-size:12px;font-weight:600;color:var(--secondary);cursor:pointer;">Copiar</button>
                <button onclick="excluirCupom('${c.id}')" style="padding:8px 12px;background:transparent;border:1px solid #ffd3ca;border-radius:9999px;font-size:12px;font-weight:600;color:var(--orange);cursor:pointer;">Excluir</button>
            </div>
        </div>
    `).join('');
}

function openNovoCupomModal() {
    document.getElementById('novoCupomModal').classList.add('open');
    document.getElementById('ncCodigo').value = '';
    document.getElementById('ncDesconto').value = '';
    document.getElementById('ncIndicador').value = '';
}

async function salvarCupom() {
    const codigo = document.getElementById('ncCodigo').value.trim().toUpperCase();
    const pct = parseFloat(document.getElementById('ncDesconto').value);
    const indicador = document.getElementById('ncIndicador').value.trim();

    if (!codigo) return alert('Código é obrigatório.');
    if (!pct || pct < 1 || pct > 100) return alert('Desconto deve ser entre 1% e 100%.');

    try {
        const { error } = await dbVendas.from('cupons').insert([{
            codigo,
            desconto_pct: pct,
            indicador: indicador || null,
            usos: 0,
            valor_gerado: 0
        }]);
        if (error) throw error;
        alert('Cupom criado!');
        document.getElementById('novoCupomModal').classList.remove('open');
        loadCupons();
    } catch (e) {
        alert('Erro: ' + e.message);
    }
}

function copiarCupom(codigo) {
    navigator.clipboard.writeText(codigo).then(() => alert('Cupom copiado: ' + codigo));
}

async function excluirCupom(id) {
    if (!confirm('Excluir este cupom?')) return;
    try {
        await dbVendas.from('cupons').delete().eq('id', id);
        allCupons = allCupons.filter(c => c.id !== id);
        renderCupons();
    } catch (e) {
        alert('Erro: ' + e.message);
    }
}
