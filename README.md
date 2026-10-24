# Imersity

Projeto em validação para apoiar consultorias de visagismo e investigar avatares
3D, troca de cabelo e experiências de realidade mista.

## Conteúdo deste repositório

- `src/`: protótipo web existente em React, TypeScript, Three.js e React Three Fiber.
- `discovery/`: pesquisa de mercado, evidências e propostas de validação.
- `docs/`: contexto compartilhado, decisões e proposta de contrato entre aplicação
  e processamento 3D.
- `AGENTS.md`: acordo de trabalho entre as frentes do projeto.

Este protótipo não representa uma arquitetura de produção aprovada. A POC de
reconstrução com Apple Object Capture, Python/Swift e visualizador próprio está
em outro diretório local (`ImersivyFeshion3D`) e ainda não integra este repositório.
Os resultados dessa POC e suas limitações estão descritos no contexto compartilhado.

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
