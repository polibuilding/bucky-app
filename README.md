# Bucky · braço hidráulico por seringas

Site que gera as peças do braço a partir das seringas, da bola, do material e da impressora.
Roda direto no navegador (sem etapa de build) e pode ser publicado no GitHub Pages.

## Estado

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | Parâmetros, derivados, folgas fixas e geração das peças estruturais em STL (+ .zip) | pronta |
| 2 | Otimizador (alcance, volume, torque com a bola) e garra (palma, cubo, dedos) | próxima |
| 3 | Montagem em 3D com as juntas, simulação das seringas e verificação de colisões | — |
| 4 | Desenhos técnicos com cotas paramétricas no .zip | — |

Conferência da etapa 1 (`tests/comparar-v24.mjs`): com os valores padrão, as peças geradas têm o mesmo
tamanho do bucky v24 do Fusion e volumes dentro de ±2 % (trava-êmbolo −5 % e atuador −4 %, redesenhados).
A varredura (`tests/varredura.mjs`) gerou 3402 peças em 243 combinações de espessura, comprimentos,
posição de A, raio do giro e diâmetro da seringa, sem falhas.

## Estrutura

```
index.html            página do aplicativo
src/
  main.js             liga formulário, gerador de peças, visor e exportação
  estilo.css
  modelo/             parametros.js (entradas e padrões), folgas.js, derivados.js (fórmulas do v24)
  geometria/          kernel.js: manifold-3d (WebAssembly), perfis 2D, extrusões
  pecas/              uma peça por arquivo; index.js lista a ordem e as quantidades
  exportar/           stl.js (STL binário), zip.js (zip sem dependências)
  ui/                 formulario.js, visor3d.js (three.js)
docs/                 revisão do modelo v24 e decisões
referencia/fusion-v24 STL e geometria exportados do Fusion (base de comparação)
outputs/              exemplo de .zip gerado com os valores padrão
tests/                comparação com o v24, varredura de parâmetros, exemplo de zip (Node)
```

## Como abrir

Módulos JavaScript não rodam abrindo o arquivo direto. Use um servidor local na pasta do projeto:

- VS Code: extensão Live Server, botão "Go Live".
- Python: `python -m http.server 8000` e abra `http://localhost:8000`.

As bibliotecas (manifold-3d, three.js) vêm do jsDelivr, então o navegador precisa de internet.

## Testes (opcional, precisa de Node)

```
npm install
node tests/comparar-v24.mjs
node tests/varredura.mjs
node tests/exemplo-zip.mjs
```
