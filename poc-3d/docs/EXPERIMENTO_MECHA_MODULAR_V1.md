# Mecha lateral modular — experimento v1

22/10/2026 · interface v0.6.3

O experimento prolonga uma parte da faixa de raiz já testada. As versões curta,
média e longa reutilizam a mesma malha de raiz e o mesmo vínculo com o couro
cabeludo estimado. O corpo e as pontas seguem uma curva comum, cortada em três
comprimentos. Não foi ampliada a cabeça nem escalado o cabelo inteiro.

## Como testar

Importe `Imersity_teste_mecha_modular_v1.glb`. No painel **Teste de troca de cabelo**,
escolha **Curta**, **Média** ou **Longa** e use **Ampliar mecha**. Em janela estreita,
o painel fica abaixo do visualizador. Comece em **Cor sem luz**, gire a cabeça e
compare também **Textura + luz**. As opções anteriores continuam no seletor.

Observe se a raiz fica parada ao trocar, como o comprimento muda a silhueta e se
a mecha passa por dentro da pele ou parece flutuar. Escultura e Malha mostram as
tiras geométricas; os fios visíveis são desenhados pela transparência da textura.

## Implementação e verificação

- 76 tiras da região lateral prolongadas; 114 tiras da faixa original mantidas.
- Raiz compartilhada entre os três estilos, com coordenadas e normais preservadas.
- Corpo com 41 estações por tira; 9.120 triângulos de cabelo por estilo ativo.
  Cabeça + estilo ativo: 127.662 triângulos. Recursos compartilhados evitam triplicar
  a raiz no arquivo. Os materiais permitem a tonalização no visualizador.
- A ligação entre raiz e corpo tem as mesmas posições e UVs dos dois lados.
- Curvas e passagem pela orelha foram preparadas especificamente para esta cabeça.
  Comprimentos adicionais de 0,065 / 0,17 / 0,32 são unidades nativas sem escala
  física validada. Não devem ser apresentados como centímetros.
- O buffer original e seus accessors permanecem idênticos. O scan, o rosto e as
  orelhas não foram remodelados. Arquivo original preservado.
- 760 amostras por versão passaram por uma checagem aproximada contra triângulos
  próximos da cabeça. Nenhuma amostra mostrou sinal negativo a menos de 0,004
  unidade nativa da superfície. A versão longa teve cinco sinais negativos em
  pontos distantes (~0,08), onde normais locais de um scan aberto não indicam
  interior/exterior de forma confiável. Isso não é prova global de ausência de
  interseções nem verificação de todos os pontos das tiras.
- Testes de geometria verificam continuidade, cortes de uma curva comum e ausência
  de triângulos degenerados. Testes da interface verificam troca dos grupos,
  cores, bloqueio de escala para raízes vinculadas e preservação do rosto.

## Resultado e limites

A troca de comprimento funciona sem reposicionar a raiz. O teste visual confirmou
que a mecha pode ser observada de diferentes ângulos. O aspecto ainda é de uma
faixa fina, com fios agrupados e suporte em tiras perceptível dependendo da vista.
Ainda faltam distribuição de volume, variação de direção, sombreamento de cabelo
e acabamento da pele estimada. Não é um penteado completo ou resultado final de
salão. Não foi validado em outra pessoa ou no Quest 3.

Este teste valida a estrutura modular em uma cabeça. Não valida adaptação
anatômica automática, realismo fotográfico, colisões globais ou escala comercial.
Não utiliza um solver acadêmico, serviço externo ou créditos de IA.

## Reprodução local

```sh
python3 scripts/prepare_hair_sections.py --source CAMINHO/Imersity_teste_raiz_fios_v1.glb --output CAMINHO/Imersity_teste_mecha_modular_v1.glb
```

Requer NumPy e Pillow. O script confere o hash do arquivo-base e gera um relatório
JSON junto do GLB. Os arquivos pessoais ficam fora de `web/public`, `web/dist` e do
ZIP de código.
