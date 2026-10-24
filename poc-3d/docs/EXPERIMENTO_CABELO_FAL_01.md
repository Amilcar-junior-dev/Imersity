# Primeiro cabelo fal/Meshy — extração e encaixe assistido

Foi usado somente o arquivo `model.glb` já gerado pelo usuário. Nenhuma chamada à fal, envio de captura, integração de API ou consumo adicional de créditos foi realizado. Uma cópia imutável do original foi preservada em outputs, fora de web/public e do pacote de código.

## Estrutura encontrada

O GLB original tem 30.463 triângulos, uma malha, um material e uma textura JPEG de 2048×2048. Após soldar posições apenas para análise de conectividade, há uma componente com 30.460 triângulos e um pequeno fragmento com 3. O cabelo não era um objeto separado; cabeça, orelhas, barba e cabelo estavam conectados. SHA-256 do primeiro arquivo: `8ea3590316b1cb0328559756e2761d1d814fcc86175b1e126f5d87b7a83022bd`.

## Preparação

Um perfil específico combina cor da textura com altura e posição angular para separar o cabelo superior da barba e do rosto. A fronteira é recortada interpolando posição, normal e UV. Fragmentos claros junto ao recorte e componentes pequenas sem ligação com a região superior foram descartados. O resultado é uma superfície exterior aberta, sem rosto ou pescoço de suporte; espessura uniforme e volume fechado não foram validados.

O encaixe usa escala inicial nativa `[.30,.30,.285]` e deslocamento `[.035,.92,.015]`, com projeção de pontos interiores contra um crânio elipsoidal estimado. Houve deformação local de até aproximadamente 0,075 nas coordenadas nativas; não são metros validados. Foi aplicada uma abertura assistida ao redor das orelhas e limpeza das regiões sob os lóbulos. Isso não constitui solução geral de colisão ou ajuste anatômico automático.

O GLB combinado acrescenta cabelo e textura ao arquivo da cabeça-base v3, preservando integralmente o prefixo binário e os accessors do modelo-base. Os vértices e UV do rosto não foram modificados. A seleção **Cabelo fal · extraído do primeiro modelo** é uma peça independente e pode ser alternada com Sem cabelo e as duas referências antigas.

A tonalização dessa textura usa um multiplicador relativo: a cor inicial #493123 mantém a textura original sem escurecimento adicional. Alterações de cor são aproximadas e não simulam coloração real de cabelo. As referências procedurais continuam sendo modelos simples. Na combinação inicial, o destaque laranja fica desativado, com uma cor uniforme aproximada para as regiões estimadas, amostrada da testa capturada. Essa cor não recupera pele escondida; o checkbox permite destacar novamente as estimativas.

## Limites observados

A textura gerada possui marcas claras e aparência irregular em algumas mechas, já presentes no arquivo da fal. O estilo e as proporções são diferentes dos do scan. Bordas, linha de implantação, nuca e transições de pele continuam necessitando acabamento. FPS no Mac não valida desempenho no Quest; não foi realizada captura de outra pessoa neste teste. Esta prova demonstra reaproveitamento e encaixe assistido do asset, não realismo final de salão.

## Reproduzir

```sh
python3 scripts/prepare_generated_hair.py --source /caminho/model.glb --head /caminho/Imersity_cabeca_orelhas_v3.glb --output /caminho/Imersity_teste_cabelo_fal_01.glb --hair-output /caminho/Imersity_cabelo_fal_01_extraido.glb
```

O hash confere que se trata do primeiro candidato inspecionado. Um segundo cabelo requer revisão do perfil, em vez de aplicar automaticamente os mesmos parâmetros. O arquivo do cabelo isolado já usa as coordenadas de encaixe desta cabeça.

Quinze testes JS passaram, incluindo estilo personalizado, preservação da cor inicial de textura, tonalização sem acúmulo, seleção exclusiva e preservação facial. Dez testes de geometria passaram, incluindo rejeição da barba escura e pele clara no perfil de extração. O build de produção concluiu.

Atualize o laboratório e importe **Imersity_teste_cabelo_fal_01.glb**. Em Teste de troca de cabelo, selecione **Cabelo fal · extraído do primeiro modelo**, compare com **Sem cabelo** e confira Frente, ¾, Perfil, Outro perfil e Nuca. O outro GLB contém somente o cabelo; importá-lo sozinho substitui a cabeça na tela.

Verificação final: 28.812 triângulos no cabelo ajustado; 147.354 no conjunto visível. Exportação em Downloads com 63.778.760 bytes. POSITION e TEXCOORD_0 do rosto observado e do cabelo são idênticos aos do arquivo preparado; geometria do cabelo finita e não degenerada. As três opções de penteado permanecem no GLB, com o cabelo fal ativo. O relatório JSON registra hashes e limitações.
