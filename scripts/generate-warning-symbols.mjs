import {writeFile} from 'node:fs/promises';
const pictures={
  general:'<path d="M47 30h7l-1 27h-5Z"/><circle cx="50" cy="65" r="4"/>',
  hump:'<path d="M24 67h8q7-22 18-22t18 22h8v6H24Z"/>',
  rail:'<path d="M36 38h28v22H36Z"/><path d="m38 58-7 17m31-17 7 17M31 67h38M31 73h38" stroke="#111" stroke-width="4" fill="none"/><path d="M42 30h16v6H42Z"/><rect x="40" y="41" width="7" height="9" fill="#ffd75c"/><rect x="53" y="41" width="7" height="9" fill="#ffd75c"/>',
  pedestrian:'<circle cx="51" cy="32" r="5"/><path d="m51 39-7 16 10 5 6 14m-16-19-9 18m13-29 13 8m-14-8-9 9" stroke="#111" stroke-width="5" fill="none"/><path d="M24 77h52" stroke="#111" stroke-width="4"/>',
  school:'<circle cx="43" cy="35" r="5"/><circle cx="61" cy="42" r="4"/><path d="m43 42-6 15 10 5 4 12m-14-17-7 17m12-28 13 9 6-7 5 13 6 12m-12-13-6 13" stroke="#111" stroke-width="4" fill="none"/>',
  bend:'<path d="M42 74V55q0-11 15-11h9V33l13 16-13 16V54h-9q-5 0-5 5v15Z"/>',
  slippery:'<path d="m38 37 24-4 7 16-30 6Z"/><circle cx="43" cy="57" r="4"/><circle cx="65" cy="53" r="4"/><path d="M43 63q-15 5 0 9m22-12q-15 5 0 11" fill="none" stroke="#111" stroke-width="3"/>',
  narrow:'<path d="M30 75V58l8-11V31h6v18l-8 11v15Zm34 0V60l-8-11V31h6v16l8 11v17Z"/>'
};
for(const [name,picture] of Object.entries(pictures))await writeFile(`public/signs/warning-${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><path d="M47 4q3-5 6 0l44 77q3 5-3 5H6q-6 0-3-5Z" fill="#df2831" stroke="#333" stroke-width=".7"/><path d="M50 17 84 76H16Z" fill="#ffd75c"/>${picture}</svg>`);
console.log('Generated eight original warning pictograms; not field photographs or assertions of posted regulatory signs.');
