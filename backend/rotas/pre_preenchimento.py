from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banco import obter_sessao
from esquemas.pre_preenchimento import (ConfirmacaoDoRascunho, ConfirmacaoResposta, PrePreenchimentoPedido,
                                        RascunhoResposta)
from rotas.autenticacao import exigir_pre_preencher, exigir_separar_produto
from servicos import pre_preenchimento as servico_pre_preenchimento
from servicos.excecoes import ConfirmacaoRecusada, IaIndisponivel, NadaParaPreencher

router = APIRouter(prefix="/cestas/pre-preenchimento", tags=["Pré-preenchimento com IA"])


# Gera o rascunho sem gravar nada. O 503 diz que a API está bem e só o serviço externo falhou.
@router.post("", response_model=RascunhoResposta,
             summary="Sugerir as cestas da semana com IA",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão cestas:pre_preencher"},
                        409: {"description": "Não há cesta aprovada com espaço, ou não há estoque na semana"},
                        503: {"description": "A IA não respondeu. A separação manual continua funcionando"}})
def sugerir_cestas(dados: PrePreenchimentoPedido, usuario=Depends(exigir_pre_preencher),
                   sessao: Session = Depends(obter_sessao)):
    """Devolve um rascunho para o produtor revisar. Nada é gravado aqui."""
    try:
        return servico_pre_preenchimento.sugerir(sessao, dados.semana)
    except NadaParaPreencher as erro:
        raise HTTPException(status_code=409, detail=str(erro))
    except IaIndisponivel as erro:
        raise HTTPException(status_code=503, detail=str(erro))


# Gravar o rascunho é separar produtos, então usa a mesma permissão da separação manual.
@router.post("/confirmar", response_model=ConfirmacaoResposta, status_code=201,
             summary="Confirmar o rascunho revisado",
             responses={401: {"description": "Sem token, ou token inválido ou vencido"},
                        403: {"description": "O grupo de quem está logado não tem a permissão produtos:separar"},
                        409: {"description": "Algum item conflita com a cesta ou o estoque, e nada foi gravado"}})
def confirmar_rascunho(dados: ConfirmacaoDoRascunho, usuario=Depends(exigir_separar_produto),
                       sessao: Session = Depends(obter_sessao)):
    """Confere todos os itens de novo e grava tudo num commit só, ou não grava nada."""
    try:
        return servico_pre_preenchimento.confirmar(sessao, dados)
    except ConfirmacaoRecusada as erro:
        raise HTTPException(status_code=409, detail=str(erro))
