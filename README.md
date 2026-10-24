# Imersity

Projeto em validação para apoiar consultorias de visagismo e investigar avatares
3D, troca de cabelo e experiências de realidade mista.

## Conteúdo deste repositório

- `src/`: protótipo web existente em React, TypeScript, Three.js e React Three Fiber.
- `poc-3d/`: POC v0.6.7 de reconstrução com Apple Object Capture, backend Python,
  ponte Swift, preparação de cabeça/cabelo e visualizador Three.js próprio.
- `discovery/`: pesquisa de mercado, evidências e propostas de validação.
- `docs/`: contexto compartilhado, decisões e proposta de contrato entre aplicação
  e processamento 3D.
- `AGENTS.md`: acordo de trabalho entre as frentes do projeto.

Estes experimentos não representam uma arquitetura de produção aprovada. A POC
validada neste chat está versionada em `poc-3d/`; suas instruções estão no
[README da POC](poc-3d/README.md). O protótipo React e a POC mantêm suas dependências
e processos separados. Compartilhar o repositório não implementa sua integração.

## Executar o protótipo

Requer Node.js e npm.

```sh
npm ci
npm run dev
```

Para verificar a compilação:

```sh
npm run build
```

Gerações com provedores externos dependem de credenciais próprias e podem consumir
créditos. Executar o protótipo não autoriza enviar imagens de clientes a terceiros.

## Leitura inicial

1. [Contexto compartilhado](docs/CONTEXTO_COMPARTILHADO.md)
2. [Decisões e propostas](docs/DECISOES.md)
3. [Contrato 3D proposto](docs/CONTRATO_3D.md)

## Dados locais

Fotos, vídeos, capturas e avatares privados devem permanecer fora do Git e de assets
públicos. Credenciais e arquivos `.env` também não devem ser versionados. O
`.gitignore` cobre diretórios de captura/saída, modelos gerados e formatos comuns
de credenciais; qualquer novo arquivo deve ser revisado antes do commit.
