# Etapas 2 a 4: otimizador, garra de 4 dedos, montagem e desenhos

## Fluxo do site
1. O usuário informa as seringas (braço, garra, comando), a meta (esfera: massa e diâmetro), o material, a espessura `e`, a impressora e o critério (área ou volume de alcance).
2. **Otimizar** acha a garra e depois o braço que maximizam o critério e atendem a todas as verificações.
3. O site gera as peças, mostra o braço montado (com as seringas, que podem ser movidas), as folhas de desenho e exporta tudo em `meu-bucky.zip`.

O exemplo inicial é o bucky v24, com as medidas do Fusion. Mudar uma entrada depois de otimizar marca o resultado como desatualizado.

## Otimizador (`src/modelo/cinematica.js`, `otimizador.js`)
Cada junta é um triângulo eixo–ponto fixo–ponto móvel com a seringa como lado variável (lei dos cossenos).
Variáveis: abertura máxima e razão de braços do ombro, do cotovelo e do giro; ângulo inicial do braço; razão antebraço/braço.
Os comprimentos L1 e L2 saem do torque disponível (força do polegar × razão de áreas × rendimento × braço de alavanca mínimo) com o fator de segurança, limitados pela mesa da impressora.

Verificações: juntas possíveis; B, C, D e E cabem e não se sobrepõem; A à frente do eixo do ombro; torque com FS no ombro e no cotovelo; base, braço, antebraço e corpo cabem na impressora; curso da seringa de comando basta; e as verificações da garra.
Busca: 6000 amostras + refinamento por coordenadas. Configurações inválidas recebem nota negativa proporcional à violação, para o refinamento caminhar até a região válida.

Com as seringas e a bola do v24: o v24 tem 202 cm² de área e 5,6 L de volume; otimizado chega a cerca de 390 cm² (critério área) ou 16 L (critério volume).

## Garra de 4 dedos (`src/modelo/garra.js`, `src/pecas/mao.js`)
- Cada dedo é uma placa num plano paralelo ao antebraço, **deslocado de `o` do centro** (cata-vento). Assim as caudas de dedos opostos podem se cruzar atrás da palma.
- `o` é o maior entre: folga do trilho em cruz e meia-largura da seringa da garra. A seringa da garra fica atrás do antebraço, afastada `o + m` do eixo, para a aba do êmbolo passar entre os planos dos dedos. Por isso a trava-corpo da garra ganhou um colar afastador.
- Mecanismo pino-no-rasgo do otimizador antigo: pivô na palma (`rp`), pino do cubo (`rh`), rasgo na cauda de `fi` a `ff`. Empurrar o cubo para a palma abre os dedos.
- A pega da aba do êmbolo fica atrás do cubo (pescoço), depois de onde as caudas alcançam. Isso limita quanto as caudas podem cruzar o centro.
- Pinos: fio de filamento ou arame (`Dpino`); palma, cubo e dedos só têm furos.
- A palma fica entre o ressalto do antebraço e a travessa do pulso. O pulso ganhou e/2 de comprimento para a travessa ficar logo depois da ponta do antebraço.

**Achado:** com dedos retos, o pivô precisa ficar fora da seção da bola para o contato ficar à frente do equador (senão a bola escapa para a frente). Por isso a palma ficou bem maior que a do v24 (raio ~50 mm contra 28 mm).

## Montagem (`src/montagem/montagem.js`)
Placas de trás para a frente: corpo, braço, antebraço. Seringa do cotovelo pela frente; do ombro e da garra por trás. Os controles movem cada seringa entre fechada e aberta; o comprimento desenhado bate com o pedido (diferença < 1 mm).

## Desenhos (`src/desenhos/`, `src/exportar/pdf.js`)
Uma folha A4 por peça: vistas de cima e de frente (projeção do sólido), cotas com o parâmetro que define cada medida, carimbo com quantidade, material, espessura e escala. Exportadas em PDF (gerador próprio, sem bibliotecas) e SVG.
