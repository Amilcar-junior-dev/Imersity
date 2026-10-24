# Ligação entre produto e POC 3D/XR

Estado: **proposta 0.1**, criada em 23/10/2026 por Executor.
Este documento não descreve uma API implementada nem fixa a stack de produção.

## Separação de responsabilidades

- A aplicação mantém o fluxo de consultoria, cliente, entrevista, preferências,
  revisão profissional e dossiê. Esses fluxos devem funcionar sem avatar.
  Não exigir captura de vídeo para abrir o núcleo sem 3D nem gerar custo de avatar
  como condição para produzir o dossiê. O protocolo 2D será validado no discovery.
- O processamento 3D recebe uma captura e devolve artefatos e um relatório de
  qualidade. O motor atual é Object Capture no Mac; uma implementação futura pode
  mudar sem alterar o domínio do dossiê.
- Um adaptador da aplicação trata submissão, estado, falhas e acesso privado aos
  artefatos. SDKs/credenciais do fornecedor de reconstrução ficam atrás dessa
  fronteira; não fazer o domínio de consultoria depender de fal.ai ou RealityKit.
- O visualizador recebe o pacote e aplica seu perfil de material. WebXR é uma
  capacidade opcional a verificar no dispositivo; não requisito do núcleo.

React/TypeScript no produto e Python/Swift no processamento são compatíveis com
essa separação. Compartilhar contrato e assets não exige usar a mesma linguagem.
Integração, hospedagem, permissões e distribuição ainda precisam de implementação.

## Entrada e saída propostas

| Parte | Informação necessária | Estado atual |
|---|---|---|
| Entrada | Referência opaca ao caso/cliente; captura autorizada; versão do protocolo de captura; opções suportadas | Vínculo com o produto ainda não implementado |
| Processamento | Identificador do trabalho; estados de execução; erro legível; progresso somente quando real | A POC tem execução local própria; não assumir que seus endpoints são contrato de produção |
| Saída | Identificador e versão do avatar; acesso ao GLB; hash; proveniência; regiões estimadas; estado de revisão; perfil de renderização | Parte já existe em metadata/relatórios da POC; não está entregue como pacote de produção |
| Cabelo | Identificador/licença do penteado; cabeça compatível; parâmetros suportados; vínculos das raízes | Hoje há ajuste assistido específico para uma captura |
| Apresentação | Versão do material e dependências do visualizador; capacidades e fallback explícito | GLB sozinho não reproduz o cabelo atual |

Estados lógicos candidatos: aguardando, processando, requer revisão, disponível e
falhou. Não apresentar saída que requer revisão como qualidade já aprovada.
Revisão do avatar, aprovação profissional do dossiê e autorização de uso da imagem
são estados distintos. Custos de dossiê, simulação 2D, avatar e retrabalho também
devem poder ser medidos separadamente, conforme revisão do Discovery.
Nomes de campos, rotas e armazenamento serão definidos com a frente da aplicação;
não criar integrações assumindo que esta proposta já existe no backend.

## Regras de compatibilidade a preservar

1. **Dados de geometria não são o visualizador.** O GLB da POC carrega curvas
   representadas como fitas, atributos `_CENTER`, `_HAIRTANGENT`, `_WIDTH`, `_EDGE`
   e metadata `imersity`. Seu efeito depende do shader em tempo de execução.
2. **Material versionado.** Definir um perfil para esse material e um adaptador
   para o renderer do produto. Na integração inicial, comparar o mesmo arquivo na
   POC e no produto, de frente, lados e topo, com a mesma cor e luz controlada.
3. **Versões diferentes hoje.** POC: Three.js 0.186.1. Este protótipo: `three` e
   tipos na faixa 0.170.x, React/R3F. Não presumir compatibilidade de patches GLSL
   entre versões. Resolver com adaptação ou alinhamento testado, sem migração por suposição.
4. **Coordenadas explícitas.** A escala atual é normalizada e não foi calibrada
   como medida anatômica. Documentar unidades, eixos, origem e transformações do
   pacote antes de usar medidas ou encaixe entre capturas. Nada aqui valida medidas em mm.
5. **Identidade e estimativa separadas.** Distinguir geometria capturada, superfície
   inferida e cabelo de referência. Capacidade de renderizar não comprova fidelidade.
6. **Falha sem quebra do atendimento.** Se perfil de material, ativo ou dispositivo
   não for suportado, preservar consulta/dossiê e informar a indisponibilidade do
   3D. Não substituir silenciosamente o cliente por um avatar genérico.
7. **Artefatos privados.** Não colocar capturas e avatares reais em `public/`,
   commits ou fixtures públicas. Não passar fotos entre provedores como efeito
   colateral de um exemplo de integração. Acesso e exclusão farão parte do produto.
8. **Licenças por ativo.** Manter atribuição do Sintel (CC BY 3.0) e do shader
   (MIT); licença de código não substitui a dos modelos e texturas.

## Teste mínimo antes de declarar a integração pronta

- Importar um ativo de teste autorizado e carregar o perfil de shader compatível.
- Comparar geometria, cores, opacidade de raízes e silhueta na POC e na aplicação.
- Confirmar troca/cor, manejo de perfil ausente e estados de falha/revisão.
- Verificar continuidade do núcleo do produto quando o módulo 3D estiver desligado.
- Medir carregamento, memória e fluidez no dispositivo de destino. O modelo atual
  com alternativas é de cerca de 141 MiB/941 mil triângulos visíveis; precisa de
  orçamento e possível otimização antes de ser tratado como ativo de produção.
- Quest/XR e adaptação a uma segunda pessoa continuam validações separadas. Não
  marcar a integração como pronta apenas por o modelo abrir no desktop.

## Mudanças no contrato

Identificar o que muda, qual consumidor é afetado, a versão e como manter a leitura
dos ativos existentes. Registrar a proposta em `DECISOES.md` e comunicar à frente
afetada dentro da autorização de coordenação. Mudança que dependa de prioridade
comercial deve ser reconciliada com discovery e usuário; tarefas isoladas não
precisam esperar essa revisão.
