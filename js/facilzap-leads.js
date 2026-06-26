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

    // SVGs no padrão do sistema: stroke, fill:none, stroke-width:2
    var ICO = {
        wa:   '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        ig:   '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
        mail: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>',
        ext:  '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
        pin:  '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    function actionBtn(href, icon, label) {
        return '<a href="' + href + '" target="_blank" rel="noopener" class="btn-secondary" ' +
               'style="width:auto;padding:8px 14px;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:6px;">' +
               icon + label + '</a>';
    }

    function renderCard(l) {
        const selos = [
            l.selo_cupons === 'Sim'               ? 'Cupom' : '',
            l.selo_cashback === 'Sim'             ? 'Cashback' + (l.cashback_porcentagem ? ' ' + l.cashback_porcentagem : '') : '',
            l.selo_frete_gratis === 'Sim'         ? 'Frete Grátis' : '',
            l.selo_brindes === 'Sim'              ? 'Brindes' : '',
            l.selo_desconto_progressivo === 'Sim' ? 'Desc. Progressivo' : '',
            l.selo_revendedor_pro === 'Sim'       ? 'Revendedor Pro' : '',
            l.selo_afiliados === 'Sim'            ? 'Afiliados' + (l.comissao_afiliado ? ' ' + l.comissao_afiliado : '') : ''
        ].filter(Boolean);

        const views   = fmtNum(l.total_visualizacoes);
        const pedidos = fmtNum(l.total_pedidos);
        const segs    = fmtNum(l.total_seguidores);
        const avals   = fmtNum(l.total_avaliacoes);
        const hasMetrics = views || pedidos || segs || avals;

        const selosBadges = selos.map(function(s) {
            return '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:var(--parchment);border:1px solid var(--stone);color:var(--graphite);">' + s + '</span>';
        }).join('');

        // WhatsApp — sempre visível; primário se tiver número, cinza se não tiver
        var waHref = l.whatsapp ? 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(l.whatsapp) : null;
        var waBtn = waHref
            ? '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn-primary" style="width:auto;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px;">' + ICO.wa + 'WhatsApp</a>'
            : '<span class="btn-secondary" style="width:auto;padding:8px 14px;font-size:12px;opacity:.45;cursor:not-allowed;display:flex;align-items:center;gap:6px;" title="Número não cadastrado">' + ICO.wa + 'WhatsApp</span>';

        var btns = waBtn;
        if (l.instagram) btns += actionBtn('https://instagram.com/' + encodeURIComponent(l.instagram), ICO.ig,   'Instagram');
        if (l.email)     btns += actionBtn('mailto:' + escAttr(l.email),                               ICO.mail, 'E-mail');
        if (l.url_loja)  btns += actionBtn(escAttr(l.url_loja),                                        ICO.ext,  'Ver Loja');

        return '<div class="panel" style="margin-bottom:12px;padding:18px 20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">' +

            '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">' +
                    '<strong style="font-size:15px;">' + escHtml(l.nome || l.slug || '—') + '</strong>' +
                    nivelBadge(l.nivel_nome) +
                    (l.loja_verificada === 'Sim' ? '<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:rgba(22,163,74,.12);color:#14532d;">Verificada</span>' : '') +
                '</div>' +
                (l.estado ? '<div style="font-size:12px;color:var(--graphite);margin-bottom:6px;display:flex;align-items:center;gap:4px;">' + ICO.pin + escHtml(l.estado) + '</div>' : '') +
                (hasMetrics ? '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--graphite);margin-bottom:8px;">' +
                    (views   ? '<span>' + views   + ' views</span>'   : '') +
                    (pedidos ? '<span>' + pedidos + ' pedidos</span>' : '') +
                    (segs    ? '<span>' + segs    + ' seg.</span>'    : '') +
                    (avals   ? '<span>' + avals   + ' aval.' + (l.nota_media ? ' · ' + Number(l.nota_media).toFixed(1) : '') + '</span>' : '') +
                '</div>' : '') +
                (selos.length ? '<div style="display:flex;gap:5px;flex-wrap:wrap;">' + selosBadges + '</div>' : '') +
            '</div>' +

            '<div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:6px;align-items:flex-start;">' +
                btns +
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
