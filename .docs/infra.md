# Infraestrutura (UC2, aula 2)

## Endereço da API no front
- `frontend/src/api.js` exporta `URL_DA_API`, lida de `import.meta.env.VITE_URL_DA_API`.
- `frontend/.env.development` (`npm run dev`) e `frontend/.env.production` (`npm run build`) valem `/api`.
- Arquivo que usa o endereço: `frontend/src/App.jsx` (importa `URL_DA_API`; nenhum endereço fixo restante).
- No `npm run dev`, o proxy do `vite.config.js` repassa `/api` para `http://127.0.0.1:8000`.

## Servidor web (Caddy)
- `Caddyfile` na raiz: serve `frontend/dist` e repassa `/api/*` para `host.docker.internal:8000`, tirando o `/api`.
- Porta 80 sem HTTPS (domínio e HTTPS ficam para a próxima aula).

## Comandos
```
cd frontend && npm run build
cd backend && venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
docker run --rm -p 8080:80 `
  -v ./Caddyfile:/etc/caddy/Caddyfile `
  -v ./frontend/dist:/srv `
  caddy:2
```
Abrir `http://localhost:8080`. Print da aba Rede em `.docs/prints/`.
