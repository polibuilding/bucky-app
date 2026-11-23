# Bucky: revisão do modelo v24 e proposta de parametrização

Base: documento `bucky v24` no Fusion (45 parâmetros de usuário, 19 componentes, 27 esboços), as fotos do protótipo montado, a Apresentação parcial e as respostas de 23/11.
As exportações usadas nesta revisão estão em `referencia/fusion-v24/` (STL de cada peça, `sketches.json` com a geometria e as cotas de cada esboço, `parametros.json` e `model_params.json`).

---

## 1. Montagem

### Seringas e travas

| Movimento | Corpo da seringa (trava-corpo) | Êmbolo (trava-êmbolo) | Seringa |
|---|---|---|---|
| Giro | **G0**: orelha da base, a `dg0` do eixo de giro. Sem click | **G1**: ombro, na ponta da aba do corpo, a `dg1` do eixo de giro | D10 |
| Ombro | **A**: corpo, em (`xA`, `yA`) a partir do eixo 1 | **B**: braço, a `d1` do eixo 1 | D10 |
| Cotovelo | **C**: braço, a `d2` do eixo 2 | **D**: antebraço, a `d3` do eixo 2 | D10 |
| Garra | **E**: antebraço, a `L2 − d4` do eixo 2 (trava-corpo D5) | cubo (o canal da aba do êmbolo faz parte do cubo) | D5 |
| Comando | atuador, 4 encaixes inclinados. Sem click | (apoio do polegar `atuador-d20`, oculto no Fusion) | D20 × 4 |

Contagem de clicks: 2 eixos + 3 trava-êmbolo (G1, B, D) + 2 trava-corpo D10 (A, C) + 1 trava-corpo D5 (E) = **8**, igual à apresentação.

### Articulações
- **Eixo 1** liga corpo e braço, no topo do corpo, a uma altura `L0` acima da mesa.
- **Eixo 2** liga braço e antebraço.
- Os dois eixos têm haste Ø `D0` e comprimento `3,1·e`: duas placas, o anel do click e 0,3 mm de folga axial. Fecham com click.
- **Giro:** o disco gira dentro do furo da base, apoiado num degrau a meia espessura. O corpo entra em pé no rasgo do disco, e o eixo de giro passa pelo meio do pé do corpo, embaixo do eixo 1.
- **Mão:**
  - O antebraço termina num garfo (rasgo de largura `e`). O pulso, em forma de T, encaixa nele em cruz (meia-madeira) e forma um trilho de seção "+" (3e × e).
  - O cubo desliza nesse trilho, empurrado pelo êmbolo da D5. A palma fica presa na ponta.
  - Os dedos pivotam em pinos da palma e têm um rasgo na cauda, onde corre um pino do cubo. É o mesmo mecanismo pino-no-rasgo do otimizador.

### Camadas em Z (pelas fotos)
De trás para a frente: **corpo → braço → antebraço**. As seringas do ombro e do cotovelo ficam pela frente. A seringa do ombro sai da face da frente do corpo (A) e vai até a face da frente do braço (B), com um desnível de uma espessura `e`, que as folgas absorvem.

---

## 2. Peças

Quase todas as peças são **um perfil 2D extrudado** com espessura `e`. As exceções são as travas, o click, o eixo e o cubo, que juntam extrusões e revoluções. Isso facilita gerar as peças no site.

