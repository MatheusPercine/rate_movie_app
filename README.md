# Resumo do tutorial de execução da aplicação

1) Tenha instalado: `Python`, `Node.js` e `PostgreSQL`.
2) Instale o `pnpm` globalmente pelo terminal:
    `npm install -g pnpm`
3) Crie e ative a virtualenv do Python e instale as dependências do backend com o arquivo `requirements.txt`.
4) Crie um arquivo `.env` na pasta `backend` com o conteúdo:
    `TMDB_API_KEY=SUA_CHAVE_TMDB`
    `DATABASE_URL=postgresql+psycopg://postgres:SUA_SENHA@localhost:5432/ratedmovies`
    `SECRET_KEY=dev-secret-key`
5) Crie um banco local com o nome `ratedmovies`.
6) Na pasta `frontend`, execute o comando:
    `pnpm install`
7) Para rodar apenas o backend, estando na pasta `backend`, execute:
    `python app.py`
8) Para rodar apenas o frontend, estando na pasta `frontend`, execute:
    `pnpm dev`
    Depois, abra `http://localhost:5173/` no navegador.
9) Para rodar backend e frontend juntos, na raiz do projeto, execute:
    `.\dev.cmd`
    Depois, abra `http://localhost:5173/` no navegador.


# Rate Movie App

Aplicação para busca de filmes via TMDB e avaliação de filmes com `React + Vite` no frontend e `Flask + PostgreSQL` no backend.

## Pré-requisitos

Antes de rodar o projeto localmente, instale:

- `Python 3.13+`
- `Node.js 20+`
- `pnpm`
- `PostgreSQL`

## Estrutura do projeto

- `backend/`: API Flask, integração com TMDB e persistência das avaliações
- `frontend/`: aplicação React/Vite
- `dev.cmd`: inicialização conjunta de backend e frontend

## Configuração do backend

Na pasta `backend`, crie um arquivo `.env` com base em `backend/.env.example`.

Exemplo:

```dotenv
TMDB_API_KEY=SUA_CHAVE_TMDB
DATABASE_URL=postgresql+psycopg://postgres:SUA_SENHA@localhost:5432/ratedmovies
SECRET_KEY=dev-secret-key
```

Também é necessário criar o banco `ratedmovies` no PostgreSQL.

## Dependências do backend

As dependências instaladas na pasta `backend` são as do arquivo `backend/requirements.txt`:

- `Flask==3.1.0`
- `Flask-Cors==5.0.1`
- `Flask-SQLAlchemy==3.1.1`
- `psycopg[binary]==3.2.6`
- `requests==2.32.3`
- `python-dotenv==1.0.1`
- `pytest==8.3.5`

### Instalação do backend

Execute, no terminal na raiz do projeto, os comandos:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
```

Se preferir executar já de dentro da pasta `backend`, use:

```powershell
pip install -r requirements.txt
```

## Dependências do frontend

As dependências instaladas na pasta `frontend` vêm de `frontend/package.json`.

### Dependências principais

- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query`
- `axios`
- `lucide-react`
- `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- componentes e utilitários como `@radix-ui/*`, `sonner`, `date-fns`, `recharts`, `zustand`, `framer-motion`

### Dependências de desenvolvimento

- `vite`
- `typescript`
- `@vitejs/plugin-react-swc`
- `eslint`, `typescript-eslint`, `@eslint/js`
- `@types/node`, `@types/react`, `@types/react-dom`

### Instalação do frontend

Execute, no terminal na raiz do frontend (pasta frontend), o comando:

```powershell
pnpm install
```

## Como rodar localmente

### Rodar apenas o backend

```powershell
python app.py
```

Backend disponível em `http://127.0.0.1:5000`.

### Rodar apenas o frontend

```powershell
pnpm dev
```

Frontend disponível normalmente em `http://localhost:5173`.

### Rodar backend + frontend com um único comando

Na raiz do projeto:

```powershell
.\dev.cmd
```