/**
 * Apps Script SITE-DASHS — DRE Completo para MLN
 * Robusto contra dados inválidos: linhas com erros são ignoradas silenciosamente.
 */

const ID_PLANILHA_MLN = '18MouuflutQfssa_e5tqgBUWd7m9_1QPA3-rL1kuppiQ';

const DRE_MAP = [
  { termos: ['simples nacional', ' das'], grupo: 'impostos' },
  { termos: ['iss', 'ipi', 'icms', 'pis', 'cofins'], grupo: 'impostos' },
  { termos: ['estoque inicial', 'estoque final', 'compra de mercadoria'], grupo: 'cmv' },
  { termos: ['comissao arquiteto', 'comissao vendedor', 'comissao escritorio'], grupo: 'csv' },
  { termos: ['montador', 'mao de obra direta', 'servicos de terceiros diretos'], grupo: 'csv' },
  { termos: ['devolucao', 'reembolso'], grupo: 'csv' },
  { termos: ['taxas de cartoes', 'taxa de cartao', 'boleto'], grupo: 'odv' },
  { termos: ['despesas com embalagens', 'embalagem'], grupo: 'odv' },
  { termos: ['fretes de mercadorias', 'frete de mercadoria'], grupo: 'odv' },
  { termos: ['insumos'], grupo: 'odv' },
  { termos: ['outras despesas variaveis'], grupo: 'odv' },
  { termos: ['irpj', 'csll'], grupo: 'nao_desembolsavel' },
  { termos: ['provisao', 'provisoes', '13 salario', 'ferias'], grupo: 'nao_desembolsavel' },
  { termos: ['perdas'], grupo: 'nao_desembolsavel' },
  { termos: ['depreciacao', 'depreciacoes'], grupo: 'nao_desembolsavel' },
  { termos: ['antecipacao do lucro'], grupo: 'pos_lucro' },
  { termos: ['investimentos'], grupo: 'pos_lucro' },
  { termos: ['parcelamento de imposto'], grupo: 'pos_lucro' },
  { termos: ['emprestimos', 'financiamentos'], grupo: 'pos_lucro' }
];

// ===================================================================
// HTTP
// ===================================================================

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.acao) {
      case 'carregar_dre_mln':       return responder(carregarDREMLN());
      case 'carregar_producao_mln':  return responder(carregarProducaoMLN());
      default:                       return responder({ ok: false, erro: 'acao_invalida' });
    }
  } catch (err) {
    return responder({ ok: false, erro: 'erro_servidor', detalhe: String(err) });
  }
}

