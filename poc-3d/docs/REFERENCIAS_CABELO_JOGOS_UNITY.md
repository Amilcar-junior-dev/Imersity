# Referências de jogos para o cabelo da Imersity

Pesquisa em fontes primárias · 22/10/2026

## Conclusão para esta POC

Jogos são uma referência relevante para produção e exibição do cabelo. O teste
atual usa tiras com cor e transparência, curvas assistidas e material PBR genérico.
Isso valida manipulação, mas ainda não representa o conjunto de criação,
sombreamento e otimização necessário ao acabamento observado nas demos.

A recomendação é preparar um benchmark com um penteado de qualidade conhecida,
conservar seus dados de aparência e comparar a referência com a versão web. A
pesquisa não equivale a uma implementação nem autoriza migrar todo o produto.

## Unity: referência de qualidade e sistema de fios

A equipe explica que Time Ghost foi produzido na Unity 6. O sistema trabalha com
fios, colisões e redução de detalhe para diminuir o custo mantendo a aparência
do volume. É uma referência concreta para o que observar no benchmark.

Fonte: [Making of Time Ghost](https://discussions.unity.com/t/making-of-time-ghost-evolving-the-hair-system/1598213).

O pacote público importa grooms — conjuntos de fios já penteados — em Alembic e
oferece geração procedural, ligação das raízes, simulação e materiais integrados
às pipelines da Unity. Exige plataforma com compute shaders. Isso não descreve
um sistema automático que deduz qualquer penteado a partir de uma foto.

Fonte: [com.unity.demoteam.hair](https://github.com/Unity-Technologies/com.unity.demoteam.hair).

O arquivo de licença identifica Unity Companion License para projetos dependentes
da Unity. Não devemos presumir que o código possa simplesmente ser copiado para
nosso visualizador Three.js. Estudar a arquitetura e adotar o pacote dentro da
Unity são decisões distintas de portar código para outro motor.

Fonte: [licença do pacote](https://raw.githubusercontent.com/Unity-Technologies/com.unity.demoteam.hair/master/LICENSE.md).

## Unreal: do groom às representações leves

A documentação distingue fios, cards e meshes. O fluxo permite converter grooms
em cards e conservar dados como cobertura, profundidade, tangentes e atributos de
raiz. A existência de tiras não é, por si só, o problema da nossa POC: a qualidade
das curvas, do atlas e do material precisa ser avaliada em conjunto.

Fontes: [cards e meshes](https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-cards-and-meshes-for-grooms-in-unreal-engine),
[texturas de groom](https://dev.epicgames.com/documentation/en-us/unreal-engine/generating-groom-textures-in-unreal-engine),
[materiais de cabelo](https://dev.epicgames.com/documentation/unreal-engine/groom-materials-in-unreal-engine?lang=en-US).

A Epic documenta cards e meshes em todas as plataformas suportadas por seu motor,
com fios limitados a determinadas plataformas. Essa tabela é do Unreal; não é
uma certificação de desempenho no navegador ou no Quest 3.

Fonte: [suporte de plataformas](https://dev.epicgames.com/documentation/unreal-engine/groom-platform-support-in-unreal-engine).

## Criação fora do navegador

O Blender documenta interpolação de fios a partir de guias presas a uma superfície,
com controle de densidade e separação entre grupos. É uma alternativa de autoria
para desenvolver o groom de referência. Exportar curvas não garante que aparência
e material sejam preservados no GLB; a conversão e a exibição precisam de teste.

Fonte: [Interpolate Hair Curves](https://docs.blender.org/manual/en/4.2/modeling/geometry_nodes/hair/generation/interpolate_hair_curves.html).

## Navegador e Quest: oportunidade com validação pendente

A Unity anunciou WebGPU como suportado na versão 6.6, com compute shaders e
fallback para WebGL 2. Isso abre possibilidades, mas o anúncio não demonstra que
o pacote de cabelo ou a qualidade de Time Ghost funcionem integralmente na web.

Fonte: [Unity 6.6 e WebGPU](https://discussions.unity.com/t/webgpu-out-of-experimental-in-unity-6-6/1734694).

A Meta registra recursos experimentais de WebGPU/WebXR nas versões recentes do
Browser. Para o produto, é necessário detectar os recursos disponíveis e testar
no aparelho. Overdraw causado por camadas transparentes também entra no orçamento.

Fontes: [release notes](https://developers.meta.com/vr/release-notes/?search_key=browser),
[detecção de recursos](https://developers.meta.com/vr/documentation/web/browser-specs/),
[desempenho WebXR](https://developers.meta.com/vr/documentation/web/webxr-perf-bp/).

## Benchmark proposto

1. Selecionar um groom/asset com referência visual e permissão de uso conferidas.
2. Reproduzir a aparência de referência em sua pipeline prevista; se houver Unity
   disponível e compatível, ela pode ser uma bancada de comparação.
3. Gerar uma versão de cards com os mapas relevantes e material adequado à web.
4. Comparar isoladamente e depois na cabeça capturada: frente, ambos os perfis e
   vista posterior, com câmera e iluminação documentadas.
5. Medir qualidade visual, implantação, cobertura, custo de transparência, memória
   e estabilidade. Validação em Mac não substitui o teste no Quest.

Avançar somente com um resultado de qualidade demonstrada. A escolha do motor,
a adaptação automática a outras cabeças e a geração por fotografia continuam
questões separadas. Não houve instalação de motores, compra de assets ou alteração
da aplicação nesta pesquisa.
