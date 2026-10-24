# Segunda captura: recorte assistido e apoio posterior

> Registro histórico: em 24/10/2026, a pedido do usuário, as mídias desta captura
> foram movidas para a Lixeira e o experimento ativo foi limpo. Os resultados
> técnicos abaixo permanecem para comparação, sem imagens ou modelos anexos.

Registro local da frente 3D/XR, 24/10/2026. Trabalho ainda requer revisão.

**Correção de direção pelo usuário, 24/10/2026:** o resultado abaixo foi rejeitado
visualmente como pior. O pedido era refazer o 3D a partir das fotos, com ajustes
na reconstrução. O apoio posterior não é uma solução aprovada. A próxima rodada
retorna aos 80 quadros originais, sem utilizar os GLBs recortados como entrada.

## O que foi observado

O USDZ da reconstrução isolada contém uma única malha de 49.999 triângulos.
Na vista posterior há uma abertura extensa: é possível ver o lado interno do
rosto através dela. Não foi encontrado outro fragmento de geometria contendo
essa parte da cabeça. Isso não demonstra que os quadros originais sejam incapazes
de produzir outra reconstrução; demonstra que a superfície está ausente neste
resultado. O processamento informou 24 quadros ignorados entre os 80 enviados.

## Experimento local

`scripts/clean_capture.py` usa um perfil privado, vinculado ao SHA-256 da captura.
O perfil combina limites espaciais, uma região facial protegida e uma heurística
de textura clara/neutra. Não reconhece cabelo ou fundo por IA. O perfil precisa
ser anotado e revisado para cada captura; os limiares podem confundir reflexos,
pele e fundo. Nenhum parâmetro pessoal foi adicionado aos assets públicos.

- `cabeca_recortada.glb`: 31.135 triângulos originais mantidos, com posições,
  normais, UVs e imagem de cor preservadas. Retirados 18.864 triângulos, incluindo
  fundo e parte inferior. Os 5.497 triângulos da região facial protegida foram
  mantidos. Ainda existem resíduos claros e bordas irregulares.
- `cabeca_apoio_estimado.glb`: a mesma captura recortada, acrescida de 6.016
  triângulos de um meio elipsoide posterior **laranja**. É apoio diagnóstico
  estimado e separado. Cobre parte da abertura visualmente; não foi soldado à
  borda, não é uma malha estanque e não recupera cabelo ou anatomia ausente.
- `verificacao.json`: proveniência, hashes, contagens e limitações.
- `comparacao_recorte_apoio.png`: renderização técnica por software dos GLBs,
  com textura de cor, para inspeção de frente e de trás. Não constitui teste no
  navegador, Quest ou visualizador de terceiros.

Os arquivos ficam em `data/<trabalho>/artifacts/`, ignorados pelo Git. O original
foi preservado e seu hash conferido após a geração. O material observado usa
`KHR_materials_unlit`; o GLB não acrescenta iluminação à cor da captura.

## Execução e verificações

Requer macOS com `/usr/bin/usdcat`, Python, NumPy e Pillow:

```sh
python scripts/clean_capture.py --source data/TRABALHO/result/head.usdz \
  --profile data/TRABALHO/inspection/cleanup-profile.json \
  --output-dir data/TRABALHO/artifacts
python -m unittest discover -s tests -p 'test_capture_cleanup.py' -v
```

Os três testes sintéticos verificam proteção facial contra exclusão, superfície
estimada restrita à região posterior, normais/triângulos válidos e rejeição de
parâmetros degenerados. Os buffers exportados desta captura também foram
conferidos separadamente com os dados originais selecionados.

## Limite e próximo passo

Esta entrega é uma primeira limpeza com diagnóstico de preenchimento, **não**
correção definitiva dos buracos nem cabeça-base pronta para receber penteados.
É necessário refinar a remoção de resíduos, definir a borda craniana preservando
orelhas e construir uma transição entre essa borda e a superfície estimada.
Para recuperar a parte posterior como observação real, é necessário investigar
os quadros ignorados e a cobertura da captura; pintar o apoio não faz isso.

O perfil assistido anterior, feito para a primeira pessoa, não foi aplicado à
segunda. Não houve alteração de API, contrato, frontend ou reconstrução nativa.
Não houve commit, push, publicação ou envio de mídia a terceiros nesta rodada.
