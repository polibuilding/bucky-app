/* Folgas fixas, em mm, medidas no DIÂMETRO (ou na largura total de um rasgo).
   Os valores reproduzem o que funcionou nas peças D10 do modelo v24, que usava
   uma folga multiplicativa tol = 1,03:
   - eixo Ø8 em furo Ø8,24  -> f_giro = 0,24
   - trava-corpo D10: Ø16,2 em Ø16,69 -> f_seringa = 0,49
   - click no eixo: furo = eixo, retenção pela abertura em C -> f_click = 0
   - rasgos de encaixe fixo e·tol = 3,09 para placa de 3 -> f_pressao = 0,09 */

export const FOLGAS_PADRAO = {
  f_pressao: 0.10, // encaixes fixos: corpo no disco, cruz antebraço/pulso, pé do atuador
  f_giro: 0.25,    // eixos, pinos das travas e pinos da mão em furos
  f_desliza: 0.30, // dedos na palma, palma e cubo no trilho, folga axial dos eixos
  f_seringa: 0.50, // travas no corpo da seringa, canal da aba do êmbolo, pino do ombro
  f_click: 0,      // click no eixo (prende pela abertura alpha)
  f_disco: 3.18,   // disco no furo da base (valor do v24; em calibração)
  f_degrau: 0.97,  // degrau do disco no ressalto da base (valor do v24)
};

export const DESCRICAO_FOLGAS = {
  f_pressao: 'Encaixes fixos (corpo no disco, cruz do trilho, pé do atuador)',
  f_giro: 'Eixos e pinos girando em furos',
  f_desliza: 'Peças que deslizam (dedos, cubo, palma) e folga axial dos eixos',
  f_seringa: 'Travas na seringa, canal da aba do êmbolo e pino do ombro',
  f_click: 'Click no eixo (pressão)',
  f_disco: 'Disco girando no furo da base',
  f_degrau: 'Degrau do disco no ressalto da base',
};
