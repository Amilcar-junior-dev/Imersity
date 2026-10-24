# Isolamento das capturas — v0.6.8

Registro de 23/10/2026, frente 3D/XR.

## Falha observada

A importação de vídeo acrescentava quadros à lista existente. No teste com uma
segunda pessoa, o pacote enviado tinha 160 imagens: 80 de cada um de dois vídeos.
O backend aceitava esse pacote e concluía um resultado que não servia para avaliar
a nova captura isoladamente.

Os 80 quadros novos foram recuperados do ZIP original, selecionando sua origem
`sourceVideo`. Seus bytes foram conferidos após a separação. Nenhum arquivo da
captura anterior foi apagado. A recuperação e seus artefatos ficam em `data/`,
fora do Git; a nova reconstrução usa exclusivamente esses 80 quadros, em Médio.

## Correção

- O navegador recusa importar vídeo enquanto já houver imagens no experimento.
- O botão **Novo experimento** fica visível também na página de capturas e abre
  a confirmação de limpeza existente. Antes da limpeza, o usuário deve guardar
  o pacote de captura e modelos que deseje preservar.
- A submissão é bloqueada quando a lista contém vídeos distintos ou mistura
  quadros de vídeo com fotos sem origem identificada.
- O backend valida a mesma regra antes de extrair imagens e ao repetir trabalhos.
  Capturas antigas misturadas ficam identificadas e indisponíveis para repetição.
- Ao limpar, o polling e salvamentos pendentes são interrompidos, e os parâmetros
  de trabalho da URL são removidos, evitando reabrir o resultado anterior.
- O progresso exibe a quantidade de quadros do trabalho aberto, que pode vir do
  Mac mesmo quando não há fotos carregadas na lista do navegador.

## Verificação e limites

Passaram 27 testes JS, 18 testes de backend e o build web. Incluem regressões para
vídeos diferentes com nomes de quadros iguais, bloqueio antes de escrita e
rejeição de repetição de captura misturada.

O bloqueio confere a procedência registrada; não reconhece identidades em fotos.
Um conjunto manual ou vídeo que já contenha várias pessoas ainda exige revisão.
Não foi implementada gestão de múltiplos clientes/experimentos simultâneos.
O núcleo React e o contrato de integração permanecem sem alteração.
