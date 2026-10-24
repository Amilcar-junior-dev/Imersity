# Lateral com mechas em camadas — v1

22/10/2026 · interface v0.6.4

O teste distribui um conjunto de mechas sobre uma lateral da cabeça de Junior.
A intenção é verificar cobertura, sobreposição e volume perto da têmpora e da
orelha, antes de completar topo, outra lateral e nuca.

## Como testar

Importe **Imersity_lateral_em_camadas_v1.glb**. A lateral é enquadrada automaticamente.
Em **Teste de troca de cabelo**, compare **Menos volume** e **Com volume**. O botão
**Ampliar lateral** restaura a vista localizada. Em telas estreitas, o painel fica
abaixo do visualizador. O seletor conserva os experimentos anteriores.

Comece em **Cor sem luz**. Gire para conferir a silhueta, a implantação e a passagem
pela orelha. Compare também **Textura + luz**. Escultura e Malha exibem as tiras que
sustentam a textura, e não milhares de fios individuais modelados em geometria.

## Construção

- 469 tiras com fibras desenhadas na transparência da textura, em sete camadas.
- Direção predominantemente para trás, com variação de curva, largura,
  comprimento, queda das pontas e distância da superfície.
- Vínculos de raiz por triângulo e coordenadas baricêntricas no couro cabeludo
  estimado. Os primeiros quatro pares de vértices de cada tira são compartilhados
  pelas duas versões; o restante varia em profundidade.
- Variação procedural de cor entre fibras, sem geração externa ou créditos de IA.
- 22.512 triângulos de cabelo por opção ativa. Com a cabeça: 141.054 triângulos.
- Implantação e curvas preparadas especificamente para esta captura. Unidades
  nativas sem calibração física. Não é adaptação automática a qualquer pessoa.

## Verificação

O script de preparação confere o hash do modelo-base. O verificador independente
lê o GLB salvo e confirma: buffer e accessors originais idênticos; raiz compartilhada;
vínculos reconstruíveis; posições e UVs coincidentes na ligação; normais unitárias;
orientação dos triângulos e ausência de triângulos degenerados.

A checagem aproximada de 1.032 pontos contra candidatos locais da cabeça não
sinalizou pontos com distância menor que 0,004 unidade nativa e sinal inferior a
−0,0005. Esse teste depende das normais de uma superfície aberta. Não verifica
continuamente todos os triângulos nem prova ausência global de interseções,
especialmente entre mechas e nas regiões próximas da orelha.

20 testes JavaScript e 16 testes Python passaram. A compilação da interface
passou. O enquadramento agora ignora estilos ocultos, incluindo filhos de grupos
ocultos, para que as opções de comparação não afastem a câmera.

## Limites

É uma lateral parcial de estudo, não um penteado final. A primeira distribuição
produziu uma borda uniforme demais; a versão entregue varia mais a queda das
pontas e a altura das raízes. Densidade, direção, iluminação específica de cabelo,
leitura dos fios de diferentes ângulos e acabamento da pele estimada ainda precisam
ser avaliados. A malha do rosto e das orelhas foi preservada; isso não significa
que qualquer volume de cabelo automaticamente passe livre de interseções por elas.

A inspeção no navegador confirmou a troca dos dois volumes, a leitura da lateral
ao girar e a preservação da raiz. A versão com volume altera a silhueta; porém o
conjunto ainda tem aspecto de uma faixa densa, e a diferença de acabamento entre
a pele estimada e a capturada permanece visível. Comparações foram registradas em
Cor sem luz e Textura + luz. Não houve aprovação de realismo final.

A conclusão deste teste se limita à possibilidade de organizar e alternar um
conjunto maior de mechas nesta cabeça. Realismo fotográfico, outro formato de
cabeça, Quest 3 e produção automática ainda não estão validados.

## Reprodução

```sh
python3 scripts/prepare_side_volume.py --source CAMINHO/Imersity_teste_mecha_modular_v1.glb --output CAMINHO/Imersity_lateral_em_camadas_v1.glb
python3 scripts/verify_side_volume.py --source CAMINHO/Imersity_teste_mecha_modular_v1.glb --target CAMINHO/Imersity_lateral_em_camadas_v1.glb
```

Requer NumPy e Pillow. GLB e relatórios pessoais permanecem fora de `web/public`,
`web/dist` e do ZIP de código.
