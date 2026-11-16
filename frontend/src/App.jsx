import { useEffect, useRef, useState } from 'react';

import { URL_DA_API } from './api';

const tamanhos = {
  pequena: { nome: 'Pequena', limite: 5, classe: 'peach-bg', ilustracao: '/ilustracoes/cesta-pequena.svg', frase: 'O tamanho ideal para começar a aproveitar a semana.' },
  media: { nome: 'Média', limite: 8, classe: 'sage-bg', ilustracao: '/ilustracoes/cesta-media.svg', frase: 'Um pouco mais de espaço para variar seus preparos.' },
  grande: { nome: 'Grande', limite: 12, classe: 'ochre-bg', ilustracao: '/ilustracoes/cesta-grande.svg', frase: 'Para quem quer aproveitar ao máximo a capacidade.' }
};

// Páginas do carrossel do início: o que é o sistema, as cestas e as preferências.
const paginasDoCarrossel = [
  {
    chave: 'sistema',
    selo: 'COMO FUNCIONA',
    titulo: <>A horta da comunidade, <em>direto na sua semana.</em></>,
    texto: 'Você escolhe a cesta, o produtor colhe e separa os produtos da semana, e você acompanha cada etapa, do pedido à entrega.',
    etiquetas: [{ icone: 'leaf', texto: 'Colhido na semana' }, { icone: 'list', texto: 'Acompanhe cada etapa' }]
  },
  {
    chave: 'cestas',
    selo: 'AS CESTAS',
    titulo: <>Pequena, média ou grande: <em>do seu tamanho.</em></>,
    texto: 'A pequena leva até 5 produtos, a média até 8 e a grande até 12. Faça o pedido em poucos cliques, toda semana.',
    etiquetas: [{ icone: 'box', texto: '3 tamanhos' }, { icone: 'calendar', texto: 'Um pedido por semana' }]
  },
  {
    chave: 'preferencias',
    selo: 'SUAS PREFERÊNCIAS',
    titulo: <>Diga o que você quer <em>e o que não quer.</em></>,
    texto: 'Marque cada produto como Quero, Tanto faz ou Não quero. O produtor vê suas escolhas na hora de montar a cesta.',
    etiquetas: [{ icone: 'heart', texto: 'Do seu jeito' }, { icone: 'check', texto: 'Respeitado na separação' }]
  }
];

// Mostra um ícone do conjunto SVG compartilhado pela interface.
// Com rótulo, o role="img" faz o leitor de tela anunciar o ícone; sem rótulo, ele é escondido.
function Icone({ nome, rotulo }) {
  return <svg className="icon" role={rotulo ? 'img' : undefined} aria-hidden={rotulo ? undefined : true} aria-label={rotulo}><use href={`#i-${nome}`} /></svg>;
}

// Mantém os símbolos acessíveis sem duplicar o desenho de cada ícone.
function DefinicoesDeIcones() {
  return <svg className="icon-defs" aria-hidden="true">
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4.5 21c0-4.5 3.1-7 7.5-7s7.5 2.5 7.5 7" /></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m8 10 4 4 4-4" /></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></symbol>
    <symbol id="i-left" viewBox="0 0 24 24"><path d="m14 5-7 7 7 7" /></symbol>
    <symbol id="i-right" viewBox="0 0 24 24"><path d="m10 5 7 7-7 7" /></symbol>
    <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M20.5 3.5C11 3 4 8 4 15.5c0 2.6 1.8 5 5 5 7.5 0 11.5-7.5 11.5-17Z" /><path d="M4 20c3-5 7-8.5 12-11" /></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" /></symbol>
    <symbol id="i-box" viewBox="0 0 24 24"><path d="m4 7 8-4 8 4v10l-8 4-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h13M3 18h13M3 6h.01" /></symbol>
    <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></symbol>
    <symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" /></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></symbol>
    <symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 5v14M15 5v14" /></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7Z" /></symbol>
    <symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M9 18h6" /></symbol>
    <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></symbol>
  </svg>;
}

// Quantas cestas o back devolve por página (o limit(10) do repositório)
const POR_PAGINA = 10;

// A cesta é "da semana": guardamos a segunda-feira daquela semana, no horário local.
// getDay() vai de 0 (domingo) a 6 (sábado); a conta volta até a segunda-feira.
function segundaDaSemana(data = new Date()) {
  const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

// Monta "AAAA-MM-DD" com a data local, o formato que o back espera no campo semana.
// O toISOString() usava o horário UTC: depois das 21h no Brasil, gravava o dia seguinte.
function dataISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// Mostra a semana como "20/10 a 26/10". O "AAAA-MM-DD" vira data local para não trocar de dia.
// segundaDaSemana corrige as cestas antigas, que guardaram o dia do pedido e não a segunda-feira.
function textoDaSemana(semanaISO) {
  const [ano, mes, dia] = semanaISO.split('-').map(Number);
  const inicio = segundaDaSemana(new Date(ano, mes - 1, dia));
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const formatar = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatar(inicio)} a ${formatar(fim)}`;
}

// Soma (ou subtrai) dias a uma semana "AAAA-MM-DD" e devolve no mesmo formato. Usada nas setas de semana.
function somarDias(semanaISO, dias) {
  const [ano, mes, dia] = semanaISO.split('-').map(Number);
  return dataISO(new Date(ano, mes - 1, dia + dias));
}

// As setas de semana, usadas no estoque e na separação. A semana é sempre a segunda-feira "AAAA-MM-DD".
function SeletorDeSemana({ semana, setSemana }) {
  const atual = dataISO(segundaDaSemana());
  return <div className="filter-bar week-bar">
    <button type="button" className="carousel-arrow" onClick={() => setSemana(somarDias(semana, -7))} aria-label="Semana anterior"><Icone nome="left" /></button>
    <strong>
      <Icone nome="calendar" /> Semana {textoDaSemana(semana)}
      {semana !== atual && (
        <button type="button" className="text-link" onClick={() => setSemana(atual)}>voltar para esta semana</button>
      )}
    </strong>
    <button type="button" className="carousel-arrow" onClick={() => setSemana(somarDias(semana, 7))} aria-label="Próxima semana"><Icone nome="right" /></button>
  </div>;
}

// Busca o estoque de uma semana: os produtos com o disponível de cada um e os tamanhos liberados.
// É usado nas três telas que dependem da colheita (estoque, separação e pedido).
function buscarEstoque(token, semanaISO, aoExpirar) {
  return fetch(`${URL_DA_API}/estoques?semana=${semanaISO}`, {
    headers: { Authorization: 'Bearer ' + token }
  }).then((res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (!res.ok) throw new Error('Não foi possível carregar o estoque da semana.');
    return res.json();
  });
}

// Busca o catálogo de produtos. somenteAtivos=true serve às listas de escolha (estoque):
// o produto desativado continua no histórico, mas não entra numa colheita nova.
function buscarProdutos(token, aoExpirar, somenteAtivos = false) {
  return fetch(`${URL_DA_API}/produtos${somenteAtivos ? '?ativos=true' : ''}`, {
    headers: { Authorization: 'Bearer ' + token }
  }).then((res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (!res.ok) throw new Error('Não foi possível carregar os produtos.');
    return res.json();
  });
}

// POST (cadastrar) ou PATCH (renomear, desativar, reativar) no catálogo.
// 409 traz a frase do serviço, como "Já existe um produto chamado Alface."
function gravarProduto(token, metodo, caminho, corpo, aoExpirar) {
  return fetch(`${URL_DA_API}/produtos${caminho}`, {
    method: metodo,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  }).then(async (res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (res.status === 409) {
      const erro = await res.json();
      throw new Error(erro.detail || 'Já existe um produto com esse nome.');
    }
    if (!res.ok) throw new Error('Não foi possível salvar o produto.');
    return res.json();
  });
}

// Botões de página: o back pagina de 10 em 10. Se veio uma página cheia, pode haver uma próxima.
function Paginacao({ pagina, setPagina, quantidade }) {
  if (pagina === 1 && quantidade < POR_PAGINA) return null;  // tudo coube numa página só
  return <nav className="pagination" aria-label="Páginas de cestas">
    <button type="button" className="btn btn-secondary" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
      <Icone nome="left" /> Anterior
    </button>
    <span>Página {pagina}</span>
    <button type="button" className="btn btn-secondary" disabled={quantidade < POR_PAGINA} onClick={() => setPagina(pagina + 1)}>
      Próxima <Icone nome="right" />
    </button>
  </nav>;
}

// Busca os produtos de todas as cestas da página ao mesmo tempo (Promise.all), e não uma por uma:
// no celular da assinante, dez buscas em fila demoravam dez vezes mais. Devolve { idDaCesta: produtos }.
function buscarProdutosDasCestas(token, lista) {
  return Promise.all(lista.map((cesta) =>
    fetch(`${URL_DA_API}/cestas/${cesta.id}/produtos`, { headers: { Authorization: 'Bearer ' + token } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((produtos) => [cesta.id, produtos])
  )).then((pares) => Object.fromEntries(pares));
}

// Soma as quantidades porque a capacidade não conta apenas os tipos de produto.
function itensSeparados(cesta) {
  if (cesta.quantidade_ocupada !== undefined) return cesta.quantidade_ocupada;
  if (!cesta.produtos) return 0;
  return cesta.produtos.reduce((total, p) => total + (p.quantidade || 0), 0);
}

// "4 de 5 itens separados · cabe mais 1", como no styleguide. Com 1 o verbo fica no singular.
// usadosExtra soma uma quantidade ainda não gravada, para a previsão do formulário de separação.
function textoCapacidade(cesta, usadosExtra = 0) {
  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const usados = itensSeparados(cesta) + usadosExtra;
  const livres = Math.max(0, limite - usados);
  const resto = livres === 0 ? 'cesta cheia' : livres === 1 ? 'cabe mais 1' : `cabem mais ${livres}`;
  return `${usados} de ${limite} itens separados · ${resto}`;
}

function Capacidade({ cesta }) {
  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const usados = itensSeparados(cesta);
  return <div className="entry-capacity">
    <div className="entry-progress-header"><span>Capacidade da cesta</span><span className="remaining">{usados} / {limite}</span></div>
    <progress value={usados} max={limite} aria-label={textoCapacidade(cesta)} />
    <p>{textoCapacidade(cesta)}</p>
  </div>;
}

// O texto e a cor de cada situação do pedido: pedida -> em separação -> concluída, ou recusada.
const SITUACOES = {
  pedida: { nome: 'Aguardando aprovação', classe: 'status-ordered' },
  em_separacao: { nome: 'Em separação', classe: 'status-progress' },
  concluida: { nome: 'Concluída', classe: 'status-done' },
  recusada: { nome: 'Recusada', classe: 'status-refused' },
  cancelada: { nome: 'Cancelada', classe: 'status-cancelled' },
};

function SituacaoDaCesta({ situacao }) {
  const info = SITUACOES[situacao] || SITUACOES.pedida;
  return <span className={`status-badge ${info.classe}`}>{info.nome}</span>;
}

// PATCH de aprovar, reprovar, concluir ou cancelar. Devolve a promessa; 401 volta para o login e
// 409 mostra a frase que vem do serviço (ex.: "A cesta ainda não está cheia. Faltam 1 itens.").
function decidirCesta(token, cestaId, acao, aoExpirar) {
  return fetch(`${URL_DA_API}/cestas/${cestaId}/${acao}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token }
  }).then(async (res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (res.status === 409) {
      const corpo = await res.json();
      throw new Error(corpo.detail || 'A cesta não está na situação esperada.');
    }
    if (!res.ok) throw new Error('Não foi possível atualizar a cesta.');
    return res.json();
  });
}

