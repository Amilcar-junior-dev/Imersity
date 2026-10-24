# Revisão de alinhamento — Discovery

Data: 23/10/2026. Escopo: revisão documental de coordenação, sem nova pesquisa, entrevistas ou implementação.

Documentos lidos: `AGENTS.md`, `docs/CONTEXTO_COMPARTILHADO.md`, `docs/DECISOES.md`, `docs/CONTRATO_3D.md` e `discovery/2026-10-23-discovery-b2b-sem-3d.md`.

## Parecer

Não identifiquei conflito material entre a direção registrada nos documentos compartilhados e as evidências do discovery. A separação proposta preserva o núcleo comercial sem depender de 3D/XR. Esta revisão não aprova arquitetura, API, fornecedor, preço, escopo de produção ou viabilidade comercial; tampouco verifica independentemente os resultados técnicos relatados pelo Executor.

## Precisões de negócio para as outras frentes

1. **Comprador inicial definido pelo usuário:** visagistas especializados que já vendem consultorias, no Brasil; referências internacionais são comparativas. Salões e barbearias pertencem ao contexto amplo do produto, mas não substituem esse recorte inicial. A frente de aplicação deve usar esse público como hipótese de trabalho até nova orientação ou evidência.
2. **Objetivo comercial:** validar se o profissional compra e volta a usar a ferramenta pela qualidade/produtividade da consultoria. O efeito UAU é parte da intenção do usuário, mas ainda não foi demonstrado como motivo suficiente para uma compra recorrente.
3. **Hipótese, não requisito validado:** entrevista, análise revisável, apresentação, dossiê e ficha de execução formam uma proposta inicial. Não há autorização implícita para construir todos esses módulos, nem evidência de que todos sejam indispensáveis. Priorizar a partir da observação do trabalho e do piloto.
4. **Diferenciação ainda aberta:** marca própria, PDF, análise facial, simulação e gestão de clientes já aparecem em ofertas concorrentes. Método configurável e revisão podem ser úteis, mas não foram comprovados como recursos exclusivos ou motivo de troca.
5. **Escopo econômico:** não avaliar rentabilidade B2C nesta etapa, conforme pedido explícito do usuário. Preços de consultorias ao consumidor são referências sobre o serviço vendido pelo comprador B2B; não validam sua disposição a pagar por software.
6. **Evidência atual:** apenas pesquisa documental. Ainda não houve entrevistas, testes pagos de concorrentes, piloto, renovação ou medição de economia de tempo. R$ 149/mês, pacote de R$ 99, margens e metas do estudo são hipóteses de experimento, não decisões comerciais.

Essas precisões complementam o resumo compartilhado; não alteram a pesquisa original nem substituem registros de decisões.

## Impactos na aplicação e no contrato 3D proposto

| Tema | Orientação de Discovery | Destino / estado |
|---|---|---|
| Captura | Não exigir vídeo/80 quadros para iniciar uma consultoria sem 3D. Fotos necessárias à análise 2D e captura de avatar têm finalidades e esforços distintos; os protocolos devem ser validados separadamente | Aplicação + 3D; consequência da independência do núcleo, não especificação final de UX |
| Dados de análise | Separar observações, interpretação profissional, preferências declaradas e saída simulada. Não converter escala normalizada de avatar em medida anatômica validada | Aplicação; compatível com a regra de coordenadas do contrato |
| Identidade e revisão | Preservar indicação de regiões estimadas e revisão do avatar, sem confundir esse estado com aprovação do dossiê ou consentimento para uso de imagem | Aplicação + 3D; detalhe proposto para futura modelagem |
| Custos | Medir separadamente produção do dossiê, simulações 2D, geração/adaptação do avatar e suporte. Núcleo não deve carregar custo obrigatório de geração 3D | Aplicação + 3D; insumo para teste de preço |
| Desempenho | 141 MiB/941 mil triângulos relatados são características de um experimento. Não representam requisitos aceitos pelo comprador nem viabilidade em celular/Quest | 3D + aplicação; orçamento e integração ainda abertos |
| Conteúdo | Cliente deve compreender quais imagens são propostas e o que o profissional considera executável. Renderização convincente não comprova adequação do corte ao cabelo real | Discovery + aplicação + 3D; hipótese de qualidade do atendimento |
| Integração | Adaptador e pacote versionado são coerentes com manter o 3D opcional. Não há necessidade comercial demonstrada de implementar essa integração antes de validar o núcleo | Aplicação + 3D; prioridade a combinar com o usuário |

Nenhuma dessas observações exige mudar agora a POC, sua linguagem, a versão de Three.js ou o contrato. A POC em `ImersivyFeshion3D` e o protótipo neste repositório permanecem distintos. Shader específico e GLB precisam de teste técnico antes de qualquer promessa de integração.

## Próxima evidência esperada

Discovery: observar consultorias reais com dados pessoais removidos, medir tempo/retrabalho e testar pagamento/renovação. A partir daí, informar à aplicação o problema prioritário e à frente 3D o esforço de captura, tempo de espera e custo tolerados. A proposta de entrevistar 12–15 profissionais e pilotar com cinco continua sendo um plano, não atividade já executada.

Mantidos sem alteração: código existente, pesquisa original, documentos compartilhados e decisões das demais frentes. O estado do repositório foi consultado; alterações prévias em código não pertencem a esta revisão. Único arquivo criado nesta atividade: este registro.
