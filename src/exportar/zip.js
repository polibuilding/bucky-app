/* ZIP mínimo, sem dependências. Comprime com deflate (CompressionStream) quando o
   navegador oferece; senão guarda sem compressão. */
const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TABELA[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

async function deflate(b) {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const s = new Blob([b]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  } catch (e) { return null; }
}

/* arquivos: [{nome, dados: Uint8Array | string}] -> Blob */
export async function criarZip(arquivos) {
  const enc = new TextEncoder(), partes = [], central = [];
  let pos = 0;
  const agora = new Date();
  const dt = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
  const hr = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
  for (const a of arquivos) {
    const dados = typeof a.dados === 'string' ? enc.encode(a.dados) : a.dados;
    const nome = enc.encode(a.nome), crc = crc32(dados);
    const comp = await deflate(dados);
    const usar = comp && comp.length < dados.length ? comp : dados, metodo = usar === dados ? 0 : 8;
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
    loc.setUint16(8, metodo, true); loc.setUint16(10, hr, true); loc.setUint16(12, dt, true);
    loc.setUint32(14, crc, true); loc.setUint32(18, usar.length, true); loc.setUint32(22, dados.length, true);
    loc.setUint16(26, nome.length, true); loc.setUint16(28, 0, true);
    partes.push(new Uint8Array(loc.buffer), nome, usar);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, metodo, true); cen.setUint16(12, hr, true); cen.setUint16(14, dt, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, usar.length, true); cen.setUint32(24, dados.length, true);
    cen.setUint16(28, nome.length, true); cen.setUint32(42, pos, true);
    central.push(new Uint8Array(cen.buffer), nome);
    pos += 30 + nome.length + usar.length;
  }
  const tamCentral = central.reduce((s, b) => s + b.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamCentral, true); fim.setUint32(16, pos, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], { type: 'application/zip' });
}
