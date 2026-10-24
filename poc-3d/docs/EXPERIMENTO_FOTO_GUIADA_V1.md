# Cabelo guiado por foto frontal — experimento v1

22/10/2026 · interface v0.6.5

Este teste usa o quadro `frame_00000.jpg` da captura de 80 imagens, com a cabeça
já reconstruída pelo vídeo. A foto orienta a parte frontal do cabelo. Não foi
reconstruída uma cabeça inteira a partir de uma única foto e não foi treinado
um modelo de aprendizado de máquina.

## O que vem da imagem

- Região de cabelo selecionada por um recorte explícito e pelo maior componente
  escuro conectado. É uma heurística específica desta foto, não uma segmentação
  geral de cabelo. O limite de luminância é 115.
- Contorno superior do volume escuro: ajusta a altura das pontas das guias.
  Fios soltos claros podem ficar fora desse contorno.
- Sete curvas cúbicas de direção anotadas manualmente olhando a referência.
- Cor mediana da região selecionada. Ela contém a iluminação da captura e não
  corresponde a uma medição de albedo ou da cor física do cabelo.
- Normalização aproximada pela distância entre os olhos, com pontos anotados na
  foto e no modelo. Não é registro de câmera calibrado nem medição anatômica.

## O que continua estimado

A profundidade, a distribuição em oito fileiras, as mechas ocultas e o afastamento
do couro cabeludo seguem regras geométricas. Uma proteção aproximada usa a forma
do couro cabeludo estimado; não há solver global de colisões. A cabeça-base veio
originalmente do vídeo inteiro. O experimento não é evidência de qualidade a partir
de uma única imagem para qualquer pessoa.

572 tiras representam as mechas, com fibras na transparência da textura, somando
27.456 triângulos de cabelo e 145.998 triângulos visíveis com a cabeça. A orientação
principal e o topo são guiados pela referência, mas aparência e volume 3D ainda
precisam de avaliação visual. Nuca e partes ocultas não foram validadas pela foto.

## Como abrir e comparar

Importe **Imersity_cabelo_guiado_foto_v1.glb** pelo botão **Importar modelo 3D** no
topo da página. No painel **Teste de troca de cabelo**, use **Foto guiada**,
**Lateral anterior**, **Ver de frente** e **Abrir foto de referência**. A foto está
embutida no próprio arquivo, sem depender de caminho local ou envio externo.

Compare contorno, direção do topete, volume lateral e implantação. Depois gire:
uma semelhança frontal não prova que a profundidade esteja correta. A referência
mostrada é um recorte de visualização do JPEG original, que permanece intacto.

## Verificação técnica

Os hashes do modelo-base e da foto são conferidos antes da preparação. O buffer e
os accessors originais permanecem idênticos. O verificador lê o GLB salvo, confere
os 572 vínculos, o afastamento inicial das raízes dentro da precisão float32,
normais unitárias, triângulos válidos e o hash do JPEG original embutido.

22 testes JavaScript e 18 testes Python passaram; a interface compilou. Os limites
projetados da geometria são registrados no relatório como envelope de suporte.
Eles não são uma pontuação de semelhança, máscara renderizada ou acurácia medida.
Não foi comprovada ausência global de interseções ou realismo final.

## Resultado observado

A referência original embutida, a seleção Foto guiada / Lateral anterior e a vista
frontal funcionaram no navegador. A máscara e as guias produziram uma cobertura
frontal, mas ela ainda parece uniforme, com linhas predominantemente verticais,
e não reproduziu fielmente a direção e o volume do topete da foto. Ao girar,
partes estimadas e lacunas na cobertura permanecem visíveis. O teste não passou
no critério de semelhança visual do penteado; não é uma demonstração de reprodução
automática bem-sucedida. O resultado deve orientar ajustes na representação,
e não ser tratado como exemplo 3D já aprovado para treinamento.

## O que seria “treinar” depois

Este experimento é ajuste assistido de um caso. Se a representação produzir um
resultado aceitável, podemos guardar imagens, guias, geometria e avaliações como
exemplos reproduzíveis. Antes de treinar e afirmar generalização, será necessário
repetir em outras pessoas e penteados, com casos separados para desenvolvimento e
avaliação. A separação deve ser por pessoa/captura, não apenas por quadros próximos
do mesmo vídeo. As outras fotos desta captura ajudam a conferir volume desta
pessoa, mas não demonstram generalização para novas clientes.

## Reprodução

```sh
python3 scripts/prepare_photo_groom.py --source CAMINHO/Imersity_lateral_em_camadas_v1.glb --photo CAMINHO/frame_00000.jpg --output CAMINHO/Imersity_cabelo_guiado_foto_v1.glb
python3 scripts/verify_photo_groom.py --source CAMINHO/Imersity_lateral_em_camadas_v1.glb --target CAMINHO/Imersity_cabelo_guiado_foto_v1.glb
```

Requer NumPy e Pillow. Foto, GLB e relatórios pessoais ficam fora do ZIP de código,
de `web/public` e de `web/dist`. Não houve uso de API externa ou créditos de IA.
