/**
 * Apps Script CENTRAL — Portal de Dashboards (Site-Dashs)
 * ------------------------------------------------------------------
 * Sistema completo com:
 *   1. Master (Dudys / 312311) → acessa admin
 *   2. Admin cria/edita/deleta usuários e define acesso a páginas
 *   3. Usuários normais logam e veem seu(s) dashboard(s)
 *   4. Aba "inicio" armazena tudo (master + usuários)
 *
 * Endpoints:
 *   - POST { acao: "login", login, senha } → { ok, cliente, dashboard } ou erro
 *   - POST { acao: "admin_listar", masterToken } → { usuarios: [...] }
 *   - POST { acao: "admin_criar", masterToken, login, senha, paginas } → { ok }
 *   - POST { acao: "admin_editar", masterToken, login, novoLogin, senha, paginas, nome } → { ok }
 *   - POST { acao: "admin_deletar", masterToken, login } → { ok }
 *   - POST { acao: "admin_listar_paginas" } → { paginas: [...] }
 *
 * Deploy: Implantar > Nova implantação > Tipo "App da Web"
 *   - Executar como: Eu
 *   - Quem tem acesso: Qualquer pessoa
 */

var ABA_INICIO = 'inicio';

// Hash pré-computado do master: SHA-256("salt-master" + "312311")
var MASTER_LOGIN = 'dudys';
var MASTER_HASH = 'd1ebfe2646b26f762d161e718809f8afea315c59cda2fb1f3613d1d62802bcb8';
var MASTER_SALT = 'salt-master';
var MASTER_TOKEN = 'master-token-12345';

// ===================================================================
// Entradas HTTP
// ===================================================================

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.acao) {
      case 'login':
        return responder(autenticarEMontar(body.login, body.senha));
      case 'admin_listar':
        return responder(adminListarUsuarios(body.masterToken));
      case 'admin_criar':
        return responder(adminCriarUsuario(body.masterToken, body.login, body.senha, body.paginas, body.nome));
      case 'admin_editar':
        return responder(adminEditarUsuario(body.masterToken, body.login, body.novoLogin, body.senha, body.paginas, body.nome));
      case 'admin_deletar':
        return responder(adminDeletarUsuario(body.masterToken, body.login));
      case 'admin_listar_paginas':
        return responder(adminListarPaginas());
      default:
        return responder({ ok: false, erro: 'acao_invalida' });
    }
  } catch (err) {
    return responder({ ok: false, erro: 'erro_servidor', detalhe: String(err) });
  }
}

function doGet() {
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

  var loginNorm = String(login).trim().toLowerCase();

  // Check master primeiro
  if (loginNorm === MASTER_LOGIN) {
    var hashCalc = gerarHash(senha, MASTER_SALT);
    if (hashCalc === MASTER_HASH) {
      return {
        ok: true,
        tipo: 'master',
        masterToken: MASTER_TOKEN,
        cliente: { slug: 'admin', nome: 'Administrador' },
        dashboard: null,
      };
    }
    return { ok: false, erro: 'credenciais_invalidas' };
  }

  // Check usuários normais
  var usuario = buscarUsuario(loginNorm);
  if (!usuario) return { ok: false, erro: 'credenciais_invalidas' };
  if (!usuario.ativo) return { ok: false, erro: 'usuario_inativo' };

  var hashCalc = gerarHash(senha, usuario.salt);
  if (hashCalc !== String(usuario.senha_hash).toLowerCase()) {
    return { ok: false, erro: 'credenciais_invalidas' };
  }

  // Se tem múltiplas páginas, pega o dashboard da primeira
  var paginas = String(usuario.paginas || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
  var primeiraPagem = paginas[0];
  var dashboard = primeiraPagem ? montarDashboard(usuario['id_planilha_' + primeiraPagem] || usuario.id_planilha) : null;

  return {
    ok: true,
    tipo: 'usuario',
    cliente: { slug: primeiraPagem, nome: usuario.nome || primeiraPagem },
    paginas: paginas,
    dashboard: dashboard,
  };
}

function buscarUsuario(login) {
  garantirAbaInicio();
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_INICIO);
  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return null;

  var cab = valores[0].map(normalizar);
  var iLogin = cab.indexOf('login');
  if (iLogin < 0) return null;

  for (var r = 1; r < valores.length; r++) {
    if (String(valores[r][iLogin]).trim().toLowerCase() === login) {
      return {
        login: login,
        senha_hash: valores[r][cab.indexOf('senha_hash')],
        salt: valores[r][cab.indexOf('salt')],
        paginas: String(valores[r][cab.indexOf('paginas')] || '').trim(),
        nome: valores[r][cab.indexOf('nome')],
        id_planilha: String(valores[r][cab.indexOf('id_planilha')] || '').trim(),
        ativo: ehVerdadeiro(valores[r][cab.indexOf('ativo')]),
      };
    }
  }
  return null;
}

// ===================================================================
// Admin
// ===================================================================

function adminListarUsuarios(masterToken) {
  if (masterToken !== MASTER_TOKEN) {
    return { ok: false, erro: 'nao_autorizado' };
  }
  garantirAbaInicio();
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_INICIO);
  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) {
    return { ok: true, usuarios: [] };
  }

  var cab = valores[0].map(normalizar);
  var usuarios = [];
  for (var r = 1; r < valores.length; r++) {
    var login = String(valores[r][cab.indexOf('login')] || '').trim();
    if (login && login !== MASTER_LOGIN) {
      usuarios.push({
        login: login,
        nome: String(valores[r][cab.indexOf('nome')] || '').trim(),
        paginas: String(valores[r][cab.indexOf('paginas')] || '').trim(),
        ativo: ehVerdadeiro(valores[r][cab.indexOf('ativo')]),
      });
    }
  }
  return { ok: true, usuarios: usuarios };
}

