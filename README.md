# Rate Movie App

## Rodar com um único comando

Na raiz do projeto, execute:

```powershell
.\dev.ps1
```

Ou, se quiser evitar qualquer bloqueio de política do PowerShell:

```powershell
.\dev.cmd
```

Esse comando abre backend e frontend juntos.

- `backend`: `http://127.0.0.1:5000`
- `frontend`: endereço exibido pelo Vite, normalmente `http://localhost:5173`

Para encerrar os dois processos com um único comando:

```powershell
.\stop-dev.ps1
```

Ou:

```powershell
.\stop-dev.cmd
```

## Pré-requisitos

- `pnpm` disponível no `PATH`
- virtualenv criada em `./.venv`
- dependências do backend instaladas em `./.venv`
- dependências do frontend instaladas em `./frontend/node_modules`
- variáveis de ambiente do backend configuradas

## Modo alternativo

Se preferir iniciar os dois processos sem abrir novas janelas do PowerShell:

```powershell
.\dev.ps1 -NoNewWindows
```