| Peça | Qtd | Forma | Parâmetros que governam | Medidas fixas no Fusion |
|---|---|---|---|---|
| Base | 1 | Anel de espessura `hb` com 4 elementos (abaixo) | `Rd`, `Rb`, `dg0`, `se`, `D1`, `e`, `hb`, `tol` | ângulos 100°, 135°, 170° |
| Disco | 1 | Disco Ø `Rd`, degrau Ø `Rd − 3e` a meia espessura, rasgo `Lb` × `e` | `Rd`, `Lb`, `e`, `hb`, `tol` | — |
| Corpo | 1 | Placa: pé `Lb` (entra `hb` no disco), olhal do eixo 1 na altura `L0`, olhal de A em (`xA`, `yA`), aba de giro até `dg1 + (D1+e)/2` na altura `hb + LE10 + 2e` com rasgo para o ombro | `L0`, `xA`, `yA`, `Lb`, `dg1`, `D0`, `D1`, `se`, `hb`, `LE10`, `e` | raios 20, 15, 5, 2; larguras 3, 10, 20 |
| Ombro | 1 | Plaquinha em L (`D1+2e` de lado), furo do pino, pé que entra no rasgo da aba | `D1`, `e`, `tol²` | raios 3 e 2 |
| Braço | 1 | Barra `L1` com olhais Ø `2·se`; furos `D0` nas pontas e `D1` em B e C | `L1`, `d1`, `d2`, `D0`, `D1`, `se` | — |
| Antebraço | 1 | Barra com furos no eixo 2, E e D; depois de D vira trilho de largura `3e` com garfo até `L2` e ganchos na ponta | `L2`, `d3`, `d4`, `D1`, `e` | rasgo do garfo 44,05 |
| Pulso | 1 | T: haste `(L2 − d3) − D1 − 2e` × `3e`, rasgo da raiz até `(L2 − d3)/2`, travessa na ponta | `L2`, `d3`, `D1`, `e` | — |
| Palma | 1 | Disco Ø `rp + 2e`, furo em cruz do trilho, 4 rasgos para os dedos, pinos dos pivôs integrados | `rp`, `e`, `Dpino` | 0,1545 cm × 6; 30°, 60°, 150°; 0,2 cm; varreduras dos pinos |
| Cubo | 1 | Bloco com furo em cruz, anel Ø `6e`, canal da aba do êmbolo D5, rasgos para as caudas com pinos | `e`, `LE5`, `Dpino` | 1,44 cm × 4 (raio dos pinos); 0,35 cm (aba da D5) |
| Dedo | 4 | Barra em V: trecho reto `Ld·1,2` com almofada na ponta, cauda a `alfa` com rasgo, furo do pivô na dobra | `Ld`, `alfa`, `Dpino` | cauda 40; fim do rasgo 35; rasgo 25; almofada 10 × 4; meia-largura 3 |
| Eixo | 2 | Cabeça Ø `2·D0` × 1,5 mm + haste Ø `D0` × `3,1·e` | `D0`, `e` | — |
| Click | 8 | Tampa Ø `2·D0` × 1,5 mm + anel em C de espessura `e`, furo `D0`, abertura `alpha` | `D0`, `alpha`, `e` | — |
| Trava-corpo D10 / D5 / D20 | 3 / 1 / 4 | Anel Ø `D + e` com espessura `D1`, assento Ø `D` na metade, furo do bico `db`, pino `D1` de comprimento `2e` (D5: `3e`) | `D`, `db`, `D1`, `e`, `tol` | — |
| Trava-êmbolo D10 | 3 | Placa com canal em C: largura `LE10`, fenda `1,5·ee10`, lábios `fe10`; pino `D1` no centro | `LE10`, `ee10`, `fe10`, `D1`, `e` | — |
| Atuador | 1 | Arco entre Ø `Rb` e Ø `2,4·dg0`, de 100° a 170°, com 4 suportes inclinados e furos `D1` para as trava-corpo D20 | `Rb`, `dg0`, `D1`, `e` | 100°, 170°; inclinação 120°; altura 15; passo 80; filete 5 |
| Atuador-D20 (apoio do polegar) | 4? | Canal da aba do êmbolo D20 + cúpula | `LE20`, `ee10`, `fe10`, `ded` | — |

Detalhes da base: furo central Ø `Rd + folga`, com o degrau de apoio do disco a meia espessura; contorno externo Ø `2,4·dg0`; orelha em `dg0`, de largura `2·se`, com furo `D1`; rasgo em arco para o pé do atuador.

Na trava-corpo, o pino fica no plano da face da frente do corpo da seringa, onde começa o bico. Na trava-êmbolo, o pino fica no plano do meio da aba do êmbolo. Por isso o comprimento "pino a pino" da seringa é a distância entre esses dois planos.

---

## 3. Parâmetros do Fusion: significado e uso

