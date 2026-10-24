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

Em 23/10/2026, o Discovery inspecionou visualmente os oito sites de referência,
o relatório público da ImagiGO e a entrada do editor YouCam. Análise e capturas em
`discovery/2026-10-23-analise-layout-referencias.md` e
`discovery/evidencias-layout-2026-10-23/`. A recomendação separa página comercial,
estúdio profissional e entrega ao cliente. Não houve login, envio de foto ou teste
de geração; composição proposta ainda depende de teste de uso e responsividade.

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


## Atualização 3D/XR — segunda captura, 23/10/2026

A importação de um segundo vídeo somou 80 quadros novos aos 80 anteriores, gerando
uma reconstrução com origens misturadas. Executor recuperou os 80 quadros novos
pelo manifesto, preservando seus bytes e todos os arquivos anteriores. A nova
reconstrução em Médio concluiu em 382,1 s no M2; USDZ de 26,1 MiB/49.999 triângulos,
com 24 imagens ignoradas pelo reconstrutor. A vista frontal foi conferida; ainda
há fundo e a qualidade/cobertura precisa de avaliação. Isso não valida recorte ou
transferência de cabelo para a segunda pessoa.

A POC v0.6.8 bloqueia somar outro vídeo ao experimento, verifica origens no navegador
e backend e impede repetir capturas antigas misturadas. Há botão Novo experimento
na página de capturas. Passaram 27 testes JS, 18 de backend e o build; o bloqueio
HTTP 400 também foi verificado no serviço reiniciado. Registro detalhado em
`poc-3d/docs/ISOLAMENTO_CAPTURAS.md`. Serviço atual em `http://localhost:4181/`.
Capturas/avatares privados permanecem em `poc-3d/data/`, fora do Git. A aplicação
React e o contrato continuam sem alteração. Próximo passo: avaliar a captura isolada
antes de preparar a cabeça e o cabelo para ela.

## Atualização 3D/XR — limpeza inicial da segunda captura, 24/10/2026

A inspeção posterior confirmou uma abertura extensa na única malha do USDZ.
Foi gerada uma versão privada recortada (31.135 triângulos originais; 5.497 da
região facial protegida mantidos) e uma comparação com apoio posterior estimado
em laranja, separado da captura. Ainda há resíduos claros; o apoio não está
soldado à borda e não recupera anatomia/cabelo ausente. Não declarar fechamento
definitivo ou cabeça pronta para troca de cabelo. Detalhes e verificação em
`poc-3d/docs/LIMPEZA_SEGUNDA_CAPTURA.md`; dados privados permanecem em `data/`.
Não há mudança de contrato ou integração com a aplicação. Próximo passo:
refinar bordas e transição, preservando rosto/orelhas, e avaliar a cobertura dos
quadros ignorados. O usuário determinou que novos envios ao GitHub dependem de
consentimento explícito para o envio em questão. Esta rodada ficou somente local.

Correção posterior do usuário nesta mesma data: considerou o resultado de recorte
e apoio pior e esclareceu que deseja **refazer a reconstrução a partir das fotos**
com ajustes para a cobertura ausente. O apoio estimado não foi aprovado como
solução. A rodada seguinte deve usar os quadros originais, não o GLB reparado.

## Atualização 3D/XR — reconstrução das fotos com máscaras, 24/10/2026

Executor refez o 3D das cópias verificadas dos 80 quadros originais, sem usar
remendos ou modelos recortados como entrada. Primeiro, máscara automática +
alinhamento não sequencial em Médio terminou em 261,3 s, mas manteve as mesmas
24 amostras ignoradas e a falha posterior. Depois forneceu máscaras explícitas
da pessoa por Apple Vision em cada `PhotogrammetrySample`, preservando o RGB.
Essa execução terminou em 404,2 s; USDZ de 25,9 MiB/49.999 triângulos, textura 4K,
com 10 amostras ignoradas. Frente, perfis e nuca em Cor sem luz e nuca em Escultura
foram inspecionados: a grande abertura/faixa clara posterior deixou de aparecer.

Restam irregularidades no topo, pontas do cabelo, pescoço e busto. Não se trata de
fidelidade métrica validada, recorte de cabelo ou transferência de penteado para
a segunda pessoa. Detalhes em `poc-3d/docs/RECONSTRUCAO_COBERTURA.md`. Novos perfis
internos `recovery`/`person-recovery` não estão no seletor; serviço existente exibe
os resultados, mas precisa reiniciar para novas submissões desses perfis por API.
Passaram 21 testes de backend, dois do runner e a compilação Swift. Artefatos e
80 máscaras ficam em `data/`, fora do Git. Nenhum push ou upload externo.
Não houve mudança do contrato, núcleo React ou definição de fornecedor comercial.

## Atualização 3D/XR — defeito no pescoço, 24/10/2026

O usuário identificou uma curva artificial na junção cabelo/nuca/pescoço. Executor
confirmou que também aparece em Escultura; revisão amostral das fotos mostra nuca
encoberta e variações de enquadramento, sem isolar uma causa única. Testou nova
reconstrução `person-head`, mesmas 80 fotos, máscaras idênticas byte a byte,
textura 4K, teto de 500 mil polígonos e exclusão da parte inferior do volume.
Produziu 249.999 triângulos em 362,9 s, com os mesmos dez IDs ignorados. A deformação
persistiu em Cor sem luz e Escultura: **não está resolvida por aumentar detalhe**.

Registro em `poc-3d/docs/EXPERIMENTO_PESCOCO.md`. Próximo teste proposto: captura
da cabeça-base com nuca e orelhas expostas e posição estável, para investigar o
efeito da oclusão/alinhamento. Não é protocolo geral aprovado nem garantia de
resultado. O perfil é interno e não foi adicionado ao seletor. Passaram compilação
Swift, 22 testes de backend e dois do runner. Originais/resultados anteriores
preservados; dados privados fora do Git; nenhum push, upload ou mudança de contrato.

