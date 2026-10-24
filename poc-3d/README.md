# Imersity Lab — POC v0.6.7

## Código versionado e primeira execução

Desde 23/10/2026, esta pasta `poc-3d/` é a referência de código da POC no repositório
Imersity. Ela inclui o backend, a ponte nativa, os scripts de preparação/verificação,
o visualizador, os testes e o cabelo de referência licenciado. Alterações futuras
devem ser feitas nesta pasta para que sejam incluídas nos commits.

O diretório local anterior `ImersivyFeshion3D` foi preservado, inclusive o serviço
que já estava em execução. Capturas, vídeos, avatares pessoais, ambientes virtuais
e arquivos compilados não acompanham o Git. Não há necessidade de apagar ou
transferir a captura original para versionar o código.

Em um clone novo, prepare o ambiente a partir desta pasta:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt -r scripts/requirements-headprep.txt
cd web
npm ci
npm run assets
npm run build
cd ..
.venv/bin/python scripts/launch.py
```

`npm run assets` recupera os modelos genéricos e WASM do MediaPipe usados na
referência de foto única; esses arquivos gerados ficam fora do Git. O cabelo
Sintel de referência e suas atribuições estão em `assets/reference-hair/`; o
shader e sua licença MIT estão em `web/src/vendor/`.

O início de reconstruções reais requer macOS, ferramentas Swift/Xcode e acesso
ao Metal. Os testes não substituem a verificação visual ou uma nova captura.
Os relatos abaixo preservam a evolução histórica da POC; arquivos de resultados
citados precisam ser fornecidos localmente e não estão publicados no repositório.

Para executar os testes a partir desta pasta:

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m unittest discover -s backend/tests -v
PYTHONPATH=.:scripts .venv/bin/python -m unittest discover -s scripts/headprep -p 'test_*.py' -v
cd web
npm test
```

Experimento de reconstrução de cabeça a partir de vídeo, com interface web e Apple Object Capture executado localmente no Mac. A fidelidade facial hiper-realista ainda precisa ser validada com capturas reais.

## Primeiro cabelo gerado na fal

O arquivo `Imersity_teste_cabelo_fal_01.glb` contém sua cabeça-base com o cabelo extraído do primeiro `model.glb`. Selecione **Cabelo fal · extraído do primeiro modelo** no painel de troca. A extração e o encaixe são assistidos; não houve chamada à fal ou consumo extra de créditos. Detalhes em `docs/EXPERIMENTO_CABELO_FAL_01.md`.

## Orelhas preservadas antes do recorte

A revisão do modelo `Imersity_cabeca_orelhas_v3.glb` recupera as bordas das orelhas a partir do scan original e recua o couro cabeludo estimado. Importe o arquivo novo e confira as vistas Perfil, Outro perfil e Nuca. Veja `docs/EXPERIMENTO_ORELHAS_V3.md`.

## Refinamento da cabeça-base por textura

A revisão do modelo `Imersity_cabeca_recorte_v2.glb` limpa resíduos nas têmporas com anotações distintas por lado e substituição local por superfície estimada. Importe o arquivo novo; atualizar a página não troca o modelo salvo. Veja `docs/EXPERIMENTO_RECORTE_V2.md`.

## Cabeça-base e cabelos separados (v0.6.1)

Foi preparado um GLB experimental a partir da captura de Junior: rosto central preservado, couro cabeludo estimado identificado em laranja e dois penteados procedurais simples (curto/chanel) para conferir troca, cor e encaixe. O painel aparece ao importar o arquivo do experimento. Não há segmentação automática ou cabelo hiper-realista validado; esta é uma preparação assistida específica desta captura.

Use o laboratório em `http://localhost:4180/`, atualize a página e importe `Imersity_cabeca_base_v061.glb` de Downloads. O link do trabalho antigo continua abrindo seu scan original. O experimento conserva os dois penteados ao exportar e mantém a geometria facial observada; as partes ocultas e transições permanecem estimadas. Detalhes e verificações em `docs/EXPERIMENTO_CABECA_BASE.md`.

## Inspecionar a qualidade sem reconstruir novamente

