"""Envio de e-mail pelo Resend. É o único arquivo que fala com o serviço de e-mail."""

import logging

import httpx

import configuracao
from servicos.excecoes import EmailIndisponivel

registro = logging.getLogger(__name__)

URL_DO_RESEND = "https://api.resend.com/emails"
TEMPO_LIMITE_SEGUNDOS = 10


# Manda ao administrador o código que ativa um pedido de cadastro de produtor.
# Sem a chave ou sem o e-mail do administrador no .env, levanta EmailIndisponivel antes de chamar a internet.
# expira_em chega em UTC; o texto mostra o horário de Brasília (UTC-3, sem horário de verão desde 2019).
def enviar_codigo_ao_admin(nome, email, codigo, expira_em):
    if not configuracao.CHAVE_DO_EMAIL or not configuracao.EMAIL_DO_ADMIN:
        raise EmailIndisponivel("O cadastro de produtor está desligado: falta configurar o envio de e-mail.")
    horario = f"{(expira_em.hour - 3) % 24:02d}:{expira_em.minute:02d}"
    texto = (
        "Alguém pediu um cadastro de produtor na Cesta do Vale.\n\n"
        f"Nome: {nome}\n"
        f"E-mail: {email}\n\n"
        f"Código de ativação: {codigo}\n"
        f"Vale até {horario} (horário de Brasília), para uma única ativação.\n\n"
        "Se você não reconhece este pedido, não passe o código adiante: ele vence sozinho."
    )
    try:
        resposta = httpx.post(
            URL_DO_RESEND,
            headers={"Authorization": f"Bearer {configuracao.CHAVE_DO_EMAIL}"},
            json={"from": configuracao.REMETENTE_DO_EMAIL, "to": [configuracao.EMAIL_DO_ADMIN],
                  "subject": "Código de ativação de produtor · Cesta do Vale", "text": texto},
            timeout=TEMPO_LIMITE_SEGUNDOS,
        )
        resposta.raise_for_status()
    except httpx.HTTPError as erro:
        # Só o tipo do erro vai para o log: a resposta do serviço pode repetir o código ou o e-mail.
        registro.warning("Falha ao enviar o código de ativação: %s", type(erro).__name__)
        raise EmailIndisponivel("Não foi possível enviar o código ao administrador. Tente de novo mais tarde.")
