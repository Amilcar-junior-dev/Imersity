# Imersity — contexto compartilhado

Atualização inicial: 23/10/2026. Mantido pelo chat **Executor**.

## Direção informada pelo usuário

Produto para visagistas e salões. A frente de discovery investiga valor e
viabilidade B2B com análise por fotos, consultoria e dossiês, sem depender de 3D.
A POC 3D/XR investiga uma experiência adicional com avatar e troca de cabelo.
O usuário criará outro chat para a aplicação real com base no discovery.
Ainda não há decisão de lançamento, preço validado ou arquitetura de produção.
Recorte inicial definido pelo usuário ao Discovery: visagistas especializados que
já vendem consultorias, no Brasil. O contexto de salões é mais amplo; referências
internacionais servem de comparação. Não avaliar rentabilidade B2C nesta etapa.

Refinamento explícito posterior do usuário, em 23/10/2026: produto premium para
profissionais já consagrados; estudar experiência, percepção de valor e inovação,
sem reduzir a tese à economia de tempo ou tratar concorrência como impedimento.
3D/MR permanece aposta de diferenciação, com núcleo comercial independente.

## Responsáveis e leitura inicial

| Frente | Chat | Fonte principal | Próxima entrega conhecida |
|---|---|---|---|
| Discovery e negócio | Discovery | `discovery/2026-10-23-discovery-b2b-sem-3d.md` | Validar hipóteses com profissionais e evidências de uso/compra |
| Reconstrução, cabelo e XR | Executor | Este contexto, contrato e `poc-3d/docs/` | Testar nova pessoa quando o usuário fornecer captura; padronizar preparação |
| Produto e aplicação | Ainda não criado pelo usuário | Discovery, decisões e contrato | Definir implementação a partir das necessidades validadas |

Referências locais de chats, não credenciais:

- Executor: `01a160a4-2e82-70d2-b07c-a13c0edc2857`.
- Discovery: `01a169a5-cb6c-7312-8558-da788570a8e0`.
- Ambos os chats atualmente usam este diretório. A associação na sidebar pode ser
  diferente; a leitura efetiva dos arquivos é o que compartilha esta documentação.

## Estado do discovery — resumo, não aprovação de escopo

A pesquisa documental inicial vê uma hipótese B2B de produtividade e autoria do
profissional: entrevista, análise revisável, apresentação, dossiê e ficha de execução.
Há concorrentes; análise automática + PDF não foi demonstrada como diferencial.
Preços, pilotos, metas e margens no estudo são referências ou propostas, não
resultados comerciais do Imersity. O usuário ainda fornecerá dados de discovery.
Não substituir a pesquisa original por este resumo nem anunciar hipóteses como fatos.
O Discovery revisou os documentos de coordenação em 23/10/2026 e registrou as
precisões em `discovery/ALINHAMENTO_ENTRE_FRENTES.md`, sem conflito material. Isso
não é aprovação de arquitetura nem verificação independente dos resultados 3D.

Em 23/10/2026, a pedido do usuário, o Discovery aprofundou a concorrência em
`discovery/2026-10-23-concorrentes-aprofundado.md` e preparou a matriz em
`discovery/2026-10-23-matriz-funcional-concorrentes.md`. Novos achados incluem
ImagiGO, VisageClub e VisaLab. Revisão/aprovação, entrevista, histórico e orientação
de execução já aparecem em ofertas; produtividade/autoria não é exclusividade
demonstrada. A matriz distingue anúncio, amostra pública e disponibilidade não
verificada. Próximo confronto com o Imersity ainda não foi executado; não tratar
essas capacidades como backlog ou vantagens já validadas. Não houve compra,
login, envio de fotos pessoais ou implementação nesta pesquisa.

A rodada premium está em `discovery/2026-10-23-modelo-premium-evidencias.md`, com
pesquisa AICI, ofertas brasileiras e casos de tecnologia profissional, e no plano
`discovery/2026-10-23-protocolo-validacao-premium.md`. A dificuldade de comunicar
valor encontrada na AICI reforça investigar consulta/apresentação; dados históricos
de consultoria de imagem não representam isoladamente especialistas premium.
Casos internacionais sustentam investigar visualização, sem quantificar o efeito
esperado do Imersity. Prioridades, desenho de teste e modelos de licença são
propostas, sem entrevistas, compras ou implementação realizadas nesta rodada.

Em 23/10/2026, após pedido de estruturação funcional, o Discovery sintetizou a
proposta em `discovery/2026-10-23-estrutura-funcional-premium.md`: preparação,
análise revisável, construção visual, apresentação, dossiê/execução, acompanhamento
e camada 3D/MR. Inclui recorte de piloto e critérios de aceite propostos. Não é
backlog integral aprovado nem auditoria do protótipo; próximo confronto deve
classificar capacidades existentes e verificar os fluxos com especialistas.

## Estado da validação 3D — observado nesta POC