function ProdutosDaCesta({ produtos }) {
  if (!produtos || !produtos.length) {
    return <p className="entry-empty">Nenhum produto separado ainda. A lista aparecerá aqui quando a separação começar.</p>;
  }
  return <ul>
    {produtos.map((produto, indice) => (
      <li key={`${produto.nome_produto || produto.nome}-${indice}`}>
        <span>{produto.nome_produto || produto.nome}</span>
        <span>{produto.quantidade} un.</span>
      </li>
    ))}
  </ul>;
}

function Janela({ aberta, aoFechar, children, classe, titulo }) {
  const referencia = useRef(null);
  useEffect(() => {
    const janela = referencia.current;
    if (aberta && janela && !janela.open) janela.showModal();
    if (!aberta && janela?.open) janela.close();
  }, [aberta]);
  return <dialog ref={referencia} className={classe} aria-labelledby={titulo} onCancel={aoFechar} onClose={aoFechar}>{children}</dialog>;
}

// O menu de cada perfil. Um item com "itens" vira um menu com dropdown; sem "itens", é um link solto.
const MENU_DO_PERFIL = {
  assinante: [
    { tela: 'inicio', rotulo: 'Início' },
    { tela: 'cestas', rotulo: 'Minhas cestas' },
    { tela: 'preferencias', rotulo: 'Preferências' },
  ],
  produtor: [
    { rotulo: 'Cestas', itens: [{ tela: 'separacao', rotulo: 'A separação' }] },
    { rotulo: 'Cadastros', itens: [{ tela: 'estoque', rotulo: 'O estoque' }, { tela: 'produtos', rotulo: 'Os produtos' }] },
  ],
};

