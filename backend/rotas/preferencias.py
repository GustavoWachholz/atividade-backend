from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.preferencia import PreferenciaEdicao, PreferenciaResposta
from rotas.autenticacao import exigir_editar_preferencias
from servicos import preferencia as servico_preferencia
from servicos.excecoes import ProdutoForaDasPreferencias

router = APIRouter(prefix="/preferencias", tags=["Preferências da assinante"])


@router.get("", response_model=list[PreferenciaResposta],
            summary="Listar os produtos do estoque com a preferência da assinante",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão preferencias:editar"}})
def listar_preferencias(usuario=Depends(exigir_editar_preferencias), sessao: Session = Depends(obter_sessao)):
    """Os produtos ativos que já foram colhidos, em ordem alfabética, com quero, nao_quero ou tanto_faz."""
    return servico_preferencia.listar(sessao, usuario.id)


# PUT troca a marcação inteira do produto: a mesma chamada repetida dá o mesmo resultado.
@router.put("/{produto_id}", response_model=list[PreferenciaResposta],
            summary="Marcar se quer ou não receber um produto",
            responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                       403: {"description": "O grupo de quem está logado não tem a permissão preferencias:editar"},
                       404: {"description": "O produto não está no estoque, ou está desativado"}})
def definir_preferencia(produto_id: int, dados: PreferenciaEdicao,
                        usuario=Depends(exigir_editar_preferencias), sessao: Session = Depends(obter_sessao)):
    """Grava a marcação e devolve a lista inteira atualizada. tanto_faz apaga a marcação."""
    try:
        return servico_preferencia.definir(sessao, usuario.id, produto_id, dados.preferencia)
    except ProdutoForaDasPreferencias as erro:
        raise HTTPException(status_code=404, detail=str(erro))