Atualize a página do laboratório (Cmd+R) e confira **POC v0.6.1**. O modelo salvo neste navegador é recarregado. Os controles em **Reconstrução 3D → Inspecione a forma** agora separam:

- **Cor sem luz:** fotografia reconstruída aplicada à malha, sem iluminação, reflexos ou mapas de detalhe acrescentados pelo visualizador. Sombras e reflexos já gravados na captura permanecem; não é remoção computacional da iluminação original.
- **Cor + forma:** cor com iluminação difusa sobre a geometria, sem normal/rugosidade/oclusão do scan nem brilho especular. Não cria profundidade.
- **Textura + luz:** materiais do scan com a correção de conversão de normais da v0.4, com preset **Suave · comparação** ou **Anterior · mais intensa**, direção e intensidade ajustáveis. O preset suave é o padrão.
- **Escultura:** geometria sem fotografia nem mapas de normal; use para conferir relevo e perfil.
- **Malha:** distribuição dos triângulos.

Esses controles alteram somente a apresentação. O arquivo de origem e os vértices são preservados. A v0.4 corrige a leitura do normal map padrão USD: o decode scale=2/bias=-1 não deve também amplificar o normalScale. GLBs antigos desta POC são reconhecidos pelos metadados e corrigidos na importação; o sinal Y usado pelo carregador é preservado. GLBs de outras origens não recebem essa correção automática. O GLB exportado incorpora os materiais corrigidos; os modos de inspeção não são gravados no material exportado. O relatório do experimento registra modo, preset e intensidade usados na inspeção.

Os testes locais de 22/10/2026 concluíram a reconstrução real no M2: Reduzido em 49,5 s; Médio em 74,4 s; Completo em 75,9 s. Médio e Completo usaram imagens idênticas. Consulte `docs/EXPERIMENTO_QUALIDADE.md` para achados e `docs/EXPERIMENTO_4K.md` para o teste controlado de resolução já executado.

## Próximo teste: relevo dos lábios (v0.5)

A malha 4K anterior tem 100 mil triângulos. O novo teste muda a reconstrução, sem subdividir o modelo pronto. Há dois perfis: **Geometria · limite de 500 mil polígonos** e **Cabeça · 500 mil + recorte da base**. Esse número é um teto, não uma promessa de contagem ou de fidelidade. Ambos pedem mapas de até 8K; displacement não é pedido, pois o visualizador não o aplica à geometria.

1. Encerre o serviço antigo com **Ctrl+C** no Terminal. Reabra **Iniciar Imersity.command**. Confira **POC v0.5** e a conexão disponível.
2. Em **Reconstrução no Mac**, escolha primeiro **Geometria · limite de 500 mil polígonos**. Abra **Reutilizar quadros já salvos no Mac**.
3. Selecione **IMG_4533.MOV · 2160×3840 · 80 quadros · full · 72500b** e clique em **Reconstruir os mesmos quadros**. São cópias sem nova compressão; o teste 4K anterior fica preservado.
4. Carregue o resultado e compare o perfil dos lábios em **Escultura**, com a mesma direção de luz. Mais triângulos sem volume melhor não contam como aprovação.
5. Repita a mesma origem com **Cabeça · 500 mil + recorte da base**, inicialmente **30%**. Esse recorte exclui a fração inferior do volume no eixo Y e mantém o restante. Não segmenta anatomicamente a cabeça. Reduza se atingir o queixo; não use se a captura estiver deitada/inclinada em outro eixo.
6. A ponte solicita os limites e a reconstrução na mesma sessão nativa, para manter as coordenadas consistentes. Os limites aplicados, configuração e vínculo com a captura de origem ficam em job.json/pipeline.log.

Implementação compilada, testes e interface verificados. **Atualização: o perfil custom gerou aproximadamente 250 mil triângulos em 3min26s; head-custom/30% gerou 249.999 em 4min32s. O corte da base foi confirmado e o queixo permaneceu visível, mas artefatos acima da cabeça persistem. Não foi demonstrada melhora adicional dos lábios com o recorte. A fidelidade e o uso de memória continuam sem medição.** O teto maior pode somente preservar ruído. Se os lábios continuarem lisos, a próxima comparação será uma captura curta e próxima da boca com expressão imóvel ou outro reconstrutor, sem presumir que mais polígonos recuperam informação ausente.

