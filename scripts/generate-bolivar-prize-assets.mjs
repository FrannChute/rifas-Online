import { mkdir, writeFile } from "node:fs/promises";

const outputDir = new URL("../public/prizes/", import.meta.url);

const prizes = [
  { position: 1, title: "Estadia", kind: "stay", color: "#0b3fa8" },
  { position: 2, title: "Gimnasio", kind: "gym", color: "#2563eb" },
  { position: 3, title: "Barberia", kind: "barber", color: "#16a34a" },
  { position: 4, title: "Barberia", kind: "barber", color: "#f97316" },
  { position: 5, title: "Barberia", kind: "barber", color: "#0891b2" },
  { position: 6, title: "Mantel", kind: "tablecloth", color: "#7c3aed" },
  { position: 7, title: "Bebidas", kind: "bottles", color: "#dc2626" },
  { position: 8, title: "Bebidas", kind: "bottles", color: "#ea580c" },
  { position: 9, title: "Padel", kind: "padel", color: "#0f766e" },
  { position: 10, title: "Padel", kind: "padel", color: "#1d4ed8" },
  { position: 11, title: "Padel", kind: "padel", color: "#9333ea" },
  { position: 12, title: "Rodillera", kind: "kneepad", color: "#111827" },
  { position: 13, title: "Merienda", kind: "snack", color: "#be123c" },
  { position: 14, title: "Voucher", kind: "voucher", color: "#0b3fa8" },
  { position: 15, title: "Limpieza", kind: "cleaning", color: "#0284c7" },
  { position: 16, title: "Aromas", kind: "aroma", color: "#c026d3" },
  { position: 17, title: "KOA DecoHome", kind: "tablecloth", color: "#0f766e" },
  { position: 18, title: "Alimentos", kind: "food", color: "#ca8a04" },
  { position: 19, title: "Alimentos", kind: "food", color: "#65a30d" },
  { position: 20, title: "Crema", kind: "cream", color: "#db2777" },
  { position: 21, title: "Premio 21", kind: "gift", color: "#475569" },
  { position: 22, title: "Golosinas", kind: "candy", color: "#7c3aed" },
];

function basketball() {
  return `
    <circle cx="95" cy="86" r="34" fill="#f97316" stroke="#fff7ed" stroke-width="5"/>
    <path d="M61 86h68M95 52c14 22 14 46 0 68M76 61c12 17 12 34 0 51M114 61c-12 17-12 34 0 51"
      fill="none" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
  `;
}

