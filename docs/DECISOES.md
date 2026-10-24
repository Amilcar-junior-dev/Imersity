# Decisões e propostas entre frentes

Criado em 23/10/2026. Distinguir direção dada pelo usuário, proposta e implementação.
Nova decisão deve informar data, autor/frente, evidência, impacto e o que substitui.
Não apagar registros para ocultar mudança de direção. O usuário resolve conflitos
de prioridade; escolhas rotineiras compatíveis com o escopo podem avançar sem rodada
de aprovação. Não transformar revisão entre frentes em bloqueio para tarefas isoladas.

| ID | Estado | Registro | Origem / impacto |
|---|---|---|---|
| D-001 | Direção do usuário | Três frentes coordenadas: discovery, validação 3D/XR e aplicação a ser criada em outro chat | Pedido neste chat em 23/10/2026; nenhuma frente decide sozinha o trabalho das outras |
| D-002 | Direção do usuário ao Discovery | Validar negócio B2B sem depender de 3D; 3D/XR como camada adicional | Mensagem do usuário ao Discovery e estudo citado no contexto. Preservar valor do núcleo mesmo se 3D estiver indisponível |
| D-004 | Recorte do usuário confirmado pelo Discovery | Comprador inicial: visagista especializado no Brasil; não avaliar rentabilidade B2C nesta etapa | `discovery/ALINHAMENTO_ENTRE_FRENTES.md`. Não confundir público amplo do produto com segmento inicial |
| D-005 | Refinamento explícito do usuário ao Discovery, 23/10/2026 | Estudar produto premium para profissionais estabelecidos, priorizando experiência, percepção de valor e inovação; 3D como aposta de diferenciação sem dependência do núcleo | Refina D-004 e a ênfase da pesquisa inicial. Economia de tempo é um benefício possível, não a única tese. Evidências em `discovery/2026-10-23-modelo-premium-evidencias.md` |
| D-003 | Acordo de trabalho registrado por Executor | Arquivos deste repositório serão a referência compartilhada; cada frente atualiza sua evidência e impactos | Concretiza D-001. Compartilhar pasta não equivale a memória automática entre chats |
| P-001 | Proposta técnica inicial, não implementada | Separar processamento 3D do produto por adaptador e pacote de avatar versionado | `CONTRATO_3D.md`; linguagens podem diferir sem duplicar clientes/dossiês |
| P-002 | Proposta a verificar na integração | Reusar navegador/WebGL e shader da POC através de módulo compatível com a aplicação | Há versões distintas de Three.js: 0.186.1 na POC e faixa 0.170.x no protótipo atual. Testar ou adaptar; não fazer upgrade/migração automática |
| D-006 | Correção de versionamento solicitada pelo usuário, 23/10/2026 | Incluir o código da POC 3D no repositório GitHub Imersity, em `poc-3d/`, preservando backend, Swift, preparação, visualizador, testes, documentação e licenças | O primeiro push incluiu apenas o protótipo React e documentos. Esta consolidação corrige a omissão; não aprova integração ou migração de stack. Capturas e avatares pessoais ficam fora do Git; novas alterações da POC devem ocorrer na pasta versionada |
| D-007 | Restrição explícita posterior do usuário, 24/10/2026 | Novos envios ao GitHub exigem consentimento do usuário para o envio em questão | Limita futuras publicações de todas as frentes. D-006 não constitui autorização permanente de push. Trabalho local e revisão podem continuar |
| D-008 | Correção de direção pelo usuário, 24/10/2026 | Refazer o 3D a partir das fotos, ajustando a reconstrução para melhorar a cobertura ausente | O usuário rejeitou o recorte com apoio posterior como piora visual. A frente 3D refez a reconstrução com máscaras por imagem; registro em `poc-3d/docs/RECONSTRUCAO_COBERTURA.md`. Não aprova preenchimento manual nem arquitetura comercial |
| D-009 | Limpeza autorizada pelo usuário e executada, 24/10/2026 | Remover vídeo, quadros e modelos da segunda captura que será refeita; manter somente registros técnicos sem mídia para comparação | Mídias identificadas foram para a Lixeira, experimento do navegador ficou vazio e capturas anteriores de Junior foram preservadas. Trabalhos antigos dessa segunda captura não estão mais disponíveis na POC ativa; não restaurar sem pedido do usuário |

