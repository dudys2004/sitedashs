/**
 * Apps Script CENTRAL — Portal de Dashboards (Site-Dashs)
 * ------------------------------------------------------------------
 * Responsável por:
 *   1. Autenticar (login + senha com hash) contra a aba "usuarios" da
 *      planilha central (a planilha à qual este script está vinculado).
 *   2. Abrir a planilha de dados do cliente (openById) e montar o JSON
 *      do dashboard financeiro.
 *
 * Segurança: a senha NUNCA fica no front. O front envia login+senha; aqui
 * comparamos SHA-256(salt + senha) com o hash salvo. Sem credencial válida,
 * nenhum dado é devolvido.
 *
 * Deploy: Implantar > Nova implantação > Tipo "App da Web"
 *   - Executar como: Eu
 *   - Quem tem acesso: Qualquer pessoa
 *   Copie a URL .../exec e coloque em VITE_APPS_SCRIPT_URL no front (Vercel).
 */

// Nome da aba de usuários na planilha central.
var ABA_USUARIOS = 'usuarios';

// ===================================================================
// Entradas HTTP
// ===================================================================

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.acao === 'login') {
      return responder(autenticarEMontar(body.login, body.senha));
    }
    return responder({ ok: false, erro: 'acao_invalida' });
  } catch (err) {
    return responder({ ok: false, erro: 'erro_servidor', detalhe: String(err) });
  }
}

function doGet() {
  // Health-check simples (não devolve dados).
  return responder({ ok: true, servico: 'site-dashs', status: 'online' });
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================
// Autenticação
// ===================================================================

function autenticarEMontar(login, senha) {
  if (!login || !senha) return { ok: false, erro: 'credenciais_invalidas' };

  var usuario = buscarUsuario(String(login).trim().toLowerCase());
  if (!usuario) return { ok: false, erro: 'credenciais_invalidas' };
  if (!usuario.ativo) return { ok: false, erro: 'usuario_inativo' };

  var hashCalc = gerarHash(senha, usuario.salt);
  if (hashCalc !== String(usuario.senha_hash).toLowerCase()) {
    return { ok: false, erro: 'credenciais_invalidas' };
  }

  var dashboard = montarDashboard(usuario.id_planilha);
  return {
    ok: true,
    cliente: { slug: usuario.slug, nome: usuario.nome || usuario.slug },
    dashboard: dashboard,
  };
}

function buscarUsuario(login) {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_USUARIOS);
  if (!aba) throw new Error('Aba "' + ABA_USUARIOS + '" não encontrada na planilha central.');
  var valores = aba.getDataRange().getValues();
  var cab = valores[0].map(normalizar);
  var iLogin = cab.indexOf('login');
  for (var r = 1; r < valores.length; r++) {
    if (String(valores[r][iLogin]).trim().toLowerCase() === login) {
      return {
        login: login,
        senha_hash: valores[r][cab.indexOf('senha_hash')],
        salt: valores[r][cab.indexOf('salt')],
        slug: String(valores[r][cab.indexOf('slug')]).trim(),
        id_planilha: String(valores[r][cab.indexOf('id_planilha')]).trim(),
        nome: valores[r][cab.indexOf('nome')],
        ativo: ehVerdadeiro(valores[r][cab.indexOf('ativo')]),
      };
    }
  }
  return null;
}

/** SHA-256(salt + senha) em hexadecimal minúsculo. */
function gerarHash(senha, salt) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt || '') + String(senha),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

// ===================================================================
// Montagem do dashboard financeiro (planilha do cliente)
// ===================================================================