// Cabeçalho em uma barra verde: logo, menus e, à direita, o usuário e o Sair.
// No computador o dropdown abre ao passar o mouse (CSS) e também por clique ou teclado (estado "menuAberto").
// No celular, o botão de menu mostra um painel com os menus já abertos, o usuário e o Sair.
function Cabecalho({ usuario, aoSair, navegar, telaAtual }) {
  const nomePerfil = usuario.tipo === 'assinante' ? 'Assinante' : 'Produtor';
  const menu = MENU_DO_PERFIL[usuario.tipo] ?? [];
  const [menuAberto, setMenuAberto] = useState(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const referencia = useRef(null);

  // Fecha o dropdown e o painel ao clicar fora do cabeçalho ou apertar Esc.
  useEffect(() => {
    if (menuAberto === null && !painelAberto) return undefined;
    const aoClicar = (evento) => {
      if (!referencia.current?.contains(evento.target)) { setMenuAberto(null); setPainelAberto(false); }
    };
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') { setMenuAberto(null); setPainelAberto(false); }
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [menuAberto, painelAberto]);

  const irPara = (tela) => {
    setMenuAberto(null);
    setPainelAberto(false);
    navegar(tela);
  };

  return <header className="site-header" id="topo" ref={referencia}>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="container topbar">
      <button className="topbar-brand" type="button" onClick={() => irPara('inicio')} aria-label="Cesta do Vale, voltar para o início">
        <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="240" height="96" />
      </button>
      <button className="topbar-toggle" type="button" aria-expanded={painelAberto} aria-controls="menu-principal"
        onClick={() => setPainelAberto((aberto) => !aberto)}>
        <Icone nome={painelAberto ? 'x' : 'menu'} rotulo={painelAberto ? 'Fechar o menu' : 'Abrir o menu'} />
      </button>
      <div className={`topbar-panel ${painelAberto ? 'open' : ''}`} id="menu-principal">
        <nav className="topnav" aria-label="Navegação principal">
          <ul className="topnav-list">
            {menu.map((entrada) => {
              if (!entrada.itens) {
                return <li key={entrada.tela}>
                  <button type="button" className={`topnav-link ${telaAtual === entrada.tela ? 'active' : ''}`}
                    aria-current={telaAtual === entrada.tela ? 'page' : undefined} onClick={() => irPara(entrada.tela)}>
                    {entrada.rotulo}
                  </button>
                </li>;
              }
              const aberto = menuAberto === entrada.rotulo;
              const ativo = entrada.itens.some((item) => item.tela === telaAtual);
              const idDoMenu = `menu-${entrada.rotulo.toLowerCase()}`;
              return <li key={entrada.rotulo} className={`topnav-menu ${aberto ? 'open' : ''}`}
                onMouseLeave={() => { if (aberto) setMenuAberto(null); }}>
                <button type="button" className={`topnav-link ${ativo ? 'active' : ''}`} aria-expanded={aberto} aria-controls={idDoMenu}
                  onClick={() => setMenuAberto(aberto ? null : entrada.rotulo)}>
                  {entrada.rotulo} <Icone nome="chevron" />
                </button>
                <ul className="topnav-dropdown" id={idDoMenu}>
                  {entrada.itens.map((item) => <li key={item.tela}>
                    <button type="button" className={telaAtual === item.tela ? 'active' : ''}
                      aria-current={telaAtual === item.tela ? 'page' : undefined} onClick={() => irPara(item.tela)}>
                      {item.rotulo}
                    </button>
                  </li>)}
                </ul>
              </li>;
            })}
          </ul>
        </nav>
        <div className="topbar-actions">
          <div className="user-badge">
            <Icone nome="user" />
            <span><strong>{usuario.nome}</strong> · {nomePerfil}</span>
          </div>
          <button className="btn-logout" type="button" onClick={aoSair} aria-label="Sair da conta">
            Sair
          </button>
        </div>
      </div>
    </div>
  </header>;
}

// O pedido de cadastro de produtor que espera o código: { id, expira_em, email }.
// Fica no sessionStorage para o passo do código sobreviver a uma recarga da página (a senha não fica guardada).
const CHAVE_DO_PEDIDO = 'pedido_produtor';

function lerPedidoGuardado() {
  try {
    const pedido = JSON.parse(sessionStorage.getItem(CHAVE_DO_PEDIDO));
    return pedido && new Date(pedido.expira_em) > new Date() ? pedido : null;
  } catch {
    return null;
  }
}

// A frase de erro que o back mandou em "detail", ou a frase padrão se não vier texto.
async function erroDaResposta(resposta, padrao) {
  try {
    const corpo = await resposta.json();
    return typeof corpo.detail === 'string' ? corpo.detail : padrao;
  } catch {
    return padrao;
  }
}

// Componente de Login conforme o slide 35 da Aula 08
function Login({ aoEntrar }) {
  const [pedido, setPedido] = useState(lerPedidoGuardado);
  const [modo, setModo] = useState(() => (pedido ? 'produtor' : 'login')); // 'login', 'cadastro' ou 'produtor'
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(false);
  // 5 cliques no logo em até 3 segundos mostram a aba de cadastro de produtor.
  // Os cliques só escondem o formulário; quem protege é o código que vai para o e-mail do administrador.
  const [produtorVisivel, setProdutorVisivel] = useState(Boolean(pedido));
  const cliquesNoLogo = useRef([]);

  const clicarNoLogo = () => {
    const agora = Date.now();
    cliquesNoLogo.current = [...cliquesNoLogo.current.filter((momento) => agora - momento < 3000), agora];
    if (cliquesNoLogo.current.length >= 5) {
      cliquesNoLogo.current = [];
      setProdutorVisivel(true);
      trocarModo('produtor');
    }
  };

  const trocarModo = (novo) => { setModo(novo); setMensagem(''); setAviso(''); };

  const guardarPedido = (novo) => {
    setPedido(novo);
    setCodigo('');
    try {
      if (novo) sessionStorage.setItem(CHAVE_DO_PEDIDO, JSON.stringify(novo));
      else sessionStorage.removeItem(CHAVE_DO_PEDIDO);
    } catch {
      // Sem sessionStorage, o passo do código só não sobrevive a uma recarga.
    }
  };

  // Mão na massa 2.6 (Slide 35): o /login lê URLSearchParams com username e password
  const entrar = (emailDoLogin, senhaDoLogin, erro = 'e-mail ou senha incorretos') => {
    const corpo = new URLSearchParams({ username: emailDoLogin, password: senhaDoLogin });
    return fetch(`${URL_DA_API}/login`, { method: 'POST', body: corpo })
      .then((resposta) => {
        if (!resposta.ok) throw new Error(erro);
        return resposta.json();
      })
      .then((dados) => {
        localStorage.setItem('token', dados.access_token);
        aoEntrar(dados.access_token);
      });
  };

  // Liga o "carregando" e mostra a frase do erro, para os quatro envios da tela.
  const enviar = (e, acao) => {
    e.preventDefault();
    setMensagem('');
    setAviso('');
    setCarregando(true);
    acao()
      .catch((problema) => setMensagem(problema.message))
      .finally(() => setCarregando(false));
  };

  const submeterLogin = (e) => enviar(e, () => entrar(email, senha));

  // O cadastro público cria sempre uma assinante: o perfil não é enviado, e o back recusa quem o mandar.
  const submeterCadastro = (e) => enviar(e, () => fetch(`${URL_DA_API}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha })
  })
    .then((resposta) => {
      if (resposta.status === 409) throw new Error('Já existe um usuário com esse e-mail');
      if (!resposta.ok) throw new Error('Erro ao cadastrar. Confira os campos digitados.');
      // Após cadastrar com sucesso, realiza o login automaticamente
      return entrar(email, senha, 'Conta criada, mas não foi possível entrar. Tente pelo login.');
    }));

  // Passo 1 do produtor: o back grava o pedido e manda o código ao e-mail do administrador.
  const submeterPedido = (e) => enviar(e, () => fetch(`${URL_DA_API}/usuarios/produtor/solicitacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha })
  })
    .then(async (resposta) => {
      if (!resposta.ok) {
        throw new Error(await erroDaResposta(resposta, 'Não foi possível pedir o cadastro. Confira os campos digitados.'));
      }
      const novo = await resposta.json();
      guardarPedido({ id: novo.id, expira_em: novo.expira_em, email });
    }));

  // Passo 2 do produtor: código certo cria a conta e entra. Pedido vencido, cancelado ou já usado volta ao passo 1.
  const submeterCodigo = (e) => enviar(e, () => fetch(
    `${URL_DA_API}/usuarios/produtor/solicitacoes/${encodeURIComponent(pedido.id)}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    })
    .then(async (resposta) => {
      if (!resposta.ok) {
        const frase = await erroDaResposta(resposta, 'Não foi possível ativar a conta.');
        if (resposta.status !== 403 || frase.includes('cancelado')) guardarPedido(null);
        else setCodigo('');
        throw new Error(frase);
      }
      const emailDoPedido = pedido.email;
      guardarPedido(null);
      // Depois de uma recarga a senha não está mais na tela: a pessoa entra pelo login.
      if (!senha) {
        setEmail(emailDoPedido);
        setModo('login');
        setAviso('Conta de produtor criada. Entre com o seu e-mail e a sua senha.');
        return undefined;
      }
      return entrar(emailDoPedido, senha, 'Conta criada, mas não foi possível entrar. Tente pelo login.');
    }));

  const prazo = pedido
    ? new Date(pedido.expira_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
  const titulos = {
    login: ['Entrar no sistema', 'Digite suas credenciais para acessar sua área.'],
    cadastro: ['Criar nova conta', 'Cadastre-se para pedir a cesta da semana.'],
    produtor: pedido
      ? ['Código de ativação', `O código foi enviado ao administrador do sistema e vale até ${prazo}.`]
      : ['Cadastro de produtor', 'Depois de enviar, o administrador recebe um código para ativar a conta.'],
  };

  const camposDoCadastro = <>
    <label>
      Nome completo
      <input
        type="text"
        required
        minLength={2}
        maxLength={100}
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
    </label>
    <label>
      E-mail
      <input
        type="email"
        required
        maxLength={100}
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </label>
    <label>
      Senha (mínimo 8 caracteres)
      <input
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
    </label>
  </>;

  return <div className="auth-wrap">
    <div className="auth-card">
      <div className="auth-header">
        {/* O clique no logo não é um botão de propósito: ele não aparece no foco do teclado nem no leitor de tela */}
        <span className="auth-logo" onClick={clicarNoLogo}>
          <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="240" height="79" draggable="false" />
        </span>
        <h1>{titulos[modo][0]}</h1>
        <p>{titulos[modo][1]}</p>
      </div>

      {/* role="tab" e aria-selected dizem ao leitor de tela qual das abas está aberta */}
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'login'}
          className={`auth-tab ${modo === 'login' ? 'active' : ''}`}
          onClick={() => trocarModo('login')}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'cadastro'}
          className={`auth-tab ${modo === 'cadastro' ? 'active' : ''}`}
          onClick={() => trocarModo('cadastro')}
        >
          Cadastrar
        </button>
        {produtorVisivel && (
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'produtor'}
            className={`auth-tab ${modo === 'produtor' ? 'active' : ''}`}
            onClick={() => trocarModo('produtor')}
          >
            Produtor
          </button>
        )}
      </div>

      {mensagem && <div className="auth-error" role="alert">{mensagem}</div>}
      {aviso && <div className="auth-success" role="status">{aviso}</div>}

      {modo === 'login' && (
        <form className="auth-form" onSubmit={submeterLogin}>
          <label>
            E-mail
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar no sistema'} <Icone nome="arrow" />
          </button>
        </form>
      )}

      {modo === 'cadastro' && (
        <form className="auth-form" onSubmit={submeterCadastro}>
          {camposDoCadastro}
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Criar conta e entrar'} <Icone nome="check" />
          </button>
        </form>
      )}

      {modo === 'produtor' && !pedido && (
        <form className="auth-form" onSubmit={submeterPedido}>
          {camposDoCadastro}
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Enviando...' : 'Solicitar cadastro'} <Icone nome="arrow" />
          </button>
        </form>
      )}

      {modo === 'produtor' && pedido && (
        <form className="auth-form" onSubmit={submeterCodigo}>
          <p className="auth-note">Pedido para <strong>{pedido.email}</strong>. Peça o código ao administrador.</p>
          <label>
            Código de ativação (6 dígitos)
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={carregando || codigo.length !== 6}>
            {carregando ? 'Ativando...' : 'Ativar conta'} <Icone nome="check" />
          </button>
          <button className="btn btn-secondary" type="button" disabled={carregando}
            onClick={() => { guardarPedido(null); setMensagem(''); }}>
            Voltar e pedir de novo
          </button>
        </form>
      )}
    </div>
  </div>;
}

// As três opções de cada produto nas preferências. tanto_faz é o padrão e não guarda nada no back.
const OPCOES_DE_PREFERENCIA = [
  { valor: 'quero', rotulo: 'Quero' },
  { valor: 'tanto_faz', rotulo: 'Tanto faz' },
  { valor: 'nao_quero', rotulo: 'Não quero' },
];

// GET /preferencias (sem corpo) ou PUT /preferencias/{id}. As duas devolvem a lista inteira atualizada.
function chamarPreferencias(token, aoExpirar, produtoId, preferencia) {
  const gravar = produtoId !== undefined;
  return fetch(`${URL_DA_API}/preferencias${gravar ? `/${produtoId}` : ''}`, {
    method: gravar ? 'PUT' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(gravar ? { 'Content-Type': 'application/json' } : {}) },
    body: gravar ? JSON.stringify({ preferencia }) : undefined
  }).then(async (res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (!res.ok) throw new Error(await erroDaResposta(res, gravar ? 'Não foi possível salvar a preferência.' : 'Não foi possível carregar as preferências.'));
    return res.json();
  });
}

// As preferências da dona de uma cesta, para o produtor: { quer: [ids], nao_quer: [ids] }.
// Se a busca falhar, a separação segue sem as marcações: o back confere de novo ao gravar.
function buscarPreferenciasDaCesta(token, cestaId) {
  return fetch(`${URL_DA_API}/cestas/${cestaId}/preferencias`, { headers: { Authorization: 'Bearer ' + token } })
    .then((res) => (res.ok ? res.json() : { quer: [], nao_quer: [] }))
    .catch(() => ({ quer: [], nao_quer: [] }));
}

// Tela de Preferências da assinante: cada produto do estoque com Quero, Tanto faz ou Não quero.
// Cada clique grava na hora; a lista que volta do back substitui a da tela.
function Preferencias({ token, navegar, aoExpirar }) {
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState('');
  // Id do produto com um PUT em andamento, para desligar as opções dele.
  const [salvando, setSalvando] = useState(null);

  useEffect(() => {
    chamarPreferencias(token, aoExpirar).then(setProdutos).catch((err) => setErro(err.message));
  }, [token]);

  const marcar = (produto, preferencia) => {
    if (produto.preferencia === preferencia) return;
    setErro('');
    setSalvando(produto.produto_id);
    // Mostra a escolha na hora; se o back recusar, volta ao que estava.
    const anterior = produtos;
    setProdutos(produtos.map((p) => (p.produto_id === produto.produto_id ? { ...p, preferencia } : p)));
    chamarPreferencias(token, aoExpirar, produto.produto_id, preferencia)
      .then(setProdutos)
      .catch((err) => { setProdutos(anterior); setErro(err.message); })
      .finally(() => setSalvando(null));
  };

  const contar = (valor) => (produtos || []).filter((p) => p.preferencia === valor).length;

  return <section className="container workspace page" aria-labelledby="titulo-preferencias">
    <div className="workspace-heading">
      <div>
        <button className="back-link" type="button" onClick={() => navegar('inicio')}>
          <Icone nome="left" /> Voltar para o início
        </button>
        <span className="section-overline">SUA ÁREA</span>
        <h1 id="titulo-preferencias">Minhas <span>preferências</span></h1>
        <p>Marque o que você quer ou não quer receber. O produtor coloca primeiro o que você quer, quando há estoque, e nunca coloca o que você não quer.</p>
      </div>
    </div>

    {erro && <div className="dialog-error" role="alert">{erro}</div>}

    {!produtos ? (
      !erro && <p>Carregando os produtos...</p>
    ) : produtos.length ? <>
      <p className="pref-summary" aria-live="polite">
        <span><strong>{contar('quero')}</strong> que você quer</span>
        <span><strong>{contar('nao_quero')}</strong> que você não quer</span>
        <span>As mudanças são salvas na hora e valem para as próximas cestas.</span>
      </p>
      <ul className="pref-list">
        {produtos.map((produto) => (
          <li key={produto.produto_id} className={`pref-item pref-${produto.preferencia}`}>
            <fieldset disabled={salvando === produto.produto_id}>
              <legend>{produto.nome_produto}</legend>
              <div className="pref-options">
                {OPCOES_DE_PREFERENCIA.map((opcao) => (
                  <label key={opcao.valor} className={`pref-option pref-option-${opcao.valor}`}>
                    <input type="radio" name={`pref-${produto.produto_id}`} value={opcao.valor}
                      checked={produto.preferencia === opcao.valor}
                      onChange={() => marcar(produto, opcao.valor)} />
                    <span>{opcao.rotulo}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
    </> : (
      <div className="empty-workspace">
        <Icone nome="leaf" />
        <h3>Ainda não há produtos no estoque.</h3>
        <p>Quando o produtor registrar a primeira colheita, os produtos aparecem aqui para você marcar.</p>
      </div>
    )}
  </section>;
}

// Tela de Minhas Cestas da assinante
function MinhasCestas({ token, navegar, abrirPedido, aoExpirar, aoAvisar, versao }) {
  const [cestas, setCestas] = useState([]);
  // Id da cesta que pede a confirmação do cancelamento, e da que está sendo cancelada agora.
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtosPorCesta, setProdutosPorCesta] = useState({});
  const [pagina, setPagina] = useState(1);
  // Filtros da lista: '' quer dizer "todas". A semana é a segunda-feira "AAAA-MM-DD" escolhida.
  const [situacao, setSituacao] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [semana, setSemana] = useState('');
  const temFiltro = Boolean(situacao || tamanho || semana);

  // Trocar qualquer filtro volta para a primeira página
  const mudarFiltro = (setFiltro) => (valor) => { setFiltro(valor); setPagina(1); };
  const limparFiltros = () => { setSituacao(''); setTamanho(''); setSemana(''); setPagina(1); };

  const carregarCestas = () => {
    setCarregando(true);
    setErro('');   // limpa o erro da busca anterior
    const filtros = new URLSearchParams({ pagina });
    if (situacao) filtros.set('situacao', situacao);
    if (tamanho) filtros.set('tamanho', tamanho);
    if (semana) filtros.set('semana', semana);
    fetch(`${URL_DA_API}/cestas?${filtros}`, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        // 401: a pulseira venceu no meio do uso, então volta para o login
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível carregar as cestas');
        return res.json();
      })
      .then((lista) => {
        setCestas(lista);
        return buscarProdutosDasCestas(token, lista);
      })
      .then(setProdutosPorCesta)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  // Busca de novo quando o token muda ou quando o App avisa que algo foi gravado (versao)
  useEffect(() => {
    carregarCestas();
  }, [token, versao, pagina, situacao, tamanho, semana]);

  // O back devolve ao estoque o que já tinha sido separado. A lista é buscada de novo para mostrar a situação nova.
  const cancelar = (cesta) => {
    setCancelando(cesta.id);
    setErro('');
    decidirCesta(token, cesta.id, 'cancelar', aoExpirar)
      .then(() => {
        setConfirmandoCancelar(null);
        aoAvisar(`Seu pedido #${cesta.id} foi cancelado.`);
        carregarCestas();
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCancelando(null));
  };

  return <section className="container workspace page" aria-labelledby="titulo-minhas-cestas">
    <div className="workspace-heading">
      <div>
        <button className="back-link" type="button" onClick={() => navegar('inicio')}>
          <Icone nome="left" /> Voltar para o início
        </button>
        <span className="section-overline">SUA ÁREA</span>
        <h1 id="titulo-minhas-cestas">Minhas <span>cestas</span></h1>
        <p>Acompanhe seus pedidos semanais e confira os produtos já separados pelo produtor.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={abrirPedido}>
        Pedir nova cesta <Icone nome="arrow" />
      </button>
    </div>

    <div className="filter-bar" role="search" aria-label="Filtrar minhas cestas">
      <label htmlFor="minhas-situacao">
        Situação
        <select id="minhas-situacao" value={situacao} onChange={(e) => mudarFiltro(setSituacao)(e.target.value)}>
          <option value="">Todas as situações</option>
          {Object.entries(SITUACOES).map(([valor, info]) => (
            <option key={valor} value={valor}>{info.nome}</option>
          ))}
        </select>
      </label>
      <label htmlFor="minhas-tamanho">
        Tamanho
        <select id="minhas-tamanho" value={tamanho} onChange={(e) => mudarFiltro(setTamanho)(e.target.value)}>
          <option value="">Todos os tamanhos</option>
          <option value="pequena">Pequena (5 itens)</option>
          <option value="media">Média (8 itens)</option>
          <option value="grande">Grande (12 itens)</option>
        </select>
      </label>
      {/* Qualquer dia serve: a semana guardada é a segunda-feira daquele dia */}
      <label htmlFor="minhas-semana">
        Semana
        <input id="minhas-semana" type="date" value={semana}
          onChange={(e) => {
            const [ano, mes, dia] = e.target.value.split('-').map(Number);
            mudarFiltro(setSemana)(e.target.value ? dataISO(segundaDaSemana(new Date(ano, mes - 1, dia))) : '');
          }} />
      </label>
      {temFiltro && (
        <button type="button" className="text-link filter-clear" onClick={limparFiltros}>
          <Icone nome="x" /> Limpar filtros
        </button>
      )}
      <div className="filter-summary" aria-live="polite">
        {semana && <>Semana {textoDaSemana(semana)} · </>}
        {cestas.length} {cestas.length === 1 ? 'cesta' : 'cestas'}
      </div>
    </div>

    {erro && <div className="dialog-error">{erro}</div>}

    {carregando ? (
      <p>Carregando suas cestas...</p>
    ) : (
      <div className="workspace-list">
        {cestas.length ? (
          cestas.map((cesta) => {
            const prods = produtosPorCesta[cesta.id] || [];
            const cestaComProds = { ...cesta, produtos: prods };
            return (
              <article className="order-entry" key={cesta.id}>
                <div className="entry-top">
                  <div>
                    <span className="entry-meta">
                      <Icone nome="calendar" /> SEMANA {textoDaSemana(cesta.semana)}
                    </span>
                    <h2 className="entry-title">Cesta {tamanhos[cesta.tamanho]?.nome.toLowerCase()}</h2>
                    <p className="entry-person">Pedido nº #{cesta.id}</p>
                  </div>
                  <SituacaoDaCesta situacao={cesta.situacao} />
                </div>
                {cesta.situacao === 'pedida' && (
                  <p className="entry-empty">Seu pedido foi enviado. O produtor ainda vai aprovar ou recusar.</p>
                )}
                {cesta.situacao === 'recusada' && (
                  <p className="entry-empty">O produtor não pôde atender este pedido. Você pode pedir outra cesta.</p>
                )}
                {cesta.situacao === 'cancelada' && (
                  <p className="entry-empty">Você cancelou este pedido.</p>
                )}
                {(cesta.situacao === 'em_separacao' || cesta.situacao === 'concluida') && <>
                  <Capacidade cesta={cestaComProds} />
                  <div className="entry-items">
                    <h3>Produtos separados pelo produtor</h3>
                    <ProdutosDaCesta produtos={prods} />
                  </div>
                </>}
                {cesta.situacao === 'em_separacao' && (
                  confirmandoCancelar === cesta.id ? (
                    <div className="cancel-confirm" role="group" aria-label={`Confirmar o cancelamento do pedido #${cesta.id}`}>
                      <p>Cancelar este pedido? Não dá para desfazer, e os produtos já separados voltam para o produtor.</p>
                      <div className="entry-actions-row">
                        <button type="button" className="btn btn-danger" disabled={cancelando === cesta.id}
                          onClick={() => cancelar(cesta)}>
                          {cancelando === cesta.id ? 'Cancelando...' : 'Sim, cancelar'}
                        </button>
                        <button type="button" className="btn btn-secondary" disabled={cancelando === cesta.id}
                          onClick={() => setConfirmandoCancelar(null)}>
                          Manter pedido
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="entry-actions">
                      <button type="button" className="text-link cancel-link" onClick={() => setConfirmandoCancelar(cesta.id)}>
                        Cancelar pedido
                      </button>
                    </div>
                  )
                )}
              </article>
            );
          })
        ) : temFiltro ? (
          <div className="empty-workspace">
            <Icone nome="filter" />
            <h3>Nenhuma cesta com esses filtros.</h3>
            <p>Troque a situação, o tamanho ou a semana para ver outros pedidos.</p>
            <button type="button" className="btn btn-secondary" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="empty-workspace">
            <Icone nome="box" />
            <h3>Você ainda não pediu uma cesta.</h3>
            <p>Escolha um tamanho para fazer seu primeiro pedido da semana.</p>
            <button type="button" className="btn btn-primary" onClick={abrirPedido}>
              Pedir uma cesta
            </button>
          </div>
        )}
      </div>
    )}
    <Paginacao pagina={pagina} setPagina={setPagina} quantidade={cestas.length} />
  </section>;
}