| Parâmetro | Valor | O que é (pelo uso) | Onde aparece | Situação |
|---|---|---|---|---|
| L0 | 80,2 | Altura do eixo 1 acima da mesa | corpo | ok |
| L1 | 130 | Eixo 1 → eixo 2 | braço | ok |
| L2 | 150 | Eixo 2 → ponta do trilho | antebraço, pulso | ok |
| d0 | 101,6 | Eixo 1 → A | — | **não usado** (A vem de xA, yA) |
| d1 | 89,9 | Eixo 1 → B | braço | ok |
| d2 | 103,2 | Eixo 2 → C | braço | ok |
| d3 | 61,9 | Eixo 2 → D | antebraço, pulso | ok |
| d4 | 120 | E → ponta do trilho | antebraço | ok |
| xA, yA | 88,3; 50,2 | A em relação ao eixo 1 (à frente e abaixo) | corpo | ok; xA também define Lb |
| dg0 | 83,5 | Eixo de giro → G0 | base, atuador | ok; também define o Ø externo da base (2,4·dg0) |
| dg1 | 83,5 | Eixo de giro → G1 | corpo (aba) | ok |
| Ld | 53,5 | Comprimento do dedo | dedo, como `Ld·1,2` | o fator 1,2 esconde o significado |
| rp | 50 | **Diâmetro** do círculo dos pivôs | palma | o nome diz raio |
| alfa | 35° | Ângulo da cauda do dedo | dedo | ok |
| nd | 3 | Número de dedos | — | **não usado**: a palma tem 4 rasgos fixos |
| rh | 33,8 | (raio do cubo no otimizador antigo) | — | **não usado**: o raio dos pinos do cubo está fixo em 14,4 |
| Dpino | 2,5 | Pinos da mão | palma, cubo, dedo | ok |
| D10, D5, D20 | 16,2; 13,2; 20,7 | Ø externo do corpo da seringa | travas | ok |
| db10, db5, db20 | 9,4; 5,5; 9,4 | Ø da base do bico | travas | db10 e db20 sem folga; db5 com tol |
| LE10, LE5, LE20 | 19; 15; 21,5 | Largura do canal da aba do êmbolo | trava-êmbolo, cubo, atuador-d20 | ok |
| ee10 | 2 | Espessura da aba do êmbolo D10 | trava-êmbolo D10 **e D20** | a D20 usa o valor da D10; a D5 tem 3,5 fixo no cubo |
| fe10 | 4 | Largura dos lábios do canal | trava-êmbolo D10 e D20 | virar parâmetro geral |
| cs10 | 87,5 | Comprimento do corpo da seringa | só numa extrusão suprimida | **não usado** |
| Dl1 (= cs10), cs5, cs20 | — | — | — | **não usados** |
| ded | 17 | Largura do dedo do usuário (apoio do polegar) | atuador-d20 | ok |
| e | 3 | Espessura das placas e paredes | 83 usos | entrada do usuário |
| hb | 2·e | Espessura da base e do disco | 9 usos | ok |
| ce | e | Espessura do anel do click (comprimento extra do pino da trava-êmbolo) | 1 uso | fundir com e |
| se | 10 | Meia-largura dos elos (olhais Ø 2·se) e da orelha da base | base, braço, corpo | derivar: `D0/2 + 2e` dá os mesmos 10 |
| D0 | 8 | Ø do eixo | eixo, click, braço, corpo | ok; o furo do eixo 2 no antebraço usa D1 (hoje igual) |
| D1 | 8 | Ø do pino das travas | 27 usos | ok |
| alpha | 90° | Abertura do click em C | click (e linhas de construção nas travas-corpo) | ok |
| tol | 1,03 | Folga multiplicativa | 38 usos | **substituir por folgas fixas** (seção 4) |
| Lb | xA | Comprimento do pé do corpo e do rasgo do disco | corpo, disco | preso a xA sem motivo físico |
| Rd | 1,2·Lb | **Diâmetro** do disco | disco, base | o nome diz raio |
| Rb | 150 | **Diâmetro** interno da faixa do atuador | base, atuador | o nome diz raio |

---

## 4. Folgas