Consulte `docs/EXPERIMENTO_GEOMETRIA_CABELO.md` para os critérios de aprovação e a etapa de cabelos intercambiáveis.

## Iniciar e testar com seu vídeo

1. Abra **Iniciar Imersity.command** no Finder. Uma janela do Terminal inicia o serviço local e abre `http://localhost:4180` (ou outra porta livre até 4189).
2. Mantenha essa janela aberta. Em **Captura multivista**, selecione **Extrair de vídeo** e escolha o arquivo original do celular.
3. Comece com **80 quadros / 2K**. O navegador compara três candidatos por intervalo e escolhe o mais nítido segundo uma heurística. Não é necessário tirar as fotos manualmente. O vídeo não é enviado a uma nuvem.
4. Confira as miniaturas. Remova quadros borrados e reserve algumas vistas distintas como **Avaliação**. Esses arquivos ficam fora da reconstrução. Há um mínimo operacional de 20 imagens de treino; isso não garante cobertura suficiente.
5. Em **Reconstrução no Mac**, clique em **Verificar conexão**. O diagnóstico precisa indicar Object Capture disponível. Se estiver indisponível, a aplicação mostra a causa e não inicia um processamento fictício.
6. Selecione **Reduzido** no primeiro teste e clique em **Reconstruir captura**. Mantenha navegador e Terminal abertos. O progresso e as etapas vêm do reconstrutor nativo; a duração ainda precisa ser medida na sua captura.
7. Ao concluir, clique em **Carregar modelo reconstruído**. Compare **Cor sem luz**, **Textura + luz**, **Escultura** e **Malha**, girando para frente, perfis e nuca. Você pode baixar o USDZ original e exportar um GLB.

**Acesso à GPU:** o diagnóstico do processo do Codex continua sem Metal. As reconstruções reais anteriores foram executadas pelo serviço aberto no Terminal do usuário, com acesso ao Apple M2. Para carregar alterações do backend, encerre esse serviço com Ctrl+C e reabra o iniciador. Atualizar apenas o navegador não recarrega o Python.

Para encerrar o serviço, pressione **Ctrl+C** no Terminal. Os processos nativos ativos recebem encerramento. Resultados e capturas do serviço ficam em `data/<id>/`; limpar o experimento do navegador não apaga esses arquivos.

## Como gravar o primeiro vídeo

- Peça a outra pessoa para mover o celular ao redor da sua cabeça; mantenha cabeça, expressão, mandíbula e ombros tão imóveis quanto possível. Girar a própria cabeça muda a relação com o fundo e pode prejudicar o alinhamento.
- Use a câmera principal, sem zoom digital, modo retrato, filtros ou embelezamento. Se disponível no Moto Edge Plus, comece em **4K / 30 fps** com boa luz difusa.
- Faça uma volta suave em aproximadamente **30–45 segundos**, mantendo distância e enquadramento parecidos. Inclua rosto, orelhas, laterais e nuca; uma passagem um pouco mais alta ajuda a cobrir o topo. Cobertura e estabilidade importam mais que uma duração exata.
- Prenda o cabelo se o objetivo é avaliar rosto/orelhas. O que estiver coberto por cabelo não poderá ser observado diretamente.
- Transfira o **arquivo original** para o Mac, sem compressão de mensageiros. A POC aceita vídeos de até 3 minutos que o navegador consiga decodificar; MP4/H.264 é a opção inicial mais simples.

## O que está implementado