function doGet() { return responder({ ok: true, status: 'online' }); }
function responder(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// ===================================================================
// DRE — Endpoint Público
// ===================================================================

function carregarDREMLN() {
  try {
    var resultado = montarDRECompleto(ID_PLANILHA_MLN);
    return { ok: true, dashboard: resultado };
  } catch(e) {
    return { ok: false, erro: 'erro_ao_carregar', detalhe: String(e) };
  }
}

// ===================================================================
// PRODUÇÃO — Endpoint Público
// ===================================================================

function carregarProducaoMLN() {
  try {
    var ss = SpreadsheetApp.openById(ID_PLANILHA_MLN);
    var sheet = ss.getSheetByName('Produção');

    if (!sheet) {
      return { ok: false, erro: 'aba_nao_encontrada', detalhe: 'Aba "Produção" não existe' };
    }

    var dados = sheet.getDataRange().getValues();
    if (!dados || dados.length < 2) {
      return { ok: true, producao: { atualizadoEm: new Date().toISOString(), clientes: [] } };
    }

    var headers = dados[0].map(normalizar);
    var idxCliente = acharCol(headers, ['cliente']);
    var idxAmbiente = acharCol(headers, ['ambiente']);
    var idxStatusMarcos = acharCol(headers, ['status marcos', 'status']);
    var idxPrevisao = acharCol(headers, ['previsao entrega', 'previsao', 'data entrega']);
    var idxObservacao = acharCol(headers, ['observacao', 'observacoes']);

    if (idxCliente === -1 || idxStatusMarcos === -1) {
      return { ok: false, erro: 'colunas_obrigatorias_nao_encontradas' };
    }

    var STATUS_LABELS = {
      1: 'Planejamento',
      2: 'Em Desenvolvimento',
      3: 'Testes',
      4: 'Concluído'
    };

    var clientes = [];
    for (var i = 1; i < dados.length; i++) {
      try {
        var row = dados[i];
        var cliente = String(seguro(row[idxCliente])).trim();
        if (!cliente) continue;

        var statusNum = parseInt(seguro(row[idxStatusMarcos])) || 0;
        var previsaoEntrega = idxPrevisao >= 0 ? row[idxPrevisao] : '';
        var dataISO = formatarDataISO(previsaoEntrega);

        clientes.push({
          cliente: cliente,
          ambiente: idxAmbiente >= 0 ? String(seguro(row[idxAmbiente])).trim() || 'N/A' : 'N/A',
          statusMarcos: statusNum,
          statusMarcosLabel: STATUS_LABELS[statusNum] || 'Desconhecido',
          previsaoEntrega: dataISO,
          observacao: idxObservacao >= 0 ? String(seguro(row[idxObservacao])).trim() || '' : ''
        });
      } catch(erroLinha) {
        // Ignora linhas com erro
        continue;
      }
    }

    return {
      ok: true,
      producao: {
        atualizadoEm: new Date().toISOString(),
        clientes: clientes
      }
    };
  } catch(e) {
    return { ok: false, erro: 'erro_ao_carregar', detalhe: String(e) };
  }
}

function formatarDataISO(dateObj) {
  try {
    if (!dateObj) return new Date().toISOString().split('T')[0];

    // Se for um número (serial do Google Sheets)
    if (typeof dateObj === 'number') {
      var date = new Date((dateObj - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // Se for string, tenta parsear
    if (typeof dateObj === 'string') {
      var date = new Date(dateObj);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // Fallback
    return new Date().toISOString().split('T')[0];
  } catch(e) {
    return new Date().toISOString().split('T')[0];
  }
}

// ===================================================================
// DRE — Montagem (retorna competência + caixa separados)
// ===================================================================

function montarDRECompleto(idPlanilha) {
  var ss = SpreadsheetApp.openById(idPlanilha);
  var aba = obterAbaFluxo(ss);
  var vals = aba.getDataRange().getValues();

  // Planilha vazia ou só cabeçalho
  if (!vals || vals.length < 2) {
    var vazio = dadosVazios();
    return montarRetorno(vazio, vazio);
  }

  var cab = vals[0].map(normalizar);
  var dadosComp  = processarLancamentos(vals, cab, 'competencia');
  var dadosCaixa = processarLancamentos(vals, cab, 'caixa');
  return montarRetorno(dadosComp, dadosCaixa);
}

function montarRetorno(dadosComp, dadosCaixa) {
  return {
    moeda: 'BRL',
    atualizadoEm: new Date().toISOString(),
    unidades:                  dadosComp.unidades,
    mesesDisponiveis:          dadosComp.mesesDisponiveis,
    kpis:                      dadosComp.kpis,
    porMes:                    dadosComp.porMes,
    rawMeses:                  dadosComp.rawMeses,
    receitaPorCategoria:       dadosComp.receitaPorCategoria,
    despesasPorCategoria:      dadosComp.despesasPorCategoria,
    unidadesCaixa:             dadosCaixa.unidades,
    mesesDisponiveisCaixa:     dadosCaixa.mesesDisponiveis,
    porMesCaixa:               dadosCaixa.porMes,
    rawMesesCaixa:             dadosCaixa.rawMeses,
    receitaPorCategoriaCaixa:  dadosCaixa.receitaPorCategoria,
    despesasPorCategoriaCaixa: dadosCaixa.despesasPorCategoria
  };
}

function dadosVazios() {
  return {
    unidades: [], mesesDisponiveis: [], kpis: calcularKPIs([]),
    porMes: [], rawMeses: [], receitaPorCategoria: [], despesasPorCategoria: []
  };
}

function processarLancamentos(vals, cab, modo) {
  // Colunas de data conforme modo
  var colMes, colAno;
  if (modo === 'caixa') {
    colMes = acharCol(cab, ['mes cx', 'mes caixa', 'mes pgto']);
    colAno = acharCol(cab, ['ano cx', 'ano caixa', 'ano pgto']);
  } else {
    colMes = acharCol(cab, ['mes comp', 'mes competencia', 'mes emissao']);
    colAno = acharCol(cab, ['ano comp', 'ano competencia', 'ano emissao']);
  }
  // Fallback para coluna genérica
  if (colMes < 0) colMes = acharCol(cab, ['mes']);
  if (colAno < 0) colAno = acharCol(cab, ['ano']);

  var colMov = acharCol(cab, ['movimentacao']);
  var colVal = acharCol(cab, ['valor de movimento', 'valor']);
  var colCls = acharCol(cab, ['classificacao']);
  var colUni = acharCol(cab, ['unidade']);

  // Se colunas obrigatórias não existem, retorna vazio sem quebrar
  if (colMov < 0 || colVal < 0 || colMes < 0 || colAno < 0) {
    return dadosVazios();
  }

  var ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var grupos = {};
  var mesSet = {};
  var uniSet = {};
  var recCat = {};
  var despCat = {};
  var totalReceita = 0;

  for (var r = 1; r < vals.length; r++) {
    // Cada linha é processada de forma isolada — erro na linha não quebra o loop
    try {
      var linha = vals[r];

      // Valida movimento
      var mov = normalizar(seguro(linha[colMov]));
      if (mov !== 'entrada' && mov !== 'saida') continue;

      // Valida valor
      var v = parseNumero(linha[colVal]);
      if (!v || v <= 0) continue;

      // Valida data
      var ano = parseAno(linha[colAno]);
      var mesNum = parseMes(linha[colMes]);
      if (!ano || ano < 2000 || ano > 2100 || !mesNum || mesNum < 1 || mesNum > 12) continue;

      var uni = String(seguro(colUni >= 0 ? linha[colUni] : '')).trim() || 'Geral';
      var cls = String(seguro(colCls >= 0 ? linha[colCls] : '')).trim();
      var clsN = normalizar(cls);
      var ch  = ano + '-' + (mesNum < 10 ? '0' + mesNum : mesNum);
      var lbl = ABREV[mesNum - 1] + '/' + String(ano).slice(-2);
      var key = ch + '|' + uni;

      mesSet[ch] = true;
      uniSet[uni] = true;

      if (!grupos[key]) {
        grupos[key] = {
          mes: ch, label: lbl, unidade: uni,
          entrada: 0, vendaProdutos: 0, vendaServicos: 0,
          impostos: 0, cmv: 0, csv: 0, odv: 0,
          despFixa: 0, naoDesembolsavel: 0, posLucro: 0
        };
      }

      if (mov === 'entrada') {
        grupos[key].entrada += v;
        if (clsN.indexOf('produto') >= 0) grupos[key].vendaProdutos += v;
        else grupos[key].vendaServicos += v;
        recCat[cls] = (recCat[cls] || 0) + v;
        totalReceita += v;
      } else {
        var grp = mapearGrupoDRE(clsN);
        if      (grp === 'impostos')          grupos[key].impostos += v;
        else if (grp === 'cmv')               grupos[key].cmv += v;
        else if (grp === 'csv')               grupos[key].csv += v;
        else if (grp === 'odv')               grupos[key].odv += v;
        else if (grp === 'nao_desembolsavel') grupos[key].naoDesembolsavel += v;
        else if (grp === 'pos_lucro')         grupos[key].posLucro += v;
        else                                  grupos[key].despFixa += v;
        despCat[cls] = (despCat[cls] || 0) + v;
      }
    } catch(erroLinha) {
      // Linha corrompida — ignora e continua
      continue;
    }
  }

  var rawMeses = Object.keys(grupos).map(function(k) {
    var g = grupos[k];
    return {
      mes: g.mes, label: g.label, unidade: g.unidade,
      entrada:          arred(g.entrada),
      vendaProdutos:    arred(g.vendaProdutos),
      vendaServicos:    arred(g.vendaServicos),
      impostos:         arred(g.impostos),
      cmv:              arred(g.cmv),
      csv:              arred(g.csv),
      odv:              arred(g.odv),
      despFixa:         arred(g.despFixa),
      naoDesembolsavel: arred(g.naoDesembolsavel),
      posLucro:         arred(g.posLucro)
    };
  }).sort(function(a, b) { return a.mes.localeCompare(b.mes); });

  var kpis   = calcularKPIs(rawMeses);
  var porMes = transformarParaPorMes(rawMeses);
  var base   = totalReceita || 1;

  var recCats = Object.keys(recCat).map(function(c) {
    return { categoria: c, valor: arred(recCat[c]), percentual: arred(recCat[c] / base * 100) };
  }).sort(function(a, b) { return b.valor - a.valor; });

  var despCats = Object.keys(despCat).map(function(c) {
    return { categoria: c, valor: arred(despCat[c]), percentual: arred(despCat[c] / base * 100) };
  }).sort(function(a, b) { return b.valor - a.valor; });

  return {
    unidades: Object.keys(uniSet).sort(),
    mesesDisponiveis: Object.keys(mesSet).sort(),
    kpis: kpis,
    porMes: porMes,
    rawMeses: rawMeses,
    receitaPorCategoria: recCats,
    despesasPorCategoria: despCats
  };
}

function calcularKPIs(rawMeses) {
  var t = { entrada:0, impostos:0, cmv:0, csv:0, odv:0, despFixa:0, naoDesembolsavel:0, posLucro:0 };
  for (var i = 0; i < rawMeses.length; i++) {
    var m = rawMeses[i];
    t.entrada          += m.entrada;
    t.impostos         += m.impostos;
    t.cmv              += m.cmv;
    t.csv              += m.csv;
    t.odv              += m.odv;
    t.despFixa         += m.despFixa;
    t.naoDesembolsavel += m.naoDesembolsavel;
    t.posLucro         += m.posLucro;
  }
  var fb  = t.entrada;
  var dvd = t.csv + t.cmv;
  var lb  = fb - dvd;
  var odv = t.odv + t.impostos;
  var mc  = lb - odv;
  var eb  = mc - t.despFixa;
  var rl  = eb - t.naoDesembolsavel;
  var sf  = rl - t.posLucro;
  var b   = fb || 1;
  return {
    faturamentoBruto:             arred(fb),
    despesasVariaveisDiretas:     arred(dvd),
    lucroBruto:                   arred(lb),
    outasDespesasVariaveis:       arred(odv),
    margemDeContribuicao:         arred(mc),
    ebitda:                       arred(eb),
    resultadoLiquido:             arred(rl),
    saldoFinal:                   arred(sf),
    despesasVariaveisDiretasPerc: arred(dvd / b * 100),
    lucroBrutoPerc:               arred(lb / b * 100),
    outasDespesasVariaveisPerc:   arred(odv / b * 100),
    margemDeContribuicaoPerc:     arred(mc / b * 100),
    ebitdaPerc:                   arred(eb / b * 100),
    resultadoLiquidoPerc:         arred(rl / b * 100),
    saldoFinalPerc:               arred(sf / b * 100)
  };
}

function transformarParaPorMes(rawMeses) {
  return rawMeses.map(function(mes) {
    var fb  = mes.entrada;
    var dvd = mes.csv + mes.cmv;
    var lb  = fb - dvd;
    var odv = mes.odv + mes.impostos;
    var mc  = lb - odv;
    var eb  = mc - mes.despFixa;
    var rl  = eb - mes.naoDesembolsavel;
    var sf  = rl - mes.posLucro;
    return {
      mes: mes.mes, label: mes.label, unidade: mes.unidade,
      faturamentoBruto:         arred(fb),
      despesasVariaveisDiretas: arred(dvd),
      lucroBruto:               arred(lb),
      outasDespesasVariaveis:   arred(odv),
      margemDeContribuicao:     arred(mc),
      ebitda:                   arred(eb),
      resultadoLiquido:         arred(rl),
      saldoFinal:               arred(sf)
    };
  });
}

// ===================================================================
// Utilitários
// ===================================================================

function mapearGrupoDRE(clsNorm) {
  for (var i = 0; i < DRE_MAP.length; i++) {
    var regra = DRE_MAP[i];
    for (var j = 0; j < regra.termos.length; j++) {
      if (clsNorm.indexOf(regra.termos[j]) >= 0) return regra.grupo;
    }
  }
  return 'desp_fixa';
}

function obterAbaFluxo(ss) {
  try {
    var abas = ss.getSheets();
    for (var i = 0; i < abas.length; i++) {
      var nome = normalizar(abas[i].getName());
      if (nome.indexOf('fluxo') >= 0 || nome.indexOf('caixa') >= 0) return abas[i];
    }
    for (var i = 0; i < abas.length; i++) {
      var c = (abas[i].getRange(1,1,1,abas[i].getLastColumn()).getValues()[0]||[]).map(normalizar);
      if (c.indexOf('movimentacao') >= 0 && c.some(function(x){return x.indexOf('valor')>=0;})) return abas[i];
    }
    return ss.getSheets()[0];
  } catch(e) {
    return ss.getSheets()[0];
  }
}

// Lê valor de célula de forma segura (nunca lança exceção)
function seguro(v) {
  try { return (v === null || v === undefined) ? '' : v; }
  catch(e) { return ''; }
}

function normalizar(v) {
  try { return String(v==null?'':v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  catch(e) { return ''; }
}

function acharCol(cab, cands) {
  for (var i = 0; i < cands.length; i++)
    for (var j = 0; j < cab.length; j++)
      if (cab[j].indexOf(cands[i]) >= 0) return j;
  return -1;
}

function parseNumero(v) {
  try {
    if (v instanceof Date) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : Math.abs(v);
    if (!v) return 0;
    var s = String(v).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.abs(n);
  } catch(e) { return 0; }
}

function parseMes(v) {
  try {
    if (v instanceof Date) return v.getMonth() + 1;
    if (typeof v === 'number') { var ni = Math.round(v); return (ni >= 1 && ni <= 12) ? ni : 0; }
    var n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) return n;
    var m = {jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
    return m[normalizar(v).slice(0,3)] || 0;
  } catch(e) { return 0; }
}

function parseAno(v) {
  try {
    if (v instanceof Date) return v.getFullYear();
    var n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  } catch(e) { return 0; }
}

function arred(n) {
  try { return Math.round((n || 0) * 100) / 100; }
  catch(e) { return 0; }
}
