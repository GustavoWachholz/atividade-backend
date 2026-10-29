import { useEffect, useRef, useState } from 'react';

import { URL_DA_API } from './api';

const tamanhos = {
  pequena: { nome: 'Pequena', limite: 5, classe: 'peach-bg', frase: 'O tamanho ideal para começar a aproveitar a semana.' },
  media: { nome: 'Média', limite: 8, classe: 'sage-bg', frase: 'Um pouco mais de espaço para variar seus preparos.' },
  grande: { nome: 'Grande', limite: 12, classe: 'ochre-bg', frase: 'Para quem quer aproveitar ao máximo a capacidade.' }
};

const destaques = [
  { titulo: <>Sua semana fica <em>mais fresquinha!</em></>, texto: 'Escolha uma cesta do seu tamanho e acompanhe cada produto separado com carinho.', acao: 'Escolher minha cesta', destino: 'cestas' },
  { titulo: <>A horta pertinho <em>da sua rotina.</em></>, texto: 'Pequena, média ou grande: escolha a cesta que acompanha o ritmo da sua semana.', acao: 'Ver tamanhos', destino: 'cestas' },
  { titulo: <>Mais clareza, <em>do pedido à cesta.</em></>, texto: 'Veja quando sua cesta entra em separação e quais produtos já foram registrados.', acao: 'Como funciona', destino: 'como-funciona' }
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
};

function SituacaoDaCesta({ situacao }) {
  const info = SITUACOES[situacao] || SITUACOES.pedida;
  return <span className={`status-badge ${info.classe}`}>{info.nome}</span>;
}

// PATCH de aprovar, reprovar ou concluir. Devolve a promessa; 401 volta para o login e
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

// Cabeçalho unificado com dados do usuário logado e botão de sair.
function Cabecalho({ usuario, aoSair, navegar, telaAtual }) {
  const nomePerfil = usuario.tipo === 'assinante' ? 'Assinante' : 'Produtor';
  return <header className="site-header" id="topo">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="announcement">
      <div className="container announcement-inner">
        <span><Icone nome="leaf" /> COLHEITA DA SEMANA</span>
        <span className="announcement-note">Uma horta comunitária, feita com cuidado</span>
      </div>
    </div>
    <div className="container header-main">
      <button className="brand-plate" type="button" onClick={() => navegar('inicio')} aria-label="Cesta do Vale, voltar para o início">
        <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="262" height="86" />
      </button>
      <div className="header-actions">
        <div className="user-badge">
          <Icone nome="user" />
          <span><strong>{usuario.nome}</strong> · {nomePerfil}</span>
        </div>
        <button className="btn-logout" type="button" onClick={aoSair} aria-label="Sair da conta">
          Sair
        </button>
      </div>
    </div>
    <nav className="primary-nav" aria-label="Navegação principal">
      <div className="container nav-inner">
        <div className="nav-links">
          {usuario.tipo === 'assinante' && (
            <>
              <button type="button" className={`nav-link ${telaAtual === 'inicio' ? 'active' : ''}`} onClick={() => navegar('inicio')}>Início</button>
              <button type="button" className={`nav-link ${telaAtual === 'cestas' ? 'active' : ''}`} onClick={() => navegar('cestas')}>Minhas cestas</button>
            </>
          )}
          {usuario.tipo === 'produtor' && (
            <>
              <button type="button" className={`nav-link ${telaAtual === 'separacao' ? 'active' : ''}`} onClick={() => navegar('separacao')}>A separação</button>
              <button type="button" className={`nav-link ${telaAtual === 'estoque' ? 'active' : ''}`} onClick={() => navegar('estoque')}>O estoque</button>
            </>
          )}
        </div>
      </div>
    </nav>
  </header>;
}