const icons = {
  stay: `
    <path d="M214 218h128v112H214z" fill="#fff" opacity=".95"/>
    <path d="M196 222l82-70 82 70" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="252" y="260" width="54" height="70" rx="8" fill="#0b3fa8"/>
    <circle cx="292" cy="296" r="4" fill="#fff"/>
  `,
  gym: `
    <rect x="170" y="246" width="42" height="84" rx="12" fill="#fff"/>
    <rect x="344" y="246" width="42" height="84" rx="12" fill="#fff"/>
    <rect x="212" y="268" width="132" height="40" rx="14" fill="#fff"/>
    <rect x="144" y="264" width="28" height="48" rx="10" fill="#fff"/>
    <rect x="386" y="264" width="28" height="48" rx="10" fill="#fff"/>
  `,
  barber: `
    <circle cx="224" cy="238" r="34" fill="none" stroke="#fff" stroke-width="18"/>
    <circle cx="330" cy="238" r="34" fill="none" stroke="#fff" stroke-width="18"/>
    <path d="M248 263l96 84M308 263l-96 84M272 282l-26 42M284 282l26 42" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
  `,
  tablecloth: `
    <rect x="170" y="168" width="218" height="146" rx="24" fill="#fff"/>
    <path d="M182 210h194M182 258h194M224 178v126M278 178v126M334 178v126" stroke="#0b3fa8" stroke-width="8" opacity=".55"/>
    <path d="M190 326h176" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
  `,
  bottles: `
    <rect x="198" y="182" width="64" height="168" rx="22" fill="#fff"/>
    <rect x="214" y="142" width="32" height="48" rx="10" fill="#fff"/>
    <rect x="304" y="160" width="62" height="190" rx="22" fill="#fff"/>
    <rect x="318" y="126" width="34" height="42" rx="10" fill="#fff"/>
    <path d="M212 260h40M318 250h34" stroke="#0b3fa8" stroke-width="8" stroke-linecap="round"/>
  `,
  padel: `
    <ellipse cx="235" cy="220" rx="54" ry="78" fill="#fff" transform="rotate(-28 235 220)"/>
    <path d="M270 286l54 74" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
    <circle cx="344" cy="178" r="26" fill="#f97316" stroke="#fff" stroke-width="7"/>
    <path d="M206 198h64M198 230h72M218 168v104M244 158v98" stroke="#0b3fa8" stroke-width="7" opacity=".45"/>
  `,
  kneepad: `
    <path d="M216 140h120c30 42 42 86 32 132-11 48-44 78-94 78-48 0-78-30-88-78-10-46 0-90 30-132z" fill="#fff"/>
    <path d="M214 196h150M204 252h162" stroke="#0b3fa8" stroke-width="14" opacity=".45"/>
  `,
  snack: `
    <path d="M184 244h184l-18 80H202z" fill="#fff"/>
    <path d="M208 244c0-44 32-78 70-78s70 34 70 78" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
    <circle cx="232" cy="290" r="10" fill="#f97316"/>
    <circle cx="278" cy="292" r="10" fill="#f97316"/>
    <circle cx="322" cy="290" r="10" fill="#f97316"/>
  `,
  voucher: `
    <path d="M168 190h226v130H168z" fill="#fff"/>
    <path d="M186 220h126M186 254h176M186 288h92" stroke="#0b3fa8" stroke-width="14" stroke-linecap="round" opacity=".55"/>
    <circle cx="354" cy="254" r="30" fill="#f97316"/>
  `,
  cleaning: `
    <path d="M218 154h112l-22 58H240z" fill="#fff"/>
    <rect x="198" y="202" width="150" height="146" rx="30" fill="#fff"/>
    <path d="M230 268h86M230 300h64" stroke="#0b3fa8" stroke-width="12" stroke-linecap="round" opacity=".55"/>
  `,
  aroma: `
    <path d="M190 260h178l-24 76H214z" fill="#fff"/>
    <path d="M230 216c-20-28 20-42 0-74M280 216c-20-28 20-42 0-74M330 216c-20-28 20-42 0-74" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none"/>
  `,
  food: `
    <ellipse cx="218" cy="274" rx="58" ry="42" fill="#fff"/>
    <ellipse cx="324" cy="278" rx="54" ry="38" fill="#fff"/>
    <circle cx="270" cy="214" r="34" fill="#fff"/>
    <path d="M204 274h28M314 278h24" stroke="#ca8a04" stroke-width="8" stroke-linecap="round" opacity=".6"/>
  `,
  cream: `
    <rect x="212" y="154" width="124" height="196" rx="28" fill="#fff"/>
    <rect x="236" y="120" width="76" height="46" rx="12" fill="#fff"/>
    <path d="M240 240h70M246 278h58" stroke="#db2777" stroke-width="12" stroke-linecap="round" opacity=".55"/>
  `,
  gift: `
    <rect x="178" y="222" width="204" height="126" rx="18" fill="#fff"/>
    <rect x="204" y="178" width="152" height="64" rx="18" fill="#fff"/>
    <path d="M280 178v170M178 258h204" stroke="#475569" stroke-width="14" opacity=".45"/>
    <path d="M280 176c-38-52-94-20-54 22M280 176c38-52 94-20 54 22" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
  `,
  candy: `
    <rect x="214" y="204" width="132" height="96" rx="30" fill="#fff"/>
    <path d="M214 252l-62-44v88zM346 252l62-44v88z" fill="#fff"/>
    <path d="M248 228h64M248 274h64" stroke="#7c3aed" stroke-width="10" stroke-linecap="round" opacity=".55"/>
  `,
};

function renderPrize(prize) {
  const number = prize.position.toString().padStart(2, "0");
  const title = prize.title.replaceAll("&", "&amp;");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-label="Premio ${prize.position} ${title}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${prize.color}"/>
      <stop offset="1" stop-color="#061735"/>
    </linearGradient>
    <pattern id="court" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M0 36h72M36 0v72" stroke="rgba(255,255,255,.08)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="960" height="640" rx="36" fill="url(#bg)"/>
  <rect width="960" height="640" fill="url(#court)"/>
  <circle cx="800" cy="128" r="150" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="20"/>
  ${basketball()}
  <g transform="translate(182 44) scale(1.35)">
    ${icons[prize.kind]}
  </g>
  <rect x="64" y="462" width="832" height="116" rx="28" fill="rgba(255,255,255,.96)"/>
  <text x="96" y="510" fill="#0b1736" font-family="Arial, sans-serif" font-size="28" font-weight="900">Premio ${prize.position}</text>
  <text x="96" y="552" fill="#0b3fa8" font-family="Arial, sans-serif" font-size="42" font-weight="900">${title}</text>
  <text x="820" y="552" text-anchor="middle" fill="${prize.color}" font-family="Arial, sans-serif" font-size="72" font-weight="900">#${number}</text>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

for (const prize of prizes) {
  const file = new URL(`bolivar-${prize.position.toString().padStart(2, "0")}.svg`, outputDir);
  await writeFile(file, renderPrize(prize), "utf8");
}

console.log(`Generated ${prizes.length} Bolivar prize assets.`);
