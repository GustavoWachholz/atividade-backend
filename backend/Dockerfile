FROM python:3.12-slim
WORKDIR /app
# copia só a lista de bibliotecas primeiro: o Docker reaproveita essa etapa em cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["fastapi", "run", "main.py", "--port", "8000"]
