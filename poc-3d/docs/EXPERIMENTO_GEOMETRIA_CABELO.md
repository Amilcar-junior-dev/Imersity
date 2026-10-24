# Experimento de geometria e critério de troca de cabelo — 22/10/2026

## Evidência de partida

As capturas de tela do usuário mostram uma malha densa, porém com relevo insuficiente nos lábios. O teste com 80 quadros 2160×3840 gerou 100 mil triângulos e texturas 8K. Aumentar textura ou trocar material não modifica a silhueta. Normal maps alteram iluminação, não acrescentam a projeção dos lábios no contorno.

## Comparação controlada preparada

- A: resultado 4K full já existente, 100 mil triângulos.
- B: mesmos arquivos, sem recompressão, custom com teto de 500 mil polígonos e mapas até 8K, sem recorte.
- C: mesmos arquivos e configuração B, com volume limitado pela remoção inicial de 30% da base em Y.

B separa o efeito do limite de simplificação; C testa adicionalmente a região de reconstrução. Não subdividir a malha A nem esculpir lábios presumidos e apresentar isso como recuperação fotogramétrica. Manter originais para comparação e registrar contagem real, tempo, avisos e limites utilizados. O recorte é manual por fração do volume e pressupõe orientação vertical, sem detecção de cabeça. Pode ainda incluir parte do pescoço/fundo. Não há garantia de que recortar o volume aumente a resolução interna da reconstrução.

No perfil C, a ponte obtém bounds antes de pedir o modelo, dentro da mesma PhotogrammetrySession. Não aplica limites de um GLB normalizado a uma sessão nova. A origem e o volume aplicado ficam nos metadados do trabalho. O percentual zero permite não excluir a base.

## Critério geométrico

Comparar em Escultura, sem textura e sem normal map, de frente, 3/4 e ambos os perfis. Conferir projeção dos lábios superior/inferior, sulco sob o nariz e separação lábio/queixo. Conferir imagens originais nos ângulos correspondentes. Melhor silhueta e relevo coerente em vários ângulos contam; apenas mais triângulos, ruído ou sombra não contam. Sem referência geométrica medida não declarar precisão em milímetros.

Se B e C continuarem sem volume labial, parar de elevar apenas a contagem. Inspecionar quantos pixels a boca ocupa, nitidez real, movimento entre vistas e suavização do reconstrutor. Testar captura próxima e curta ou rota especializada em faces. Esse experimento não comprova captura comercial com 3–4 fotos.

## Cabelo: segundo critério obrigatório de viabilidade

O scan atual incorpora cabelo e cabeça em uma superfície única. O controle de visibilidade por nomes do visualizador só atua em objetos de cabelo já separados; não separa cabelo fundido. Colocar um penteado por cima pode esconder defeitos, mas não comprova troca, especialmente para um corte mais curto.

Preparar uma cabeça base com rosto preservado, orelhas, nuca e couro cabeludo contínuo. Regiões cobertas pelo cabelo atual não são observadas na captura: devem ser estimadas e marcadas como tal, ou obtidas com uma captura adequada. Separação de cabelo, preenchimento e encaixe ainda não estão implementados nesta versão.

Prova mínima posterior:

1. Separar/remover o cabelo original e completar a superfície base, verificando continuidade e preservação do rosto.
2. Usar pelo menos dois penteados como objetos independentes, incluindo um mais curto que o original. Trocar pelo navegador sem reconstruir o rosto.
3. Ajustar escala, posição e linha de implantação; conferir frente, perfis, nuca e topo. Reprovar cabelo antigo aparente, buracos, orelhas atravessadas, interpenetração evidente ou identidade facial modificada.
4. Medir tempo de troca, memória, tamanho e FPS no Mac. Validar aparência e desempenho separadamente; Quest/MR terá teste próprio quando houver dispositivo.

A primeira prova pode usar penteados simples para validar encaixe e remoção. Isso não deve ser apresentado como cabelo hiper-realista. Depois avaliar transparência, mechas, sombra, materiais e orçamento de renderização com assets de licença conhecida. A arquitetura desejada é cabeça base + penteados independentes, não um novo scan completo para cada corte.

## Estado inicial da entrega (antes das execuções abaixo)

Ponte Swift compilada com os perfis customizados e recorte; 15 testes Python e 10 JS passaram; build e controles conferidos no navegador. API de repetição verifica opções e preserva os bytes dos quadros; erro de GPU não produz sucesso fictício. O processo do Codex segue sem acesso Metal. **B/C ainda precisam de execução real pelo serviço do Terminal reiniciado. Nenhum novo modelo com lábios melhores nem cabelo substituível foi validado nesta entrega.**

## Fontes primárias

