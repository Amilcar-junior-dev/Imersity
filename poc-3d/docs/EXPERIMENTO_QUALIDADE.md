# Inspeção de qualidade — 22/10/2026

A POC reconstruiu dados reais no Mac M2. Foram inspecionados os arquivos de saída, capturas, metadados, materiais USD e a renderização do modelo Completo no navegador local. Não houve envio das capturas a serviço externo nem nova reconstrução nesta inspeção.

| Execução | Treino | Imagens | Tempo | Malha observada | Textura de cor observada | USDZ |
|---|---:|---|---:|---:|---|---:|
| Reduzido | 80 | 1152 × 2048 | 49,5 s | Não contada nesta inspeção | 2048 × 2048 | 8,2 MB |
| Médio | 80 | 1152 × 2048 | 74,4 s | 50.000 faces triangulares | 4096 × 4096 | 23,3 MB |
| Completo | 80 | 1152 × 2048 | 75,9 s | 100.000 faces triangulares | 4096 × 4096 | 58,7 MB |

Valores de arquivo em MB decimais. Médio e Completo usam conjuntos de imagens byte a byte idênticos (SHA-256 do conjunto igual). O Reduzido usa outro conjunto; portanto sua comparação visual com os demais mistura captura e preset.

## Achados

- O Completo dobrou a malha observada em relação ao Médio, mantendo a resolução das texturas em 4096². Não supor a resolução teórica máxima da API para todos os modelos.
- O Médio inclui cor, normal e oclusão; rugosidade constante de 0,9. O Completo inclui também um mapa de rugosidade. Assim, o brilho pode mudar mesmo com imagens iguais.
- A iluminação antiga do visualizador adicionava HemisphereLight 2,2 e três luzes direcionais 3, 1,3 e 2. A comparação visual do mesmo USDZ com e sem essa iluminação mostrou contribuição visível do material/luz para o aspecto brilhante relatado. Isso não prova que a iluminação seja o único problema.
- No modo sem luz extra o rosto continua suavizado, particularmente ao redor dos olhos. No modo Escultura aparecem as limitações da geometria, sem que a foto as disfarce.
- A captura examinada inclui bastante parede, pescoço e tronco. A malha inclui busto e um fragmento de fundo acima da cabeça. Os pixels de entrada e o orçamento de geometria não se concentram apenas no rosto.
- Os logs não registraram eventos estruturados de imagem inválida, downsampling ou alinhamento incompleto. Ausência de aviso não comprova fidelidade.
- Não há medidas de erro geométrico, comparação automática com vistas reservadas ou validação de microdetalhe/poros.

## Alterações v0.3

- Modo **Cor sem luz**: usa cor/textura base com material que não recebe luzes adicionais. Mantém a iluminação já gravada na fotografia.
- **Textura + luz**: preserva materiais do scan; preset suave de comparação, preset antigo e controle de intensidade.
- **Escultura/Malha** continuam disponíveis para avaliar superfície e distribuição de triângulos.
- Exportação mantém o material original, independentemente do modo de inspeção; relatório registra o modo de visualização.
- Liberação das texturas dos materiais ao trocar modelo, incluindo normal/rugosidade/oclusão.
- Dois testes adicionados para conferir preservação do material original e isolamento entre aparência e geometria. Sete testes JS e build passaram. A importação do USDZ Completo e a troca de modos/presets foram verificadas no navegador, sem erros de console.

## Próximo experimento

1. Reabrir o modelo existente e comparar Cor sem luz, Textura + luz suave e Escultura, mantendo o mesmo ponto de vista. Não precisa reconstruir para esse teste.
2. Se o vídeo original tiver resolução suficiente, extrair novamente em 4K, mantendo 80 imagens e o mesmo nível de detalhe. Isso testa o efeito da resolução sem mudar também a quantidade de vistas.
3. Capturar uma volta com enquadramento mais próximo, concentrado na cabeça e parte mínima dos ombros, com luz difusa estável, expressão imóvel e cobertura do topo. Manter o rosto em foco; não usar filtro/embelezamento, zoom digital ou vídeo recomprimido.
4. Comparar vistas distintas, reservadas fora da reconstrução. Registrar cobertura, contornos do nariz/orelhas/mandíbula, olhos, textura e tempo. Não usar apenas nitidez frontal como critério.
5. Se a geometria continuar suavizada com captura melhor, comparar outro motor ou método específico para cabeças com o mesmo conjunto de entrada. Não interpretar mais polígonos, sharpening ou detalhe gerado por IA como nova medição fiel da pessoa.
