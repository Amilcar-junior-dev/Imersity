# Imersity Lab — web

POC estática com reconstrução facial aproximada por foto, inspeção de malhas e Gaussian Splatting, organização de capturas e conexão opcional ao backend GPU.

```sh
npm install
npm run assets
npm run dev -- --port 5173
```

`npm test` verifica funções geométricas, manifesto e métricas; `npm run build` gera `dist/`.

Fotos e modelos carregados são processados/salvos no próprio navegador (IndexedDB). Envio de capturas só ocorre por ação explícita na aba GPU. Não use esta aproximação como scan métrico: cabelo, crânio, orelhas e regiões ocultas não são reconstruídos pelo modo foto única.

Na distribuição completa do projeto, `../backend/` contém o serviço FastAPI que executa COLMAP + Splatfacto em Linux/NVIDIA. Ele precisa ser provisionado separadamente: a hospedagem estática não oferece GPU. A raiz do projeto contém as instruções completas e os limites da POC.
