# Preservação das orelhas — revisão 3 do modelo

A revisão 2 protegia as orelhas somente depois do recorte craniano. Isso não recuperava as partes já cortadas e permitia sobreposição do complemento estimado sobre a borda posterior. A revisão 3 usa contornos distintos por lado, conferidos no scan colorido original, para preservar o volume das orelhas antes do recorte. Não gera orelhas novas por IA.

## Alterações e evidências

- Os contornos de perfil e os limiares de profundidade lateral são específicos deste scan. A proteção independe do brilho dos pixels; cavidades escuras da orelha permanecem observadas.
- 7.530 triângulos inteiros no núcleo das regiões marcadas das orelhas são preservados no recorte; 2.521 deles eram atingidos pelo recorte da revisão 2. Isso inclui a margem anatômica revisada, não é uma segmentação semântica universal.
- 9.140 triângulos das regiões protegidas de orelha no resultado, incluindo a margem de transição, conservam os atributos capturados. O preparador verifica igualdade de posição, normal e UV.
- O complemento craniano e somente vértices estimados livres foram recuados para o lado interno das orelhas. Vértices de pele observada e das orelhas protegidas permanecem fixos. Esse recuo local adicional pode ultrapassar o limite de 0,012 da suavização anterior: o deslocamento total máximo registrado é aproximadamente 0,041 nas coordenadas nativas. Não são metros validados.
- A região central do rosto conserva os mesmos 11.801 triângulos protegidos da revisão 2. O USDZ original continua intacto, verificado pelo hash da captura.
- Cabeça-base: 118.542 triângulos (54.687 capturados, 3.438 de transição estimada, 60.417 do complemento craniano). O contorno craniano possui 959 pontos e permanece fechado nessa região; o corte inferior do pescoço permanece aberto.
- Acrescentadas vistas **Outro perfil** e **Nuca** em **Inspecione a forma → Ponto de vista**, para facilitar a conferência.

A cabeça-base e o couro cabeludo continuam estimados. Pode haver pequenas franjas de textura/sombra na junção e irregularidades do preenchimento. Esta alteração trata a preservação das orelhas; não valida pele reconstruída hiper-realista nem cabelos de produção.

## Reproduzir

```sh
python3 scripts/prepare_head_base.py --refine-ears --output /caminho/Imersity_cabeca_orelhas_v3.glb
python3 -m unittest discover -s scripts/headprep -p 'test_*.py' -v
```

Oito testes passaram, incluindo uma borda posterior que o corte antigo excluía e a preservação da costura ao recuar a superfície estimada. Build de produção concluído. Dados e modelos pessoais permanecem fora do pacote de código e de web/public.

## Conferir

Atualize o laboratório e importe `Imersity_cabeca_orelhas_v3.glb`. O nome novo no rodapé e os 118.542 triângulos identificam a revisão. Use Sem cabelo, Cor sem luz, Perfil, Outro perfil e Nuca. Depois confira o relevo em Escultura. O destaque laranja identifica somente material estimado; desligá-lo aplica cor de pele aproximada.

Verificação final: GLB exportado para Downloads com 60.899.052 bytes; igualdade de POSITION e TEXCOORD_0 da superfície observada entre preparação e exportação; normais normalizadas pelo exportador conforme esperado. Triângulos estimados finitos e não degenerados. As duas opções de cabelo continuam presentes, com TRS e escala zero quando inativas. No navegador, cabeça-base 118.542 triângulos, curto 127.902 e chanel 138.284; retorno à cabeça-base conferido.