function montarDashboard(idPlanilha) {
  var ss = SpreadsheetApp.openById(idPlanilha);
  var aba = obterAbaDados(ss);
  var valores = aba.getDataRange().getValues();
  var cab = valores[0].map(normalizar);

  var col = {
    movimentacao: acharCol(cab, ['movimentacao']),
    valor: acharCol(cab, ['valor de movimento', 'valor']),
    classificacao: acharCol(cab, ['classificacao']),
    unidade: acharCol(cab, ['unidade']),
    mes: acharCol(cab, ['mes comp', 'mes cx', 'mes']),
    ano: acharCol(cab, ['ano comp', 'ano cx', 'ano']),
  };

  var totalEntradas = 0, totalSaidas = 0, qtd = 0;
  var porMes = {}, porClass = {}, porUnidade = {}, unidadesSet = {};

  for (var r = 1; r < valores.length; r++) {
    var linha = valores[r];
    var mov = normalizar(linha[col.movimentacao]);
    if (mov !== 'entrada' && mov !== 'saida') continue;
    var valor = parseNumero(linha[col.valor]);
    if (!valor) continue;
    qtd++;

    var ehEntrada = mov === 'entrada';
    if (ehEntrada) totalEntradas += valor; else totalSaidas += valor;

    // por mês (competência)
    var ano = parseInt(linha[col.ano], 10);
    var mesNum = parseMes(linha[col.mes]);
    if (ano && mesNum) {
      var chave = ano + '-' + (mesNum < 10 ? '0' + mesNum : mesNum);
      if (!porMes[chave]) porMes[chave] = { entradas: 0, saidas: 0, ano: ano, mes: mesNum };
      if (ehEntrada) porMes[chave].entradas += valor; else porMes[chave].saidas += valor;
    }

    // unidade
    var uni = String(linha[col.unidade] || '').trim() || 'Sem unidade';
    unidadesSet[uni] = true;
    if (!porUnidade[uni]) porUnidade[uni] = { entradas: 0, saidas: 0 };
    if (ehEntrada) porUnidade[uni].entradas += valor; else porUnidade[uni].saidas += valor;

    // classificação (apenas saídas)
    if (!ehEntrada) {
      var cls = String(linha[col.classificacao] || '').trim() || 'Outros';
      porClass[cls] = (porClass[cls] || 0) + valor;
    }
  }

  return {
    moeda: 'BRL',
    atualizadoEm: new Date().toISOString(),
    unidades: Object.keys(unidadesSet),
    kpis: {
      totalEntradas: arred(totalEntradas),
      totalSaidas: arred(totalSaidas),
      saldo: arred(totalEntradas - totalSaidas),
      qtdLancamentos: qtd,
    },
    porMes: serializarMeses(porMes),
    porClassificacao: serializarClass(porClass),
    porUnidade: Object.keys(porUnidade).map(function (u) {
      return { unidade: u, entradas: arred(porUnidade[u].entradas), saidas: arred(porUnidade[u].saidas) };
    }),
  };
}

/** Escolhe a aba que parece o extrato (tem MOVIMENTAÇÃO + VALOR no cabeçalho). */
function obterAbaDados(ss) {
  var abas = ss.getSheets();
  for (var i = 0; i < abas.length; i++) {
    var cab = (abas[i].getRange(1, 1, 1, abas[i].getLastColumn()).getValues()[0] || []).map(normalizar);
    var temMov = cab.indexOf('movimentacao') >= 0;
    var temValor = cab.some(function (c) { return c.indexOf('valor') >= 0; });
    if (temMov && temValor) return abas[i];
  }
  return ss.getSheets()[0];
}

function serializarMeses(porMes) {
  var ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return Object.keys(porMes).sort().map(function (k) {
    var m = porMes[k];
    return {
      mes: k,
      label: ABREV[m.mes - 1] + '/' + String(m.ano).slice(-2),
      entradas: arred(m.entradas),
      saidas: arred(m.saidas),
      saldo: arred(m.entradas - m.saidas),
    };
  });
}

function serializarClass(porClass) {
  return Object.keys(porClass)
    .map(function (c) { return { classificacao: c, saidas: arred(porClass[c]) }; })
    .sort(function (a, b) { return b.saidas - a.saidas; });
}

// ===================================================================
// Utilitários
// ===================================================================

function normalizar(v) {
  return String(v == null ? '' : v)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
}

function acharCol(cab, candidatos) {
  for (var i = 0; i < candidatos.length; i++) {
    for (var j = 0; j < cab.length; j++) {
      if (cab[j].indexOf(candidatos[i]) >= 0) return j;
    }
  }
  return -1;
}

function parseNumero(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  var s = String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseMes(v) {
  if (typeof v === 'number') return v;
  var n = parseInt(v, 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return n;
  var nomes = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
  var k = normalizar(v).slice(0, 3);
  return nomes[k] || 0;
}

function ehVerdadeiro(v) {
  if (v === true) return true;
  var s = normalizar(v);
  return s === 'true' || s === 'sim' || s === '1' || s === 'verdadeiro' || s === 'x';
}

function arred(n) {
  return Math.round(n * 100) / 100;
}

// ===================================================================
// FERRAMENTAS DE ADMINISTRAÇÃO (rodar manualmente no editor Apps Script)
// ===================================================================

/**
 * Gera hash+salt para cadastrar/trocar a senha de um usuário.
 * 1) Edite SENHA abaixo. 2) Rode esta função. 3) Veja o log (Ctrl+Enter).
 * 4) Cole 'salt' e 'senha_hash' na linha do usuário na aba "usuarios".
 */
function ADMIN_gerarCredencial() {
  var SENHA = 'troque-aqui';
  var salt = Utilities.getUuid().replace(/-/g, '');
  var hash = gerarHash(SENHA, salt);
  Logger.log('salt:       ' + salt);
  Logger.log('senha_hash: ' + hash);
}

/**
 * Cria a aba "usuarios" com cabeçalho, se ainda não existir.
 * Rode uma vez na planilha central.
 */
function ADMIN_criarAbaUsuarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA_USUARIOS) || ss.insertSheet(ABA_USUARIOS);
  if (aba.getLastRow() === 0) {
    aba.appendRow(['login', 'senha_hash', 'salt', 'slug', 'id_planilha', 'nome', 'ativo']);
    aba.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  Logger.log('Aba "usuarios" pronta.');
}
