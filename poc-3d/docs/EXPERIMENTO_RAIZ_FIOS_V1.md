# Faixa parcial de raiz — comparação entre borda sólida e fios

POC web v0.6.2. Este é um teste localizado da representação do cabelo na testa e na têmpora de Junior. Não é um penteado completo e não deve ser apresentado como acabamento hiper-realista validado.

O arquivo `Imersity_teste_raiz_fios_v1.glb` preserva integralmente o buffer e os accessors do modelo moldado v2, inclusive rosto, orelhas, couro cabeludo e cabelos anteriores. Acrescenta duas opções que compartilham exatamente os mesmos atributos geométricos, índices e textura. A diferença é o material: OPAQUE para controle e MASK com cutoff 0,18 para visualizar os fios. Não foi aplicado um desfoque à borda inteira; o alpha contém linhas finas individuais, espaços e variação no início/fim dos fios.

A faixa usa 190 hair cards com 3.040 triângulos. Cada card representa um pequeno conjunto de fios pela textura RGBA gerada localmente por um algoritmo determinístico. A textura tem 16 variações com 13 traços por variação. Isso não equivale a 2.470 fios geométricos independentes. Não foram usados assets comerciais, imagens externas, novas chamadas de IA ou créditos.

A base de cada card tem um vínculo explícito ao couro cabeludo: índice de triângulo e três coordenadas baricêntricas. As 190 posições de vínculo foram reconstruídas sem erro numérico na verificação em dupla precisão. A superfície de apoio acompanha o couro cabeludo e se eleva ligeiramente depois da base. O pequeno deslocamento inicial evita sobreposição exata com a pele. As raízes são vínculos estáticos registrados no arquivo; não implementamos ainda transferência para outra cabeça, deformação animada do couro cabeludo nem solver de colisões geral. A procura local por candidatos usa centros de triângulos; não garante o triângulo globalmente mais próximo em malhas arbitrárias.

O teste parte do contorno assistido já preparado, com variação determinística de posição, comprimento e largura. Ele não detecta a linha de implantação automaticamente. As coordenadas nativas não são medidas anatômicas calibradas.

No visualizador, alpha-to-coverage é habilitado para as tiras mascaradas com MSAA. Cor sem luz e Cor + forma preservam o alpha e a cobertura. Escultura/Malha mostram as tiras de apoio, pois os fios individuais dependem da textura. O material exportável permanece separado dos materiais temporários de inspeção. Ao importar um GLB com os metadados do teste, a configuração de cobertura do visualizador é reaplicada.

Para não desprender as raízes neste experimento, os controles de escala e altura ficam desativados nas duas opções da faixa. Os penteados anteriores conservam seus ajustes. Não há nova modificação dos vértices da face.

## Como testar

1. Abra http://localhost:4180/ e confira a versão v0.6.2. Importe `Imersity_teste_raiz_fios_v1.glb` se ele ainda não estiver carregado. Atualizar a página não substitui um modelo antigo salvo no navegador.
2. Em Teste de troca de cabelo, clique em **Ampliar teste de raiz**.
3. Alterne **Comparar borda sólida** e **Ver fios de transição** sem mudar a câmera. O seletor também contém as duas opções com prefixo **Faixa de raiz**.
4. Comece em Cor sem luz; depois confira Textura + luz e gire o modelo. As cores e a malha do couro cabeludo continuam sendo as anteriores.
5. Avalie se há raiz flutuando, aspecto de placa, serrilhado, cintilação ao mover ou espaços excessivos. Não confunda melhora do contorno com aprovação do cabelo inteiro.

A inspeção real no navegador confirmou seleção exclusiva, carregamento da máscara e distinção entre borda sólida e fios. Os fios ainda são simplificados, com distribuição e aparência que exigem trabalho. A transição da textura de pele continua visivelmente diferente em partes estimadas; não foi corrigida neste ensaio. Nenhuma validação em outra pessoa ou no Quest foi realizada.

## Verificação

- 14 testes Python e 17 testes JS passaram. O build de produção concluiu; permanece o aviso de tamanho de chunks já existente.
- O arquivo contém 121.582 triângulos visíveis com a faixa ativa. Os 118.542 triângulos da cabeça-base continuam iguais.
- Todas as posições e normais da faixa são finitas; normais unitárias e triângulos com área positiva.
- Geometria A/B exatamente compartilhada, mesma textura RGBA embutida e materiais com interpretação distinta do alpha.
- A verificação confirmou os vínculos baricêntricos, preservação dos dados anteriores e hash da saída. O relatório é `Imersity_teste_raiz_fios_v1_verificacao.json`.

Não utilizamos o código de DiffLocks, Perm ou de outro método de licença restrita. Este fixture é uma implementação local simplificada dos princípios de cards, cobertura por alpha e vínculo à superfície discutidos na pesquisa. Não implementa o solver completo de retargeting do artigo.

## Reproduzir

```sh
python3 scripts/prepare_hairline_patch.py --source /caminho/Imersity_teste_cabelo_moldado_v2.glb --output /caminho/Imersity_teste_raiz_fios_v1.glb
```

O script verifica o SHA-256 da revisão de origem. Requer apenas as dependências locais de preparação já usadas (NumPy e Pillow). Os modelos privados continuam fora de `web/public`, `web/dist` e do ZIP de código.

A próxima avaliação de qualidade deve substituir esta faixa simplificada por uma referência de grooming melhor, tratar a textura de pele e então testar a adaptação a outra cabeça. O ensaio atual valida a possibilidade de comparar uma representação com fios no navegador, sem modificar a identidade facial; não aprova ainda a transição natural final.
