/* PDF vetorial mínimo, sem dependências: linhas, polígonos (com furos) e texto Helvetica.
   Unidades: mm de papel (convertidos para pontos). Texto em WinAnsi (cobre acentos do português). */
const PT = 72 / 25.4;

function cor(hex) {
  const h = hex.replace('#', ''), v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return v.map(x => x.toFixed(3)).join(' ');
}
function winAnsi(s) {
  const out = [];
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c < 128) out.push(c === 40 || c === 41 || c === 92 ? '\\' + ch : ch);
    else if (c >= 160 && c <= 255) out.push('\\' + c.toString(8).padStart(3, '0'));
    else if (c === 0x2013 || c === 0x2014) out.push('-');
    else if (c === 0x2192) out.push('->');
    else if (c === 0x2264) out.push('<=');
    else if (c === 0x2265) out.push('>=');
    else if (c === 0x2248) out.push('~');
    else if (c === 0x2212) out.push('-');
    else if (c === 0x00B0) out.push('\\260');
    else out.push('?');
  }
  return out.join('');
}

function pagina(f, A) {
  const n = v => (v * PT).toFixed(2);
  const o = [];
  for (const p of f.p) {
    if (p.t === 'x') {
      const r = (p.rot || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      const larg = p.s.length * p.tam * 0.5;
      const dx = p.anc === 'middle' ? -larg / 2 : p.anc === 'end' ? -larg : 0;
      const x = p.x + dx * c, y = p.y + dx * s;
      o.push(`BT /${p.negrito ? 'F2' : 'F1'} ${n(p.tam * 1.05)} Tf ${cor(p.cor)} rg ${c.toFixed(4)} ${s.toFixed(4)} ${(-s).toFixed(4)} ${c.toFixed(4)} ${n(x)} ${n(y)} Tm (${winAnsi(p.s)}) Tj ET`);
      continue;
    }
    const laços = p.t === 'm' ? p.laços : [p.pts], fecha = p.t === 'm' || p.fechado;
    let d = '';
    for (const l of laços) { d += l.map((q, i) => `${n(q[0])} ${n(q[1])} ${i ? 'l' : 'm'}`).join(' ') + (fecha ? ' h ' : ' '); }
    const traco = p.traco ? `[${p.traco.map(v => (v * PT).toFixed(1)).join(' ')}] 0 d` : '[] 0 d';
    const op = p.preench ? (fecha ? 'B*' : 'S') : 'S';
    o.push(`${traco} ${(p.larg * PT).toFixed(2)} w ${cor(p.cor)} RG ${p.preench ? cor(p.preench) + ' rg' : ''} 1 j ${d}${op}`);
  }
  return o.join('\n');
}

/* folhas: [Folha] -> Uint8Array */
export function pdfDeFolhas(folhas, A) {
  const objs = [];
  const add = s => { objs.push(s); return objs.length; };
  const catalogo = add(''), paginas = add('');
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  for (const f of folhas) {
    const conteudo = pagina(f, A);
    const c = add(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${paginas} 0 R /MediaBox [0 0 ${(A.w * PT).toFixed(2)} ${(A.h * PT).toFixed(2)}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`));
  }
  objs[catalogo - 1] = `<< /Type /Catalog /Pages ${paginas} 0 R >>`;
  objs[paginas - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let s = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const pos = [];
  objs.forEach((o, i) => { pos.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = s.length;
  s += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + pos.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('');
  s += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogo} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
  return b;
}