Hoje a folga é `tol = 1,03` vezes o diâmetro. As referências que você aprovou correspondem a:

| Encaixe | Expressão hoje | Folga real (no diâmetro) |
|---|---|---|
| Eixo D0 no furo (gira) | `D0·tol` | **0,24** ✔ referência |
| Pino D1 das travas no furo (gira) | `D1·tol` | 0,24 |
| Pino D1 no furo do ombro | `D1·tol²` | 0,49 |
| Click no eixo | `D0`, abertura 90° | **0** (entra por pressão) ✔ referência |
| Folga axial do eixo | `3,1e − 3e` | 0,3 |
| Trava-corpo D10 no corpo da seringa | `D10·tol` | **0,49** ✔ referência |
| Trava-corpo D5 / D20 | `D·tol` | 0,40 / 0,62 (muda com o diâmetro) |
| Corpo no rasgo do disco; cruz antebraço-pulso | `e·tol` | 0,09 (fixo por pressão) |
| Dedos nos rasgos da palma; trilho na palma e no cubo | `e·1,1`; `3e·1,1` | 0,3 / 0,9 |
| Disco no furo da base | `Rd·tol` | **3,18** |
| Degrau do disco | `(Rd−3e)·1,01` | 0,97 |
| Pinos da mão | `Dpino·tol` | 0,075 |

**Proposta:** cinco folgas fixas em mm, com os valores que funcionaram nas peças D10:

| Folga | Valor | Onde |
|---|---|---|
| `f_pressao` | 0,10 | encaixes fixos: corpo no disco, cruz do trilho, ombro na aba, pé do atuador |
| `f_giro` | 0,25 | eixos, pinos D1 e pinos da mão em furos |
| `f_desliza` | 0,30 | dedos na palma, palma e cubo no trilho; folga axial dos eixos |
| `f_seringa` | 0,50 | travas no corpo da seringa e no bico, canal da aba do êmbolo |
| `f_click` | 0 | click no eixo (a retenção vem da abertura `alpha`) |

O disco na base fica à parte (seção 6).

---

## 5. Proposta de parâmetros do aplicativo

### 5.1 O que o usuário informa
- **Seringas** (braço D10, garra D5, comando D20). Para cada uma, 6 medidas com paquímetro:
  1. Ø externo do corpo (`D`)
  2. Ø da base do bico (`db`)
  3. Ø da aba do êmbolo (`LE`)
  4. Espessura da aba do êmbolo (`ee`)
  5. `cf`: da face do corpo onde começa o bico até o meio da aba do êmbolo, com o êmbolo todo empurrado
  6. `ca`: a mesma distância com o êmbolo puxado até a última marca útil

  O app usa `cf` e `ca` direto como comprimentos pino a pino, porque os pinos das travas ficam exatamente nesses dois planos.
- **Bola:** massa e diâmetro.
- **Material:** preset PLA (densidade, resistência), editável.
- **Espessura** `e` (padrão 3 mm).
- **Impressora:** X × Y × Z (padrão 220 × 220 × 250).
- **Número de dedos** `nd` (2 a 4).
- **Avançado:** força do polegar (40 N), fração útil do curso, folgas, `D0`, `D1`, `Dpino`, `alpha`, `ded`.

### 5.2 O que o otimizador define
`L0`, `L1`, `L2`, `xA`, `yA`, `d1`, `d2`, `d3`, `dg0`, `dg1` (giro), `d4` (E) e, na garra: `rp`, `Ld`, `alfa`, raio dos pinos do cubo (hoje 14,4 fixo) e início e fim do rasgo da cauda (hoje 10 a 35 fixos).

Os critérios são os de hoje:
- área de alcance e volume máximo;
- torque com fator de segurança, considerando a massa da bola;
- cauda do dedo sem colidir com o antebraço;
- cada peça cabendo na mesa X × Y e na altura Z.

### 5.3 O que é derivado (fórmulas fixas no app)