- Captura de uma pessoa (Junior), com quadros extraídos de vídeo. Equipamentos
  informados: MacBook Air M2/24 GB e Moto Edge Plus; Quest 3 ainda não disponível.
- Reconstrução multivista com Apple Object Capture/RealityKit via Swift, orquestrada
  por Python. O navegador captura/importa e exibe; reconstrução atual roda no Mac.
- Preparação da cabeça em Python/NumPy/Pillow: recorte assistido, proteção do rosto
  e orelhas, couro cabeludo oculto estimado. Há coordenadas específicas da captura.
- Penteado Sintel importado: 11.400 curvas de 16 pontos. A revisão v2 acrescenta
  16.000 fios curtos estimados para implantação e divisão; não são fios medidos da pessoa.
- Exibição com Three.js 0.186.1/WebGL e shader próprio de fitas voltadas à câmera,
  apoiado em material MIT de Create Game Characters. GLB com dados adicionais.
- Teste v0.6.7: troca, cor, rotação e comparação com encaixe anterior verificadas.
  Buffer/accessors da captura preservados; 24 testes JS, 18 Python e verificação
  específica dos vínculos passaram. Isso não mede fidelidade anatômica ou realismo.
- O usuário considerou o resultado em evolução satisfatória. Persistem falhas
  visuais. Não há validação de automação entre pessoas, escala métrica, desempenho
  no Quest, custo por cliente ou operação comercial.
- Avatar ajustado: aproximadamente 941 mil triângulos visíveis; GLB com alternativas
  de cerca de 141 MiB. São custos de experimento, não orçamento de produção aprovado.

## Onde estão as coisas — não confundir projetos

| Local | Conteúdo e estado |
|---|---|
| Raiz deste repositório `Imersity3D` | Protótipo React 18/TypeScript/Vite 6/Three.js 0.170.x/R3F, com serviços fal.ai e tipos de visagismo; documentos compartilhados e discovery. Histórico enviado ao repositório GitHub Imersity em 23/10/2026 |
| `poc-3d/` neste repositório | Código da POC 3D v0.6.7: `backend/`, `native/`, `scripts/`, `web/`, testes, docs, Sintel e atribuições. Referência de desenvolvimento/versionamento desde a consolidação de 23/10/2026. Não integrada ao protótipo React |
| `/Users/junioroliveira/Documents/Junior/ProjetosSoftware/ImersivyFeshion3D` | Diretório de origem preservado com código anterior, ambientes, capturas e serviço local existente. Novas mudanças de código devem ocorrer em `poc-3d/`; o serviço já aberto não foi reiniciado pela importação |
| `/Users/junioroliveira/Documents/Codex/2026-10-21/q/outputs` | Artefatos locais privados e relatórios. Não publicar nem copiar para `public/` |
| `http://localhost:4180/` | Endereço local usado pela POC. Não é endereço de produção nem integração de API estável |

Artefato atual: `Imersity_cabelo_referencia_Sintel_v2.glb`.
SHA-256: `ea9cee4fc01869f6a3f1e3a5a4a37e5ca5ba883d99bb8a2a33b61ca5ff6ea692`.
Relatório: mesmo nome com `_verificacao.json`, no diretório de outputs.
Documentação técnica versionada: `poc-3d/docs/AJUSTE_RAIZ_SINTEL_V2.md`.

## O que precisa conversar entre as frentes

1. Quantas imagens e quanto esforço de captura o público aceita? Discovery fornece
   evidência; 3D verifica o que a técnica consegue com essa entrada.
2. Quanto tempo, custo e retrabalho são toleráveis? Medir; não prometer instantâneo.
3. Como o produto acessará o avatar? Contrato versionado com dados, estado de revisão,
   proveniência e perfil de renderização; detalhes em `CONTRATO_3D.md`.
4. GLB + shader: teste obrigatório antes de levar material da POC ao React/R3F atual.
5. Que decisão é final? Consulte `DECISOES.md`; sugestões permanecem propostas.
6. O núcleo sem 3D não exige vídeo/80 quadros. Protocolos de captura, estados de
   revisão e custos do dossiê, simulação 2D e avatar devem permanecer distinguíveis.

## Fluxo de atualização

Ao retomar: ler o acordo e contexto; consultar a fonte da frente afetada. Ao concluir:
registrar resultado verificado, limitações e impacto para as outras frentes. Mensagem
curta de coordenação pode apontar os arquivos; o documento versionado fica como memória.
Não há sincronização automática de históricos nem acompanhamento em segundo plano.

Entrada para o futuro chat da aplicação:

> Trabalhe no Imersity como responsável pela aplicação. Leia AGENTS.md,
> docs/CONTEXTO_COMPARTILHADO.md, docs/DECISOES.md, docs/CONTRATO_3D.md e o discovery
> citado antes de definir arquitetura. O núcleo deve funcionar sem 3D; a camada 3D
> continua experimental. Confira a implementação existente e proponha o adaptador
> antes de assumir que os GLBs e shaders da POC funcionam na stack atual.
