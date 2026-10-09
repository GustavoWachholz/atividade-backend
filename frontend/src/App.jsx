import { useEffect, useRef, useState } from 'react';

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

// Calcula o primeiro dia da semana para apresentar a mesma referência em todas as telas.
function semanaAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const formatar = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatar(inicio)} a ${formatar(fim)}`;
}

// Soma as quantidades porque a capacidade não conta apenas os tipos de produto.
function itensSeparados(cesta) {
  return cesta.produtos.reduce((total, produto) => total + produto.quantidade, 0);
}

// Gera o texto completo que acompanha a barra de capacidade.
function textoCapacidade(cesta) {
  const usados = itensSeparados(cesta);
  const limite = tamanhos[cesta.tamanho].limite;
  const livres = limite - usados;
  return `${usados} de ${limite} itens separados · ${livres === 0 ? 'cesta cheia' : `cabem mais ${livres}`}`;
}

// Exibe a capacidade com valor semântico e leitura textual, conforme o styleguide.
function Capacidade({ cesta }) {
  const usados = itensSeparados(cesta);
  const limite = tamanhos[cesta.tamanho].limite;
  return <div className="entry-capacity">
    <div className="entry-progress-header"><span>Capacidade da cesta</span><span className="remaining">{usados} / {limite}</span></div>
    <progress value={usados} max={limite} aria-label={textoCapacidade(cesta)} />
    <p>{textoCapacidade(cesta)}</p>
  </div>;
}

// Lista os produtos ou explica por que a lista ainda está vazia.
function ProdutosDaCesta({ cesta }) {
  if (!cesta.produtos.length) return <p className="entry-empty">Nenhum produto separado ainda. A lista aparecerá aqui quando a separação começar.</p>;
  return <ul>{cesta.produtos.map((produto, indice) => <li key={`${produto.nome}-${indice}`}><span>{produto.nome}</span><span>{produto.quantidade} un.</span></li>)}</ul>;
}

// Controla a abertura de uma janela nativa, incluindo o fechamento pela tecla Escape.
function Janela({ aberta, aoFechar, children, classe, titulo }) {
  const referencia = useRef(null);
  useEffect(() => {
    const janela = referencia.current;
    if (aberta && janela && !janela.open) janela.showModal();
    if (!aberta && janela?.open) janela.close();
  }, [aberta]);
  return <dialog ref={referencia} className={classe} aria-labelledby={titulo} onCancel={aoFechar} onClose={aoFechar}>{children}</dialog>;
}

// Reúne identidade, navegação, escolha de perfil e busca em um cabeçalho consistente.
function Cabecalho({ perfil, definirPerfil, quantidade, navegar, buscar, menuAberto, definirMenuAberto }) {
  const nomePerfil = perfil === 'Aline' ? 'Aline · Assinante' : 'Vanderlei · Produtor';
  return <header className="site-header" id="topo">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="announcement"><div className="container announcement-inner"><span><Icone nome="leaf" /> COLHEITA DA SEMANA</span><span className="announcement-note">Uma horta comunitária, feita com cuidado</span></div></div>
    <div className="container header-main">
      <button className="brand-plate" type="button" onClick={() => navegar('inicio')} aria-label="Cesta do Vale, voltar para o início"><img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="262" height="86" /></button>
      <form className="search" role="search" onSubmit={buscar}><label htmlFor="busca" className="sr-only">Buscar por tamanho de cesta</label><input id="busca" name="busca" type="search" placeholder="Qual cesta combina com sua semana?" autoComplete="off" /><button aria-label="Buscar"><Icone nome="search" /></button></form>
      <div className="header-actions">
        <label className="profile-select" htmlFor="perfil"><Icone nome="user" /><span className="profile-copy"><small>Você está como</small><strong>{nomePerfil}</strong></span><span className="sr-only">Escolher perfil de demonstração</span><select id="perfil" value={perfil} onChange={(evento) => definirPerfil(evento.target.value)} aria-label="Perfil de demonstração"><option value="Aline">Aline · Assinante</option><option value="Vanderlei">Vanderlei · Produtor</option></select><Icone nome="chevron" /></label>
        <button className="header-orders" type="button" onClick={() => navegar('cestas')} aria-label={`Minhas cestas, ${quantidade} ${quantidade === 1 ? 'cesta' : 'cestas'}`}><Icone nome="box" /><span>Minhas cestas</span><span className="counter">{quantidade}</span></button>
        <button className="mobile-menu-button" type="button" onClick={() => definirMenuAberto(!menuAberto)} aria-expanded={menuAberto} aria-controls="primary-nav" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}><Icone nome="menu" /></button>
      </div>
    </div>
    <nav className={`primary-nav ${menuAberto ? 'open' : ''}`} id="primary-nav" aria-label="Navegação principal"><div className="container nav-inner"><div className="nav-links"><button type="button" className="nav-link" onClick={() => navegar('inicio')}>Início</button><button type="button" className="nav-link" onClick={() => navegar('inicio', 'cestas')}>Cestas da semana</button><button type="button" className="nav-link" onClick={() => navegar('inicio', 'horta')}>Nossa horta</button><button type="button" className="nav-link" onClick={() => navegar('cestas')}>Minhas cestas</button></div><button type="button" className="producer-link" onClick={() => navegar('separacao')}><Icone nome="leaf" /> Área do produtor <Icone nome="arrow" /></button></div></nav>
  </header>;
}

// Apresenta os três tamanhos para a pessoa escolher rapidamente a cesta semanal.
function CartoesDeCesta({ busca, pedir }) {
  const encontrados = Object.entries(tamanhos).filter(([chave, tamanho]) => !busca || `${chave} ${tamanho.nome} cesta semanal`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(busca));
  return <section className="section container basket-section" id="cestas" aria-labelledby="titulo-cestas">
    <div className="section-header"><div><span className="section-overline"><Icone nome="leaf" /> ESCOLHA A SUA</span><h2 id="titulo-cestas">Uma cesta do <span>seu tamanho</span></h2><p>Três opções para você escolher, sem complicação.</p></div><span className="section-pill"><Icone nome="calendar" /> Pedidos da semana</span></div>
    <div className="basket-grid">{encontrados.map(([chave, tamanho]) => <article className={`basket-card ${chave === 'media' ? 'featured' : ''}`} key={chave}>{chave === 'media' && <span className="popular-flag"><Icone nome="heart" /> PARA A SEMANA TODA</span>}<div className={`basket-card-visual ${tamanho.classe}`}><img src="/ilustracoes/hero-horta.svg" alt={`Ilustração de cesta ${tamanho.nome.toLowerCase()} com vegetais`} width="225" height="183" /></div><div className="basket-card-body"><span className="card-kicker">CESTA SEMANAL</span><div className="card-title-line"><h3>{tamanho.nome}</h3><span className="capacity-tag">{tamanho.limite} itens</span></div><p>{tamanho.frase}</p><div className="card-meta"><Icone nome="check" /> Até {tamanho.limite} unidades de produtos</div><button className="btn btn-primary btn-block" type="button" onClick={() => pedir(chave)}>Pedir cesta {tamanho.nome.toLowerCase()} <Icone nome="arrow" /></button></div></article>)}</div>
    {!encontrados.length && <div className="empty-search">Nenhuma cesta encontrada. Tente buscar por pequena, média ou grande.</div>}
    <p className="section-footnote"><Icone nome="info" /> A capacidade considera a soma das quantidades dos produtos separados. Os itens variam conforme a separação.</p>
  </section>;
}

// Mantém a página inicial com a mesma apresentação visual e conteúdos institucionais.
function Inicio({ pedir, busca, definirBusca, navegar }) {
  const [destaque, definirDestaque] = useState(0);
  const atual = destaques[destaque];
  const mudarDestaque = (valor) => definirDestaque((valor + destaques.length) % destaques.length);
  return <div className="page active-page">
    <section className="hero-wrap container" aria-label="Destaques da semana"><div className={`hero slide-${destaque}`}><div className="hero-content"><span className="eyebrow"><span className="eyebrow-dot" /> CESTAS SEMANAIS DA NOSSA HORTA</span><h1>{atual.titulo}</h1><p>{atual.texto}</p><div className="hero-actions"><button type="button" className="btn btn-primary btn-large" onClick={() => navegar('inicio', atual.destino)}>{atual.acao} <Icone nome="arrow" /></button><button type="button" className="text-link" onClick={() => navegar('inicio', 'como-funciona')}>Como funciona <Icone nome="arrow" /></button></div><div className="hero-carousel" aria-label="Selecionar destaque"><button type="button" className="carousel-arrow" onClick={() => mudarDestaque(destaque - 1)} aria-label="Destaque anterior"><Icone nome="left" /></button><div className="carousel-dots">{destaques.map((_, indice) => <button type="button" className={`dot ${indice === destaque ? 'active' : ''}`} aria-label={`Ir para destaque ${indice + 1}`} aria-current={indice === destaque || undefined} key={indice} onClick={() => definirDestaque(indice)} />)}</div><button type="button" className="carousel-arrow" onClick={() => mudarDestaque(destaque + 1)} aria-label="Próximo destaque"><Icone nome="right" /></button></div></div><div className="hero-visual"><span className="floating-tag tag-top"><Icone nome="heart" /> Feito com cuidado</span><span className="hero-halo" /><img src="/ilustracoes/hero-horta.svg" width="640" height="520" alt="Ilustração de uma cesta de hortaliças frescas" /><span className="floating-tag tag-bottom"><Icone nome="leaf" /> Da nossa horta</span></div></div></section>
    <section className="benefits container" aria-label="Facilidades da Cesta do Vale"><div className="benefit"><span className="benefit-icon gold"><Icone nome="box" /></span><span><strong>Do seu tamanho</strong><small>Escolha entre 3 cestas</small></span></div><div className="benefit"><span className="benefit-icon green"><Icone nome="list" /></span><span><strong>Acompanhe tudo</strong><small>Veja o que já foi separado</small></span></div><div className="benefit"><span className="benefit-icon peach"><Icone nome="heart" /></span><span><strong>Feita em comunidade</strong><small>Uma horta que aproxima</small></span></div><div className="benefit"><span className="benefit-icon sage"><Icone nome="calendar" /></span><span><strong>Toda semana</strong><small>Um novo pedido, bem simples</small></span></div></section>
    <CartoesDeCesta busca={busca} pedir={pedir} />
    <section className="section produce-section" id="horta" aria-labelledby="titulo-horta"><div className="container"><div className="section-header"><div><span className="section-overline"><Icone nome="leaf" /> DIRETO DA TERRA</span><h2 id="titulo-horta">Um gostinho da <span>nossa horta</span></h2><p>Alguns exemplos de produtos que podem fazer parte das cestas.</p></div><span className="illustration-note">Ilustrações de exemplo, não representam disponibilidade</span></div><div className="produce-grid" aria-label="Exemplos ilustrativos de hortaliças">{[['🥬', 'Folhas', 'Verdinhas e frescas', 'p-green'], ['🥕', 'Raízes', 'Cor em cada receita', 'p-peach'], ['🍅', 'Hortaliças', 'Para variar o prato', 'p-rose'], ['🥦', 'Verdes', 'Sabores da horta', 'p-lime'], ['🎃', 'Da estação', 'O que a terra oferece', 'p-orange']].map(([icone, nome, frase, classe]) => <div className="produce-card" key={nome}><div className={`produce-illustration ${classe}`}><span role="img" aria-label={nome}>{icone}</span></div><h3>{nome}</h3><p>{frase}</p></div>)}</div></div></section>
    <section className="section container how-section" id="como-funciona" aria-labelledby="titulo-como"><div className="section-header"><div><span className="section-overline"><Icone nome="heart" /> SIMPLES ASSIM</span><h2 id="titulo-como">Da escolha à <span>sua cesta</span></h2><p>Um caminho claro, para quem pede e para quem separa.</p></div></div><div className="how-grid"><div className="step-panel">{[['01', 'Escolha o tamanho', 'Pequena, média ou grande. Você decide conforme sua necessidade.'], ['02', 'Acompanhe a separação', 'Consulte a situação da cesta e veja os produtos registrados pelo produtor.'], ['03', 'Saiba o que tem nela', 'Veja as quantidades separadas para planejar suas refeições.']].map(([numero, titulo, texto]) => <div className="step" key={numero}><span className="step-number">{numero}</span><div><h3>{titulo}</h3><p>{texto}</p></div></div>)}<button type="button" className="btn btn-secondary how-cta" onClick={() => navegar('cestas')}>Ver minhas cestas <Icone nome="arrow" /></button></div><div className="progress-preview"><span className="preview-demo">EXEMPLO ILUSTRATIVO</span><div className="preview-heading"><span className="preview-basket"><Icone nome="box" /></span><div><small>SUA CESTA DA SEMANA</small><h3>Cesta pequena</h3></div><span className="status-badge status-progress">Em separação</span></div><div className="preview-items"><div><span>🥬</span> Alface <strong>2 un.</strong></div><div><span>🍅</span> Tomate <strong>2 un.</strong></div></div><div className="progress-caption"><strong>Quase lá!</strong><span>4 de 5 itens separados</span></div><progress value="4" max="5" aria-label="Exemplo: 4 de 5 itens separados" /><div className="preview-bottom"><span><Icone nome="leaf" /> Cabe mais 1 item</span><span>80%</span></div></div></div></section>
    <section className="closing-cta container"><div><span className="section-overline">UM CONVITE DA NOSSA HORTA</span><h2>Uma semana mais verde começa por aqui.</h2><p>Escolha sua cesta e acompanhe cada etapa, do seu jeito.</p></div><button className="btn btn-cream" type="button" onClick={() => navegar('inicio', 'cestas')}>Quero minha cesta <Icone nome="arrow" /></button></section>
  </div>;
}

// Mostra as cestas da assinante com situação, produtos e capacidade atual.
function MinhasCestas({ cestas, navegar }) {
  const lista = cestas.filter((cesta) => cesta.assinante === 'Aline');
  return <section className="container workspace page" aria-labelledby="titulo-minhas-cestas"><div className="workspace-heading"><div><button className="back-link" type="button" onClick={() => navegar('inicio')}><Icone nome="left" /> Voltar para o início</button><span className="section-overline">SUA ÁREA</span><h1 id="titulo-minhas-cestas">Minhas <span>cestas</span></h1><p>Acompanhe seus pedidos e confira os produtos separados.</p></div><button type="button" className="btn btn-primary" onClick={() => navegar('inicio', 'cestas')}>Pedir nova cesta <Icone nome="arrow" /></button></div><p className="demo-note"><Icone nome="info" /> Dados de demonstração em memória. Seus pedidos nesta prévia desaparecem ao recarregar a página.</p><div className="workspace-list">{lista.length ? lista.map((cesta) => <article className="order-entry" key={cesta.id}><div className="entry-top"><div><span className="entry-meta"><Icone nome="calendar" /> SEMANA {semanaAtual()}</span><h2 className="entry-title">Cesta {tamanhos[cesta.tamanho].nome.toLowerCase()}</h2><p className="entry-person">{cesta.exemplo ? 'Cesta de demonstração' : 'Pedido realizado nesta sessão'}</p></div><span className={`status-badge ${itensSeparados(cesta) ? 'status-progress' : 'status-ordered'}`}>{itensSeparados(cesta) ? 'Em separação' : 'Pedida'}</span></div><Capacidade cesta={cesta} /><div className="entry-items"><h3>Produtos separados</h3><ProdutosDaCesta cesta={cesta} /></div></article>) : <div className="empty-workspace"><Icone nome="box" /><h3>Você ainda não pediu uma cesta para esta semana.</h3><p>Escolha um tamanho para fazer seu primeiro pedido.</p><button type="button" className="btn btn-primary" onClick={() => navegar('inicio', 'cestas')}>Escolher uma cesta</button></div>}</div></section>;
}

// Exibe as cestas ao produtor e oferece filtros simples da cartilha.
function Separacao({ cestas, abrirFechamento, navegar }) {
  const [tamanho, definirTamanho] = useState('todas');
  const [assinante, definirAssinante] = useState('');
  const consulta = assinante.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lista = cestas.filter((cesta) => (tamanho === 'todas' || cesta.tamanho === tamanho) && cesta.assinante.toLowerCase().includes(consulta));
  return <section className="container workspace page" aria-labelledby="titulo-separacao"><div className="workspace-heading"><div><button className="back-link" type="button" onClick={() => navegar('inicio')}><Icone nome="left" /> Voltar para o início</button><span className="section-overline">ÁREA DO PRODUTOR</span><h1 id="titulo-separacao">A <span>separação</span></h1><p>Veja as cestas, confira os limites e registre os produtos da semana.</p></div><span className="producer-week"><Icone nome="calendar" /> Semana {semanaAtual()}</span></div><p className="demo-note"><Icone nome="info" /> Prévia funcional com dados de demonstração; sem autenticação nem armazenamento permanente nesta etapa.</p><div className="filter-bar"><label htmlFor="filtro-tamanho">Tamanho<select id="filtro-tamanho" value={tamanho} onChange={(evento) => definirTamanho(evento.target.value)}><option value="todas">Todos os tamanhos</option><option value="pequena">Pequena</option><option value="media">Média</option><option value="grande">Grande</option></select></label><label htmlFor="filtro-assinante">Assinante<input id="filtro-assinante" type="search" placeholder="Buscar assinante" autoComplete="off" value={assinante} onChange={(evento) => definirAssinante(evento.target.value)} /></label><div className="filter-summary" aria-live="polite">{lista.length} {lista.length === 1 ? 'cesta encontrada' : 'cestas encontradas'}</div></div><div className="workspace-list">{lista.length ? lista.map((cesta) => { const cheia = itensSeparados(cesta) === tamanhos[cesta.tamanho].limite; return <article className="producer-entry" key={cesta.id}><div className="entry-top"><div><span className="entry-meta"><Icone nome="calendar" /> SEMANA {semanaAtual()}</span><h2 className="entry-title">Cesta {tamanhos[cesta.tamanho].nome.toLowerCase()}</h2><p className="entry-person">Assinante: <strong>{cesta.assinante}</strong></p></div><span className={`status-badge ${itensSeparados(cesta) ? 'status-progress' : 'status-ordered'}`}>{itensSeparados(cesta) ? 'Em separação' : 'Pedida'}</span></div><Capacidade cesta={cesta} /><div className="entry-items"><h3>Produtos separados</h3><ProdutosDaCesta cesta={cesta} /></div><div className="entry-actions"><button type="button" className="btn btn-primary" disabled={cheia} onClick={() => abrirFechamento(cesta.id)}>{cheia ? 'Cesta cheia' : 'Separar produto'} <Icone nome="arrow" /></button></div></article>; }) : <div className="empty-workspace"><Icone nome="filter" /><h3>Nenhuma cesta com esses filtros</h3><p>Experimente alterar o tamanho ou o nome do assinante.</p></div>}</div></section>;
}

// Mantém ações institucionais e os limites do escopo no rodapé.
function Rodape({ navegar }) {
  return <footer className="site-footer"><div className="container footer-main"><div className="footer-about"><span className="footer-logo"><img src="/marca/logo_cesta_do_vale_em_estilo_cartum.png" alt="Cesta do Vale" width="240" height="80" /></span><p>Uma horta comunitária que aproxima pessoas e alimentos frescos.</p></div><div><h2>Explore</h2><button type="button" onClick={() => navegar('inicio')}>Início</button><button type="button" onClick={() => navegar('inicio', 'cestas')}>Escolher cesta</button><button type="button" onClick={() => navegar('cestas')}>Minhas cestas</button></div><div><h2>Para o produtor</h2><button type="button" onClick={() => navegar('separacao')}>A separação</button><p>Registre produtos e acompanhe a capacidade de cada cesta.</p></div><div className="footer-message"><Icone nome="heart" /><strong>Da terra da nossa gente,<br />para a sua semana.</strong><span>Feito com cuidado e simplicidade.</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Cesta do Vale · Projeto demonstrativo</span><span>Sem pagamentos, estoque ou entregas nesta etapa.</span></div></footer>;
}

// Coordena as telas e o estado compartilhado sem precisar de bibliotecas extras.
export default function App() {
  const [tela, definirTela] = useState('inicio');
  const [perfil, definirPerfil] = useState('Aline');
  const [busca, definirBusca] = useState('');
  const [menuAberto, definirMenuAberto] = useState(false);
  const [tamanhoPedido, definirTamanhoPedido] = useState(null);
  const [cestaEmFechamento, definirCestaEmFechamento] = useState(null);
  const [aviso, definirAviso] = useState('');
  const [cestas, definirCestas] = useState([{ id: 'exemplo-1', assinante: 'Aline', tamanho: 'pequena', exemplo: true, produtos: [{ nome: 'Alface', quantidade: 2 }, { nome: 'Tomate', quantidade: 2 }] }]);

  useEffect(() => {
    if (!aviso) return undefined;
    const tempo = window.setTimeout(() => definirAviso(''), 4500);
    return () => window.clearTimeout(tempo);
  }, [aviso]);

  const navegar = (proximaTela, destino) => {
    definirTela(proximaTela);
    definirMenuAberto(false);
    if (proximaTela === 'separacao') definirPerfil('Vanderlei');
    if (proximaTela === 'cestas') definirPerfil('Aline');
    window.setTimeout(() => {
      const elemento = destino ? document.getElementById(destino) : document.getElementById('conteudo');
      elemento?.scrollIntoView({ behavior: destino ? 'smooth' : 'auto', block: 'start' });
    }, 0);
  };
  const abrirPedido = (tamanho) => { definirPerfil('Aline'); definirTamanhoPedido(tamanho); };
  const confirmarPedido = () => {
    if (!tamanhoPedido) return;
    definirCestas((lista) => [{ id: `cesta-${Date.now()}`, assinante: 'Aline', tamanho: tamanhoPedido, exemplo: false, produtos: [] }, ...lista]);
    definirTamanhoPedido(null);
    definirAviso('Sua cesta da semana foi pedida!');
    navegar('cestas');
  };
  const registrarProduto = (nome, quantidade) => {
    const cesta = cestas.find((item) => item.id === cestaEmFechamento);
    if (!cesta) return 'Não encontramos essa cesta. Feche a janela e tente novamente.';
    const restante = tamanhos[cesta.tamanho].limite - itensSeparados(cesta);
    if (!nome.trim()) return 'Informe o nome do produto.';
    if (!Number.isSafeInteger(quantidade) || quantidade < 1) return 'Informe uma quantidade inteira maior que zero.';
    if (quantidade > restante) return `Não foi possível adicionar essa quantidade: ela ultrapassa a capacidade da cesta. Ainda cabem ${restante} ${restante === 1 ? 'item' : 'itens'}.`;
    definirCestas((lista) => lista.map((item) => item.id !== cesta.id ? item : { ...item, produtos: [...item.produtos, { nome: nome.trim(), quantidade }] }));
    definirCestaEmFechamento(null);
    definirAviso(`${quantidade} ${quantidade === 1 ? 'unidade registrada' : 'unidades registradas'} na cesta ${tamanhos[cesta.tamanho].nome.toLowerCase()}.`);
    return '';
  };
  const buscar = (evento) => { evento.preventDefault(); definirBusca(evento.currentTarget.busca.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()); navegar('inicio', 'cestas'); };
  const quantidadeAline = cestas.filter((cesta) => cesta.assinante === 'Aline').length;
  const cestaSelecionada = cestas.find((cesta) => cesta.id === cestaEmFechamento);

  return <><DefinicoesDeIcones /><Cabecalho perfil={perfil} definirPerfil={(novoPerfil) => { definirPerfil(novoPerfil); navegar(novoPerfil === 'Vanderlei' ? 'separacao' : 'inicio'); }} quantidade={quantidadeAline} navegar={navegar} buscar={buscar} menuAberto={menuAberto} definirMenuAberto={definirMenuAberto} /><main id="conteudo" tabIndex="-1">{tela === 'inicio' && <Inicio pedir={abrirPedido} busca={busca} definirBusca={definirBusca} navegar={navegar} />}{tela === 'cestas' && <MinhasCestas cestas={cestas} navegar={navegar} />}{tela === 'separacao' && <Separacao cestas={cestas} abrirFechamento={definirCestaEmFechamento} navegar={navegar} />}</main><Rodape navegar={navegar} />
    <Janela aberta={Boolean(tamanhoPedido)} aoFechar={() => definirTamanhoPedido(null)} classe="order-dialog" titulo="titulo-pedido">{tamanhoPedido && <><button type="button" className="dialog-close" onClick={() => definirTamanhoPedido(null)} aria-label="Fechar janela"><Icone nome="x" /></button><span className="dialog-icon"><Icone nome="box" /></span><span className="section-overline">SEU PEDIDO</span><h2 id="titulo-pedido">Confirmar cesta</h2><p>Veja os detalhes antes de pedir sua cesta.</p><div className="order-summary"><div><span>Tamanho</span><strong>{tamanhos[tamanhoPedido].nome}</strong></div><div><span>Capacidade</span><strong>{tamanhos[tamanhoPedido].limite} itens</strong></div><div><span>Assinante</span><strong>Aline</strong></div></div><p className="dialog-hint">Os produtos serão registrados pelo produtor. Você poderá acompanhá-los em Minhas cestas.</p><div className="dialog-actions"><button type="button" className="btn btn-secondary" onClick={() => definirTamanhoPedido(null)}>Voltar</button><button type="button" className="btn btn-primary" onClick={confirmarPedido}>Confirmar pedido <Icone nome="check" /></button></div></>}</Janela>
    <Janela aberta={Boolean(cestaSelecionada)} aoFechar={() => definirCestaEmFechamento(null)} classe="produce-dialog" titulo="titulo-fechamento">{cestaSelecionada && <FormularioDeProduto cesta={cestaSelecionada} aoCancelar={() => definirCestaEmFechamento(null)} aoRegistrar={registrarProduto} />}</Janela>
    {aviso && <div className="toast" role="status" aria-live="polite" aria-atomic="true"><Icone nome="check" /><span>{aviso}</span><button type="button" onClick={() => definirAviso('')} aria-label="Fechar aviso"><Icone nome="x" /></button></div>}
  </>;
}

// Valida o formulário antes de alterar a cesta e conserva os campos quando há erro.
function FormularioDeProduto({ cesta, aoCancelar, aoRegistrar }) {
  const [nome, definirNome] = useState('');
  const [quantidade, definirQuantidade] = useState('1');
  const [erro, definirErro] = useState('');
  const limite = tamanhos[cesta.tamanho].limite;
  const restante = limite - itensSeparados(cesta);
  const enviar = (evento) => { evento.preventDefault(); definirErro(aoRegistrar(nome, Number(quantidade))); };
  return <><button type="button" className="dialog-close" onClick={aoCancelar} aria-label="Fechar janela"><Icone nome="x" /></button><span className="section-overline">REGISTRO DO PRODUTOR</span><h2 id="titulo-fechamento">Separar produto</h2><div className="remaining-box">{textoCapacidade(cesta)}</div><form id="produce-form" onSubmit={enviar} noValidate><label htmlFor="nome-produto">Nome do produto</label><input id="nome-produto" type="text" autoComplete="off" placeholder="Ex.: Tomate" maxLength="65" value={nome} onChange={(evento) => definirNome(evento.target.value)} /><label htmlFor="quantidade-produto">Quantidade (unidades)</label><input id="quantidade-produto" type="number" min="1" max={restante} step="1" value={quantidade} onChange={(evento) => definirQuantidade(evento.target.value)} />{erro && <p className="dialog-error" role="alert">{erro}</p>}<div className="dialog-actions"><button type="button" className="btn btn-secondary" onClick={aoCancelar}>Cancelar</button><button type="submit" className="btn btn-primary">Registrar produto <Icone nome="check" /></button></div></form></>;
}
