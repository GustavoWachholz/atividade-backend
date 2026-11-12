import os
from pathlib import Path

from dotenv import load_dotenv

# A configuração é o único ponto de leitura do ambiente da máquina.
load_dotenv(Path(__file__).parent / ".env")
URL_DO_BANCO = os.getenv("URL_DO_BANCO")
# A URL de testes aponta para um banco separado, nunca para os dados do projeto.
URL_DO_BANCO_TESTE = os.getenv("URL_DO_BANCO_TESTE")
ORIGEM_FRONTEND = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")
# A chave é opcional: sem ela a API sobe normalmente, e só o pré-preenchimento fica indisponível.
CHAVE_DA_IA = os.getenv("CHAVE_DA_IA")
# O cadastro de produtor manda um código de ativação ao e-mail do administrador, pelo Resend.
# Sem a chave ou sem o e-mail, o cadastro de produtor fica desligado (503). O e-mail do administrador
# fica só aqui no .env e no Vercel, nunca no código, porque o repositório é público.
EMAIL_DO_ADMIN = os.getenv("EMAIL_DO_ADMIN", "").strip()
CHAVE_DO_EMAIL = os.getenv("CHAVE_DO_EMAIL", "").strip()
# Sem domínio próprio, o Resend envia só deste remetente, e só para o e-mail dono da conta.
REMETENTE_DO_EMAIL = os.getenv("REMETENTE_DO_EMAIL", "").strip() or "Cesta do Vale <onboarding@resend.dev>"
# Os modelos tentados em ordem, separados por vírgula. Os Flash-Lite responderam em 3 a 24 s nos testes;
# o 3.8 Flash passou de 50 s e estourava o tempo. Se um estiver sobrecarregado, o seguinte é tentado.
MODELOS_DA_IA = [modelo.strip() for modelo in
                 os.getenv("MODELOS_DA_IA", "gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",")
                 if modelo.strip()]
# O OpenRouter entra depois de todos os modelos do Gemini falharem. Sem a chave, ele fica de fora.
# O modelo padrão é gratuito: tem limite de uso diário, e o provedor pode guardar o pedido
# (só vão ids, nomes e quantidades de produto e ids e tamanhos de cesta).
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
MODELO_DO_OPENROUTER = os.getenv("MODELO_DO_OPENROUTER", "").strip() or "nvidia/nemotron-3.5-super-vl:free"


# obter_configuracao reúne os valores que o seguranca.py precisa sem importar variáveis soltas.
def obter_configuracao():
    return {
        "chave_do_token": os.getenv("CHAVE_DO_TOKEN"),
    }