- Apple, maximumPolygonCount: teto de simplificação, sem garantir quantidade ou reconstrução de detalhe: https://developer.apple.com/documentation/realitykit/photogrammetrysession/configuration-swift.struct/customdetailspecification-swift.struct/maximumpolygoncount
- Apple, Detail.custom: https://developer.apple.com/documentation/realitykit/photogrammetrysession/request/detail/custom
- Apple, Geometry: https://developer.apple.com/documentation/realitykit/photogrammetrysession/request/geometry
- Blender, cabelo em curvas e vínculo com superfície: https://www.blender.org/download/releases/3-5/

## Execuções reais conferidas após retorno do usuário

Em 22/10/2026 foram encontrados dois trabalhos concluídos com perfil custom, ambos originados do teste 4K 72500b305d4cbd5ed09e9304b04f5805 e sem recorte. Os hashes SHA-256 confirmam as mesmas 80 imagens preparadas, byte a byte, em cada trabalho.

| Trabalho | Triângulos reais | Tempo | Texturas | Recorte |
| --- | ---: | ---: | --- | --- |
| de350288843cb03ea6c82de1bbbc9ff2 | 249.999 | 202,7 s | quatro mapas 8192×8192 | nenhum |
| 2f9ebeee988ac04a74197753e73074cc | 250.000 | 206,0 s | quatro mapas 8192×8192 | nenhum |

A contagem foi obtida dos faceVertexCounts do USDZ, convertido com usdcat. Todos os polígonos encontrados são triângulos. O teto configurado era 500 mil; a saída efetiva ficou em aproximadamente 250 mil, contra 100 mil no full 4K anterior. Não confundir teto solicitado com contagem produzida. Nenhum evento estruturado de warning foi encontrado nesses dois logs; isso não comprova ausência de artefatos geométricos.

O usuário relatou melhora perceptível na boca e ganhos sutis em outras regiões; sua captura de tela sugere maior definição do contorno labial. Ainda não houve comparação visual registrada com enquadramento idêntico nem medição de fidelidade. As texturas mantiveram 8K, portanto não houve aumento de resolução de textura em relação ao full 4K anterior. A relação causal exclusiva com a contagem de polígonos não foi demonstrada.

Próxima comparação preparada: perfil head-custom, mesmos quadros 4K, recorte inicial de 30% da base, inspecionando Escultura e ambos os perfis. Nenhuma execução head-custom foi encontrada nesta conferência. A prova de cabelos intercambiáveis continua pendente.

## Teste C executado: recorte de 30%

Trabalho 172b63aab23237505cdac988ca1485ad, concluído no Apple M2 em 272,0 s (4min32s), USDZ 102.373.519 bytes. Conferência SHA-256: os mesmos 80 quadros 4K do trabalho 72500b305d4cbd5ed09e9304b04f5805 foram preservados byte a byte. Perfil head-custom, teto de 500 mil polígonos, corte de 30% da base em Y. A saída real tem 249.999 triângulos e quatro mapas 8192×8192. Nenhum evento estruturado de warning foi encontrado.

Volume solicitado: min=(-0,4323231; 0,2731722; -0,4236776), max=(0,4323040; 1,4513831; 0,5232268). A malha final tem Y mínimo 0,27316466, coerente com o corte registrado. As coordenadas não devem ser usadas como medidas anatômicas: a escala e a correspondência entre reconstruções não foram validadas.

A base foi efetivamente recortada. O queixo permanece na inspeção lateral, mas há artefatos acima da cabeça e ainda parte dos ombros. O recorte por fração do volume não equivale a segmentar a cabeça. A comparação diagnóstica sem textura e a importação real no navegador não fornecem evidência suficiente de melhora adicional dos lábios sobre o custom sem recorte de 250 mil triângulos. A contagem praticamente igual também não comprova a densidade local ou a fidelidade.

A figura de comparação foi renderizada diretamente dos triângulos USD, sem textura e sem normal map. As poses/escala entre execuções não foram registradas entre si; a figura serve para inspecionar artefatos e preservação anatômica geral, não para medir diferenças milimétricas. O novo USDZ foi carregado no laboratório e conferido em Escultura/Perfil.

O laboratório aceita agora ?job=<id>&show=model para abrir um resultado específico concluído. O nome exibido inclui os primeiros seis caracteres do trabalho, evitando confundir o resultado com o modelo anterior. Exemplo local deste teste: http://localhost:4180/?job=172b63aab23237505cdac988ca1485ad&show=model . Não precisa reiniciar o serviço para essa alteração do frontend.

A prova de cabeça base sem cabelo fundido e de dois penteados intercambiáveis continua pendente. Nenhum cabelo foi separado ou completado neste teste.
