# Cabelo moldado v2 — teste local de adaptação regional

Este experimento reutiliza o primeiro arquivo fal/Meshy já gerado. Não faz chamadas de IA, envios externos nem consome créditos. O novo GLB conserva o cabelo anterior e acrescenta uma segunda opção: **Cabelo fal · moldado nas têmporas e nuca**. A opção anterior permanece selecionável para comparação.

A deformação atua de forma suave nas têmporas e na parte posterior, mantendo a região superior acima de y=1,12 e a franja central fixas nas coordenadas nativas. O alongamento acompanha o aumento das seções inferiores do crânio estimado para reduzir interpenetrações causadas por um simples deslocamento vertical. As normais são transportadas pelo Jacobiano da deformação; a textura original permanece vinculada aos UVs. A abertura ao redor de cada orelha é recortada depois de moldar, com margem menor de 0,004 nas coordenadas nativas. Os números não representam medidas físicas validadas.

O perfil é específico para Junior e para o primeiro arquivo fal inspecionado. Não é ajuste automático para qualquer pessoa. A extensão não cria fios ou textura nova: pode alongar detalhes existentes, e as irregularidades da textura gerada continuam presentes. Persistem áreas de pele estimada próximas das orelhas, além de transições que exigem acabamento. Ausência de colisões em toda a superfície não foi comprovada.

O arquivo novo tem 28.845 triângulos no cabelo ativo e 147.387 no conjunto visível. Todo o buffer original e seus accessors foram preservados: rosto, orelhas, couro cabeludo e cabelo anterior mantêm os mesmos atributos. A deformação regional deslocou 26.179 vértices antes do recorte; deslocamento máximo de 0,086885 em coordenadas nativas. O Jacobiano foi positivo nos vértices amostrados (mínimo 0,775828). Todos os triângulos finais do cabelo têm área positiva, atributos finitos e normais unitárias. Doze testes Python e quinze testes JS passaram; build concluído.

## Testar

Importe **Imersity_teste_cabelo_moldado_v2.glb** no laboratório, em http://localhost:4180/. Em Teste de troca de cabelo, alterne **Cabelo fal · extraído do primeiro modelo** e **Cabelo fal · moldado nas têmporas e nuca**. Use Cor sem luz, os dois perfis e Nuca. O destaque laranja ajuda a localizar pele estimada ainda exposta; parte da pele ao redor das orelhas deve permanecer visível. O arquivo com sufixo **isolado** contém apenas o cabelo, já nas coordenadas desta cabeça.

## Reproduzir

```sh
python3 scripts/prepare_generated_hair.py --source /caminho/Imersity_fal_model_original_01.glb --head /caminho/Imersity_teste_cabelo_fal_01.glb --output /caminho/Imersity_teste_cabelo_moldado_v2.glb --hair-output /caminho/Imersity_cabelo_moldado_v2_isolado.glb --regional-fit
```

## O que foi demonstrado

Nesta cabeça e com este candidato, é possível extrair uma peça de cabelo de outra malha, preservá-la separada do rosto, deformar regiões do cabelo e comparar os dois encaixes no navegador. Isso apoia a arquitetura de cabeça-base com cabelos substituíveis. Ainda falta validar acabamento realista, repetibilidade em outras pessoas e estilos, tempo de preparação e viabilidade de automatizar o encaixe. A simulação não prevê o resultado físico de um corte ou coloração no salão.