| Derivado | Fórmula | Hoje |
|---|---|---|
| `hb` | `2e` | igual |
| `se` | `D0/2 + 2e` | 10 fixo |
| `Lb` | `xA`, com limite mínimo pela estabilidade | igual |
| `Rd` | `1,2·Lb` | igual |
| Ø externo da base | `2,4·dg0` | igual |
| Altura da aba de giro | alinha o eixo da seringa de giro entre G0 (na base) e G1 (no ombro) | `hb + LE10 + 2e` |
| Rasgo do garfo e do pulso | `(L2 − d3)/2` | 44,05 fixo no antebraço |
| Ângulos dos rasgos da palma e do cubo | `360°/nd` | 30°, 60°, 150° fixos |
| Arco do atuador | 4 encaixes com passo que caiba a D20 + paredes | 100° a 170°, passo 80 |
| Raios de concordância | proporcionais a `se` (`2·se`, `1,5·se`, `se/2`) e um filete fixo de 2 mm | fixos em mm |

---

## 6. Pontos em aberto

1. **Camadas:** confirmar a ordem corpo → braço → antebraço, com as seringas pela frente. O app vai seguir essa regra e verificar colisões.
2. **Disco na base:** a folga hoje é 3,2 mm no diâmetro. O giro está bom assim? Se estiver, mantenho uma folga própria do disco (`f_disco`); se estiver solto demais, proponho 1,0 mm.
3. **Pinos da mão (Dpino 2,5):** são impressos (como as varreduras na palma) ou de metal (prego ou arame)? Isso muda a folga e a geração da palma.
4. **Atuador-D20 (apoio do polegar):** está oculto no Fusion e fora da sua lista. Entra no kit (4 unidades)?
5. **Pino do ombro com folga 0,49** (`D1·tol²`): foi de propósito, para o pino girar mais solto? Se sim, ele passa a usar `f_seringa`.

---

## 7. Estrutura proposta do projeto (site, sem etapa de build)

```
bucky-app/
├─ index.html
├─ src/
│  ├─ main.js
│  ├─ modelo/      parâmetros, derivados, cinemática, otimizador, verificações
│  ├─ pecas/       um módulo por peça: perfil 2D → extrusão/revolução → malha
│  ├─ montagem/    posições e juntas, visualização 3D
│  ├─ desenhos/    folhas técnicas em SVG/PDF com cotas paramétricas
│  ├─ exportar/    STL de cada peça + desenhos → .zip
│  └─ ui/
├─ public/         ícones e fontes
├─ docs/           esta revisão e o manual
├─ referencia/     exportações do Fusion (v24)
├─ outputs/        exemplos de .zip gerados
└─ tests/          verificações automáticas das peças e do otimizador
```

Bibliotecas por CDN com import map, sem Node: three.js (3D), manifold-3d (operações booleanas para gerar as peças), JSZip (zip), jsPDF + svg2pdf (desenhos em PDF). O site publica no GitHub Pages como os outros aplicativos. Para testar no computador, basta um servidor local (Live Server do VS Code ou `python -m http.server`), porque módulos JavaScript não rodam abrindo o arquivo direto.

---

## 8. Decisões de 23/11

| Ponto | Decisão |
|---|---|
| Camadas | O que importa é **alternar os lados das seringas do ombro e do cotovelo**. Regra do app: placas de trás para a frente corpo → braço → antebraço; seringa do cotovelo **pela frente** (como no protótipo); seringa do ombro **por trás**; seringa da garra (D5) **por trás** do antebraço, para não cruzar a trava-êmbolo do ponto D. O app vai verificar colisões com essa regra. |
| Disco na base | Mantida a folga do v24 (`f_disco` = 3,18 mm no diâmetro) enquanto o disco é calibrado. |
| Pinos da mão | Não são impressos: fio de filamento ou arame. A palma, o cubo e os dedos terão só furos `Dpino`. |
| Apoio do polegar (atuador-d20) | Fora do kit. |
| Pino do ombro | Folga maior de propósito (`D1 + f_seringa` = 8,5 mm). |
| Seringas | As medidas `cf` e `ca` são tomadas até o meio da aba do êmbolo. O pino da trava-êmbolo fica `(fenda + parede)/2` além desse plano (2 mm no D10); o app soma esse desvio no comprimento pino a pino. |
