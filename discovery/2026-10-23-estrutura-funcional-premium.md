# Imersity — proposta de estrutura funcional premium

23/10/2026. Síntese dos estudos existentes, preparada após o pedido do usuário de estruturar as funcionalidades. É uma proposta de produto para discussão e teste; não descreve capacidades já implementadas nem aprova todo o escopo para desenvolvimento.

## Direção do produto

Uma plataforma de consultoria visual para o profissional de visagismo apresentar seu método, construir uma transformação com o cliente e entregar um plano claro de execução e manutenção. Comprador inicial: especialista estabelecido no Brasil.

Jornada principal: **preparar caso → analisar e revisar → construir alternativas → apresentar e escolher → entregar plano → acompanhar resultado**.

Premium deve aparecer na qualidade dessa jornada: fidelidade visual, clareza, controle do especialista e acabamento da apresentação. Quantidade de módulos não substitui esses atributos.

## 1. Preparação do atendimento

**Funcionalidades:** cadastro e histórico básico do cliente; entrevista sobre objetivo de imagem, preferências, rotina e manutenção; registro profissional de características e restrições capilares; envio orientado de fotos; checagem de qualidade com possibilidade de solicitar nova imagem.

**Primeira entrega:** formulário editável pelo profissional, fotos e observações vinculados a um caso. Fotografias frontais e laterais conforme necessidade do serviço, sem exigir captura de avatar.

**Critério de aceite:** o profissional consegue entender o objetivo e as restrições do caso antes de gerar recomendações. Informações ausentes ficam visíveis, sem preenchimento automático apresentado como fato.

## 2. Análise facial e capilar assistida

**Funcionalidades:** apoio visual à análise de proporções e características observáveis; anotações sobre cabelo/barba; recomendações com justificativa relacionada ao objetivo do cliente; edição e aprovação profissional.

**Primeira entrega:** análise em rascunho, editável por seção, com separação entre observação, sugestão da IA e conclusão aprovada. Marcações visuais úteis, sem assumir medidas físicas a partir de fotografias não calibradas.

**Evolução:** correção de pontos faciais se esse controle for necessário nos testes; modelos de análise e terminologia configuráveis conforme o método do especialista.

**Critério de aceite:** uma correção relevante atualiza ou sinaliza como pendentes as recomendações e entregas dependentes. O sistema não pode manter conclusões contraditórias silenciosamente.

## 3. Construção visual da transformação

**Funcionalidades:** simulações na foto do cliente; alternativas de corte, comprimento, volume, cor e barba conforme o serviço; referências; comparação entre original e propostas; seleção de uma versão aprovada.

**Primeira entrega:** poucas alternativas úteis, com revisão e descarte pelo profissional. Edições precisam preservar a identidade e as áreas que não deveriam mudar; controle por parâmetro é uma capacidade a testar, não presumida.

**Evolução:** biblioteca própria de referências e iterações mais localizadas. Avaliação de cor por foto deve explicitar condições de captura e alcance; análise cromática completa não entra automaticamente no primeiro escopo.

**Critério de aceite:** a imagem representa a proposta descrita e ajuda na decisão. O profissional valida viabilidade e manutenção; simulação não equivale a previsão exata do resultado físico.

## 4. Apresentação premium durante a consulta

**Funcionalidades:** modo de apresentação com a marca do especialista; comparação de opções; explicação visual dos motivos, manutenção e compromissos de cada escolha; anotações e registro da decisão conjunta.

**Primeira entrega:** apresentação em tela derivada do caso revisado, com identidade visual básica e navegação limpa. O cliente consegue visualizar alternativas sem receber rascunhos internos por engano.

**Critério de aceite:** ao final, o cliente consegue explicar a opção escolhida, uma razão da recomendação e o cuidado exigido. Avaliar essa compreensão, além da avaliação estética da interface.

## 5. Dossiê e plano de execução

**Funcionalidades:** dossiê editável com marca, análise aprovada, imagens selecionadas, recomendação e manutenção; ficha técnica para o executante; exportação em PDF e entrega por link privado.

**Primeira entrega:** um modelo de apresentação bem acabado, com personalização delimitada. Documento para cliente e ficha técnica são duas vistas da mesma proposta aprovada.

