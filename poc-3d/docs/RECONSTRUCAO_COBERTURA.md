# Nova reconstrução das fotos — teste de cobertura

> Registro histórico: em 24/10/2026, a pedido do usuário, as mídias desta captura
> foram movidas para a Lixeira e o experimento ativo foi limpo. Os resultados
> técnicos abaixo permanecem para comparação, sem imagens ou modelos anexos.

Frente 3D/XR, 24/10/2026. Rodada solicitada pelo usuário após rejeitar a limpeza
e o apoio posterior como piora visual. O pedido é refazer o 3D das fotos.

## Entrada e mudança técnica

Usadas cópias dos mesmos 80 quadros da segunda captura isolada. O script
`scripts/reconstruct_saved.py` verifica os hashes das cópias e a origem única
antes de iniciar, cria outro trabalho privado e confere os originais ao final.
Não utiliza os GLBs recortados ou o preenchimento laranja como entrada.

O novo perfil interno `recovery` mantém saída **Médio**, sensibilidade alta e
resolução de entrada original; muda:

- `isObjectMaskingEnabled=true`: solicita separação automática de primeiro plano
  e fundo durante a reconstrução. A API pode recorrer à imagem inteira se não
  conseguir criar a máscara; o parâmetro ativo não comprova segmentação correta.
- `sampleOrdering=.unordered`: deixa de informar uma ordem sequencial ao motor,
  para testar outro alinhamento das mesmas imagens.

São duas mudanças na mesma rodada: eventual melhora não isola a contribuição de
cada uma. Nenhuma região da malha resultante é completada pelo script com formas
geométricas. Configurações anteriores mantêm o comportamento original.

O código Swift compila com o SDK instalado. O diagnóstico da execução autorizada
fora do sandbox reconheceu Apple M2/Metal; a reconstrução foi iniciada diretamente
pelo runner, sem reiniciar o serviço web nem alterar o experimento anterior.
O serviço já aberto consegue consultar e mostrar o resultado do novo trabalho;
para reconhecer `recovery` em novas submissões por API precisa ser reiniciado.
O perfil não foi acrescentado ao seletor da interface nesta rodada.

```sh
.venv/bin/python scripts/build_native.py
.venv/bin/python scripts/reconstruct_saved.py --source-job ID_DA_CAPTURA --profile recovery
```

## Critérios de avaliação

Conferir a vista posterior de verdade, a preservação visual da identidade na
frente, as laterais e artefatos de fundo. Comparar imagens ignoradas, tempo e
tamanho com o teste Médio anterior. Mais polígonos não equivalem a recuperar
vistas ausentes. Não anunciar cabeça completa, fidelidade métrica, recorte de
cabelo ou automatização geral a partir de uma única execução.

Os 21 testes de backend e dois testes do runner passaram: configuração registrada,
falhas preservadas, cópias idênticas e rejeição de origens misturadas antes de
criar outro trabalho. Capturas e resultados permanecem privados em `data/`.
Não houve commit, push ou envio de mídia a terceiros.

## Referências da configuração

- [Apple: máscara automática e fallback](https://developer.apple.com/documentation/realitykit/photogrammetrysession/configuration-swift.struct/isobjectmaskingenabled).
- [Apple: ordem das amostras](https://developer.apple.com/documentation/realitykit/photogrammetrysession/configuration-swift.struct/sampleordering-swift.enum).

## Primeira rodada: máscara automática

Concluiu em 261,3 s e gerou USDZ de 24.913.901 bytes/50.000 triângulos. Continuou
descartando as mesmas 24 amostras (IDs 30 a 53), e a inspeção posterior em Cor sem
luz ainda mostrou uma grande região defeituosa/clara. Não resolveu a cobertura.
O fato de `isObjectMaskingEnabled=true` estar registrado não prova que o motor
tenha segmentado a pessoa corretamente; o teste não tratou o resultado como êxito.

## Segunda rodada: máscaras explícitas por foto

O perfil interno `person-recovery` mantém Médio e `.unordered`, mas carrega
`PhotogrammetrySample` com a imagem original e fornece `objectMask` explicitamente.
A máscara vem de `VNGeneratePersonSegmentationRequest`, qualidade `.accurate`,
formato 8 bits, ampliada à resolução da foto, com margem de seis pixels e limiar
conservador de 32/255. Não recolore, recorta ou recomprime o RGB original.

Foram geradas 80 máscaras binárias com as dimensões das respectivas imagens e
80 IDs distintos. Prévia amostral conferida em frente, perfil, nuca e um quadro
muito próximo. Em `frame_00053.jpg`, a cabeça já ocupa quase toda a imagem e é
cortada pelo enquadramento original; máscara de 99,2% foi sinalizada para revisão.
O primeiro processamento de máscaras parou nesse quadro por uma guarda excessiva
de área; o limite foi corrigido para avisar sobre a foto próxima, preservando a
rejeição de máscaras quase vazias. A tentativa interrompida permanece registrada.

Cada máscara é salva como PNG privado para inspeção, juntamente com eventos de
área e mapeamento de ID/nome do quadro. A inspeção amostral e os checks de forma
não são medição de precisão semântica em todas as fotos. Cabelo fino e regiões
ocultas continuam difíceis. Esta segmentação experimental depende do Apple Vision
local, sem decidir fornecedor ou arquitetura do produto; contrato permanece igual.

```sh
.venv/bin/python scripts/reconstruct_saved.py --source-job ID_DA_CAPTURA --profile person-recovery
```

### Resultado da segunda rodada

Concluiu em **404,2 s**, com USDZ de **27.112.993 bytes**, 49.999 triângulos,
25.000 vértices na malha original e textura de 4096 × 4096. Foram ignoradas
**10 amostras** (IDs 44 a 53; nomes conferíveis nos eventos `personMask`), contra
24 na execução anterior. Os bytes da captura de origem permaneceram intactos.

A inspeção no visualizador da POC conferiu frente, ambos os perfis e nuca em
**Cor sem luz**, além da nuca em **Escultura**. A grande abertura/faixa clara
posterior deixou de aparecer nessas vistas; há superfície posterior visível
também sem a textura. Frente e perfis mantêm uma aparência coerente com a pessoa,
sem medição objetiva de fidelidade nesta rodada. Não foram aplicados recortes
posteriores, remendos manuais ou o elipsoide do experimento rejeitado.

A análise topológica do resultado encontrou sete arestas de borda e nenhuma
aresta com mais de duas faces. Isso não é certificado de malha estanque ou
ausência de autointerseções. Ainda existem irregularidades, especialmente junto
ao topo, pontas do cabelo, pescoço e limite do busto; o acabamento fino permanece
em avaliação. O cabelo original continua unido à captura e a troca de penteado
ainda não foi testada nesta pessoa. Não houve validação no Quest.

O trabalho e seu `reconstruction-verification.json` ficam em `data/`, privados.
O resultado está acessível pela URL local do trabalho na porta 4181. Este teste
verificou uma melhora de cobertura nesta captura; não demonstra automatização
para qualquer pessoa ou aprovação da arquitetura comercial.

- [Apple: objectMask explícita](https://developer.apple.com/documentation/realitykit/photogrammetrysample/objectmask).
- [Apple: segmentação da pessoa](https://developer.apple.com/documentation/vision/vngeneratepersonsegmentationrequest).
