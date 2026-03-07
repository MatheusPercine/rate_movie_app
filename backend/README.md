# Rate Movie App - Backend

Backend em Flask para busca de filmes via TMDB e CRUD de avaliações em PostgreSQL.

## Entidade principal

A entidade persistida é `Rating`.

| campo | tipo | descrição |
| --- | --- | --- |
| `id` | int | identificador interno |
| `movie_id` | int | identificador do filme no TMDB |
| `movie_name` | int | identificador do filme no TMDB |
| `rating` | int | nota do usuário, de 1 a 5 |
| `created_at` | datetime | data de criação |
| `updated_at` | datetime | data da última edição |

## Endpoints

### Saúde
- `GET /api/health`

### Filmes via TMDB
- `GET /api/movies/search?query=batman&page=1`
- `GET /api/movies/<movie_id>`

### Avaliações
- `GET /api/ratings`
- `GET /api/ratings/<movie_id>`
- `POST /api/ratings`
- `PUT /api/ratings/<movie_id>`
- `PATCH /api/ratings/<movie_id>`
- `DELETE /api/ratings/<movie_id>`

## Exemplo de payloads

### Criar avaliação
```json
{
  "movie_id": 550,
  "rating": 5
}
```

### Atualizar avaliação
```json
{
  "rating": 4
}
```

## Como rodar

1. Crie um arquivo `.env` baseado em `.env.example`.
  `.env` projeto original:
  TMDB_API_KEY=9532f82b3e7c83bb1134af3b2a8b07fb
  DATABASE_URL=postgresql+psycopg://postgres:root@localhost:5432/ratedmovies
  SECRET_KEY=dev-secret-key
2. Crie no PostgreSQL um banco chamado `rate_movie_app`.
3. Configure `TMDB_API_KEY` e `DATABASE_URL`.
4. Instale as dependências.
5. Execute a aplicação.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:TMDB_API_KEY="SUA_CHAVE_AQUI"
$env:DATABASE_URL="postgresql+psycopg://postgres:SUA_SENHA@localhost:5432/rate_movie_app"
python app.py
```

A API sobe em `http://127.0.0.1:5000`.

## PostgreSQL e pgAdmin 4

- Use o `pgAdmin 4` para criar e inspecionar o banco `rate_movie_app`.
- O backend usa a connection string em `DATABASE_URL`.
- O `pgAdmin 4` não é dependência do código; ele serve para administrar o PostgreSQL localmente.

## Rodar testes

```powershell
pytest
```

## Fluxo esperado com o front

- O frontend busca filmes em `GET /api/movies/search`
- O frontend abre detalhes em `GET /api/movies/<movie_id>`
- O frontend salva, edita e remove nota nos endpoints de `ratings`
- A página `Filmes avaliados` consome `GET /api/ratings`
