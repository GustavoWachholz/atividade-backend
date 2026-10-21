from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.cesta import CestaCriacao, CestaDetalheResposta, CestaResposta, TamanhoCesta
from rotas.autenticacao import exigir_assinante, obter_usuario_atual
from servicos import cesta as servico_cesta

router = APIRouter(prefix="/cestas", tags=["Cestas"])


# Dependência das rotas com {cesta_id}: 404 se a cesta não existe e, depois do 404,
# 403 se uma assinante tentar abrir a cesta de outra pessoa. O produtor vê todas.
def cesta_existente(cesta_id: int, usuario=Depends(obter_usuario_atual),
                    sessao: Session = Depends(obter_sessao)):
    cesta = servico_cesta.buscar_por_id(sessao, cesta_id)
    if cesta is None:
        raise HTTPException(status_code=404, detail="Cesta não encontrada.")
    if usuario.tipo == "assinante" and cesta.assinante_id != usuario.id:
        raise HTTPException(status_code=403, detail="Esta cesta não é sua")
    return cesta


# A assinante pede a cesta; o dono vem sempre do token, não do corpo da requisição.
@router.post("", response_model=CestaResposta, status_code=201,
             summary="Pedir a cesta da semana",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "Quem está logado não é assinante"}})
def criar_cesta(dados: CestaCriacao, usuario=Depends(exigir_assinante),
                sessao: Session = Depends(obter_sessao)):
    """A cesta nasce como pedida, e o dono é quem está logado."""
    return servico_cesta.criar(sessao, dados, usuario)


# Query(ge=1) recusa páginas menores que 1; o serviço decide o que cada perfil vê.
@router.get("", response_model=list[CestaResposta],
            summary="Listar as cestas",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"}})
def listar_cestas(tamanho: TamanhoCesta | None = None,
                  assinante_id: int | None = Query(default=None, gt=0),
                  pagina: int = Query(default=1, ge=1),
                  usuario=Depends(obter_usuario_atual),
                  sessao: Session = Depends(obter_sessao)):
    """A assinante vê só as cestas dela. O produtor vê todas, com filtro por tamanho e por assinante."""
    return servico_cesta.listar(sessao, usuario, tamanho, assinante_id, pagina)


# O detalhe acrescenta os cálculos de capacidade à cesta já conferida pela dependência.
@router.get("/{cesta_id}", response_model=CestaDetalheResposta,
            summary="Mostrar uma cesta",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "A cesta é de outra assinante"},
                       404: {"description": "A cesta não existe"}})
def consultar_cesta(cesta=Depends(cesta_existente)):
    """Mostra a cesta com o limite, o que já foi separado e quanto ainda cabe."""
    return servico_cesta.detalhar(cesta)
