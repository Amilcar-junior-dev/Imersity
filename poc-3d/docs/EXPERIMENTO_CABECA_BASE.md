# Cabeça-base e troca de cabelos de referência — POC v0.6.1

## Resultado e limite da prova

Uma cópia da reconstrução custom de Junior foi preparada com recorte assistido da região do cabelo e fechamento do couro cabeludo. O resultado permite alternar entre cabeça-base, um cabelo curto e um chanel simples, modificar cor e ajustar tamanho/altura no navegador. Esses dois penteados são superfícies procedurais de referência; não representam cabelo hiper-realista, fios físicos ou previsão de corte de salão. Não houve integração com Meshy, fal.ai ou outros serviços.

A preparação é específica desta captura. O perfil de recorte foi ajustado em várias inspeções, não identificado por um segmentador automático. O cálculo após definir o perfil levou aproximadamente 2 segundos, mas esse tempo não inclui o trabalho de preparação assistida nem demonstra tempo por cliente.

## Preservação e estimativas

- Origem: trabalho `2f9ebeee988ac04a74197753e73074cc`, custom com 250.000 triângulos.
- SHA-256 original: `a337e9175ef2d3257a144dbb10ae066c74603121c114564d504643b072bf8f03`.
- 14.037 triângulos da região facial central protegida — olhos, nariz, boca e parte central da testa — foram preservados em posição e UV. Não significa preservação byte a byte de toda a superfície da cabeça.
- A superfície mantida contém 55.158 triângulos: 51.467 com a cor capturada e 3.691 classificados como transição estimada perto das têmporas. A classificação de transição é uma heurística assistida por região/cor e não uma segmentação semântica validada.
- A abertura craniana possui uma única borda de 972 pontos. O complemento começa exatamente nessa borda e tem 61.236 triângulos.
- A cabeça-base tem 116.394 triângulos visíveis; com curto, 125.871; com chanel, 136.253.
- Laranja identifica couro cabeludo e transições estimadas. Desativar o destaque aplica uma cor de pele aproximada; não revela pele observada na captura.
- A forma do crânio e as regiões ocultas foram estimadas por um volume elipsoidal ajustado ao recorte. Escala e medidas anatômicas não foram validadas.
- Ainda é necessário avaliar acabamento junto às orelhas/têmporas, a linha de implantação e possíveis pequenos resíduos de textura/forma. A borda inferior do pescoço permanece aberta; o modelo não foi preparado para impressão.

O arquivo original foi verificado por hash após a preparação e permanece intacto. As regiões fora do recorte não foram subdivididas para simular recuperação de detalhe.

## Como testar

1. Abra `http://localhost:4180/` pelo laboratório local e atualize a página para carregar a v0.6.1. O link antigo com `?job=...&show=model` continua abrindo o scan daquele trabalho e pode substituir o experimento na tela.
2. Importe `Imersity_cabeca_base_v061.glb`, disponível em Downloads após a exportação verificada, ou o GLB inicial em outputs.
3. No painel **Teste de troca de cabelo**, selecione **Sem cabelo**, **Curto** ou **Chanel**.
4. Use **Cor sem luz**, **Textura + luz** ou **Cor + forma** para conferir os materiais, e **Escultura** para conferir a superfície. Cor e destaque laranja ficam desativados em modos sem esses materiais.
5. Confira os dois perfis e a nuca. Ajuste tamanho/altura em porcentagem, sem interpretar como milímetros. O botão Restaurar encaixe inicial volta a 100%/0%.
6. Exporte o GLB e reimporte. Ele conserva ambos os penteados e os metadados do experimento. Cabelos inativos são gravados com escala zero, para não aparecerem sobrepostos em visualizadores comuns. O laboratório reconhece as opções e restaura sua escala quando selecionadas. Não há troca de penteados padronizada para outros aplicativos nesta versão.

## Verificação

- 14 testes JS: incluindo exclusividade de penteados, preservação da face ao trocar/cor/encaixe, ajuste absoluto sem acumulação e proteção dos materiais originais durante os modos de inspeção.
- 3 testes de geometria em Python/NumPy: interpolação no recorte, preservação de entradas, fechamento da superfície estimada e rejeição de bordas abertas/ramificadas.
- Preparação real sobre o USDZ, conferência de hash original e igualdade dos atributos protegidos.
- GLB real importado no navegador, cabeça-base reconhecida e os dois penteados alternados. Cor, tamanho e altura foram exercitados. Exportação e reimportação conferidas; as posições da malha facial observada foram comparadas entre o GLB inicial e o exportado.
- Build de produção concluído. O backend de reconstrução não precisou mudar ou reiniciar.

Isso demonstra a estrutura de cabeça + peças separadas neste caso assistido. Ainda não demonstra separação automática, cabelos finais realistas, processamento de outras clientes, compatibilidade de qualquer asset externo ou desempenho no Quest.

## Reprodução local

Usar Python com NumPy e Pillow, além de `usdcat` do macOS. Dependências opcionais em `scripts/requirements-headprep.txt`.

```sh
python3 scripts/prepare_head_base.py --output /caminho/para/cabeca_base.glb
python3 -m unittest discover -s scripts/headprep -p 'test_*.py' -v
```

O preparador confere o hash da captura original. Não aplique o mesmo perfil em outra pessoa: será necessário definir um novo recorte e validar a região protegida. Os dados pessoais e modelos reconstruídos ficam fora do pacote de código e de web/public.

Verificação final do arquivo exportado: POSITION e TEXCOORD_0 da malha observada são idênticos ao GLB preparado. As normais foram normalizadas para vetores unitários pelo GLTFExporter; isso não muda as posições. Ambos os cabelos estão presentes e inativos com escala zero na seleção Sem cabelo. Arquivo final em Downloads: Imersity_cabeca_base_v061.glb.

Reabertura final v0.6.1 conferida no navegador: Sem cabelo 116.394 triângulos, Curto 125.871 e Chanel 136.253. Ambos os cabelos foram reativados após reimportação; console sem erros nessa verificação. As transformações são exportadas como TRS para evitar matrizes singulares nos cabelos inativos.