## Limpeza autorizada da segunda captura — 24/10/2026

O usuário vai refazer o vídeo e autorizou remover o material da captura com cabelo
solto. Executor moveu para a Lixeira o vídeo original localizado em Downloads,
seis trabalhos relacionados (incluindo o pacote misturado), o pacote de recuperação,
temporários nativos e imagens de diagnóstico identificadas. São 34 arquivos/pastas
de origem removidos dos locais ativos, com recuperação possível pela Lixeira.
Os 80 quadros da primeira pessoa presentes no pacote misturado foram previamente
conferidos por hash contra outra captura preservada. Sete trabalhos anteriores,
o vídeo e o GLB anteriores de Junior permanecem nos locais originais.

O cache do experimento na porta 4181 foi limpo pela interface. Verificação na
porta antiga 4180 e na atual 4181 mostrou referência genérica e zero imagens;
a API lista zero trabalhos salvos no diretório ativo desta POC. O laboratório foi
reaberto localmente nas duas portas, com 4181 como endereço principal, para deixar
o fluxo pronto para nova captura. Dados técnicos dos resultados anteriores continuam
nos documentos, mas as mídias desses testes não estão mais disponíveis em `data/`.
Não considerar links antigos de trabalhos como ativos nem tentar reutilizar seus
quadros sem recuperação expressamente solicitada pelo usuário.

Foram preservados código, parâmetros, testes e conclusões sem mídia pessoal para
comparação técnica. Relatório de movimentação/recuperação permanece em `data/limpeza/`,
ignorado pelo Git. Não houve commit, push ou envio de dados a terceiros.

## Nova captura com cabelo preso — 24/10/2026

O usuário refez o vídeo e concluiu a extração. Foi localizada uma captura salva
com uma única origem, 80 quadros 2160 × 3840 e nenhuma imagem de avaliação.
Amostras mostram coque, nuca e orelhas mais expostas. Já havia um resultado
Médio sem máscaras, concluído em 614,7 s/49.999 triângulos/textura 4K; ainda
incorporou fundo junto ao cabelo. Executor iniciou outra reconstrução local
com cópias verificadas dos mesmos quadros e máscaras explícitas de pessoa,
perfil `person-recovery`, preservando o primeiro modelo. A inspeção e conclusão
ficam pendentes do processamento. Registro em `poc-3d/docs/NOVA_CAPTURA_PRESA.md`.

O seletor web agora oferece **Pessoa · máscaras + Médio (experimental)** quando
o backend anuncia suporte. Os 27 testes JS e o build passaram. Isso expõe o
perfil já existente; não segmenta cabelo, não implementa o contrato proposto nem
altera o núcleo React. Dados privados permanecem fora do Git. Sem commit/push.

Conclusão desta comparação: máscaras + Médio terminaram em 1.626,3 s
(27,1 min), 2,65 vezes o tempo do Médio sequencial desta captura, com 49.999
triângulos e textura 4K. Originais/cópias conferidos, nenhum evento de amostra
ignorada registrado. Frente, perfis e nuca foram inspecionados: grandes resíduos
de fundo desapareceram, mas irregularidades no pescoço e atrás das orelhas
continuam visíveis em Escultura. Não declarar o pescoço resolvido nem qualidade
hiper-realista. O usuário confirmou que a pessoa girou diante da câmera; giro
é uma abordagem possível, porém máscaras não corrigem mudanças de forma.
Não foi isolada a causa da demora/deformação. Detalhes no registro citado.
Próximo passo: revisar região útil da cabeça antes do preparo específico desta
pessoa; troca de cabelo e XR ainda não testados nela. Sem push ou envio externo.

## Revisão de geometria facial estruturada — 24/10/2026

Após persistirem deformações, o usuário perguntou sobre padrões anatômicos de
geradores 3D e personagens de jogos. Executor revisou FLAME, DECA, MetaHuman,
SIRA++ e um exemplo aberto de geração imagem→3D. Esses caminhos já apareciam na
pesquisa documental, mas não foram implementados/comparados com as capturas.
O ramo multivista atual não registra um template facial nem impõe parâmetros
anatômicos próprios; máscaras pessoa/fundo não equivalem a essa camada.

Proposta de próximo experimento: ajustar uma cabeça humana estruturada às mesmas
imagens e comparar forma/identidade com a fotogrametria, separando dados observados
e inferidos. Evidência e limites em `poc-3d/docs/MODELO_FACIAL_ESTRUTURADO.md`.
Sem novo código, reconstrução, upload, escolha de fornecedor ou mudança de contrato.

## Checkpoint autorizado — 24/10/2026

O usuário solicitou explicitamente commit e push do estado atual para garantir
o versionamento. Essa autorização vale para este envio; D-007 permanece para
os seguintes. Escopo: código e testes da POC, registros técnicos/compartilhados
e material público de pesquisa de layout produzido anteriormente pelo Discovery.
Capturas pessoais, vídeos, avatares, máscaras, perfis privados, ambientes e builds
continuam fora do Git. FLAME ainda é proposta, aguardando o arquivo do modelo.

Antes do checkpoint passaram 22 testes de backend, dois do runner, três de
limpeza sintética, 18 de preparação da cabeça/cabelo e 27 JS, além do build web
e compilação Swift. A suíte de preparação usa `PYTHONPATH=scripts` a partir de
`poc-3d/`. Essas verificações não certificam fidelidade anatômica ou XR. A revisão
de arquivos não encontrou credenciais pelos padrões conferidos; capturas de
layout foram identificadas como páginas/material públicos, sem sessão autenticada.