## Questões abertas com responsável

Proposta funcional do Discovery, 23/10/2026:
`discovery/2026-10-23-estrutura-funcional-premium.md`. Traduz D-005 em jornada,
capacidades, recorte de piloto e critérios de aceite candidatos. Destino: discussão
de produto e futura frente da aplicação. Não escolhe stack nem declara recursos
implementados; não muda o contrato ou a prioridade técnica da frente 3D.

| Questão | Frente que produz evidência | Outra frente afetada |
|---|---|---|
| Público, dor, rotina e disposição a pagar | Discovery | Aplicação e 3D, para custo/tempo/captura |
| Requisitos reais do primeiro produto | Discovery + usuário | Aplicação |
| Captura viável e repetibilidade em outras pessoas | 3D/XR | UX de captura e operação |
| Material, desempenho e formato do pacote de avatar | 3D/XR + aplicação | Custos, publicação e experiência |
| Backend, banco, hospedagem, autenticação e fornecedores finais | Aplicação, com requisitos e limites das outras frentes | Não definidos por este documento |

## Registro de coordenação

- 23/10/2026 — Discovery analisou layout e organização das referências públicas em
  `discovery/2026-10-23-analise-layout-referencias.md`. Destino: futura especificação
  da aplicação e design da oferta. Recomendações são propostas, sem sistema visual
  aprovado, auditoria dos painéis autenticados ou alteração do código do produto.

- 23/10/2026 — Executor corrigiu a omissão da POC no primeiro envio ao GitHub.
  Importou a v0.6.7 para `poc-3d/`, verificando igualdade dos fontes com a origem,
  e preservou as atribuições do Sintel e do shader. Na pasta consolidada passaram
  24 testes JS, 15 de backend, 18 de preparação e o build web. Os testes de backend
  usaram o venv local existente; os de preparação usaram o Python científico
  disponível, pois o venv do backend não tinha NumPy. Capturas, avatares pessoais,
  dependências instaladas e caches não são versionados. Serviço em execução e
  diretório de origem preservados; próximas alterações da POC devem ocorrer aqui.
- 23/10/2026 — Executor leu o estudo de discovery e inspecionou a stack deste
  repositório. Criou acordo, contexto e proposta de contrato sem alterar o código
  do protótipo nem mover a POC ou dados privados.
- 23/10/2026 — Executor enviou ao chat Discovery o contexto e os caminhos dos
  documentos, solicitando revisão registrada em arquivo. Envio confirmado pela
  ferramenta. Leitura, conclusão da revisão e aceite de propostas não são presumidos.
- 23/10/2026 — Discovery concluiu a revisão e criou
  `discovery/ALINHAMENTO_ENTRE_FRENTES.md`. Executor leu o registro e incorporou ao
  contexto/contrato o recorte de público e a distinção de protocolos, custos e
  revisão. Não houve aprovação de API/stack nem alteração de código da aplicação.
- 23/10/2026 — Discovery aprofundou o levantamento funcional por pedido do usuário.
  Perfis/fontes em `discovery/2026-10-23-concorrentes-aprofundado.md`; matriz para
  confronto posterior em `discovery/2026-10-23-matriz-funcional-concorrentes.md`.
  Encontradas ofertas explícitas de revisão profissional e fluxo de consultoria;
  registrar tais recursos como hipóteses de paridade, não diferenciais exclusivos.
  Pesquisa pública, sem testes internos pagos; nenhuma mudança de escopo aprovada.
- 23/10/2026 — Discovery pesquisou o modelo premium a pedido do usuário. Registrou
  evidências e limitações em `discovery/2026-10-23-modelo-premium-evidencias.md` e
  definições de métricas/desenho proposto em
  `discovery/2026-10-23-protocolo-validacao-premium.md`. Direção comercial D-005
  não transforma prioridades propostas em requisitos aprovados. Nenhuma mensagem
  externa, compra, pesquisa com participantes ou alteração de implementação.
