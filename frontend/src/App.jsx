import { useEffect, useRef, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

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
function Icone({ nome, rotulo }) {
  return <svg className="icon" aria-hidden={rotulo ? undefined : true} aria-label={rotulo}><use href={`#i-${nome}`} /></svg>;
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

function semanaAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const formatar = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatar(inicio)} a ${formatar(fim)}`;
}

function dataISO(data = new Date()) {
  return data.toISOString().split('T')[0];
}

// Soma as quantidades porque a capacidade não conta apenas os tipos de produto.
function itensSeparados(cesta) {
  if (cesta.quantidade_ocupada !== undefined) return cesta.quantidade_ocupada;
  if (!cesta.produtos) return 0;
  return cesta.produtos.reduce((total, p) => total + (p.quantidade || 0), 0);
}

function textoCapacidade(cesta) {
  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const usados = itensSeparados(cesta);
  const livres = Math.max(0, limite - usados);
  return `${usados} de ${limite} itens separados · ${livres === 0 ? 'cesta cheia' : `cabem mais ${livres}`}`;
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
            <button type="button" className={`nav-link ${telaAtual === 'separacao' ? 'active' : ''}`} onClick={() => navegar('separacao')}>A separação</button>
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
    fetch(`${API_URL}/login`, { method: 'POST', body: corpo })
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
    fetch(`${API_URL}/usuarios`, {
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
        return fetch(`${API_URL}/login`, { method: 'POST', body: corpo })
          .then((r) => r.json())
          .then((dados) => {
            localStorage.setItem('token', dados.access_token);
            aoEntrar(dados.access_token);
          });
      })
      .catch((problema) => setMensagem(problema.message))
      .finally(() => setCarregando(false));
  };

  const preencherDemo = (demoEmail, demoSenha) => {
    setEmail(demoEmail);
    setSenha(demoSenha);
    setModo('login');
    setMensagem('');
  };

  return <div className="auth-wrap">
    <div className="auth-card">
      <div className="auth-header">
        <span className="auth-logo">
          <img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="220" height="72" />
        </span>
        <h1>{modo === 'login' ? 'Entrar no sistema' : 'Criar nova conta'}</h1>
        <p>{modo === 'login' ? 'Digite suas credenciais para acessar sua área.' : 'Cadastre-se como assinante ou produtor da horta.'}</p>
      </div>

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={`auth-tab ${modo === 'login' ? 'active' : ''}`}
          onClick={() => { setModo('login'); setMensagem(''); }}
        >
          Já tenho conta
        </button>
        <button
          type="button"
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

      <div className="auth-demos">
        <div className="auth-demos-title">Acesso rápido para avaliação</div>
        <div className="auth-demos-grid">
          <button
            type="button"
            className="btn-demo"
            onClick={() => preencherDemo('aline@cestadovale.com', 'teste1234')}
          >
            <span>Aline (Assinante)</span>
            <small>aline@cestadovale.com</small>
          </button>
          <button
            type="button"
            className="btn-demo"
            onClick={() => preencherDemo('vanderlei@cestadovale.com', 'teste1234')}
          >
            <span>Vanderlei (Produtor)</span>
            <small>vanderlei@cestadovale.com</small>
          </button>
        </div>
      </div>
    </div>
  </div>;
}

// Tela de Minhas Cestas da Assinante (Aline)
function MinhasCestas({ token, navegar, abrirPedido, aoExpirar }) {
  const [cestas, setCestas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtosPorCesta, setProdutosPorCesta] = useState({});

  const carregarCestas = () => {
    setCarregando(true);
    fetch(`${API_URL}/cestas`, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        // 401: a pulseira venceu no meio do uso, então volta para o login
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível carregar as cestas');
        return res.json();
      })
      .then(async (lista) => {
        setCestas(lista);
        // Busca os produtos de cada cesta
        const produtosMap = {};
        for (const c of lista) {
          try {
            const r = await fetch(`${API_URL}/cestas/${c.id}/produtos`, {
              headers: { Authorization: 'Bearer ' + token }
            });
            if (r.ok) {
              produtosMap[c.id] = await r.json();
            }
          } catch {
            produtosMap[c.id] = [];
          }
        }
        setProdutosPorCesta(produtosMap);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarCestas();
  }, [token]);

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
                      <Icone nome="calendar" /> SEMANA {cesta.semana}
                    </span>
                    <h2 className="entry-title">Cesta {tamanhos[cesta.tamanho]?.nome.toLowerCase()}</h2>
                    <p className="entry-person">Pedido nº #{cesta.id}</p>
                  </div>
                  <span className={`status-badge ${cesta.situacao === 'em_separacao' ? 'status-progress' : 'status-ordered'}`}>
                    {cesta.situacao === 'em_separacao' ? 'Em separação' : 'Pedida'}
                  </span>
                </div>
                <Capacidade cesta={cestaComProds} />
                <div className="entry-items">
                  <h3>Produtos separados pelo produtor</h3>
                  <ProdutosDaCesta produtos={prods} />
                </div>
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
  </section>;
}

// Tela de Separação do Produtor (Vanderlei)
function Separacao({ token, abrirFechamento, aoExpirar }) {
  const [cestas, setCestas] = useState([]);
  const [tamanho, setTamanho] = useState('todas');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtosPorCesta, setProdutosPorCesta] = useState({});

  const carregarTodasCestas = () => {
    setCarregando(true);
    const url = tamanho === 'todas' ? `${API_URL}/cestas` : `${API_URL}/cestas?tamanho=${tamanho}`;
    fetch(url, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        // 401: a pulseira venceu no meio do uso, então volta para o login
        if (res.status === 401) { aoExpirar(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível carregar as cestas');
        return res.json();
      })
      .then(async (lista) => {
        setCestas(lista);
        const produtosMap = {};
        for (const c of lista) {
          try {
            const r = await fetch(`${API_URL}/cestas/${c.id}/produtos`, {
              headers: { Authorization: 'Bearer ' + token }
            });
            if (r.ok) {
              produtosMap[c.id] = await r.json();
            }
          } catch {
            produtosMap[c.id] = [];
          }
        }
        setProdutosPorCesta(produtosMap);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarTodasCestas();
  }, [token, tamanho]);

  return <section className="container workspace page" aria-labelledby="titulo-separacao">
    <div className="workspace-heading">
      <div>
        <span className="section-overline">ÁREA DO PRODUTOR</span>
        <h1 id="titulo-separacao">A <span>separação</span></h1>
        <p>Veja todas as cestas da horta, confira os limites e registre os produtos colhidos.</p>
      </div>
      <span className="producer-week">
        <Icone nome="calendar" /> Semana atual
      </span>
    </div>

    <div className="filter-bar">
      <label htmlFor="filtro-tamanho">
        Filtrar por tamanho
        <select id="filtro-tamanho" value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
          <option value="todas">Todos os tamanhos</option>
          <option value="pequena">Pequena (5 itens)</option>
          <option value="media">Média (8 itens)</option>
          <option value="grande">Grande (12 itens)</option>
        </select>
      </label>
      <div className="filter-summary" aria-live="polite">
        {cestas.length} {cestas.length === 1 ? 'cesta encontrada' : 'cestas encontradas'}
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
                      <Icone nome="calendar" /> SEMANA {cesta.semana}
                    </span>
                    <h2 className="entry-title">Cesta {tamanhos[cesta.tamanho]?.nome.toLowerCase()} #{cesta.id}</h2>
                    <p className="entry-person">Assinante ID: <strong>{cesta.assinante_id}</strong></p>
                  </div>
                  <span className={`status-badge ${cesta.situacao === 'em_separacao' ? 'status-progress' : 'status-ordered'}`}>
                    {cesta.situacao === 'em_separacao' ? 'Em separação' : 'Pedida'}
                  </span>
                </div>
                <Capacidade cesta={cestaComProds} />
                <div className="entry-items">
                  <h3>Produtos já separados</h3>
                  <ProdutosDaCesta produtos={prods} />
                </div>
                <div className="entry-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={cheia}
                    onClick={() => abrirFechamento(cestaComProds)}
                  >
                    {cheia ? 'Cesta cheia' : 'Separar produto'} <Icone nome="arrow" />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-workspace">
            <Icone nome="filter" />
            <h3>Nenhuma cesta encontrada com esse filtro</h3>
            <p>Selecione outro tamanho acima para consultar.</p>
          </div>
        )}
      </div>
    )}
  </section>;
}

// Rodapé institucional
function Rodape({ navegar }) {
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
        <button type="button" onClick={() => navegar('inicio')}>Início</button>
        <button type="button" onClick={() => navegar('cestas')}>Minhas cestas</button>
      </div>
      <div className="footer-message">
        <Icone nome="heart" />
        <strong>Da terra da nossa gente,<br />para a sua semana.</strong>
        <span>Feito com cuidado e simplicidade.</span>
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© {new Date().getFullYear()} Cesta do Vale · Projeto com autenticação JWT e perfis</span>
      <span>Ciclo 4 · O acesso</span>
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
function FormularioDeProduto({ cesta, aoCancelar, aoSalvar }) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const limite = tamanhos[cesta.tamanho]?.limite || 5;
  const restante = Math.max(0, limite - itensSeparados(cesta));

  const submeter = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome do produto colhido.');
      return;
    }
    const qtd = Number(quantidade);
    if (!qtd || qtd < 1) {
      setErro('Informe uma quantidade válida.');
      return;
    }
    if (qtd > restante) {
      setErro(`Capacidade insuficiente: cabem apenas mais ${restante} unidades nesta cesta.`);
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
      <label htmlFor="nome-produto">Nome do produto colhido</label>
      <input
        id="nome-produto"
        type="text"
        placeholder="Ex.: Alface crespa, Tomate, Cenoura"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <label htmlFor="quantidade-produto">Quantidade (unidades)</label>
      <input
        id="quantidade-produto"
        type="number"
        min="1"
        max={restante}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
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

  // Leitura linha a linha (Slide 36): a pulseira vai no cabeçalho
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/usuarios/eu`, {
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
    fetch(`${API_URL}/cestas`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semana: dataISO(),
        tamanho: tamanhoPedido
      })
    })
      .then((res) => {
        if (res.status === 401) { sair(); throw new Error('Sua sessão expirou. Entre de novo.'); }
        if (!res.ok) throw new Error('Não foi possível criar o pedido');
        return res.json();
      })
      .then(() => {
        setTamanhoPedido(null);
        setAviso(`Sua cesta ${tamanhos[tamanhoPedido]?.nome.toLowerCase()} da semana foi pedida!`);
        setTela('cestas');
      })
      .catch((err) => setAviso(err.message));
  };

  const registrarProduto = async (nomeProduto, quantidade) => {
    if (!cestaEmFechamento) return;
    const res = await fetch(`${API_URL}/cestas/${cestaEmFechamento.id}/produtos`, {
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
        <Separacao token={token} abrirFechamento={setCestaEmFechamento} aoExpirar={sair} />
      ) : (
        <>
          {tela === 'inicio' && <Inicio pedir={setTamanhoPedido} navegar={setTela} />}
          {tela === 'cestas' && <MinhasCestas token={token} navegar={setTela} abrirPedido={() => setTamanhoPedido('media')} aoExpirar={sair} />}
        </>
      )}
    </main>

    <Rodape navegar={setTela} />

    {/* Janela de confirmação do pedido de cesta */}
    <Janela aberta={Boolean(tamanhoPedido)} aoFechar={() => setTamanhoPedido(null)} classe="order-dialog" titulo="titulo-pedido">
      {tamanhoPedido && <>
        <button type="button" className="dialog-close" onClick={() => setTamanhoPedido(null)} aria-label="Fechar janela">
          <Icone nome="x" />
        </button>
        <span className="dialog-icon"><Icone nome="box" /></span>
        <span className="section-overline">SEU PEDIDO</span>
        <h2 id="titulo-pedido">Confirmar cesta</h2>
        <p>Veja os detalhes antes de pedir sua cesta semanal.</p>
        <div className="order-summary">
          <div><span>Tamanho</span><strong>{tamanhos[tamanhoPedido]?.nome}</strong></div>
          <div><span>Capacidade</span><strong>{tamanhos[tamanhoPedido]?.limite} itens</strong></div>
          <div><span>Assinante</span><strong>{usuario.nome}</strong></div>
        </div>
        <p className="dialog-hint">O dono do pedido é autenticado pelo seu token JWT. O produtor receberá seu pedido e registrará os produtos colhidos.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setTamanhoPedido(null)}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={confirmarPedido}>Confirmar pedido <Icone nome="check" /></button>
        </div>
      </>}
    </Janela>

    {/* Janela de registro de produto pelo produtor */}
    <Janela aberta={Boolean(cestaEmFechamento)} aoFechar={() => setCestaEmFechamento(null)} classe="produce-dialog" titulo="titulo-fechamento">
      {cestaEmFechamento && (
        <FormularioDeProduto
          cesta={cestaEmFechamento}
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