**Critério de aceite:** textos e imagens concordam entre si; a ficha é compreensível por outro profissional; uma alteração posterior exige revisão antes de republicar. Registrar a versão entregue e permitir revogar seu link.

## 6. Acompanhamento e autoria profissional

**Funcionalidades:** recuperar o combinado no retorno; registrar o resultado executado e ajustes; comparar proposta e resultado; manter preferências e histórico de versões; aplicar a identidade do profissional.

**Primeira entrega:** histórico simples, registro do realizado e configuração de marca/assinatura. A aprovação da proposta e o registro da execução são eventos distintos.

**Evolução:** lembretes de retorno, biblioteca e modelos próprios, equipe com papéis e configuração mais profunda do método. Priorizar conforme os parceiros realmente usam.

**Critério de aceite:** um novo atendimento recupera o que foi recomendado, o que foi realizado e o que o cliente relatou, sem depender da memória do especialista.

## 7. Experiência 3D e realidade mista

**Funcionalidades candidatas:** avatar do cliente, visualização de ângulos, troca de cabelo/cor e comparação; depois, experiência em realidade mista quando tecnicamente adequada.

**Tratamento:** experimento paralelo ao núcleo. Captura adicional e processamento aparecem apenas quando o profissional escolhe essa experiência. O atendimento segue com fotos se o avatar não estiver disponível.

**Critério para incorporar à oferta:** melhora observável na compreensão ou preferência, qualidade aprovada, esforço de captura e custo compatíveis com a compra profissional. Comparar foto, 3D em tela e realidade mista separadamente. A POC atual ainda não comprova integração nem operação entre diferentes pessoas.

## Recorte recomendado para o primeiro piloto pago

Entregar uma consultoria completa com preparação, análise revisável, simulação em foto, apresentação, dossiê/ficha e histórico simples. Incluir marca básica do profissional desde o início. Restringir os tipos de transformação àqueles com qualidade verificada, em vez de prometer um catálogo amplo.

A primeira versão pode usar preparação e revisão assistidas pela equipe, registrando tempo e custo. Isso permite testar a experiência antes de automatizar todo o processo. Automação completa não deve ser condição para aprender, nem esforço manual ficar oculto no cálculo de margem.

Fundação necessária: acesso privado aos casos, separação entre contas profissionais, controle de compartilhamento, exportação/exclusão e registro de consumo/custo por caso. Detalhes técnicos e operacionais ficam para a especificação da aplicação.

Depois do piloto: aprofundar configuração do método, biblioteca, acompanhamento e equipe conforme uso e renovação. Agenda completa, financeiro de salão, marketplace, rede social e consultoria B2C direta ficam fora do foco inicial.

## Onde buscar diferenciação

| Hipótese | Comportamento concreto do produto | Como verificar |
|---|---|---|
| Controle profissional com coerência | Corrigir uma análise altera ou invalida as saídas dependentes | Casos de correção sem contradição final |
| Simulação confiável para decidir | Alterar o cabelo preserva a pessoa e respeita a proposta | Avaliação de cliente/executante e tentativas até aprovação |
| Consulta que comunica valor | Alternativas e justificativas ficam claras na apresentação | Compreensão, escolha e preferência pelo atendimento |
| Continuidade entre consulta e execução | Plano aprovado, ficha e resultado ficam vinculados | Dúvidas, divergências e uso no retorno |
| Adequação à assinatura do especialista | Marca, linguagem e modelos refletem sua prática | Adoção em novos casos, pagamento e renovação |

São hipóteses de vantagem de execução e adequação ao público, sem alegação de exclusividade. A matriz já encontrou ofertas concorrentes com simulação, revisão, histórico e marca própria.

## Base e próximo trabalho

- Evidências e limites: [estudo premium](2026-10-23-modelo-premium-evidencias.md).
- Paridade e lacunas não verificadas: [matriz concorrente](2026-10-23-matriz-funcional-concorrentes.md).
- Medição de valor e compra: [protocolo de validação](2026-10-23-protocolo-validacao-premium.md).
- Limites de integração: [contrato 3D proposto](../docs/CONTRATO_3D.md).

Próximo trabalho: confrontar esta proposta com os fluxos reais dos especialistas e auditar o protótipo existente para classificar cada capacidade como utilizável, parcial, experimental ou ausente. Só então estimar construção. Não houve auditoria do código, implementação, entrevista ou novo teste de mercado nesta estruturação.
