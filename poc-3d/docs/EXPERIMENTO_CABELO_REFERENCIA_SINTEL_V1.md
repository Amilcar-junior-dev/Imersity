# Cabelo de referência Sintel — teste v1

23/10/2026 · aplicação v0.6.6.

## Objetivo e resultado

Usar curvas de um penteado já produzido por um artista, em vez de continuar
inventando direções de mechas. O teste permite comparar o penteado na cabeça de
referência com a adaptação ao avatar capturado. Os controles de troca, cor e
rotação funcionaram no navegador integrado. Isso valida importação e manipulação
assistida; não valida hiper-realismo, adaptação automática ou desempenho no Quest.

A inspeção visual mostrou fios individuais e uma forma de penteado reconhecível,
mas também couro cabeludo excessivamente exposto na divisão e na testa, aspecto
uniforme em áreas densas e transições que ainda exigem trabalho. O resultado não
foi classificado como acabamento final aprovado. O modelo de referência é
estilizado; não deve ser apresentado como cabelo fotorrealista de produção.

## Como testar

1. Abra http://localhost:4180/ e atualize a página. A versão deve ser v0.6.6.
2. Se o modelo não aparecer, use **Importar modelo 3D** no topo e selecione
   `Imersity_cabelo_referencia_Sintel_v1.glb`, entregue na pasta de outputs.
3. No painel **Teste de troca de cabelo**, compare **Cabeça de referência** e
   **No meu avatar**. O primeiro botão troca também a cabeça, não só o cabelo.
4. Arraste para ver frente, lados e nuca. Use **Aproximar cabelo** para restaurar
   o enquadramento do experimento. Teste também a cor.
5. Use **Cor sem luz** para manter o rosto sem iluminação adicional. Os fios e a
   cabeça cinza de referência mantêm seus materiais iluminados específicos. Em
   Escultura/Malha, as tiras geométricas de suporte ficam visíveis.

Não é necessário reconstruir o vídeo, gerar imagens em serviços externos ou gastar
créditos. Fotos e cabeça privada continuam locais. O arquivo privado não fica em
web/public, web/dist nem no ZIP de código.

## Implementação

- Fonte: Sintel Lite 2.57b, BenDansie / Blender Foundation, distribuído sob CC BY
  3.0. Curvas TFX e cabeça OBJ exportadas por Marcin Matuszczyk (Scthe). Fontes,
  revisões, hashes e atribuição preservados em assets/reference-hair/.
- 11.400 curvas importadas, 16 pontos por curva, uma fita fina por fio. Não são
  11.400 fios medidos da pessoa. O controle usa transformação uniforme; seus
  centros de curva preservam o formato do arquivo original.
- A versão adaptada usa registro afim assistido e projeção da raiz em triângulos
  do couro cabeludo estimado. O deslocamento da raiz diminui ao longo do fio.
  Essa deformação é específica desta cabeça, não um sistema automático para
  outras pessoas. Não há garantia global de ausência de interseções.
- As fitas viram sua largura para a câmera no shader. A forma central das curvas
  fica estática. Material com cobertura suave e anisotropia; código de material
  Create Game Characters, licença MIT preservada em web/src/vendor/.
- 342.000 triângulos de cabelo por opção. A cabeça capturada com a opção adaptada
  totaliza 460.542 triângulos. O GLB inclui as duas opções e tem cerca de 101 MiB.
  Geometria inativa não participa da renderização.
- Sem simulação física. O contador da aplicação mostrou 60 FPS durante a inspeção
  no navegador integrado; isso não é um benchmark controlado e não foi medido em
  Quest, celular ou outros navegadores.
- O shader específico não é transportado pelo GLB. Por isso a exportação GLB pela
  interface fica desativada nesse experimento. O GLB entregue é um artefato de
  dados para o nosso aplicativo; outro visualizador pode renderizar diferente.

## Verificação

24 testes JavaScript e 18 testes Python passaram. Build de produção concluído;
permanece o aviso conhecido de chunks grandes. Console do navegador sem erros
durante importação e troca. Verificação do GLB confirmou buffer e accessors da
cabeça-base preservados, 11.400 vínculos de raiz e curvas do controle preservadas.
O relatório de verificação está junto ao GLB. Esses testes não medem realismo.

Próxima decisão: comparar visualmente as falhas do controle e do avatar, corrigir
o material/cobertura que afeta ambos e a implantação que afeta a adaptação. Uma
nova técnica só deve ser considerada aprovada após avaliação visual; passar testes
de código ou aumentar o número de fios não basta.
