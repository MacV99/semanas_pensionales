const line = '860013816     LNemIUTO DE SEGUROS 199609 | 08/10/1996 | s6053002006509 | $ 1.168.214) — $ 157.700| $ 157.700 | |» >] Cielo Doble -——';
console.log('ORIGINAL:', line);

let s = line;
s = s.replace(/\s*(?:declarado|ahorro|pago\s+recibido|pago\s+aplicado|valor\s+devuelto|nividual|nividuol|velado|aporte|ciclo|r[ee]gimen|individual|traslado|fondo|\*{2,}|=+|Tojo|ojo|jojo|fol\]|lolo|flojo).*$/i, '');
console.log('after obs strip:', s);
s = s.replace(/\$[\d.,]+/g, ' ');
console.log('after dollar strip:', s);
s = s.replace(/\d{2}\/\d{2}\/\d{4}/g, ' ');
console.log('after date strip:', s);
s = s.replace(/\b\d{5,}\b/g, ' ');
console.log('after long num strip:', s);
s = s.replace(/[oO]\s*[oO]\s*[oO]/g, ' ');
console.log('after ooo strip:', s);

const matches = [...s.matchAll(/\b(\d{1,2})\b/g)];
console.log('small number matches:', matches.map(m => m[1]));

// Also trace line L542
const line2 = '860015816      LEO               |] 200012 | 14/02/2001 | 0116802927N4RO | —$ 2.000878| -— $ 264.700) — -$ 6.600 | |] 2 aa o mi';
console.log('\nL542:', line2);
let s2 = line2;
s2 = s2.replace(/\s*(?:declarado|ahorro|pago\s+recibido|pago\s+aplicado|valor\s+devuelto|nividual|nividuol|velado|aporte|ciclo|r[ee]gimen|individual|traslado|fondo|\*{2,}|=+|Tojo|ojo|jojo|fol\]|lolo|flojo).*$/i, '');
s2 = s2.replace(/\$[\d.,]+/g, ' ');
s2 = s2.replace(/\d{2}\/\d{2}\/\d{4}/g, ' ');
s2 = s2.replace(/\b\d{5,}\b/g, ' ');
s2 = s2.replace(/[oO]\s*[oO]\s*[oO]/g, ' ');
const m2 = [...s2.matchAll(/\b(\d{1,2})\b/g)];
console.log('cleaned:', s2);
console.log('matches:', m2.map(m => m[1]));
