// ============================================================
// FACILZAP LEADS — Diretório de lojas para prospecção
// ============================================================
(function () {

    // ---- State ----
    var fzPage       = 1;
    var FZ_PER_PAGE  = 20;
    var fzTotal      = 0;
    var fzSearchTimer = null;

    // ---- Expose to global scope ----
    window.loadFacilzapLeads  = loadFacilzapLeads;
    window.fzChangePage       = fzChangePage;
    window.fzSearchDebounce   = fzSearchDebounce;
    window.fzApplyFilters     = fzApplyFilters;
    window.fzResetFilters     = fzResetFilters;
    window.fzImportCSVFile    = fzImportCSVFile;

    // ---- Init ----
    async function loadFacilzapLeads() {
        await Promise.all([loadEstados(), loadGlobalStats()]);
        await fetchLojas();
    }

    // Popula o dropdown de estados com valores únicos da tabela
    async function loadEstados() {
        try {
            const { data } = await window.dbBriefing
                .from('facilzap_lojas')
                .select('estado')
                .not('estado', 'is', null)
                .order('estado');

            const estados = [...new Set((data || []).map(r => r.estado).filter(Boolean))].sort();
            const sel = document.getElementById('fzEstadoFilter');
            if (!sel) return;
            while (sel.options.length > 1) sel.remove(1);
            estados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = e;
                sel.appendChild(opt);
            });
        } catch (_) { /* tabela pode não existir ainda */ }
    }

    // Carrega totais globais (independente de filtros)
    async function loadGlobalStats() {
        try {
            const [
                { count: total },
                { count: verificadas },
                { count: diamante },
                { count: cupom }
            ] = await Promise.all([
                window.dbBriefing.from('facilzap_lojas').select('*', { count: 'exact', head: true }),
                window.dbBriefing.from('facilzap_lojas').select('*', { count: 'exact', head: true }).eq('loja_verificada', 'Sim'),
                window.dbBriefing.from('facilzap_lojas').select('*', { count: 'exact', head: true }).eq('nivel_nome', 'Diamante'),
                window.dbBriefing.from('facilzap_lojas').select('*', { count: 'exact', head: true }).eq('selo_cupons', 'Sim')
            ]);

            setText('fzStatTotal',      fmt(total));
            setText('fzStatVerificadas', verificadas ? fmt(verificadas) : '—');
            setText('fzStatDiamante',    diamante    ? fmt(diamante)    : '—');
            setText('fzStatCupom',       cupom       ? fmt(cupom)       : '—');
        } catch (_) { /* silently skip */ }
    }

    // ---- Fetch paginado com filtros ----
    async function fetchLojas() {
        const busca       = val('fzSearch').trim();
        const nivel       = val('fzNivelFilter');
        const estado      = val('fzEstadoFilter');
        const ordenacao   = val('fzOrdemFilter') || 'visualizacoes';
        const freteGratis = chk('fzFreteGratis');
        const cashback    = chk('fzCashback');
        const revendPro   = chk('fzRevendedorPro');
        const afiliados   = chk('fzAfiliados');
        const verificadas = chk('fzVerificadas');

        const from = (fzPage - 1) * FZ_PER_PAGE;
        const to   = from + FZ_PER_PAGE - 1;

        const grid = document.getElementById('fzGrid');
        if (grid) grid.innerHTML = '<div class="loading-state">Carregando lojas...</div>';

        const ORDER_MAP = {
            visualizacoes: 'total_visualizacoes',
            pedidos:       'total_pedidos',
            seguidores:    'total_seguidores',
            avaliacoes:    'total_avaliacoes',
            recentes:      'created_at'
        };
        const orderCol = ORDER_MAP[ordenacao] || 'total_visualizacoes';

        try {
            let q = window.dbBriefing
                .from('facilzap_lojas')
                .select('*', { count: 'exact' })
                .order(orderCol, { ascending: false, nullsFirst: false })
                .range(from, to);

            if (busca)      q = q.ilike('nome', '%' + busca + '%');
            if (nivel)      q = q.eq('nivel_nome', nivel);
            if (estado)     q = q.eq('estado', estado);
            if (freteGratis) q = q.eq('selo_frete_gratis', 'Sim');
            if (cashback)   q = q.eq('selo_cashback', 'Sim');
            if (revendPro)  q = q.eq('selo_revendedor_pro', 'Sim');
            if (afiliados)  q = q.eq('selo_afiliados', 'Sim');
            if (verificadas) q = q.eq('loja_verificada', 'Sim');

            const { data, count, error } = await q;

            if (error) {
                if (grid) grid.innerHTML = '<div class="empty-state">' +
                    '<strong>Tabela não encontrada.</strong><br>' +
                    '<small>Execute o SQL em <code>sql/facilzap_lojas.sql</code> no painel do Supabase e importe o CSV.</small>' +
                    '</div>';
                return;
            }

            fzTotal = count || 0;
            renderLojas(data || []);
            renderPagination();
        } catch (e) {
            if (grid) grid.innerHTML = '<div class="empty-state">Erro: ' + escHtml(e.message) + '</div>';
        }
    }

    // ---- Render cards ----
    function renderLojas(lojas) {
        const grid = document.getElementById('fzGrid');
        if (!grid) return;
        if (!lojas.length) {
            grid.innerHTML = '<div class="empty-state">Nenhuma loja encontrada com esses filtros.</div>';
            return;
        }
        grid.innerHTML = lojas.map(renderCard).join('');
    }

    const NIVEL_EMOJI = { Bronze: '🥉', Prata: '🥈', Ouro: '🥇', Platina: '💠', Diamante: '💎' };
    const NIVEL_STYLE = {
        Bronze:   'background:rgba(234,88,12,.12);color:#9a3412;',
        Prata:    'background:rgba(100,116,139,.12);color:#475569;',
        Ouro:     'background:rgba(202,138,4,.12);color:#854d0e;',
        Platina:  'background:rgba(37,99,235,.12);color:#1e3a8a;',
        Diamante: 'background:rgba(126,34,206,.12);color:#581c87;'
    };

    function nivelBadge(nivel) {
        if (!nivel) return '';
        const st = NIVEL_STYLE[nivel] || 'background:rgba(100,116,139,.12);color:#475569;';
        return '<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;' + st + '">' +
               (NIVEL_EMOJI[nivel] || '') + ' ' + escHtml(nivel) + '</span>';
    }

    function fmtNum(n) {
        if (n == null || n === '') return null;
        const num = Number(n);
        if (isNaN(num) || num === 0) return null;
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return Math.round(num / 1e3) + 'K';
        return num.toLocaleString('pt-BR');
    }

    function renderCard(l) {
        const selos = [
            l.selo_cupons === 'Sim'              ? '🎟 Cupom' : '',
            l.selo_cashback === 'Sim'            ? '💰 Cashback' + (l.cashback_porcentagem ? ' ' + l.cashback_porcentagem : '') : '',
            l.selo_frete_gratis === 'Sim'        ? '🚚 Frete Grátis' : '',
            l.selo_brindes === 'Sim'             ? '🎁 Brindes' : '',
            l.selo_desconto_progressivo === 'Sim'? '📉 Desc. Progressivo' : '',
            l.selo_revendedor_pro === 'Sim'      ? '⭐ Revendedor Pro' : '',
            l.selo_afiliados === 'Sim'           ? '🔗 Afiliados' + (l.comissao_afiliado ? ' ' + l.comissao_afiliado : '') : ''
        ].filter(Boolean);

        const views    = fmtNum(l.total_visualizacoes);
        const pedidos  = fmtNum(l.total_pedidos);
        const segs     = fmtNum(l.total_seguidores);
        const avals    = fmtNum(l.total_avaliacoes);
        const hasMetrics = views || pedidos || segs || avals;

        const metricItem = (icon, val, label) =>
            val ? '<span>' + icon + ' ' + val + ' ' + label + '</span>' : '';

        const selosBadges = selos.map(s =>
            '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:var(--parchment);border:1px solid var(--stone);color:var(--graphite);">' + s + '</span>'
        ).join('');

        const waBtn = l.whatsapp
            ? '<a href="https://api.whatsapp.com/send?phone=' + encodeURIComponent(l.whatsapp) + '" target="_blank" rel="noopener" class="btn-secondary" style="width:auto;padding:7px 12px;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:5px;">' +
              '<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>' +
              'WhatsApp</a>'
            : '';

        const igBtn = l.instagram
            ? '<a href="https://instagram.com/' + encodeURIComponent(l.instagram) + '" target="_blank" rel="noopener" class="btn-secondary" style="width:auto;padding:7px 12px;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:5px;">📸 Instagram</a>'
            : '';

        const lojaBtn = l.url_loja
            ? '<a href="' + escAttr(l.url_loja) + '" target="_blank" rel="noopener" class="btn-secondary" style="width:auto;padding:7px 12px;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:5px;">🏪 Ver Loja</a>'
            : '';

        return '<div class="panel" style="margin-bottom:12px;padding:18px 20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">' +
                    '<strong style="font-size:15px;">' + escHtml(l.nome || l.slug || '—') + '</strong>' +
                    nivelBadge(l.nivel_nome) +
                    (l.loja_verificada === 'Sim' ? '<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:rgba(22,163,74,.12);color:#14532d;">✓ Verificada</span>' : '') +
                '</div>' +
                (l.estado ? '<div style="font-size:12px;color:var(--graphite);margin-bottom:6px;">📍 ' + escHtml(l.estado) + '</div>' : '') +
                (hasMetrics ? '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--graphite);margin-bottom:8px;">' +
                    metricItem('👁', views, 'views') +
                    metricItem('📦', pedidos, 'pedidos') +
                    metricItem('👥', segs, 'seg.') +
                    (avals ? '<span>⭐ ' + avals + ' aval.' + (l.nota_media ? ' · ' + Number(l.nota_media).toFixed(1) : '') + '</span>' : '') +
                '</div>' : '') +
                (selos.length ? '<div style="display:flex;gap:5px;flex-wrap:wrap;">' + selosBadges + '</div>' : '') +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">' +
                waBtn + igBtn + lojaBtn +
            '</div>' +
            '</div>' +
            '</div>';
    }

    // ---- Paginação ----
    function renderPagination() {
        const totalPages = Math.ceil(fzTotal / FZ_PER_PAGE);
        const el = document.getElementById('fzPagination');
        if (!el) return;
        if (totalPages <= 1) { el.innerHTML = ''; return; }

        const prevDisabled = fzPage <= 1         ? 'disabled style="opacity:.4;pointer-events:none;"' : '';
        const nextDisabled = fzPage >= totalPages ? 'disabled style="opacity:.4;pointer-events:none;"' : '';

        el.innerHTML =
            '<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-top:24px;">' +
            '<button class="btn-secondary" style="width:auto;padding:8px 18px;" onclick="fzChangePage(' + (fzPage - 1) + ')" ' + prevDisabled + '>← Anterior</button>' +
            '<span style="font-size:13px;color:var(--graphite);">Página ' + fzPage + ' de ' + totalPages + ' · ' + fzTotal.toLocaleString('pt-BR') + ' lojas</span>' +
            '<button class="btn-secondary" style="width:auto;padding:8px 18px;" onclick="fzChangePage(' + (fzPage + 1) + ')" ' + nextDisabled + '>Próxima →</button>' +
            '</div>';
    }

    // ---- Handlers públicos ----
    function fzChangePage(p) {
        const totalPages = Math.ceil(fzTotal / FZ_PER_PAGE);
        if (p < 1 || p > totalPages) return;
        fzPage = p;
        fetchLojas();
        var view = document.getElementById('facilzapView');
        if (view) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function fzSearchDebounce() {
        clearTimeout(fzSearchTimer);
        fzSearchTimer = setTimeout(function () { fzPage = 1; fetchLojas(); }, 300);
    }

    function fzApplyFilters() { fzPage = 1; fetchLojas(); }

    function fzResetFilters() {
        ['fzSearch'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
        ['fzNivelFilter','fzEstadoFilter','fzOrdemFilter'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.selectedIndex = 0;
        });
        ['fzFreteGratis','fzCashback','fzRevendedorPro','fzAfiliados','fzVerificadas'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.checked = false;
        });
        fzPage = 1;
        fetchLojas();
    }

    // Colunas válidas da tabela — extras do CSV são ignoradas silenciosamente.
    var KNOWN_COLS = new Set([
        'slug','nome','whatsapp','instagram','facebook','url_loja',
        'nivel_nome','estado','email','website','endereco','cep',
        'total_pedidos','total_visualizacoes','total_seguidores',
        'total_avaliacoes','nota_media','pedido_minimo',
        'loja_verificada','selo_cupons','selo_cashback','cashback_porcentagem',
        'selo_frete_gratis','frete_gratis_valor_minimo','selo_brindes',
        'selo_desconto_progressivo','desconto_progressivo_maximo',
        'selo_revendedor_pro','selo_afiliados','comissao_afiliado',
        'total_curtidas','total_perguntas','descricao','data_entrada_facilzap'
    ]);

    // Colunas que o Postgres espera como numeric — qualquer valor não numérico vira null.
    var NUMERIC_COLS = new Set([
        'total_pedidos','total_visualizacoes','total_seguidores',
        'total_avaliacoes','nota_media','total_curtidas','total_perguntas'
    ]);

    // Parser CSV robusto: respeita campos entre aspas (que podem conter vírgulas).
    function parseCSVLine(line) {
        var fields = [], field = '', inQ = false;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (c === '"') {
                if (inQ && line[i + 1] === '"') { field += '"'; i++; } // aspas escapadas
                else inQ = !inQ;
            } else if (c === ',' && !inQ) {
                fields.push(field); field = '';
            } else {
                field += c;
            }
        }
        fields.push(field);
        return fields;
    }

    // ---- Importar CSV ----
    async function fzImportCSVFile(input) {
        const file = input.files[0];
        if (!file) return;

        const status = document.getElementById('fzImportStatus');
        const setStatus = function(msg, color) {
            if (status) { status.textContent = msg; status.style.color = color || 'var(--graphite)'; }
        };

        setStatus('Lendo arquivo...');

        try {
            const text    = await file.text();
            const rawLines = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            const headers  = parseCSVLine(rawLines[0]).map(function(h) { return h.trim(); });

            const rows = rawLines.slice(1).map(function(line) {
                if (!line.trim()) return null;
                const parts = parseCSVLine(line);
                const row = {};
                headers.forEach(function(h, i) {
                    if (!KNOWN_COLS.has(h)) return; // ignora colunas fora do schema
                    var v = (parts[i] || '').trim();
                    if (NUMERIC_COLS.has(h)) {
                        var n = parseFloat(v.replace(',', '.'));
                        row[h] = isNaN(n) ? null : n; // "Sim"/vazio → null
                    } else {
                        row[h] = v || null;
                    }
                });
                return row;
            }).filter(function(r) { return r && r.slug; });

            if (!rows.length) {
                setStatus('⚠ Nenhuma linha válida encontrada no arquivo.', '#854d0e');
                return;
            }

            const BATCH = 100;
            var inserted = 0;

            setStatus('Importando ' + rows.length + ' lojas...');

            for (var i = 0; i < rows.length; i += BATCH) {
                const batch = rows.slice(i, i + BATCH);
                const { error } = await window.dbBriefing
                    .from('facilzap_lojas')
                    .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false });

                if (error) {
                    setStatus('❌ Erro: ' + error.message, '#9a3412');
                    input.value = '';
                    return;
                }
                inserted += batch.length;
                setStatus('Importando... ' + inserted + '/' + rows.length);
            }

            input.value = '';
            setStatus('✓ ' + inserted + ' lojas importadas!', '#14532d');
            setTimeout(function() {
                setStatus('', '');
                loadFacilzapLeads();
            }, 2500);

        } catch (e) {
            setStatus('❌ Erro: ' + escHtml(e.message), '#9a3412');
            input.value = '';
        }
    }

    // ---- Utilitários internos ----
    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }
    function chk(id) {
        var el = document.getElementById(id);
        return el ? el.checked : false;
    }
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    function fmt(n) {
        return (n || 0).toLocaleString('pt-BR');
    }
    function escHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function escAttr(s) {
        return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

})();