function adminCriarUsuario(masterToken, login, senha, paginas, nome) {
  if (masterToken !== MASTER_TOKEN) {
    return { ok: false, erro: 'nao_autorizado' };
  }
  if (!login || !senha || !paginas) {
    return { ok: false, erro: 'campos_obrigatorios' };
  }

  garantirAbaInicio();
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_INICIO);
  var valores = aba.getDataRange().getValues();
  var cab = valores[0].map(normalizar);

  // Check se login já existe
  var loginNorm = String(login).trim().toLowerCase();
  for (var r = 1; r < valores.length; r++) {
    if (String(valores[r][cab.indexOf('login')]).trim().toLowerCase() === loginNorm) {
      return { ok: false, erro: 'login_ja_existe' };
    }
  }

  // Gera salt e hash
  var salt = Utilities.getUuid().replace(/-/g, '');
  var hash = gerarHash(senha, salt);

  // Adiciona nova linha
  var novaLinha = [];
  for (var c = 0; c < valores[0].length; c++) {
    var col = cab[c];
    if (col === 'login') novaLinha[c] = login;
    else if (col === 'senha_hash') novaLinha[c] = hash;
    else if (col === 'salt') novaLinha[c] = salt;
    else if (col === 'paginas') novaLinha[c] = String(paginas).trim();
    else if (col === 'nome') novaLinha[c] = String(nome || login).trim();
    else if (col === 'ativo') novaLinha[c] = 'TRUE';
    else novaLinha[c] = '';
  }
  aba.appendRow(novaLinha);

  return { ok: true, mensagem: 'Usuario criado com sucesso' };
}

function adminEditarUsuario(masterToken, login, novoLogin, senha, paginas, nome) {
  if (masterToken !== MASTER_TOKEN) {
    return { ok: false, erro: 'nao_autorizado' };
  }
  if (!login) {
    return { ok: false, erro: 'login_obrigatorio' };
  }

  garantirAbaInicio();
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_INICIO);
  var valores = aba.getDataRange().getValues();
  var cab = valores[0].map(normalizar);
  var loginNorm = String(login).trim().toLowerCase();

  // Procura usuário por login original
  for (var r = 1; r < valores.length; r++) {
    if (String(valores[r][cab.indexOf('login')]).trim().toLowerCase() === loginNorm) {
      // Se mudou o login, verifica se novo login já existe
      if (novoLogin && novoLogin !== login) {
        var novoLoginNorm = String(novoLogin).trim().toLowerCase();
        for (var c = 1; c < valores.length; c++) {
          if (c !== r && String(valores[c][cab.indexOf('login')]).trim().toLowerCase() === novoLoginNorm) {
            return { ok: false, erro: 'login_ja_existe' };
          }
        }
        valores[r][cab.indexOf('login')] = novoLogin;
      }

      // Atualiza senha se fornecida
      if (senha) {
        var salt = String(valores[r][cab.indexOf('salt')] || '').trim();
        if (!salt) salt = Utilities.getUuid().replace(/-/g, '');
        var hash = gerarHash(senha, salt);
        valores[r][cab.indexOf('salt')] = salt;
        valores[r][cab.indexOf('senha_hash')] = hash;
      }

      // Atualiza paginas se fornecido
      if (paginas) {
        valores[r][cab.indexOf('paginas')] = String(paginas).trim();
      }

      // Atualiza nome se fornecido
      if (nome) {
        valores[r][cab.indexOf('nome')] = String(nome).trim();
      }

      aba.clearContents();
      aba.getRange(1, 1, valores.length, valores[0].length).setValues(valores);
      return { ok: true, mensagem: 'Usuario atualizado com sucesso' };
    }
  }
  return { ok: false, erro: 'usuario_nao_encontrado' };
}

function adminListarPaginas() {
  // Lista todas as páginas/clientes disponíveis (para links de acesso)
  // Retorna um array com info de cada página
  var paginas = [
    { slug: 'MLN', nome: 'MLN', url: '/MLN' }
  ];
  return { ok: true, paginas: paginas };
}

function adminDeletarUsuario(masterToken, login) {
  if (masterToken !== MASTER_TOKEN) {
    return { ok: false, erro: 'nao_autorizado' };
  }
  if (!login) {
    return { ok: false, erro: 'login_obrigatorio' };
  }

  garantirAbaInicio();
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_INICIO);
  var valores = aba.getDataRange().getValues();
  var cab = valores[0].map(normalizar);
  var loginNorm = String(login).trim().toLowerCase();

  for (var r = 1; r < valores.length; r++) {
    if (String(valores[r][cab.indexOf('login')]).trim().toLowerCase() === loginNorm) {
      aba.deleteRow(r + 1); // +1 porque os índices de deleteRow começam em 1
      return { ok: true, mensagem: 'Usuario deletado com sucesso' };
    }
  }
  return { ok: false, erro: 'usuario_nao_encontrado' };
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

function garantirAbaInicio() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA_INICIO);
  if (!aba) {
    aba = ss.insertSheet(ABA_INICIO);
    aba.appendRow(['login', 'senha_hash', 'salt', 'nome', 'paginas', 'id_planilha', 'ativo']);
    aba.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
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