// Componente de Login conforme o slide 35 da Aula 08
function Login({ aoEntrar }) {
  const [modo, setModo] = useState('login'); // 'login' ou 'cadastro'
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('assinante');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Mão na massa 2.6 (Slide 35): o /login lê URLSearchParams com username e password
  const submeterLogin = (e) => {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);
    const corpo = new URLSearchParams({ username: email, password: senha });
    fetch(`${URL_DA_API}/login`, { method: 'POST', body: corpo })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('e-mail ou senha incorretos');
        return resposta.json();
      })
      .then((dados) => {
        localStorage.setItem('token', dados.access_token);
        aoEntrar(dados.access_token);
      })
      .catch((problema) => setMensagem(problema.message))
      .finally(() => setCarregando(false));
  };

  const submeterCadastro = (e) => {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);
    fetch(`${URL_DA_API}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, tipo, email, senha })
    })
      .then((resposta) => {
        if (resposta.status === 409) throw new Error('Já existe um usuário com esse e-mail');
        if (!resposta.ok) throw new Error('Erro ao cadastrar. Confira os campos digitados.');
        return resposta.json();
      })
      .then(() => {
        // Após cadastrar com sucesso, realiza o login automaticamente
        const corpo = new URLSearchParams({ username: email, password: senha });
        return fetch(`${URL_DA_API}/login`, { method: 'POST', body: corpo })
          .then((r) => {
            if (!r.ok) throw new Error('Conta criada, mas não foi possível entrar. Tente pelo login.');
            return r.json();
          })
          .then((dados) => {
            localStorage.setItem('token', dados.access_token);
            aoEntrar(dados.access_token);
          });
      })
      .catch((problema) => setMensagem(problema.message))
      .finally(() => setCarregando(false));
  };

  return <div className="auth-wrap">
    <div className="auth-card">
      <div className="auth-header">
        <span className="auth-logo">
          <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="240" height="79" />
        </span>
        <h1>{modo === 'login' ? 'Entrar no sistema' : 'Criar nova conta'}</h1>
        <p>{modo === 'login' ? 'Digite suas credenciais para acessar sua área.' : 'Cadastre-se como assinante ou produtor da horta.'}</p>
      </div>

      {/* role="tab" e aria-selected dizem ao leitor de tela qual das duas abas está aberta */}
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'login'}
          className={`auth-tab ${modo === 'login' ? 'active' : ''}`}
          onClick={() => { setModo('login'); setMensagem(''); }}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'cadastro'}
          className={`auth-tab ${modo === 'cadastro' ? 'active' : ''}`}
          onClick={() => { setModo('cadastro'); setMensagem(''); }}
        >
          Cadastrar
        </button>
      </div>

      {mensagem && <div className="auth-error" role="alert">{mensagem}</div>}

      {modo === 'login' ? (
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
      ) : (
        <form className="auth-form" onSubmit={submeterCadastro}>
          <label>
            Nome completo
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="Ex.: Aline Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </label>
          <label>
            Perfil na horta
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="assinante">Aline · Assinante (pede as cestas)</option>
              <option value="produtor">Vanderlei · Produtor (separa os produtos)</option>
            </select>
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
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Criar conta e entrar'} <Icone nome="check" />
          </button>
        </form>
      )}
    </div>
  </div>;
}

// Tela de Minhas Cestas da Assinante (Aline)
function MinhasCestas({ token, navegar, abrirPedido, aoExpirar, versao }) {
  const [cestas, setCestas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtosPorCesta, setProdutosPorCesta] = useState({});
  const [pagina, setPagina] = useState(1);

  const carregarCestas = () => {
    setCarregando(true);
    setErro('');   // limpa o erro da busca anterior
    fetch(`${URL_DA_API}/cestas?pagina=${pagina}`, {
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
  }, [token, versao, pagina]);

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
                {(cesta.situacao === 'em_separacao' || cesta.situacao === 'concluida') && <>
                  <Capacidade cesta={cestaComProds} />
                  <div className="entry-items">
                    <h3>Produtos separados pelo produtor</h3>
                    <ProdutosDaCesta produtos={prods} />
                  </div>
                </>}
              </article>
            );
          })
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

// Tela de Separação do Produtor (Vanderlei)
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

  // Trocar de semana volta para a primeira página, como trocar o filtro de tamanho
  const mudarSemana = (nova) => { setSemana(nova); setPagina(1); };
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
                {cesta.situacao !== 'pedida' && cesta.situacao !== 'recusada' && <>
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
function Estoque({ token, aoExpirar, versao, aoCadastrar }) {
  const [semana, setSemana] = useState(() => dataISO(segundaDaSemana()));
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [salvando, setSalvando] = useState(false);

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
    if (!nome.trim()) { setErro('Informe o nome do produto colhido.'); return; }
    if (!Number.isInteger(qtd) || qtd < 1) { setErro('Informe uma quantidade inteira, a partir de 1.'); return; }
    setSalvando(true);
    setErro('');
    fetch(`${URL_DA_API}/estoques`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ semana, nome_produto: nome.trim(), quantidade: qtd })
    })
      .then((res) => {
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível cadastrar o produto.');
        return res.json();
      })
      .then((salvo) => {
        setNome('');
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
        <label htmlFor="estoque-nome">Produto colhido</label>
        <input id="estoque-nome" type="text" maxLength={100} placeholder="Ex.: Alface crespa"
          value={nome} onChange={(e) => setNome(e.target.value)} />
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
                  <tr key={item.nome_produto}>
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
        </> : <>
          <button type="button" onClick={() => navegar('separacao')}>A separação</button>
          <button type="button" onClick={() => navegar('estoque')}>O estoque</button>
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

// Início / Vitrine para Assinante
function Inicio({ pedir, navegar }) {
  const [destaque, setDestaque] = useState(0);
  const atual = destaques[destaque];
  const mudarDestaque = (valor) => setDestaque((valor + destaques.length) % destaques.length);

  return <div className="page active-page">
    <section className="hero-wrap container" aria-label="Destaques da semana">
      <div className={`hero slide-${destaque}`}>
        <div className="hero-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> CESTAS SEMANAIS DA NOSSA HORTA</span>
          <h1>{atual.titulo}</h1>
          <p>{atual.texto}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={() => pedir('media')}>
              Pedir cesta média <Icone nome="arrow" />
            </button>
            <button type="button" className="text-link" onClick={() => navegar('cestas')}>
              Minhas cestas <Icone nome="arrow" />
            </button>
          </div>
          <div className="hero-carousel" aria-label="Selecionar destaque">
            <button type="button" className="carousel-arrow" onClick={() => mudarDestaque(destaque - 1)} aria-label="Destaque anterior"><Icone nome="left" /></button>
            <div className="carousel-dots">
              {destaques.map((_, indice) => (
                <button
                  type="button"
                  className={`dot ${indice === destaque ? 'active' : ''}`}
                  key={indice}
                  onClick={() => setDestaque(indice)}
                  aria-label={`Destaque ${indice + 1} de ${destaques.length}`}
                  aria-current={indice === destaque ? 'true' : undefined}
                />
              ))}
            </div>
            <button type="button" className="carousel-arrow" onClick={() => mudarDestaque(destaque + 1)} aria-label="Próximo destaque"><Icone nome="right" /></button>
          </div>
        </div>
        <div className="hero-visual">
          <span className="floating-tag tag-top"><Icone nome="heart" /> Feito com cuidado</span>
          <span className="hero-halo" />
          <img src="/ilustracoes/hero-horta.svg" width="640" height="520" alt="Ilustração de uma cesta de hortaliças frescas" />
          <span className="floating-tag tag-bottom"><Icone nome="leaf" /> Da nossa horta</span>
        </div>
      </div>
    </section>

    <section className="benefits container" aria-label="Facilidades da Cesta do Vale">
      <div className="benefit"><span className="benefit-icon gold"><Icone nome="box" /></span><span><strong>Do seu tamanho</strong><small>Escolha entre 3 cestas</small></span></div>
      <div className="benefit"><span className="benefit-icon green"><Icone nome="list" /></span><span><strong>Acompanhe tudo</strong><small>Veja o que já foi separado</small></span></div>
      <div className="benefit"><span className="benefit-icon peach"><Icone nome="heart" /></span><span><strong>Feita em comunidade</strong><small>Uma horta que aproxima</small></span></div>
      <div className="benefit"><span className="benefit-icon sage"><Icone nome="calendar" /></span><span><strong>Toda semana</strong><small>Um novo pedido, bem simples</small></span></div>
    </section>

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
              <img src="/ilustracoes/hero-horta.svg" alt={`Ilustração de cesta ${tamanho.nome.toLowerCase()}`} width="225" height="183" />
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
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [estoque, setEstoque] = useState(null);

  // O estoque é o da semana da cesta, que pode não ser a semana atual
  useEffect(() => {
    buscarEstoque(token, cesta.semana, aoExpirar)
      .then(setEstoque)
      .catch((err) => setErro(err.message));
  }, [token, cesta.semana]);

  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const restante = Math.max(0, limite - itensSeparados(cesta));
  const produtosDisponiveis = estoque ? estoque.itens.filter((item) => item.disponivel > 0) : [];
  const escolhido = produtosDisponiveis.find((item) => item.nome_produto === nome);
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
    aoSalvar(nome.trim(), qtd)
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
    <form id="produce-form" onSubmit={submeter}>
      <label htmlFor="nome-produto">Produto do estoque da semana</label>
      {/* O select só lista o que foi colhido na semana da cesta e ainda tem unidades */}
      <select
        id="nome-produto"
        value={nome}
        disabled={!estoque || !produtosDisponiveis.length}
        onChange={(e) => setNome(e.target.value)}
      >
        <option value="">
          {!estoque ? 'Carregando o estoque...' : produtosDisponiveis.length ? 'Escolha um produto' : 'Nenhum produto disponível nesta semana'}
        </option>
        {produtosDisponiveis.map((item) => (
          <option key={item.nome_produto} value={item.nome_produto}>
            {item.nome_produto} · {item.disponivel} disponíveis
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
        // Produtor entra diretamente na separação
        if (dados.tipo === 'produtor') setTela('separacao');
        else setTela('cestas');
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

  const registrarProduto = async (nomeProduto, quantidade) => {
    if (!cestaEmFechamento) return;
    const res = await fetch(`${URL_DA_API}/cestas/${cestaEmFechamento.id}/produtos`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome_produto: nomeProduto,
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
    setAviso(`${quantidade} un. de ${nomeProduto} adicionadas na cesta #${cestaEmFechamento.id}.`);
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
          <Estoque token={token} aoExpirar={sair} versao={versao}
            aoCadastrar={(mensagem) => { setVersao((atual) => atual + 1); setAviso(mensagem); }} />
        ) : (
          <Separacao token={token} abrirFechamento={setCestaEmFechamento} aoExpirar={sair} versao={versao} />
        )
      ) : (
        <>
          {tela === 'inicio' && <Inicio pedir={setTamanhoPedido} navegar={setTela} />}
          {tela === 'cestas' && <MinhasCestas token={token} navegar={setTela} abrirPedido={() => setTamanhoPedido('media')} aoExpirar={sair} versao={versao} />}
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
        {/* Tela 1 da cartilha: a Aline escolhe o tamanho. Os radio de mesmo name formam um grupo
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
                <li key={item.nome_produto}><Icone nome="leaf" /> {item.nome_produto}</li>
              ))}
            </ul>
          ) : (
            <p className="dialog-hint">O produtor ainda não registrou a colheita desta semana.</p>
          )}
          <p className="dialog-hint">Os produtos são escolhidos pelo produtor na montagem da cesta.</p>
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
