from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.cesta import CestaCriacao, CestaDetalheResposta, CestaResposta, TamanhoCesta
# [NOVO · grupos] exigir_pedir_cesta e exigir_ver_cestas substituem exigir_assinante e obter_usuario_atual.
from rotas.autenticacao import (exigir_aprovar_cesta, exigir_concluir_cesta,
                                exigir_pedir_cesta, exigir_ver_cestas)
from seguranca import tem_permissao  # [NOVO · grupos]
from servicos import cesta as servico_cesta
from servicos.excecoes import CestaIncompleta, CestaNaoEmSeparacao, CestaNaoPedida, SemanaForaDoPedido

router = APIRouter(prefix="/cestas", tags=["Cestas"])


# Dependência das rotas com {cesta_id}: 404 se a cesta não existe e, depois do 404,
# 403 se quem não pode ver todas as cestas tentar abrir a cesta de outra pessoa.
# [NOVO · grupos] Exige a permissão cestas:ver, e a conferência do dono pergunta pela
# permissão cestas:ver_todas, e não mais pelo tipo "assinante".
def cesta_existente(cesta_id: int, usuario=Depends(exigir_ver_cestas),
                    sessao: Session = Depends(obter_sessao)):
    cesta = servico_cesta.buscar_por_id(sessao, cesta_id)
    if cesta is None:
        raise HTTPException(status_code=404, detail="Cesta não encontrada.")
    if not tem_permissao(usuario, "cestas:ver_todas") and cesta.assinante_id != usuario.id:
        raise HTTPException(status_code=403, detail="Esta cesta não é sua")
    return cesta


# A assinante pede a cesta; o dono vem sempre do token, não do corpo da requisição.
# O pedido não depende do estoque: ele cai para o produtor aprovar ou reprovar.
@router.post("", response_model=CestaResposta, status_code=201,
             summary="Pedir a cesta da semana",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão cestas:pedir"},
                        409: {"description": "A semana do pedido não é a semana atual"}})
def criar_cesta(dados: CestaCriacao, usuario=Depends(exigir_pedir_cesta),  # [NOVO · grupos]
                sessao: Session = Depends(obter_sessao)):
    """A cesta nasce como pedida, e o dono é quem está logado. O produtor decide depois."""
    try:
        return servico_cesta.criar(sessao, dados, usuario)
    except SemanaForaDoPedido as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# Query(ge=1) recusa páginas menores que 1; o serviço decide o que cada perfil vê.
@router.get("", response_model=list[CestaResposta],
            summary="Listar as cestas",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão cestas:ver"}})
# semana é opcional: qualquer dia serve, e a lista traz as cestas daquela semana (segunda a domingo).
def listar_cestas(tamanho: TamanhoCesta | None = None,
                  assinante_id: int | None = Query(default=None, gt=0),
                  pagina: int = Query(default=1, ge=1),
                  semana: date | None = None,
                  usuario=Depends(exigir_ver_cestas),  # [NOVO · grupos]
                  sessao: Session = Depends(obter_sessao)):
    """Quem tem cestas:ver_todas (produtor) vê todas, com filtro por assinante. Os outros veem só as próprias."""
    return servico_cesta.listar(sessao, usuario, tamanho, assinante_id, pagina, semana)


# O detalhe acrescenta os cálculos de capacidade à cesta já conferida pela dependência.
@router.get("/{cesta_id}", response_model=CestaDetalheResposta,
            summary="Mostrar uma cesta",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "Sem a permissão cestas:ver, ou a cesta é de outra assinante"},
                       404: {"description": "A cesta não existe"}})
def consultar_cesta(cesta=Depends(cesta_existente)):
    """Mostra a cesta com o limite, o que já foi separado e quanto ainda cabe."""
    return servico_cesta.detalhar(cesta)


# PATCH muda só um pedaço do recurso, aqui a situação da cesta. O exigir_ vem antes da cesta_existente,
# então quem não é produtor recebe 403 mesmo que a cesta não exista.
# A recusa de estado vira 409: o pedido está certo no formato, mas a cesta não está na situação esperada.
@router.patch("/{cesta_id}/aprovar", response_model=CestaResposta,
              summary="Aprovar o pedido da cesta",
              responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                         403: {"description": "O grupo de quem está logado não tem a permissão cestas:aprovar"},
                         404: {"description": "A cesta não existe"},
                         409: {"description": "A cesta não está pedida"}})
def aprovar_cesta(usuario=Depends(exigir_aprovar_cesta), cesta=Depends(cesta_existente),
                  sessao: Session = Depends(obter_sessao)):
    """A cesta pedida passa para em separação, e o produtor já pode separar os produtos."""
    try:
        return servico_cesta.aprovar(sessao, cesta)
    except CestaNaoPedida as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# Reprovar deixa a cesta recusada. Ela não recebe produtos e não volta para pedida.
@router.patch("/{cesta_id}/reprovar", response_model=CestaResposta,
              summary="Reprovar o pedido da cesta",
              responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                         403: {"description": "O grupo de quem está logado não tem a permissão cestas:aprovar"},
                         404: {"description": "A cesta não existe"},
                         409: {"description": "A cesta não está pedida"}})
def reprovar_cesta(usuario=Depends(exigir_aprovar_cesta), cesta=Depends(cesta_existente),
                   sessao: Session = Depends(obter_sessao)):
    """A cesta pedida passa para recusada."""
    try:
        return servico_cesta.reprovar(sessao, cesta)
    except CestaNaoPedida as erro:
        raise HTTPException(status_code=409, detail=str(erro))


# Concluir exige a cesta em separação e cheia. As duas recusas viram 409.
@router.patch("/{cesta_id}/concluir", response_model=CestaResposta,
              summary="Concluir a cesta",
              responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                         403: {"description": "O grupo de quem está logado não tem a permissão cestas:concluir"},
                         404: {"description": "A cesta não existe"},
                         409: {"description": "A cesta não está em separação, ou ainda não está cheia"}})
def concluir_cesta(usuario=Depends(exigir_concluir_cesta), cesta=Depends(cesta_existente),
                   sessao: Session = Depends(obter_sessao)):
    """A cesta em separação e cheia passa para concluída."""
    try:
        return servico_cesta.concluir(sessao, cesta)
    except (CestaNaoEmSeparacao, CestaIncompleta) as erro:
        raise HTTPException(status_code=409, detail=str(erro))