- Extração no navegador de 48, 80 ou 120 quadros, com limite de lado maior 2048 ou 3840 pixels. Seleção por variância do Laplaciano em uma miniatura: favorece nitidez relativa, mas não reconhece rosto, olhos fechados, cobertura angular ou movimento da pessoa.
- Serviço FastAPI local, conexão automática com token temporário, fila de um trabalho ativo e até três pendentes/ativos, validação de ZIP e isolamento das imagens de avaliação.
- Ponte Swift para **RealityKit PhotogrammetrySession**: ordenação sequencial, sensibilidade alta, máscaras automáticas desativadas; detalhe preview/reduced/medium/full, dois perfis experimentais customizados e saída USDZ. O sistema pode reduzir imagens automaticamente e emitir avisos de alinhamento incompleto.
- Progresso, etapas, erros e logs reais. Modelo disponível somente depois de arquivo de saída verificado.
- Three.js para visualizar USDZ/GLB, alternar materiais, inspecionar e exportar GLB. USDZ usa o USDLoader, incluindo suporte a USDC e texturas do pacote.
- Face aproximada de foto única via MediaPipe (468 vértices) como referência comparativa. Esse modo continua limitado à face, sem nuca, crânio, cabelo ou geometria métrica.
- Importação de Gaussian Splatting binário via Spark. Backend NVIDIA/COLMAP/Splatfacto preservado como experimento alternativo.
- Persistência no IndexedDB e exportação de pacotes com manifesto, metadados dos quadros e separação treino/avaliação. Token não é persistido.
- WebXR immersive-ar quando suportado pelo navegador/dispositivo; ainda sem validação física no Quest.

## Como interpretar o resultado

Object Capture reconstrói a cena observada, não um avatar facial especializado. O resultado pode incluir ombros e fundo, ter buracos, perder olhos/dentes, suavizar pele ou falhar ao alinhar imagens. Não há recorte automático da cabeça, separação de cabelo, criação de couro cabeludo oculto ou rig facial nesta versão.

**Cabeça completa e hiper-realismo são hipóteses do experimento, não capacidades comprovadas desta entrega.** Inspecione os ângulos reais da captura e compare o modelo sem textura para não confundir projeção fotográfica com geometria fiel.

**Escala não validada:** ao importar USDZ/splats, o visualizador normaliza o modelo para inspeção. O USDZ original pode ser baixado sem essa normalização; o GLB exportado reflete a escala do visualizador e inclui metadados de escala não validada. Uma referência física é necessária antes de usar medidas ou tamanho 1:1 em MR. FPS no Mac não comprova desempenho no Quest.

## Desenvolvimento e requisitos

Para a rota local: Mac compatível com Object Capture/Metal, Python 3, ferramentas Swift/Xcode e navegador moderno com WebGL2. O iniciador usa `.venv`, já preparado neste projeto; em uma cópia sem esse ambiente, cria o venv e instala `backend/requirements.txt`. A primeira compilação usa `xcrun swiftc` e não instala Xcode automaticamente.

Frontend (Node.js 22.12+; validado com Node 24):

```sh
cd web
npm install
npm run assets
npm run dev -- --port 5173
npm test
npm run build
```

Os modelos e WASM já acompanham a versão pronta. `npm run assets` recupera esses arquivos quando necessário. Em desenvolvimento na porta 5173, configure a URL/token do serviço manualmente ou use o iniciador com o build pronto para conexão automática no mesmo endereço.

Testes do backend, na raiz:

```sh
.venv/bin/python -m unittest discover -s backend/tests -v
```

## Rota alternativa: GPU NVIDIA

Esta rota não é necessária para o primeiro teste no M2. Use Linux/NVIDIA com COLMAP, FFmpeg e Nerfstudio instalados conforme a documentação oficial. Configure `IMERSITY_ENGINE=colmap-splatfacto`, `IMERSITY_API_TOKEN` com pelo menos 24 caracteres, `IMERSITY_DATA_DIR` e `IMERSITY_ALLOWED_ORIGINS`. Inicie um único worker Uvicorn, coloque HTTPS à frente e informe endereço/token em **Conexão avançada / servidor remoto**. Imagens são enviadas ao servidor escolhido apenas ao iniciar a reconstrução. O pipeline executa `ns-process-data`, `ns-train splatfacto` e `ns-export gaussian-splat`. Nenhuma GPU remota foi provisionada nem esse treinamento validado ponta a ponta.