// Tela de Separação do produtor
// A frase padrão quando a IA falha. Um erro do servidor do Vercel nem sempre vem em JSON, então fica aqui também.
const FALHA_DA_IA = 'Não foi possível gerar a sugestão. Você pode separar manualmente.';

// As duas chamadas do pré-preenchimento. O detail traz a frase que o back escreveu para a tela.
function enviarPrePreenchimento(token, caminho, corpo, aoExpirar, mensagemPadrao) {
  return fetch(`${URL_DA_API}/cestas/pre-preenchimento${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(corpo)
  }).then((res) => {
    if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    return res.json().catch(() => ({})).then((dados) => {
      if (!res.ok) throw new Error(typeof dados.detail === 'string' ? dados.detail : mensagemPadrao);
      return dados;
    });
  });
}

// Uma quantidade do rascunho só vale inteira e a partir de 1. O campo vazio, durante a digitação, não vale.
function quantidadeValida(valor) {
  const numero = Number(valor);
  return valor !== '' && Number.isInteger(numero) && numero >= 1;
}

// Soma o que está no rascunho por produto (pelo id do catálogo), em todas as cestas, para mostrar o que sobra do estoque.
function somarPorProduto(cestas) {
  const soma = {};
  cestas.forEach((cesta) => cesta.itens.forEach((item) => {
    soma[item.produto_id] = (soma[item.produto_id] || 0) + (quantidadeValida(item.quantidade) ? Number(item.quantidade) : 0);
  }));
  return soma;
}

function somarCesta(cesta) {
  return cesta.itens.reduce((total, item) => total + (quantidadeValida(item.quantidade) ? Number(item.quantidade) : 0), 0);
}

// O rascunho que a IA sugeriu. Nada aqui está gravado: o produtor ajusta e só o botão Confirmar grava.
// A conferência da tela só ajuda a corrigir antes de enviar; quem decide é o back, de novo, na confirmação.
function RascunhoDaIa({ rascunho, setRascunho, aoConfirmar, aoDescartar, confirmando, erro }) {
  const { cestas, estoque, descartados, cestas_pedidas: cestasPedidas } = rascunho;
  const usados = somarPorProduto(cestas);
  const sobra = (produto) => produto.disponivel - (usados[produto.produto_id] || 0);
  const totalDeItens = cestas.reduce((total, cesta) => total + cesta.itens.length, 0);
  const estoqueEstourado = estoque.some((produto) => sobra(produto) < 0);
  const cestaEstourada = cestas.some((cesta) => somarCesta(cesta) > cesta.espaco_livre);
  const quantidadeRuim = cestas.some((cesta) => cesta.itens.some((item) => !quantidadeValida(item.quantidade)));
  const podeConfirmar = totalDeItens > 0 && !estoqueEstourado && !cestaEstourada && !quantidadeRuim;

  // Troca só a cesta alterada e mantém o resto do rascunho
  const mudarItens = (cestaId, novosItens) => setRascunho({
    ...rascunho,
    cestas: cestas.map((cesta) => (cesta.cesta_id === cestaId ? { ...cesta, itens: novosItens(cesta.itens) } : cesta))
  });

  return <section className="draft-panel" aria-labelledby="titulo-rascunho">
    <div className="draft-heading">
      <div>
        <span className="section-overline">SUGESTÃO DA IA</span>
        <h2 id="titulo-rascunho">Rascunho das cestas</h2>
        <p>Nada foi gravado ainda. Revise, ajuste o que precisar e confirme.</p>
      </div>
      <div className="draft-actions">
        <button type="button" className="btn btn-secondary" onClick={aoDescartar} disabled={confirmando}>
          Descartar
        </button>
        <button type="button" className="btn btn-primary" onClick={aoConfirmar} disabled={!podeConfirmar || confirmando}>
          {confirmando ? 'Gravando...' : 'Confirmar'} <Icone nome="check" />
        </button>
      </div>
    </div>

    {cestasPedidas > 0 && (
      <p className="draft-note">
        <Icone nome="info" />
        {cestasPedidas === 1 ? '1 cesta ainda não aprovada ficou' : `${cestasPedidas} cestas ainda não aprovadas ficaram`} fora da sugestão.
      </p>
    )}
    {descartados.length > 0 && (
      <div className="draft-note draft-discarded">
        <Icone nome="info" />
        <div>
          <strong>A IA sugeriu itens que não puderam entrar, e o espaço ficou vazio:</strong>
          <ul>
            {descartados.map((item, indice) => (
              <li key={indice}>Cesta #{item.cesta_id}: {item.quantidade} × {item.produto}. {item.motivo}</li>
            ))}
          </ul>
        </div>
      </div>
    )}

    <div className="draft-stock" aria-label="O que sobra do estoque com este rascunho">
      {estoque.map((produto) => {
        const resto = sobra(produto);
        return <span key={produto.produto_id} className={resto < 0 ? 'draft-stock-over' : ''}>
          {produto.nome_produto}: <strong>sobra {resto}</strong>
        </span>;
      })}
    </div>

    <div className="workspace-list">
      {cestas.map((cesta) => {
        const soma = somarCesta(cesta);
        const estourada = soma > cesta.espaco_livre;
        const naoQuer = cesta.nao_quer || [];
        const opcoes = estoque.filter((produto) => sobra(produto) > 0 && !naoQuer.includes(produto.produto_id)
          && !cesta.itens.some((item) => item.produto_id === produto.produto_id));
        const nomes = (ids) => estoque.filter((produto) => (ids || []).includes(produto.produto_id))
          .map((produto) => produto.nome_produto).join(', ');
        return <article className="producer-entry" key={cesta.cesta_id}>
          <h3 className="entry-title">Cesta {tamanhos[cesta.tamanho]?.nome.toLowerCase()} #{cesta.cesta_id}</h3>
          <p className="entry-person">Assinante: <strong>{cesta.assinante}</strong></p>
          {nomes(cesta.quer) && <p className="entry-person">Quer: {nomes(cesta.quer)}</p>}
          {nomes(cesta.nao_quer) && <p className="entry-person">Não quer: {nomes(cesta.nao_quer)}</p>}
          <p className={estourada ? 'draft-capacity draft-capacity-over' : 'draft-capacity'}>
            {soma} de {cesta.espaco_livre} {cesta.espaco_livre === 1 ? 'espaço livre usado' : 'espaços livres usados'}
          </p>
          {cesta.itens.length === 0 && <p className="entry-empty">Nenhum produto sugerido. O espaço fica vazio.</p>}
          {cesta.itens.map((item, indice) => (
            <div className="draft-row" key={item.produto_id}>
              <label htmlFor={`qtd-${cesta.cesta_id}-${indice}`}>{item.produto}</label>
              <input
                id={`qtd-${cesta.cesta_id}-${indice}`}
                type="number"
                min="1"
                step="1"
                value={item.quantidade}
                aria-invalid={!quantidadeValida(item.quantidade)}
                onChange={(e) => mudarItens(cesta.cesta_id, (itens) => itens.map((atual, i) => (
                  i === indice ? { ...atual, quantidade: e.target.value } : atual)))}
              />
              <button type="button" className="draft-remove" aria-label={`Tirar ${item.produto} da cesta #${cesta.cesta_id}`}
                onClick={() => mudarItens(cesta.cesta_id, (itens) => itens.filter((_, i) => i !== indice))}>
                <Icone nome="x" />
              </button>
            </div>
          ))}
          {opcoes.length > 0 && soma < cesta.espaco_livre && (
            <label className="draft-add">
              Acrescentar produto
              {/* O value do option é texto: o item novo guarda o id como número, igual aos que vieram do back */}
              <select value="" onChange={(e) => {
                const escolhido = opcoes.find((produto) => String(produto.produto_id) === e.target.value);
                if (!escolhido) return;
                mudarItens(cesta.cesta_id, (itens) => [
                  ...itens, { produto_id: escolhido.produto_id, produto: escolhido.nome_produto, quantidade: 1 }]);
              }}>
                <option value="">Escolha um produto</option>
                {opcoes.map((produto) => (
                  <option key={produto.produto_id} value={produto.produto_id}>{produto.nome_produto}</option>
                ))}
              </select>
            </label>
          )}
        </article>;
      })}
    </div>

    {!podeConfirmar && (
      <p className="draft-hint" role="status">
        {quantidadeRuim ? 'Corrija as quantidades: use números inteiros, a partir de 1.'
          : cestaEstourada ? 'Alguma cesta passou do espaço livre.'
            : estoqueEstourado ? 'Algum produto passou do que há no estoque.'
              : 'Acrescente ao menos um produto para confirmar.'}
      </p>
    )}
    {erro && <div className="dialog-error">{erro}</div>}
  </section>;
}

