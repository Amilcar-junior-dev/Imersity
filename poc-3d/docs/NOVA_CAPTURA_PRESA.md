# Nova captura com cabelo preso — 24/10/2026

Frente 3D/XR. O usuário refez o vídeo depois do teste de pescoço e informou
que as fotos estavam extraídas. A captura salva contém uma única origem,
80 quadros de 2160 × 3840, todos para reconstrução e nenhum reservado para
avaliação. Dados pessoais permanecem somente em `data/`, ignorado pelo Git.

## Entrada e comparação

A revisão amostral mostra cabelo preso em coque, orelhas e nuca mais expostas.
Isso melhora a observabilidade, mas não valida imobilidade, calibração ou
fidelidade anatômica. O usuário confirmou que a pessoa girou diante da câmera;
a câmera não contornou uma pessoa imóvel. Rotação do objeto é admitida pelo
Object Capture, mas articulações, deformações e fundo estático podem dificultar
a correspondência. Máscaras excluem o fundo; não corrigem mudanças de forma.
Não foi demonstrado que o giro seja a causa dos defeitos ou da demora.
O coque continua fazendo parte da superfície capturada. Referência:
[Apple: captura de fotografias](https://developer.apple.com/documentation/realitykit/capturing-photographs-for-realitykit-object-capture/).

Já havia uma reconstrução em Médio, ordenação sequencial, sensibilidade alta,
sem máscaras, concluída em 614,7 s. Produziu 49.999 triângulos, textura 4K e
29.159.301 bytes. Foram contadas 277 arestas de borda e zero não manifold;
essas contagens não medem fidelidade. A inspeção posterior em Cor sem luz e
Escultura mostra resíduos de fundo junto ao cabelo e irregularidades no busto.

Foi iniciada uma comparação `person-recovery`: cópias dos mesmos 80 quadros,
verificadas por SHA-256, máscaras explícitas por Apple Vision, ordenação
não sequencial e detalhe Médio. Nenhum preenchimento manual, elipsoide ou
recorte específico da primeira pessoa foi aplicado. As 80 máscaras foram
criadas; revisão visual amostral inclui frente, perfis e nuca. O resultado e a inspeção estão registrados abaixo.

## Interface

A opção **Pessoa · máscaras + Médio (experimental)** foi adicionada em
Reconstrução no Mac e só é habilitada se o serviço anunciar suporte. Ela
não faz segmentação de cabelo ou recorte anatômico. Os 27 testes JS e o build
passaram; a opção foi conferida no navegador com o backend Apple M2 ativo.
As fotos no navegador do usuário não foram apagadas ou transferidas de cache.
Nenhum commit, push ou envio externo foi feito.

## Critério da avaliação

Comparar frente, os dois perfis e nuca em Cor sem luz e Escultura, dando
atenção à junção cabelo/pescoço, fundo residual, orelhas e preservação facial.
Não declarar o resultado aprovado por apenas terminar. Ausência de imagens de
avaliação e mudanças simultâneas de máscara/ordenação limitam a conclusão.

## Resultado da comparação

O perfil com máscaras concluiu em **1.626,3 s (27,1 min)**, contra **614,7 s
(10,2 min)** do Médio sequencial sem máscaras: aproximadamente 2,65 vezes o
tempo nesta execução. Não é benchmark controlado nem estimativa comercial.
Produziu USDZ de **29.680.915 bytes**, **49.999 triângulos**, **25.011 vértices**
e textura **4096 × 4096**. O log não contém eventos de amostra ignorada ou
inválida. Houve 80 máscaras; origem e cópias verificadas, captura original
inalterada após a execução. Relatório privado junto ao resultado em `data/`.

A inspeção de frente, ambos os perfis e nuca em Cor sem luz, e perfis/nuca em
Escultura, mostrou remoção dos grandes resíduos claros de fundo presentes no
Médio. As arestas de borda passaram de 277 para 25, ambas as malhas com zero
arestas não manifold. Essa redução não significa modelo estanque ou anatomia
correta. A aparência facial permanece reconhecível visualmente, sem medição
independente da identidade ou precisão. Persistem irregularidades no pescoço,
atrás das orelhas, junção com cabelo e busto, visíveis também sem textura.
**Não declarar o defeito no pescoço resolvido ou qualidade hiper-realista.**

A contribuição de máscaras e ordenação não foi isolada. A confirmação de que a
pessoa girou não demonstra a causa dos defeitos ou da demora. Nenhuma nova
captura foi exigida como condição para terminar este teste. Próximo passo:
revisão visual pelo usuário e definição da região útil da cabeça antes de
preparar um recorte específico para esta pessoa. Não reutilizar coordenadas
assistidas da primeira pessoa nem esconder deformações com preenchimento
apresentado como observado. O teste ainda não valida troca de cabelo nesta
pessoa, XR, automação geral ou fidelidade métrica.