A aplicação é uma POC para uma pessoa/equipe de confiança, não um serviço multiusuário de produção. Limites: importação de USDZ até 256 MiB (outros modelos: 180 MiB); 200 imagens por captura, 20 MB por imagem, pacote de 400 MB, até 2 horas por reconstrução Apple. Detalhe completo pode exigir mais memória/tempo; comece reduzido.

## Verificação desta versão

- Compilação real da ponte Swift e execução do diagnóstico nativo; GPU Metal indisponível no processo do Codex.
- 15 testes Python: validação e isolamento de capturas, autenticação, origem/host local, CORS, erros nativos e rejeição de processamento sem suporte.
- 10 testes JS: geometria aproximada, manifesto, métricas e heurística de nitidez.
- Extração de 48 quadros de vídeo sintético de teste no navegador.
- Importação de USDZ sintético (cubo), carregamento de textura do pacote e exportação GLB com textura embutida; esse objeto não é resultado de fotogrametria.
- Build de produção concluído. Face MediaPipe, GLB e splats também foram inspecionados na versão anterior.

**Atualização v0.3:** a reconstrução real da cabeça já foi executada pelo usuário e os arquivos locais foram inspecionados. Dez testes JS e o build passaram; os controles novos foram verificados com o USDZ Completo no navegador. **Pendente:** melhorar/medir fidelidade geométrica e textura, repetir com enquadramento focado na cabeça e validar no Quest. A avaliação das fotos reservadas é manual nesta versão.

Fontes técnicas e bibliotecas: [Apple Object Capture](https://developer.apple.com/augmented-reality/object-capture/), [USDLoader/Three.js](https://threejs.org/docs/pages/USDLoader.html), [MediaPipe](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [Spark](https://github.com/sparkjsdev/spark), [Nerfstudio](https://docs.nerf.studio/quickstart/installation.html). Consulte `docs/POC_PESQUISA_TECNICA.md` para a pesquisa inicial. A publicação hospedada permanece pendente; esta entrega usa execução local. As fontes DM Sans/Manrope são solicitadas ao Google Fonts; as fotos não são enviadas a esse serviço.

Para abrir um resultado específico concluído: `http://localhost:4180/?job=<id>&show=model`. O navegador carrega esse trabalho e identifica o arquivo pelo prefixo do ID. O serviço local precisa permanecer aberto.

Experimento de adaptação regional: [cabelo moldado v2](docs/EXPERIMENTO_CABELO_MOLDADO_V2.md), com versão anterior selecionável e preservação dos atributos da cabeça.

Teste parcial de linha de implantação: [faixa de raiz com comparação opaca/fios](docs/EXPERIMENTO_RAIZ_FIOS_V1.md). As mechas de apoio têm vínculo com o couro cabeludo; o teste não é um penteado completo.

## Mecha modular parcial

A interface v0.6.3 compara três comprimentos com a mesma raiz. Veja [o experimento](docs/EXPERIMENTO_MECHA_MODULAR_V1.md).

## Lateral em camadas

A interface v0.6.4 compara uma lateral com menos volume e com sete camadas de mechas. Veja [o experimento](docs/EXPERIMENTO_LATERAL_CAMADAS_V1.md).

## Cabelo guiado por foto

A interface v0.6.5 abre a foto original junto de um teste assistido de cabelo frontal. O resultado ainda não reproduziu fielmente o topete. Veja [o experimento e seus limites](docs/EXPERIMENTO_FOTO_GUIADA_V1.md).

## Teste atual: cabelo de referência Sintel

A versão v0.6.6 compara um penteado de referência com sua adaptação ao avatar.
Veja [o roteiro e as limitações](docs/EXPERIMENTO_CABELO_REFERENCIA_SINTEL_V1.md).
O teste usa cabelo estático e materiais específicos do visualizador. O acabamento
fotorrealista e a adaptação automática ainda não foram validados.

## Ajuste de raiz e divisão v2

A versão v0.6.7 acrescenta fios curtos na raiz e mantém o encaixe anterior para comparação. Veja [o roteiro](docs/AJUSTE_RAIZ_SINTEL_V2.md). O arquivo GLB privado é entregue separadamente.
