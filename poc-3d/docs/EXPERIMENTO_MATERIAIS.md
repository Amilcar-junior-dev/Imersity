# Correção de apresentação — v0.4

## Diagnóstico

Os modos de inspeção compartilham os mesmos vértices e triângulos. Cor sem luz troca somente o material por MeshBasicMaterial e deixa de acrescentar luz à superfície. A silhueta geométrica não é alterada, mas o relevo pode ficar menos perceptível sem sombreamento. Sombras e reflexos da própria captura continuam gravados na textura.

O GLB 4K usado pelo usuário continha normalTexture.scale=2. O USD original usa scale=(2,2,2,2), bias=(-1,-1,-1,-1) para converter as normais de [0,1] para [-1,1]. O carregador USD do Three 0.186.1 também transferia o 2 para normalScale, embora o shader já faça a conversão. Essa segunda aplicação amplificava indevidamente a perturbação da iluminação.

## Correção

- USDZ: corrigir apenas o padrão de decode conhecido e normalScale=2.
- GLB: corrigir apenas arquivos com a procedência da exportação antiga desta POC. O carregador glTF pode inverter Y para tangentes derivadas; o sinal é preservado ao remover a amplificação 2×.
- Marcar a correção nos metadados para evitar aplicá-la novamente em arquivos reexportados. GLBs de outras origens e normal maps não padronizados não são alterados automaticamente.
- Cor + forma: material difuso com a cor original e iluminação, sem normal/rugosidade/oclusão do scan nem brilho especular. É um modo de inspeção, não um método para reconstruir novos detalhes ou remover a iluminação gravada nas imagens.
- Os arquivos originais e a geometria não foram substituídos. A correção de material é aplicada ao carregar o arquivo na aplicação e incorporada se ele for exportado novamente.

## Verificação

Dez testes JS passaram, incluindo proteção de arquivos externos, correção idempotente, preservação do sinal Y e dos vértices e isolamento do material difuso. Build concluído. O GLB real em Downloads foi reimportado e a aplicação confirmou a correção; Cor + forma foi inspecionado no navegador sem erros de console.

A falta de definição dos lábios em perfil não foi resolvida por esta correção. O próximo experimento deve avaliar geometria mais detalhada/concentrada na cabeça, usando as capturas existentes como referência antes de pedir outra gravação. Acrescentar polígonos por subdivisão ou aparência por normal map não comprova recuperação de volume anatômico fiel.

Referências: https://openusd.org/release/spec_usdpreviewsurface.html e https://threejs.org/docs/pages/MeshStandardMaterial.html
