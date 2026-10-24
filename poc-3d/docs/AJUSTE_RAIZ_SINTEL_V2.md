# Ajuste de raiz e divisão — Sintel v2

23/10/2026 · aplicação v0.6.7.

## O que mudou

O arquivo `Imersity_cabelo_referencia_Sintel_v2.glb` conserva o corpo das 11.400
curvas importadas e acrescenta 16.000 fios curtos estimados na implantação frontal
e na divisão do topo. Esses fios tomam a direção de segmentos próximos do penteado
existente. Na primeira metade, acompanham a superfície da pele; depois se afastam
para se juntar às mechas. O início recebe uma transição gradual de opacidade.

Na testa, uma envoltória frontal calculada por coordenadas baricêntricas evita que
os pontos dos fios suplementares entrem na pele capturada. No topo posterior,
usamos a aproximação elipsoidal do couro cabeludo já estimado. Trata-se de uma
correção localizada, não de um solucionador geral de colisões nem de um couro
cabeludo medido. Uma faixa estreita de implantação fica sem raízes novas para
preservar a risca. Os fios podem passar por cima dessa faixa.

O rosto, as orelhas, os UVs e as imagens da captura permanecem no buffer original.
A versão anterior continua selecionável, para comparação na mesma cor e câmera.
Não houve alteração da reconstrução original nem envio de fotos a serviços externos.

## Como comparar

1. Atualize http://localhost:4180/ e confira a versão v0.6.7.
2. Se necessário, use **Importar modelo 3D** e selecione o GLB v2 entregue.
3. No painel **Teste de troca de cabelo**, compare **Ver encaixe anterior** com
   **No meu avatar**. A cabeça de referência continua disponível.
4. Arraste para observar testa, perfil e a divisão por cima. Mantenha a mesma
   cor durante a comparação. Não é necessário reconstruir o vídeo.

## Resultado e limites

A inspeção de frente, de perfil e por cima mostrou redução das falhas na testa e
na divisão, com os fios de raiz mais próximos da pele. Ainda há áreas pontuais
de couro cabeludo aparente e acabamento a avaliar. Não classificamos isso como
hiper-realismo ou como adaptação automática validada para outra pessoa.

A opção ajustada tem 940.542 triângulos visíveis. O GLB inclui as alternativas
e ocupa aproximadamente 141 MiB. O contador do navegador integrado mostrou
60 FPS durante a inspeção; isso não é um benchmark de Quest ou celular. O
material específico continua dependendo do aplicativo para a mesma aparência.

## Verificação

Passaram os 24 testes JavaScript e os 18 testes Python existentes. Build de
produção concluído, com o aviso conhecido de chunks grandes. A inspeção no
navegador não registrou erros no console.

`verify_reference_roots.py` verifica o prefixo binário e os accessors originais,
o reúso da malha das mechas, os 16.000 vínculos de raiz e o afastamento dos pontos
suplementares em relação às superfícies locais usadas na correção. A tolerância
de comparação considera o armazenamento Float32. Esses testes não garantem
ausência de toda interseção entre segmentos nem medem realismo.

Os relatórios JSON de geração/verificação acompanham o GLB. A atribuição e as
licenças do modelo Sintel e do shader continuam preservadas. Os arquivos privados
não são colocados em web/public, web/dist ou no ZIP de código.
