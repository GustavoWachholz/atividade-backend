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
MODELO_DA_IA = os.getenv("MODELO_DA_IA", "gemini-3.8-flash")


# obter_configuracao reúne os valores que o seguranca.py precisa sem importar variáveis soltas.
def obter_configuracao():
    return {
        "chave_do_token": os.getenv("CHAVE_DO_TOKEN"),
    }
