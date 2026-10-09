import os
from pathlib import Path

from dotenv import load_dotenv

# A configuração é o único ponto de leitura do ambiente da máquina.
load_dotenv(Path(__file__).parent / ".env")
URL_DO_BANCO = os.getenv("URL_DO_BANCO")
# A URL de testes aponta para um MySQL separado, nunca para os dados do projeto.
URL_DO_BANCO_TESTE = os.getenv("URL_DO_BANCO_TESTE")
ORIGEM_FRONTEND = os.getenv("ORIGEM_FRONTEND", "http://localhost:5173")
