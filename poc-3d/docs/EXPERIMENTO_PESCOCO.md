# Pescoço e nuca — experimento de detalhe concentrado

> Registro histórico: em 24/10/2026, a pedido do usuário, as mídias desta captura
> foram movidas para a Lixeira e o experimento ativo foi limpo. Os resultados
> técnicos abaixo permanecem para comparação, sem imagens ou modelos anexos.

Frente 3D/XR, 24/10/2026. O usuário identificou deformação no pescoço da segunda
captura, mesmo após a melhora da cobertura posterior com máscaras por imagem.

## Diagnóstico e hipótese

A deformação é visível em Escultura, portanto não se restringe ao material ou à
iluminação. A revisão amostral das fotos mostra a nuca encoberta pelo cabelo e
variações fortes de enquadramento na passagem posterior. Isso limita a observação
da transição entre pele e cabelo. Não foi isolada uma causa única: oclusão,
alinhamento e regularização da superfície podem contribuir. Não foi demonstrado
que movimento da pessoa seja a causa.

O fechamento da abertura posterior não validou fidelidade anatômica do pescoço.
A hipótese deste teste é verificar se maior detalhe reconstruído, concentrado na
cabeça e pescoço, melhora a região. Aumentar o teto de polígonos não garante
recuperar superfícies ocultas ou corrigir alinhamento.

## Configuração

Novo perfil interno `person-head`, preservando os 80 quadros originais da execução
anterior e a separação explícita da pessoa por Apple Vision. Foram conferidas
80 máscaras PNG idênticas byte a byte às da execução anterior. RGB não é
recortado, recomprimido ou pintado. Reconstrução usa:

- Sensibilidade alta e ordenação `.unordered`, como no teste anterior.
- Detalhe customizado com teto de 500 mil polígonos, contra cerca de 50 mil na
  saída Médio anterior. Não faz subdivisão da malha pronta.
- Textura limitada a 4K para manter a comparação centrada na geometria.
- Consulta `.bounds` na própria sessão; exclusão dos 30% inferiores do volume
  no eixo Y antes da solicitação do modelo. É um recorte espacial da região a
  reconstruir, não detecção automática da cabeça nem modelagem manual do pescoço.

O teste combina maior detalhe e menor volume de saída; não separa a contribuição
de cada mudança. O perfil não está no seletor da interface. A execução direta
cria outro trabalho privado, preservando o anterior para comparação. Nenhum
preenchimento manual ou o elipsoide do experimento rejeitado foi aplicado.

## Verificações e estado

Compilação Swift e 22 testes de backend passaram, mais dois testes do runner.
Os testes incluem encaminhamento do recorte no perfil mascarado, preservação do
comportamento de Médio, erros sem sucesso fictício e origem/cópias dos quadros.
Não houve envio ao GitHub, upload externo ou mudança do contrato do produto.

O resultado deve ser inspecionado nos mesmos ângulos em Cor sem luz e Escultura,
com atenção à curva da nuca, junção com ombros/cabelo e preservação do rosto e da
cobertura traseira. O teste não estará aprovado apenas por concluir ou gerar
mais triângulos.

## Resultado verificado

A execução concluiu em **362,9 s**, USDZ de **39.318.969 bytes**, com **249.999
triângulos** e textura **4096 × 4096**. O teto solicitado de 500 mil não é a
quantidade efetivamente produzida. Os mesmos dez IDs de amostras foram ignorados
(44 a 53), contando IDs únicos entre as solicitações da sessão. A captura de
origem permaneceu intacta.

A inspeção de perfil e oblíqua posterior, em Cor sem luz e Escultura, mostrou
que a curva artificial entre cabelo e pescoço **persistiu**. O maior detalhe e
o recorte da base não resolveram a deformação. O fechamento posterior anterior
foi preservado nas vistas conferidas. Este modelo é comparação de experimento,
não correção aprovada ou substituto declarado melhor que o anterior.

Relatórios privados `neck-verification.json` e `mask-comparison.json` ficam junto
ao trabalho em `data/`. Nenhum remendo manual ou pós-processamento de suavização
foi apresentado como reconstrução fiel.

## Próximo teste proposto

Não repetir apenas aumentos de detalhe para este defeito. Para investigar a
fidelidade da cabeça-base, propor uma captura com a pessoa imóvel, cabelo preso
ou levantado de forma estável durante toda a tomada, deixando nuca e orelhas
observáveis. Câmera deve contornar a pessoa com foco/zoom e enquadramento estáveis,
incluindo a junção entre cabeça, pescoço e ombros. É uma hipótese de protocolo,
não demonstração de que nova captura eliminará o problema. Não juntar sem revisão
um trecho com cabelo levantado a outro com cabelo solto: a superfície muda.

A necessidade de observar a nuca vem da inspeção desta captura. A recomendação de
objeto estático, várias vistas, configurações consistentes e luz difusa acompanha
a [orientação de captura da Apple](https://developer.apple.com/documentation/realitykit/capturing-photographs-for-realitykit-object-capture/).
Isso não comprova que Object Capture seja um motor validado para pessoas vivas.
