# Bucky · braço hidráulico com seringas

Informe seus parâmetros e seu critério de otimização, e o site gera o seu Bucky otimizado:
as peças em STL, o braço montado em 3D e os desenhos técnicos em PDF.
Roda direto no navegador (sem etapa de build) e pode ser publicado no GitHub Pages.

## Estado

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | Parâmetros, folgas fixas, peças estruturais em STL | pronta |
| 2 | Otimizador (área ou volume de alcance, torque com a meta) e garra de 4 dedos | pronta |
| 3 | Braço montado em 3D com as seringas móveis | pronta |
| 4 | Desenhos técnicos (PDF e SVG) no .zip | pronta |

Detalhes em `docs/02-otimizador-garra-montagem.md`.

## Estrutura

```
index.html            página do aplicativo
src/
  main.js             liga formulário, gerador de peças, visor e exportação
  estilo.css
  modelo/             parametros.js, folgas.js, derivados.js, cinematica.js, garra.js, otimizador.js
  geometria/          kernel.js: manifold-3d (WebAssembly), perfis 2D, extrusões
  pecas/              uma peça por arquivo (mao.js: palma, cubo, dedo); index.js lista a ordem e as quantidades
  montagem/           posição de cada peça no braço montado
  desenhos/           folhas A4 com vistas e cotas
  exportar/           stl.js, pdf.js, zip.js (sem dependências)
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
node tests/otimizar.mjs
node tests/montagem.mjs
node tests/desenhos.mjs
```
