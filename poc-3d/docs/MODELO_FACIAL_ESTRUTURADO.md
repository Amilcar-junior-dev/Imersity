# Geometria facial estruturada — revisão de 24/10/2026

Estado: pesquisa e proposta de experimento. Nenhuma nova reconstrução ou alteração
de código foi executada nesta revisão. Nenhuma escolha de fornecedor aprovada.

## Pergunta do usuário

Depois de observar deformações na nova captura, o usuário perguntou como geradores
de imagem para 3D e sistemas de personagens de jogos impõem uma estrutura para
nariz, boca, maxilar, orelhas e pescoço, e se já usamos isso.

## Estado verificado da POC

O ramo multivista fornece RGB e, no perfil person-recovery, máscaras Apple Vision
por pessoa para RealityKit PhotogrammetrySession. Nosso código não registra uma
malha humana canônica nas imagens, não identifica semanticamente cada região
anatômica para o ajuste e não impõe um modelo paramétrico facial. A máscara separa
pessoa/fundo; não é segmentação anatômica. O ramo separado de foto frontal usa
landmarks MediaPipe para uma superfície facial aproximada, sem cabeça e pescoço
completos. Não transferir essa capacidade ao ramo multivista.

FLAME, DECA, MICA, MetaHuman e priors de reconstrução já constam da pesquisa
POC_PESQUISA_TECNICA.md de 21/10; eram referências/candidatos, não integrações
executadas. A revisão atual confirma a distinção entre estudo e validação.
Não fazemos afirmações sobre todos os mecanismos internos proprietários da Apple.

## Referências primárias conferidas

- [FLAME](https://flame.is.tue.mpg.de/): modelo estatístico de cabeça aprendido de
  scans, com forma, expressão e articulações de mandíbula, pescoço e olhos.
  É uma base a ajustar; não recupera automaticamente informação individual oculta.
- [DECA](https://deca.is.tue.mpg.de/): estima forma, aparência, expressão, pose,
  iluminação e detalhe por deslocamento a partir de imagem. Detalhe inferido não
  equivale a anatomia medida. Não é implementação instalada na POC.
- [MetaHuman Identity](https://dev.epicgames.com/documentation/en-us/metahuman/metahuman-identity-asset):
  usa template, marcadores, ajuste ao volume, aproximação de base e deltas de
  forma. A Epic reconhece que nem todo detalhe de entrada é preservado.
- [SIRA++ / Crisalix](https://crisalixsa.github.io/sira-plus-plus/): utiliza
  conhecimento prévio aprendido de forma/aparência para orientar ajuste de SDF
  por renderização diferenciável, com imagens, máscaras e poses de câmera.
  Não demonstra que o motor comercial seja distribuído como API de malha modular.
- [Hunyuan3D 2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2): exemplo aberto de
  geração de forma condicionada por imagem e síntese de textura separada. Não
  atribuir sua arquitetura ao Meshy. Geometria plausível não comprova fidelidade
  à pessoa, especialmente no que não foi fotografado.

## Experimento proposto

Comparar a fotogrametria atual com uma cabeça-base humana ajustada às mesmas
fotos e, quando útil, ao scan. Estimar pose por vista e forma compartilhada,
separando expressão/movimento quando o método suportar. Usar landmarks,
silhuetas e evidência multivista para orientar um ajuste regularizado. Preservar
assimetrias e evidência observada; registrar regiões inferidas. Só depois refinar
detalhes e projetar textura, avaliando também a geometria sem textura.

Critérios: coerência do pescoço, perfis, orelhas e mandíbula; preservação visual
de identidade; falhas/tempo/manualidade; imagens de avaliação separadas quando
possível. Retopologia sozinha não reconstitui informação ausente. Template pode
suavizar demais ou aproximar a pessoa de uma média; por isso precisa de comparação.
Não prometer qualidade superior antes do teste. Cabelo segue uma etapa distinta.

Impacto para aplicação: nenhuma alteração de contrato, stack ou API. É proposta
para o motor de reconstrução atrás do adaptador previsto, não migração de produto.

## Pré-requisitos verificados — 24/10/2026

O usuário perguntou se podemos usar essas técnicas e o que falta. As 80 fotos e
os dois modelos da captura atual continuam disponíveis. Não foi encontrado
modelo FLAME nos diretórios consultados do projeto, origem e Downloads. O
ambiente científico consultado contém NumPy/Pillow, mas não PyTorch, SciPy ou
OpenCV; preparar um ambiente isolado permanece trabalho de implementação.

O link oficial de FLAME2023Open.zip apresenta login/cadastro. Portanto, a
obtenção do arquivo pelo titular da conta é o pré-requisito pendente para
iniciar o ajuste dessa base. Não solicitar senha. A página oficial distingue
FLAME 2023 Open das versões acadêmicas anteriores. Não foi aceito nenhum termo,
criada conta, instalado pacote ou baixado peso nesta verificação.

PyTorch documenta backend Metal/MPS em macOS, mas isso não valida o pipeline
inteiro no M2. O primeiro ajuste deverá verificar CPU/MPS e dependências
individualmente; não foi comprovada necessidade de GPU remota. O teste usará
as fotos existentes; tempo, qualidade e preservação de identidade seguem
pendentes de implementação e comparação.
