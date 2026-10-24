# Teste controlado: quadros 2K × 4K

Executado localmente em 22/10/2026 no MacBook Air M2 / 24 GB. O vídeo original IMG_4533.MOV tem 2160 × 3840, aproximadamente 30 fps e 32,23 segundos.

## Condições

- Mesmo vídeo, mesmos 80 instantes selecionados e mesmo preset Completo; nenhum quadro de avaliação nesta rodada.
- Conferência dos timestamps: 80 de 80 coincidem exatamente entre os manifestos.
- Quadros: 1152 × 2048 → 2160 × 3840. O número de pixels por imagem aumentou 3,515625 vezes.
- Fonte nova: job 72500b305d4cbd5ed09e9304b04f5805. Referência: c25071ca90fa4ee920aab6e1743c22e6.

| Métrica | Entrada 2K | Entrada 4K |
|---|---:|---:|
| Tempo de reconstrução | 75,9 s | 247,7 s |
| Malha de saída | 100.000 triângulos | 100.000 triângulos |
| Cor / normal / rugosidade / oclusão | 4096 × 4096 | 8192 × 8192 |
| USDZ original | 58,7 MB | 200,1 MB |

São execuções únicas no Mac em uso, não um benchmark de hardware isolado. O tempo de extração, upload local e visualização não está incluído no tempo acima.

## Resultado e limites

O modo Cor sem luz foi inspecionado frontalmente; Escultura foi usado para verificar a superfície sem fotografia. As texturas ganharam resolução, mas os relevos da boca continuam suavizados. Não há evidência suficiente para afirmar precisão geométrica ou hiper-realismo. Os screenshots usam o mesmo visualizador, modo, vista frontal e gestos de aproximação, mas não têm registro geométrico pixel a pixel; a posição do modelo muda com os limites da cena reconstruída.

O USDZ novo também contém um EXR de deslocamento de aproximadamente 101 MB, registrado como `unconnected:displacement`. Ele não está conectado ao shader no arquivo e não é aplicado à geometria pelo visualizador atual. O GLB exportado representa a geometria e os materiais exibidos no navegador, com texturas embutidas; esse EXR auxiliar não faz parte do GLB. O USDZ original está preservado.

O limite local de importação foi ajustado para USDZ até 256 MiB (outros formatos permanecem em 180 MiB), e a importação real do novo arquivo foi verificada. GLB exportado e verificado: 146.266.736 bytes, cabeçalho glTF 2.0, tamanho declarado correto e quatro imagens embutidas. O GLB foi reimportado no navegador e renderizado sem erros de console. Escala normalizada para inspeção e não validada fisicamente.

## Próximo passo

Avaliar o modelo novo no navegador usando Cor sem luz e Escultura. Aumentar a resolução de entrada não aumentou a contagem de triângulos. O próximo teste técnico pode concentrar a geometria na cabeça, testar malha mais densa ou investigar o uso do mapa auxiliar de deslocamento. Não é necessário gravar outro vídeo para avaliar esta rodada. Caso seja necessária nova captura, usar enquadramento mais próximo da cabeça e cobertura do topo, com luz difusa e expressão estável.