function Separacao({ token, abrirFechamento, aoExpirar, versao }) {
  const [cestas, setCestas] = useState([]);
  const [tamanho, setTamanho] = useState('todas');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtosPorCesta, setProdutosPorCesta] = useState({});
  const [pagina, setPagina] = useState(1);
  // Começa na semana atual, a mesma do estoque; as setas trocam de semana como na tela do estoque
  const [semana, setSemana] = useState(() => dataISO(segundaDaSemana()));
  // Filtro por assinante: { id, nome } de quem foi escolhida, ou null para ver todas.
  // Não existe lista de usuários na API, então o filtro nasce do nome mostrado em cada cesta.
  const [assinante, setAssinante] = useState(null);
  // Id da cesta com um PATCH em andamento: desliga os botões dela para não decidir duas vezes.
  const [decidindo, setDecidindo] = useState(null);
  // O rascunho da IA fica só na tela: recarregar a página perde o rascunho, e nada foi gravado.
  const [rascunho, setRascunho] = useState(null);
  const [sugerindo, setSugerindo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroDaIa, setErroDaIa] = useState('');
  const [avisoDaIa, setAvisoDaIa] = useState('');

  // Aprova, reprova ou conclui; depois busca a lista de novo para a cesta mudar de situação na tela.
  const decidir = (cesta, acao) => {
    setDecidindo(cesta.id);
    setErro('');
    decidirCesta(token, cesta.id, acao, aoExpirar)
      .then(() => carregarTodasCestas())
      .catch((err) => setErro(err.message))
      .finally(() => setDecidindo(null));
  };

  const carregarTodasCestas = () => {
    setCarregando(true);
    setErro('');   // limpa o erro da busca anterior
    const filtro = tamanho === 'todas' ? '' : `&tamanho=${tamanho}`;
    const filtroAssinante = assinante ? `&assinante_id=${assinante.id}` : '';
    const url = `${URL_DA_API}/cestas?pagina=${pagina}&semana=${semana}${filtro}${filtroAssinante}`;
    fetch(url, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        // 401: a pulseira venceu no meio do uso, então volta para o login
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível carregar as cestas');
        return res.json();
      })
      .then((lista) => {
        setCestas(lista);
        return buscarProdutosDasCestas(token, lista);
      })
      .then(setProdutosPorCesta)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  // Busca de novo quando muda o token, um filtro ou quando o App avisa que algo foi gravado (versao)
  useEffect(() => {
    carregarTodasCestas();
  }, [token, tamanho, versao, pagina, semana, assinante]);

  // Pede a sugestão da semana selecionada. A resposta é um rascunho: nada foi gravado.
  const pedirSugestao = () => {
    setSugerindo(true);
    setErroDaIa('');
    setAvisoDaIa('');
    enviarPrePreenchimento(token, '', { semana }, aoExpirar, FALHA_DA_IA)
      .then(setRascunho)
      .catch((err) => setErroDaIa(err.message))
      .finally(() => setSugerindo(false));
  };

  // O clique que confere: manda os itens revisados, e o back grava tudo ou nada.
  // Se o back recusar, o rascunho continua na tela para o produtor ajustar.
  const confirmarRascunho = () => {
    const itens = rascunho.cestas.flatMap((cesta) => cesta.itens.map((item) => ({
      cesta_id: cesta.cesta_id, produto_id: item.produto_id, quantidade: Number(item.quantidade)
    })));
    setConfirmando(true);
    setErroDaIa('');
    enviarPrePreenchimento(token, '/confirmar', { semana: rascunho.semana, itens }, aoExpirar,
      'Não foi possível gravar o rascunho. Tente de novo.')
      .then((resposta) => {
        setRascunho(null);
        setAvisoDaIa(`Rascunho gravado: ${resposta.itens_gravados} ${resposta.itens_gravados === 1 ? 'item' : 'itens'} em ${resposta.cestas_atualizadas} ${resposta.cestas_atualizadas === 1 ? 'cesta' : 'cestas'}.`);
        carregarTodasCestas();
      })
      .catch((err) => setErroDaIa(err.message))
      .finally(() => setConfirmando(false));
  };

  const descartarRascunho = () => { setRascunho(null); setErroDaIa(''); };

  // Trocar de semana volta para a primeira página, como trocar o filtro de tamanho.
  // O rascunho é de uma semana só, então a troca pergunta antes de perder o que foi ajustado.
  const mudarSemana = (nova) => {
    if (rascunho && !window.confirm('Trocar de semana descarta o rascunho. Continuar?')) return;
    setRascunho(null);
    setErroDaIa('');
    setAvisoDaIa('');
    setSemana(nova);
    setPagina(1);
  };
  // Escolher (ou tirar) a assinante também volta para a primeira página
  const mudarAssinante = (nova) => { setAssinante(nova); setPagina(1); };

  return <section className="container workspace page" aria-labelledby="titulo-separacao">
    <div className="workspace-heading">
      <div>
        <span className="section-overline">ÁREA DO PRODUTOR</span>
        <h1 id="titulo-separacao">A <span>separação</span></h1>
        <p>Veja as cestas da horta semana a semana, confira os limites e registre os produtos colhidos.</p>
      </div>
    </div>

    <SeletorDeSemana semana={semana} setSemana={mudarSemana} />

    <div className="filter-bar">
      <label htmlFor="filtro-tamanho">
        Filtrar por tamanho
        <select id="filtro-tamanho" value={tamanho} onChange={(e) => { setTamanho(e.target.value); setPagina(1); }}>
          <option value="todas">Todos os tamanhos</option>
          <option value="pequena">Pequena (5 itens)</option>
          <option value="media">Média (8 itens)</option>
          <option value="grande">Grande (12 itens)</option>
        </select>
      </label>
      {assinante && (
        <div className="filter-chip">
          Só as cestas de <strong>{assinante.nome}</strong>
          <button type="button" onClick={() => mudarAssinante(null)} aria-label={`Tirar o filtro de ${assinante.nome}`}>
            <Icone nome="x" />
          </button>
        </div>
      )}
      <div className="filter-summary" aria-live="polite">
        Página {pagina} · {cestas.length} {cestas.length === 1 ? 'cesta' : 'cestas'}
      </div>
    </div>

    {!rascunho && (
      <div className="ia-bar">
        <div>
          <strong>Pré-preencher com IA</strong>
          <p>A IA sugere como dividir o estoque entre as cestas aprovadas desta semana. Você revisa antes de gravar.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={pedirSugestao} disabled={sugerindo}>
          {sugerindo ? 'Gerando sugestão...' : 'Pré-preencher com IA'}
        </button>
      </div>
    )}
    {!rascunho && sugerindo && (
      <p className="ia-waiting" role="status">A IA está montando a sugestão. Isso pode levar até um minuto.</p>
    )}
    {!rascunho && erroDaIa && <div className="dialog-error" role="alert">{erroDaIa}</div>}
    {avisoDaIa && <p className="ia-success" role="status">{avisoDaIa}</p>}
    {rascunho && (
      <RascunhoDaIa rascunho={rascunho} setRascunho={setRascunho} aoConfirmar={confirmarRascunho}
        aoDescartar={descartarRascunho} confirmando={confirmando} erro={erroDaIa} />
    )}

    {erro && <div className="dialog-error">{erro}</div>}

    {carregando ? (
      <p>Carregando cestas para separação...</p>
    ) : (
      <div className="workspace-list">
        {cestas.length ? (
          cestas.map((cesta) => {
            const prods = produtosPorCesta[cesta.id] || [];
            const cestaComProds = { ...cesta, produtos: prods };
            const limite = tamanhos[cesta.tamanho]?.limite || 5;
            const usados = itensSeparados(cestaComProds);
            const cheia = usados >= limite;

            return (
              <article className="producer-entry" key={cesta.id}>
                <div className="entry-top">
                  <div>
                    <span className="entry-meta">
                      <Icone nome="calendar" /> SEMANA {textoDaSemana(cesta.semana)}
                    </span>
                    <h2 className="entry-title">Cesta {tamanhos[cesta.tamanho]?.nome.toLowerCase()} #{cesta.id}</h2>
                    <p className="entry-person">
                      Assinante: <strong>{cesta.assinante?.nome}</strong>
                      {!assinante && cesta.assinante && (
                        <button type="button" className="text-link" onClick={() => mudarAssinante(cesta.assinante)}>
                          ver só as cestas de {cesta.assinante.nome}
                        </button>
                      )}
                    </p>
                  </div>
                  <SituacaoDaCesta situacao={cesta.situacao} />
                </div>
                {/* Pedida: o produtor decide. Em separação e concluída mostram a capacidade e os produtos. */}
                {cesta.situacao === 'cancelada' && (
                  <p className="entry-empty">A assinante cancelou este pedido. Os produtos separados voltaram ao estoque.</p>
                )}
                {(cesta.situacao === 'em_separacao' || cesta.situacao === 'concluida') && <>
                  <Capacidade cesta={cestaComProds} />
                  <div className="entry-items">
                    <h3>Produtos já separados</h3>
                    <ProdutosDaCesta produtos={prods} />
                  </div>
                </>}
                {cesta.situacao === 'pedida' && (
                  <div className="entry-actions entry-actions-row">
                    <button type="button" className="btn btn-primary" disabled={decidindo === cesta.id}
                      onClick={() => decidir(cesta, 'aprovar')}>
                      Aprovar pedido <Icone nome="check" />
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={decidindo === cesta.id}
                      onClick={() => decidir(cesta, 'reprovar')}>
                      Reprovar
                    </button>
                  </div>
                )}
                {cesta.situacao === 'em_separacao' && (
                  <div className="entry-actions entry-actions-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={cheia}
                      onClick={() => abrirFechamento(cestaComProds)}
                    >
                      {cheia ? 'Cesta cheia' : 'Separar produto'} <Icone nome="arrow" />
                    </button>
                    {/* Só conclui a cesta cheia; o back também confere e responde 409 se faltar item */}
                    <button type="button" className="btn btn-secondary"
                      disabled={!cheia || decidindo === cesta.id}
                      onClick={() => decidir(cesta, 'concluir')}>
                      Concluir cesta <Icone nome="check" />
                    </button>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="empty-workspace">
            <Icone nome="filter" />
            <h3>Nenhuma cesta encontrada nesta semana</h3>
            <p>Troque a semana com as setas, selecione outro tamanho ou tire o filtro de assinante.</p>
          </div>
        )}
      </div>
    )}
    <Paginacao pagina={pagina} setPagina={setPagina} quantidade={cestas.length} />
  </section>;
}

// Tela do estoque do produtor: cadastra o que foi colhido na semana e mostra o que sobrou de cada produto.
// Começa na semana atual; as setas trocam de semana para cadastrar a colheita da próxima.
// O produto vem do catálogo (só os ativos); o produtor não digita mais o nome a cada semana.
function Estoque({ token, aoExpirar, versao, aoCadastrar, navegar }) {
  const [semana, setSemana] = useState(() => dataISO(segundaDaSemana()));
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [catalogo, setCatalogo] = useState(null);
  // O value do select é texto; o id vira número só no envio.
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarProdutos(token, aoExpirar, true)
      .then(setCatalogo)
      .catch((err) => setErro(err.message));
  }, [token]);

  // Busca de novo quando muda a semana ou quando o App avisa que algo foi gravado (versao)
  useEffect(() => {
    setCarregando(true);
    setErro('');
    buscarEstoque(token, semana, aoExpirar)
      .then(setResumo)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [token, semana, versao]);

  const submeter = (e) => {
    e.preventDefault();
    const qtd = Number(quantidade);
    if (!produtoId) { setErro('Escolha o produto colhido.'); return; }
    if (!Number.isInteger(qtd) || qtd < 1) { setErro('Informe uma quantidade inteira, a partir de 1.'); return; }
    setSalvando(true);
    setErro('');
    fetch(`${URL_DA_API}/estoques`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ semana, produto_id: Number(produtoId), quantidade: qtd })
    })
      .then(async (res) => {
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        // 409: o produto foi desativado em outra aba depois que a lista carregou
        if (res.status === 409) {
          const corpo = await res.json();
          throw new Error(corpo.detail || 'Esse produto não pode entrar no estoque.');
        }
        if (!res.ok) throw new Error('Não foi possível cadastrar o produto.');
        return res.json();
      })
      .then((salvo) => {
        setProdutoId('');
        setQuantidade('1');
        // O back soma quando o produto já existe na semana; o aviso mostra o total que ficou.
        aoCadastrar(`${qtd} un. de ${salvo.nome_produto} no estoque. Total na semana: ${salvo.quantidade}.`);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setSalvando(false));
  };

  return <section className="container workspace page" aria-labelledby="titulo-estoque">
    <div className="workspace-heading">
      <div>
        <span className="section-overline">ÁREA DO PRODUTOR</span>
        <h1 id="titulo-estoque">O <span>estoque</span></h1>
        <p>Cadastre o que foi colhido na semana. As cestas são montadas com esses produtos, e a assinante só pede o tamanho que cabe no que sobrou.</p>
      </div>
    </div>

    <SeletorDeSemana semana={semana} setSemana={setSemana} />

    {erro && <div className="dialog-error" role="alert">{erro}</div>}

    <div className="stock-layout">
      <form className="producer-entry stock-form" onSubmit={submeter}>
        <h2 className="entry-title">Registrar colheita</h2>
        <label htmlFor="estoque-produto">Produto colhido</label>
        <select id="estoque-produto" value={produtoId} disabled={!catalogo || !catalogo.length}
          onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">
            {!catalogo ? 'Carregando os produtos...' : catalogo.length ? 'Escolha um produto' : 'Nenhum produto cadastrado'}
          </option>
          {(catalogo || []).map((produto) => (
            <option key={produto.id} value={produto.id}>{produto.nome}</option>
          ))}
        </select>
        <button type="button" className="text-link stock-catalog-link" onClick={() => navegar('produtos')}>
          {catalogo && !catalogo.length ? 'Cadastrar os produtos da horta' : 'Falta um produto? Cadastre no catálogo'}
        </button>
        <label htmlFor="estoque-quantidade">Quantidade (unidades)</label>
        <input id="estoque-quantidade" type="number" min="1" step="1"
          value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        <p className="dialog-hint">Se o produto já está na semana, a quantidade é somada ao que já foi colhido.</p>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Registrando...' : 'Adicionar ao estoque'} <Icone nome="check" />
        </button>
      </form>

      <div className="producer-entry">
        {carregando || !resumo ? <p>Carregando o estoque...</p> : <>
          <div className="order-summary stock-summary">
            <div><span>Colhido na semana</span><strong>{resumo.total_colhido} itens</strong></div>
            <div><span>Reservado pelas cestas aprovadas</span><strong>{resumo.total_reservado} itens</strong></div>
            <div><span>Livres para aprovar mais pedidos</span><strong>{resumo.itens_livres} itens</strong></div>
          </div>
          {resumo.itens.length ? (
            <table className="stock-table">
              <thead><tr><th>Produto</th><th>Colhido</th><th>Separado</th><th>Disponível</th></tr></thead>
              <tbody>
                {resumo.itens.map((item) => (
                  <tr key={item.produto_id}>
                    <td>{item.nome_produto}</td>
                    <td>{item.colhido}</td>
                    <td>{item.separado}</td>
                    <td><strong>{item.disponivel}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="entry-empty">Nada colhido nesta semana ainda. Enquanto o estoque estiver vazio, nenhuma cesta pode ser pedida.</p>
          )}
        </>}
      </div>
    </div>
  </section>;
}

// Tela do catálogo do produtor: os produtos são cadastrados uma vez e valem para todas as semanas.
// Não há excluir: desativar tira o produto das listas novas e mantém o histórico das cestas.
function Produtos({ token, aoExpirar, aoAvisar }) {
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  // Produto em edição: { id, nome } com o nome que está sendo digitado, ou null.
  const [editando, setEditando] = useState(null);
  // Id do produto com um PATCH em andamento, para desligar os botões dele.
  const [mudando, setMudando] = useState(null);

  const carregar = () => buscarProdutos(token, aoExpirar)
    .then(setProdutos)
    .catch((err) => setErro(err.message));

  useEffect(() => { carregar(); }, [token]);

  const cadastrar = (e) => {
    e.preventDefault();
    if (!nome.trim()) { setErro('Informe o nome do produto.'); return; }
    setSalvando(true);
    setErro('');
    gravarProduto(token, 'POST', '', { nome: nome.trim() }, aoExpirar)
      .then((salvo) => {
        setNome('');
        aoAvisar(`${salvo.nome} entrou no catálogo.`);
        return carregar();
      })
      .catch((err) => setErro(err.message))
      .finally(() => setSalvando(false));
  };

  // Renomeia ou muda a situação; o nome novo aparece também no estoque e nas cestas já montadas.
  const editar = (produto, corpo, mensagem) => {
    setMudando(produto.id);
    setErro('');
    gravarProduto(token, 'PATCH', `/${produto.id}`, corpo, aoExpirar)
      .then((salvo) => {
        setEditando(null);
        aoAvisar(mensagem(salvo));
        return carregar();
      })
      .catch((err) => setErro(err.message))
      .finally(() => setMudando(null));
  };

  const salvarNome = (e, produto) => {
    e.preventDefault();
    if (!editando.nome.trim()) { setErro('O nome do produto não pode ficar vazio.'); return; }
    editar(produto, { nome: editando.nome.trim() }, (salvo) => `Produto renomeado para ${salvo.nome}.`);
  };

  return <section className="container workspace page" aria-labelledby="titulo-produtos">
    <div className="workspace-heading">
      <div>
        <span className="section-overline">ÁREA DO PRODUTOR</span>
        <h1 id="titulo-produtos">Os <span>produtos</span></h1>
        <p>Cadastre uma vez o que a horta produz. No estoque, você escolhe o produto nesta lista e informa só a quantidade colhida.</p>
      </div>
    </div>

    {erro && <div className="dialog-error" role="alert">{erro}</div>}

    <div className="stock-layout">
      <form className="producer-entry stock-form" onSubmit={cadastrar}>
        <h2 className="entry-title">Novo produto</h2>
        <label htmlFor="produto-nome">Nome do produto</label>
        <input id="produto-nome" type="text" maxLength={100} placeholder="Ex.: Alface crespa"
          value={nome} onChange={(e) => setNome(e.target.value)} />
        <p className="dialog-hint">O nome não pode repetir, nem com maiúsculas diferentes.</p>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar produto'} <Icone nome="check" />
        </button>
      </form>

      <div className="producer-entry">
        {!produtos ? <p>Carregando os produtos...</p> : produtos.length ? (
          <table className="stock-table catalog-table">
            <thead><tr><th>Produto</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className={produto.ativo ? '' : 'catalog-inactive'}>
                  <td>
                    {editando?.id === produto.id ? (
                      <form className="catalog-rename" onSubmit={(e) => salvarNome(e, produto)}>
                        <input aria-label={`Novo nome para ${produto.nome}`} maxLength={100} autoFocus
                          value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
                        <button type="submit" className="text-link" disabled={mudando === produto.id}>Salvar</button>
                        <button type="button" className="text-link" onClick={() => setEditando(null)}>Cancelar</button>
                      </form>
                    ) : produto.nome}
                  </td>
                  <td>
                    <span className={`status-badge ${produto.ativo ? 'status-done' : 'status-refused'}`}>
                      {produto.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="catalog-actions">
                    {editando?.id !== produto.id && (
                      <button type="button" className="text-link" disabled={mudando === produto.id}
                        onClick={() => setEditando({ id: produto.id, nome: produto.nome })}>
                        Renomear
                      </button>
                    )}
                    <button type="button" className="text-link" disabled={mudando === produto.id}
                      onClick={() => editar(produto, { ativo: !produto.ativo },
                        (salvo) => (salvo.ativo ? `${salvo.nome} voltou para as listas.` : `${salvo.nome} saiu das listas novas.`))}>
                      {produto.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="entry-empty">Nenhum produto cadastrado ainda. Comece pelo que a horta colhe toda semana.</p>
        )}
      </div>
    </div>
  </section>;
}

// Rodapé institucional
function Rodape({ navegar, usuario }) {
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-about">
        <span className="footer-logo">
          <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="240" height="80" />
        </span>
        <p>Uma horta comunitária que aproxima pessoas e alimentos frescos.</p>
      </div>
      <div>
        <h2>Explore</h2>
        {usuario.tipo === 'assinante' ? <>
          <button type="button" onClick={() => navegar('inicio')}>Início</button>
          <button type="button" onClick={() => navegar('cestas')}>Minhas cestas</button>
          <button type="button" onClick={() => navegar('preferencias')}>Preferências</button>
        </> : <>
          <button type="button" onClick={() => navegar('separacao')}>A separação</button>
          <button type="button" onClick={() => navegar('estoque')}>O estoque</button>
          <button type="button" onClick={() => navegar('produtos')}>Os produtos</button>
        </>}
      </div>
      <div className="footer-message">
        <Icone nome="heart" />
        <strong>Da terra da nossa gente,<br />para a sua semana.</strong>
        <span>Feito com cuidado e simplicidade.</span>
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© {new Date().getFullYear()} Cesta do Vale · horta comunitária</span>
    </div>
  </footer>;
}

// Carrossel do início: a página atual no centro e um pedaço das vizinhas aparecendo nas laterais.
// Passa sozinho a cada 7 s; para ao passar o mouse, ao focar, no botão de pausa e com movimento reduzido.
function CarrosselInicio({ pedir, navegar }) {
  const total = paginasDoCarrossel.length;
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const [emFoco, setEmFoco] = useState(false);
  const inicioDoArraste = useRef(null);
  const irPara = (indice) => setAtual((indice + total) % total);
  const verTamanhos = () => document.getElementById('cestas')?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (pausado || emFoco) return undefined;
    const relogio = setTimeout(() => setAtual((atual + 1) % total), 7000);
    return () => clearTimeout(relogio);
  }, [atual, pausado, emFoco, total]);

  // Arrastar com o dedo ou o mouse troca de página
  const comecarArraste = (e) => { inicioDoArraste.current = e.clientX; };
  const terminarArraste = (e) => {
    if (inicioDoArraste.current === null) return;
    const distancia = e.clientX - inicioDoArraste.current;
    inicioDoArraste.current = null;
    if (Math.abs(distancia) > 50) irPara(atual + (distancia < 0 ? 1 : -1));
  };

  // -1 = à esquerda, 0 = no centro, 1 = à direita
  const posicao = (indice) => ((indice - atual + total + 1) % total) - 1;

  const visual = {
    sistema: <img src="/ilustracoes/hero-horta.svg" width="640" height="520" alt="" draggable="false" />,
    cestas: <div className="showcase-baskets">
      {Object.entries(tamanhos).map(([chave, tamanho]) => <figure key={chave}>
        <img src={tamanho.ilustracao} width="640" height="520" alt="" draggable="false" />
        <figcaption><strong>{tamanho.nome}</strong> até {tamanho.limite}</figcaption>
      </figure>)}
    </div>,
    preferencias: <ul className="showcase-prefs" aria-hidden="true">
      {[['Tomate', 'quero'], ['Alface', 'tanto'], ['Beterraba', 'nao'], ['Cenoura', 'quero']].map(([nome, marca]) => <li key={nome}>
        <span>{nome}</span>
        <span className="showcase-pref-options">
          <i className={marca === 'quero' ? 'on-quero' : ''}>Quero</i>
          <i className={marca === 'tanto' ? 'on-tanto' : ''}>Tanto faz</i>
          <i className={marca === 'nao' ? 'on-nao' : ''}>Não quero</i>
        </span>
      </li>)}
    </ul>
  };

  const acoes = {
    sistema: <>
      <button type="button" className="btn btn-primary btn-large" onClick={verTamanhos}>Escolher minha cesta <Icone nome="arrow" /></button>
      <button type="button" className="text-link" onClick={() => navegar('cestas')}>Minhas cestas <Icone nome="arrow" /></button>
    </>,
    cestas: <>
      <button type="button" className="btn btn-primary btn-large" onClick={() => pedir('media')}>Pedir cesta média <Icone nome="arrow" /></button>
      <button type="button" className="text-link" onClick={verTamanhos}>Ver os 3 tamanhos <Icone nome="arrow" /></button>
    </>,
    preferencias: <button type="button" className="btn btn-primary btn-large" onClick={() => navegar('preferencias')}>Marcar minhas preferências <Icone nome="arrow" /></button>
  };

  return <section
    className="showcase"
    aria-roledescription="carrossel"
    aria-label="Conheça a Cesta do Vale"
    onMouseEnter={() => setEmFoco(true)}
    onMouseLeave={() => setEmFoco(false)}
    onFocus={() => setEmFoco(true)}
    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setEmFoco(false); }}
  >
    <div className="showcase-stage" onPointerDown={comecarArraste} onPointerUp={terminarArraste} onPointerCancel={() => { inicioDoArraste.current = null; }}>
      {paginasDoCarrossel.map((pagina, indice) => {
        const lugar = posicao(indice);
        return <article
          key={pagina.chave}
          className={`showcase-slide showcase-${pagina.chave}`}
          data-pos={lugar}
          aria-roledescription="página"
          aria-label={`${indice + 1} de ${total}`}
          aria-hidden={lugar !== 0}
        >
          <div className="showcase-inner" inert={lugar !== 0}>
            <div className="showcase-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> {pagina.selo}</span>
              <h2>{pagina.titulo}</h2>
              <p>{pagina.texto}</p>
              <div className="hero-actions">{acoes[pagina.chave]}</div>
            </div>
            <div className="showcase-visual">{visual[pagina.chave]}</div>
          </div>
          {lugar !== 0 && <button type="button" className="showcase-peek" tabIndex={-1} onClick={() => irPara(indice)} aria-label={`Ver página ${indice + 1}`} />}
        </article>;
      })}
      <div className="showcase-tags" key={atual} aria-hidden="true">
        {paginasDoCarrossel[atual].etiquetas.map((etiqueta, i) => <span className={`showcase-tag tag-${i}`} key={etiqueta.texto}><Icone nome={etiqueta.icone} /> {etiqueta.texto}</span>)}
      </div>
    </div>
    <div className="showcase-controls">
      <button type="button" className="carousel-arrow" onClick={() => irPara(atual - 1)} aria-label="Página anterior"><Icone nome="left" /></button>
      <div className="carousel-dots">
        {paginasDoCarrossel.map((pagina, indice) => <button
          type="button"
          key={pagina.chave}
          className={`dot ${indice === atual ? 'active' : ''}`}
          onClick={() => irPara(indice)}
          aria-label={`Página ${indice + 1} de ${total}`}
          aria-current={indice === atual ? 'true' : undefined}
        />)}
      </div>
      <button type="button" className="carousel-arrow" onClick={() => irPara(atual + 1)} aria-label="Próxima página"><Icone nome="right" /></button>
      <button type="button" className="carousel-arrow" onClick={() => setPausado(!pausado)} aria-label={pausado ? 'Continuar a passagem automática' : 'Pausar a passagem automática'}><Icone nome={pausado ? 'play' : 'pause'} /></button>
    </div>
    <p className="sr-only" aria-live="polite">Página {atual + 1} de {total}: {paginasDoCarrossel[atual].selo.toLowerCase()}</p>
  </section>;
}

// Início / Vitrine para Assinante: o carrossel e a escolha do tamanho.
function Inicio({ pedir, navegar }) {
  return <div className="page active-page">
    <CarrosselInicio pedir={pedir} navegar={navegar} />

    <section className="section container basket-section" id="cestas">
      <div className="section-header">
        <div>
          <span className="section-overline"><Icone nome="leaf" /> ESCOLHA A SUA</span>
          <h2>Uma cesta do <span>seu tamanho</span></h2>
          <p>Três opções para você escolher, com limite protegido pelo servidor.</p>
        </div>
        <span className="section-pill"><Icone nome="calendar" /> Pedidos da semana</span>
      </div>
      <div className="basket-grid">
        {Object.entries(tamanhos).map(([chave, tamanho]) => (
          <article className={`basket-card ${chave === 'media' ? 'featured' : ''}`} key={chave}>
            {chave === 'media' && <span className="popular-flag"><Icone nome="heart" /> MAIS PEDIDA</span>}
            <div className={`basket-card-visual ${tamanho.classe}`}>
              <img src={tamanho.ilustracao} alt={`Ilustração de cesta ${tamanho.nome.toLowerCase()}, com até ${tamanho.limite} produtos`} width="225" height="183" />
            </div>
            <div className="basket-card-body">
              <span className="card-kicker">CESTA SEMANAL</span>
              <div className="card-title-line">
                <h3>{tamanho.nome}</h3>
                <span className="capacity-tag">{tamanho.limite} itens</span>
              </div>
              <p>{tamanho.frase}</p>
              <div className="card-meta"><Icone nome="check" /> Até {tamanho.limite} unidades de produtos</div>
              <button className="btn btn-primary btn-block" type="button" onClick={() => pedir(chave)}>
                Pedir cesta {tamanho.nome.toLowerCase()} <Icone nome="arrow" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>;
}

// Formulário de separação de produto (exclusivo do produtor)
// O produto vem de uma lista com o estoque da semana da cesta: só aparece o que ainda tem disponível.
function FormularioDeProduto({ cesta, token, aoExpirar, aoCancelar, aoSalvar }) {
  // O value do select é o id do produto no catálogo, como texto.
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [estoque, setEstoque] = useState(null);
  const [preferencias, setPreferencias] = useState({ quer: [], nao_quer: [] });

  // O estoque é o da semana da cesta, que pode não ser a semana atual
  useEffect(() => {
    buscarEstoque(token, cesta.semana, aoExpirar)
      .then(setEstoque)
      .catch((err) => setErro(err.message));
  }, [token, cesta.semana]);

  // O que a dona da cesta marcou nas preferências
  useEffect(() => {
    buscarPreferenciasDaCesta(token, cesta.id).then(setPreferencias);
  }, [token, cesta.id]);

  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const restante = Math.max(0, limite - itensSeparados(cesta));
  // O que a assinante não quer fica fora da lista; o que ela quer vem primeiro.
  const querido = (item) => preferencias.quer.includes(item.produto_id);
  const produtosDisponiveis = estoque
    ? estoque.itens.filter((item) => item.disponivel > 0 && !preferencias.nao_quer.includes(item.produto_id))
      .sort((a, b) => Number(querido(b)) - Number(querido(a)))
    : [];
  const nomesDoEstoque = (ids) => (estoque ? estoque.itens.filter((item) => ids.includes(item.produto_id)).map((item) => item.nome_produto) : []);
  const queridos = nomesDoEstoque(preferencias.quer);
  const recusados = nomesDoEstoque(preferencias.nao_quer);
  const escolhido = produtosDisponiveis.find((item) => String(item.produto_id) === produtoId);
  // A quantidade respeita as duas regras: o que cabe na cesta e o que sobrou do produto
  const maximo = escolhido ? Math.min(restante, escolhido.disponivel) : restante;
  // Previsão do espaço depois de registrar (styleguide, "O fechamento"): só com quantidade inteira que cabe
  const qtdDigitada = Number(quantidade);
  const previsaoValida = Number.isInteger(qtdDigitada) && qtdDigitada >= 1 && qtdDigitada <= restante;

  const submeter = (e) => {
    e.preventDefault();
    if (!escolhido) {
      setErro('Escolha um produto do estoque da semana.');
      return;
    }
    const qtd = Number(quantidade);
    // Number.isInteger recusa 1,5 aqui mesmo: o back só aceita inteiros e responderia 422
    if (!Number.isInteger(qtd) || qtd < 1) {
      setErro('Informe uma quantidade inteira, a partir de 1.');
      return;
    }
    if (qtd > restante) {
      setErro(`Capacidade insuficiente: cabem apenas mais ${restante} unidades nesta cesta.`);
      return;
    }
    if (qtd > escolhido.disponivel) {
      setErro(`Estoque insuficiente: restam só ${escolhido.disponivel} unidades de ${escolhido.nome_produto}.`);
      return;
    }

    setSalvando(true);
    setErro('');
    aoSalvar(escolhido, qtd)
      .catch((err) => setErro(err.message))
      .finally(() => setSalvando(false));
  };

  return <>
    <button type="button" className="dialog-close" onClick={aoCancelar} aria-label="Fechar janela">
      <Icone nome="x" />
    </button>
    <span className="section-overline">REGISTRO DO PRODUTOR</span>
    <h2 id="titulo-fechamento">Separar produto na cesta #{cesta.id}</h2>
    <div className="remaining-box">{textoCapacidade(cesta)}</div>
    {(queridos.length > 0 || recusados.length > 0) && (
      <div className="pref-note">
        {queridos.length > 0 && <p><strong>A assinante quer:</strong> {queridos.join(', ')}</p>}
        {recusados.length > 0 && <p><strong>Não quer (fora da lista):</strong> {recusados.join(', ')}</p>}
      </div>
    )}
    <form id="produce-form" onSubmit={submeter}>
      <label htmlFor="nome-produto">Produto do estoque da semana</label>
      {/* O select só lista o que foi colhido na semana da cesta e ainda tem unidades */}
      <select
        id="nome-produto"
        value={produtoId}
        disabled={!estoque || !produtosDisponiveis.length}
        onChange={(e) => setProdutoId(e.target.value)}
      >
        <option value="">
          {!estoque ? 'Carregando o estoque...' : produtosDisponiveis.length ? 'Escolha um produto' : 'Nenhum produto disponível nesta semana'}
        </option>
        {produtosDisponiveis.map((item) => (
          <option key={item.produto_id} value={item.produto_id}>
            {querido(item) ? '★ ' : ''}{item.nome_produto} · {item.disponivel} disponíveis
          </option>
        ))}
      </select>
      <label htmlFor="quantidade-produto">Quantidade (unidades)</label>
      <input
        id="quantidade-produto"
        type="number"
        min="1"
        step="1"
        max={maximo}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <p className="dialog-hint" aria-live="polite">
        {previsaoValida
          ? `Depois de registrar: ${textoCapacidade(cesta, qtdDigitada)}`
          : `Escolha de 1 a ${restante} ${restante === 1 ? 'unidade' : 'unidades'} para ver como a cesta fica.`}
      </p>
      {erro && <p className="dialog-error" role="alert">{erro}</p>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={aoCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Registrando...' : 'Registrar produto'} <Icone nome="check" />
        </button>
      </div>
    </form>
  </>;
}

// Aplicação principal coordenada pelo JWT e perfil (Slides 36 e 36b da Aula 08)
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null);
  const [tela, setTela] = useState('inicio');
  const [tamanhoPedido, setTamanhoPedido] = useState(null);
  const [cestaEmFechamento, setCestaEmFechamento] = useState(null);
  const [aviso, setAviso] = useState('');
  // versao é um contador: sobe a cada gravação que deu certo, e as telas que leem
  // as cestas usam esse número no useEffect para buscar a lista de novo, sem F5
  const [versao, setVersao] = useState(0);
  // O estoque da semana atual, buscado quando a janela de pedido abre
  const [estoquePedido, setEstoquePedido] = useState(null);
  const [erroPedido, setErroPedido] = useState('');
  const pedidoAberto = Boolean(tamanhoPedido);

  // Leitura linha a linha (Slide 36): a pulseira vai no cabeçalho
  useEffect(() => {
    if (!token) return;
    fetch(`${URL_DA_API}/usuarios/eu`, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('pulseira vencida');
        return resposta.json();
      })
      .then((dados) => {
        setUsuario(dados);
        // Produtor entra diretamente na separação, e a assinante no início
        if (dados.tipo === 'produtor') setTela('separacao');
        else setTela('inicio');
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuario(null);
      });
  }, [token]);

  // Ao abrir a janela de pedido, busca o estoque da semana: ele diz quais tamanhos estão liberados
  // e quais produtos vêm na cesta. Depende só de abrir e fechar, e não de trocar o tamanho.
  useEffect(() => {
    if (!pedidoAberto) return;
    setEstoquePedido(null);
    setErroPedido('');
    buscarEstoque(token, dataISO(segundaDaSemana()), sair)
      .then(setEstoquePedido)
      .catch((err) => setErroPedido(err.message));
  }, [pedidoAberto, token]);

  useEffect(() => {
    if (!aviso) return undefined;
    const tempo = window.setTimeout(() => setAviso(''), 4500);
    return () => window.clearTimeout(tempo);
  }, [aviso]);

  const sair = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setTela('inicio');
  };

  const confirmarPedido = () => {
    if (!tamanhoPedido) return;
    fetch(`${URL_DA_API}/cestas`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semana: dataISO(segundaDaSemana()),
        tamanho: tamanhoPedido
      })
    })
      .then(async (res) => {
        if (res.status === 401) { sair(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        // 409: o estoque acabou entre abrir a janela e confirmar; a frase vem do serviço
        if (res.status === 409) {
          const erro = await res.json();
          throw new Error(erro.detail || 'Não há estoque para esse tamanho nesta semana.');
        }
        if (!res.ok) throw new Error('Não foi possível criar o pedido');
        return res.json();
      })
      .then(() => {
        setTamanhoPedido(null);
        setVersao((atual) => atual + 1);   // a cesta nova aparece em Minhas cestas
        setAviso(`Sua cesta ${tamanhos[tamanhoPedido]?.nome.toLowerCase()} da semana foi pedida! Aguarde a aprovação do produtor.`);
        setTela('cestas');
      })
      .catch((err) => setErroPedido(err.message));
  };

  // produto é o item do estoque escolhido no formulário: o id vai para o back, o nome fica para o aviso.
  const registrarProduto = async (produto, quantidade) => {
    if (!cestaEmFechamento) return;
    const res = await fetch(`${URL_DA_API}/cestas/${cestaEmFechamento.id}/produtos`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        produto_id: produto.produto_id,
        quantidade: quantidade
      })
    });

    if (res.status === 401) {
      sair();
      throw new Error('Sua sessão expirou. Entre de novo.');
    }
    if (res.status === 409) {
      const err = await res.json();
      throw new Error(err.detail || 'Capacidade da cesta excedida.');
    }
    if (!res.ok) {
      throw new Error('Falha ao registrar produto.');
    }

    setCestaEmFechamento(null);
    setVersao((atual) => atual + 1);     // a contagem de itens da cesta é atualizada
    setAviso(`${quantidade} un. de ${produto.nome_produto} adicionadas na cesta #${cestaEmFechamento.id}.`);
  };

  // Slide 36b: Cada perfil cai na sua tela
  if (!token) {
    return <>
      <DefinicoesDeIcones />
      <Login aoEntrar={(novoToken) => setToken(novoToken)} />
    </>;
  }

  if (!usuario) {
    return <div className="loading-screen">
      <DefinicoesDeIcones />
      <p>Carregando perfil...</p>
    </div>;
  }

  return <>
    <DefinicoesDeIcones />
    <Cabecalho usuario={usuario} aoSair={sair} navegar={setTela} telaAtual={tela} />

    <main id="conteudo" tabIndex="-1">
      {usuario.tipo === 'produtor' ? (
        tela === 'estoque' ? (
          <Estoque token={token} aoExpirar={sair} versao={versao} navegar={setTela}
            aoCadastrar={(mensagem) => { setVersao((atual) => atual + 1); setAviso(mensagem); }} />
        ) : tela === 'produtos' ? (
          <Produtos token={token} aoExpirar={sair} aoAvisar={setAviso} />
        ) : (
          <Separacao token={token} abrirFechamento={setCestaEmFechamento} aoExpirar={sair} versao={versao} />
        )
      ) : (
        <>
          {tela === 'inicio' && <Inicio pedir={setTamanhoPedido} navegar={setTela} />}
          {tela === 'cestas' && <MinhasCestas token={token} navegar={setTela} abrirPedido={() => setTamanhoPedido('media')} aoExpirar={sair} aoAvisar={setAviso} versao={versao} />}
          {tela === 'preferencias' && <Preferencias token={token} navegar={setTela} aoExpirar={sair} />}
        </>
      )}
    </main>

    <Rodape navegar={setTela} usuario={usuario} />

    {/* Janela de confirmação do pedido de cesta */}
    <Janela aberta={Boolean(tamanhoPedido)} aoFechar={() => setTamanhoPedido(null)} classe="order-dialog" titulo="titulo-pedido">
      {tamanhoPedido && <>
        <button type="button" className="dialog-close" onClick={() => setTamanhoPedido(null)} aria-label="Fechar janela">
          <Icone nome="x" />
        </button>
        <span className="dialog-icon"><Icone nome="box" /></span>
        <span className="section-overline">SEU PEDIDO</span>
        <h2 id="titulo-pedido">Confirmar cesta</h2>
        <p>Escolha o tamanho e confira os detalhes antes de pedir sua cesta semanal.</p>
        {/* Tela 1 da cartilha: a assinante escolhe o tamanho. Os radio de mesmo name formam um grupo
            em que só um fica marcado; trocar a opção atualiza o tamanhoPedido e o resumo abaixo */}
        {/* O pedido não depende do estoque: o produtor aprova ou recusa depois */}
        <fieldset className="size-picker">
          <legend>Tamanho da cesta</legend>
          {Object.entries(tamanhos).map(([chave, info]) => (
            <label key={chave} className={`size-option ${tamanhoPedido === chave ? 'selected' : ''}`}>
              <input
                type="radio"
                name="tamanho-pedido"
                value={chave}
                checked={tamanhoPedido === chave}
                onChange={() => { setTamanhoPedido(chave); setErroPedido(''); }}
              />
              <strong>{info.nome}</strong>
              <span>{`até ${info.limite} itens`}</span>
            </label>
          ))}
        </fieldset>
        {/* Só para ver: a assinante não escolhe os produtos, quem monta a cesta é o produtor */}
        <div className="week-produce">
          <h3>Colhido nesta semana</h3>
          {!estoquePedido ? (
            <p className="dialog-hint">{erroPedido ? 'Não foi possível ver o estoque.' : 'Carregando os produtos...'}</p>
          ) : estoquePedido.itens.some((item) => item.disponivel > 0) ? (
            <ul>
              {estoquePedido.itens.filter((item) => item.disponivel > 0).map((item) => (
                <li key={item.produto_id}><Icone nome="leaf" /> {item.nome_produto}</li>
              ))}
            </ul>
          ) : (
            <p className="dialog-hint">O produtor ainda não registrou a colheita desta semana.</p>
          )}
          <p className="dialog-hint">Os produtos são escolhidos pelo produtor na montagem da cesta, respeitando as suas <button type="button" className="text-link inline-link" onClick={() => { setTamanhoPedido(null); setTela('preferencias'); }}>preferências</button>.</p>
        </div>
        {erroPedido && <p className="dialog-error" role="alert">{erroPedido}</p>}
        <div className="order-summary">
          <div><span>Semana</span><strong>{textoDaSemana(dataISO(segundaDaSemana()))}</strong></div>
          <div><span>Tamanho</span><strong>{tamanhos[tamanhoPedido]?.nome}</strong></div>
          <div><span>Capacidade</span><strong>{tamanhos[tamanhoPedido]?.limite} itens</strong></div>
          <div><span>Assinante</span><strong>{usuario.nome}</strong></div>
        </div>
        <p className="dialog-hint">O dono do pedido é autenticado pelo seu token JWT. O produtor receberá seu pedido e vai aprová-lo ou recusá-lo antes de separar os produtos.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setTamanhoPedido(null)}>Voltar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirmarPedido}
          >
            Confirmar pedido <Icone nome="check" />
          </button>
        </div>
      </>}
    </Janela>

    {/* Janela de registro de produto pelo produtor */}
    <Janela aberta={Boolean(cestaEmFechamento)} aoFechar={() => setCestaEmFechamento(null)} classe="produce-dialog" titulo="titulo-fechamento">
      {cestaEmFechamento && (
        <FormularioDeProduto
          cesta={cestaEmFechamento}
          token={token}
          aoExpirar={sair}
          aoCancelar={() => setCestaEmFechamento(null)}
          aoSalvar={registrarProduto}
        />
      )}
    </Janela>

    {aviso && (
      <div className="toast" role="status" aria-live="polite">
        <Icone nome="check" />
        <span>{aviso}</span>
        <button type="button" onClick={() => setAviso('')} aria-label="Fechar aviso"><Icone nome="x" /></button>
      </div>
    )}
  </>;
}
