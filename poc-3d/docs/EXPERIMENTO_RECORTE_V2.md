# Recorte guiado pela textura — revisão 2

Arquivo de comparação: `Imersity_cabeca_recorte_v2.glb`. Mantém o esquema do laboratório v0.6.1 e os dois penteados de referência. A revisão é do modelo e do preparador; não é uma nova reconstrução fotogramétrica.

O scan original custom de 250 mil triângulos permanece intacto (SHA-256 a337e9175ef2d3257a144dbb10ae066c74603121c114564d504643b072bf8f03). Não houve envio de dados a terceiros.

## O que mudou

- Guias diferentes para as duas laterais, anotados a partir dos perfis com a textura capturada. As coordenadas deste scan não são simétricas em x=0.
- Polígonos específicos para preservar as orelhas; dentro deles, cor/brilho ajudam a distinguir a borda de pele de cabelo adjacente. Não se trata de selecionar globalmente tudo que é escuro.
- 4.308 triângulos laterais marcados são substituídos por superfície estimada. A substituição reutiliza a conectividade desses triângulos, remove a fotografia de cabelo nessa região e permite suavizar seus vértices interiores. Não significa que 4.308 triângulos sejam todos cabelo: há margem de transição estimada.
- A suavização mantém fixos os vértices vizinhos a pele observada, os da região facial protegida e os das orelhas protegidas. O limite de deslocamento é 0,012 nas coordenadas nativas, sem correspondência física validada.
- O complemento craniano foi recentrado e estreitado para reduzir sobreposição com as orelhas. As direções dos anéis foram regularizadas para reduzir dobras do preenchimento. Esse crânio continua estimado.
- A superfície final mantém 116.394 triângulos: 50.850 capturados, 4.308 de transição estimada e 61.236 do complemento craniano.

## Preservação e limites

11.801 triângulos da região facial central definida nesta revisão permanecem originais. A proteção usa x=.035 +/- .105, z>=.12 e .62<=y<=.94; qualquer triângulo que toque um vértice protegido fica fora da substituição. Essa definição exclui as têmporas que estavam incluídas na caixa ampla da revisão anterior. Os números não devem ser comparados como perda de detalhe do rosto.

Asserções na preparação confirmam igualdade dos atributos das superfícies mantidas (posição, normal e UV) e dos 4.018 triângulos protegidos das orelhas. Isso não prova que todo o limite anatômico da orelha foi classificado perfeitamente: a anotação e a junção ainda exigem inspeção visual. O material laranja mostra a região estimada. Desativá-lo usa apenas uma cor de pele aproximada; pele hiper-realista sob o cabelo não foi recuperada.

A anotação é específica de Junior, assistida e ajustada manualmente. Não está validada em outra pessoa, em cabelo loiro, crespo, solto ou sobre as orelhas. Os penteados continuam simples referências de encaixe. Pequenas irregularidades no contorno e na superfície estimada permanecem possíveis. A nuca inferior permanece aberta.

## Reproduzir e testar

```sh
python3 scripts/prepare_head_base.py --refine-texture --output /caminho/Imersity_cabeca_recorte_v2.glb
python3 -m unittest discover -s scripts/headprep -p 'test_*.py' -v
```

Seis testes de geometria passaram, incluindo preservação de fronteiras observadas durante suavização, limite de deslocamento, proteção de face escura e fechamento da superfície craniana. O build do frontend passou para reconhecer o nome da exportação desta revisão. O preparador confere o hash original e rejeita qualquer outra captura.

No laboratório, importe o arquivo novo por **Compare outras técnicas → Importar modelo 3D**. Confira o nome `Imersity_cabeca_recorte_v2.glb` no rodapé do visualizador; a contagem de triângulos permanece igual e não distingue as revisões. Selecione Sem cabelo e compare os dois perfis, com destaque laranja ativado e desativado, e depois em Escultura. A região estimada não deve ser confundida com anatomia medida.

Verificação final no navegador: ambas as laterais inspecionadas, seleção de cabelo curto e retorno a Sem cabelo conferidos, console sem erros. Exportação de 60.618.776 bytes em Downloads. Posições e UV da superfície observada são idênticos aos do GLB preparado; normais foram normalizadas pelo exportador (erro máximo em relação à normalização esperada de 1,2e-7). Triângulos estimados finitos e não degenerados. Ambos os cabelos inativos permanecem no arquivo com transformações TRS e escala zero.
