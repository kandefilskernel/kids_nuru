// Illustrations originales en SVG (aucune image externe).

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#2740d6" />
      <line x1="32" y1="8" x2="32" y2="16" stroke="#ffc233" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="8" r="4" fill="#ff6b5b" />
      <rect x="12" y="16" width="40" height="32" rx="10" fill="#fff" />
      <rect x="17" y="22" width="30" height="20" rx="7" fill="#0e1647" />
      <circle cx="26" cy="32" r="3.5" fill="#19c9a0" />
      <circle cx="38" cy="32" r="3.5" fill="#19c9a0" />
      <rect x="20" y="50" width="24" height="6" rx="3" fill="#ffc233" />
    </svg>
  );
}

function Chip({ x, y, w, label, color = "#2740d6", cls = "" }: { x: number; y: number; w: number; label: string; color?: string; cls?: string }) {
  return (
    <g className={cls}>
      <rect x={x} y={y} width={w} height="38" rx="12" fill="#fff" />
      <rect x={x} y={y} width="8" height="38" rx="4" fill={color} />
      <text x={x + w / 2 + 4} y={y + 25} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0e1647" fontFamily="Consolas, monospace">
        {label}
      </text>
    </g>
  );
}

function Sparkle({ x, y, s = 1, color = "#ffc233" }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -12 Q2 -2 12 0 Q2 2 0 12 Q-2 2 -12 0 Q-2 -2 0 -12Z"
      fill={color}
    />
  );
}

export function HeroArt() {
  return (
    <svg viewBox="0 0 520 450" className="h-auto w-full" role="img" aria-label="Un robot sympathique entouré de blocs de code">
      <circle cx="262" cy="230" r="206" fill="#fff" opacity="0.08" />
      <circle cx="262" cy="230" r="150" fill="#fff" opacity="0.07" />
      {/* circuits */}
      <g fill="none" stroke="#9fb0ff" strokeWidth="3" opacity="0.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 400 H120 V340 H196" />
        <path d="M506 80 H430 V150 H372" />
        <path d="M30 120 H90 V170" />
        <path d="M500 380 H440 V320" />
      </g>
      <g fill="#ffc233">
        <circle cx="14" cy="400" r="6" />
        <circle cx="506" cy="80" r="6" />
        <circle cx="30" cy="120" r="6" />
        <circle cx="500" cy="380" r="6" />
      </g>
      <Sparkle x={70} y={250} s={1.1} />
      <Sparkle x={455} y={235} s={0.8} color="#19c9a0" />
      <Sparkle x={300} y={30} s={0.9} color="#ff6b5b" />

      {/* robot */}
      <g transform="translate(160 70)">
       <g className="float">
        <ellipse cx="100" cy="338" rx="78" ry="10" fill="#000" opacity="0.18" />
        <line x1="100" y1="2" x2="100" y2="32" stroke="#ffc233" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="2" r="11" fill="#ff6b5b" />
        <rect x="12" y="72" width="18" height="38" rx="9" fill="#ffc233" />
        <rect x="170" y="72" width="18" height="38" rx="9" fill="#ffc233" />
        <rect x="28" y="30" width="144" height="114" rx="34" fill="#fff" />
        <rect x="46" y="50" width="108" height="70" rx="22" fill="#0e1647" />
        <g className="blink">
          <circle cx="78" cy="82" r="11" fill="#19c9a0" />
          <circle cx="122" cy="82" r="11" fill="#19c9a0" />
        </g>
        <path d="M80 102 Q100 118 120 102" fill="none" stroke="#19c9a0" strokeWidth="5" strokeLinecap="round" />
        <rect x="88" y="144" width="24" height="14" fill="#c4cdff" />
        <rect x="48" y="156" width="104" height="116" rx="30" fill="#ffc233" />
        <rect x="70" y="180" width="60" height="44" rx="12" fill="#fff" />
        <circle cx="86" cy="202" r="7" fill="#ff6b5b" />
        <circle cx="104" cy="202" r="7" fill="#2740d6" />
        <circle cx="122" cy="202" r="7" fill="#19c9a0" />
        <rect x="76" y="236" width="48" height="8" rx="4" fill="#fff" opacity="0.7" />
        <path d="M50 184 Q6 196 10 238" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
        <circle cx="10" cy="242" r="13" fill="#ffc233" />
        <path d="M150 184 Q198 174 202 128" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
        <circle cx="202" cy="122" r="14" fill="#ffc233" />
        <rect x="62" y="272" width="26" height="36" rx="9" fill="#fff" />
        <rect x="112" y="272" width="26" height="36" rx="9" fill="#fff" />
        <rect x="54" y="304" width="42" height="20" rx="10" fill="#2740d6" />
        <rect x="104" y="304" width="42" height="20" rx="10" fill="#2740d6" />
       </g>
      </g>

      <Chip x={28} y={52} w={78} label="{ }" cls="drift" />
      <Chip x={392} y={186} w={74} label="if" color="#19c9a0" cls="drift-2" />
      <Chip x={30} y={304} w={74} label="AI" color="#ff6b5b" cls="drift-2" />
      <Chip x={380} y={350} w={108} label="Scratch" color="#ffc233" cls="drift" />
    </svg>
  );
}

const frame = "h-full w-full";

export function EveilArt() {
  return (
    <svg viewBox="0 0 200 130" className={frame} role="img" aria-label="Robot au sol et cartes de codage">
      <rect width="200" height="130" rx="18" fill="#dcfaf1" />
      <circle cx="168" cy="26" r="20" fill="#fff" opacity="0.7" />
      <g className="drift">
        <rect x="52" y="34" width="96" height="60" rx="26" fill="#ffc233" />
        <rect x="64" y="46" width="72" height="22" rx="11" fill="#0e1647" />
        <circle cx="84" cy="57" r="5" fill="#19c9a0" />
        <circle cx="116" cy="57" r="5" fill="#19c9a0" />
        <rect x="76" y="76" width="48" height="6" rx="3" fill="#fff" opacity="0.8" />
        <rect x="58" y="90" width="26" height="12" rx="6" fill="#2740d6" />
        <rect x="116" y="90" width="26" height="12" rx="6" fill="#2740d6" />
      </g>
      {[
        { x: 14, c: "#2740d6", rot: 0 },
        { x: 74, c: "#ff6b5b", rot: 90 },
        { x: 134, c: "#19c9a0", rot: -90 },
      ].map((a) => (
        <g key={a.x}>
          <rect x={a.x} y="98" width="52" height="28" rx="9" fill="#fff" />
          <path
            d="M0 7 V-7 M-6 -1 L0 -7 L6 -1"
            transform={`translate(${a.x + 26} 112) rotate(${a.rot})`}
            stroke={a.c}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      ))}
    </svg>
  );
}

export function ExplorateurArt() {
  return (
    <svg viewBox="0 0 200 130" className={frame} role="img" aria-label="Blocs Scratch et carte micro:bit">
      <rect width="200" height="130" rx="18" fill="#e3ebff" />
      {/* blocs */}
      <g className="drift">
        <rect x="16" y="20" width="84" height="24" rx="8" fill="#ffc233" />
        <rect x="16" y="20" width="84" height="24" rx="8" fill="none" />
        <rect x="22" y="48" width="84" height="24" rx="8" fill="#2740d6" />
        <rect x="16" y="76" width="84" height="24" rx="8" fill="#19c9a0" />
        <rect x="30" y="29" width="40" height="6" rx="3" fill="#fff" opacity="0.85" />
        <rect x="36" y="57" width="52" height="6" rx="3" fill="#fff" opacity="0.85" />
        <rect x="30" y="85" width="34" height="6" rx="3" fill="#fff" opacity="0.85" />
      </g>
      {/* micro:bit */}
      <g className="drift-2">
        <rect x="116" y="26" width="70" height="78" rx="12" fill="#0e1647" />
        <rect x="124" y="34" width="54" height="40" rx="6" fill="#16215f" />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 5 }).map((__, c) => {
            const on = [0, 4, 6, 8, 12, 16, 18, 20, 24].includes(r * 5 + c);
            return <circle key={`${r}${c}`} cx={133 + c * 9} cy={42 + r * 7} r="2.6" fill={on ? "#ff6b5b" : "#2a367f"} />;
          }),
        )}
        <circle cx="134" cy="88" r="7" fill="#fff" />
        <circle cx="168" cy="88" r="7" fill="#fff" />
        <rect x="146" y="98" width="10" height="6" fill="#ffc233" />
      </g>
    </svg>
  );
}

export function CreateurArt() {
  return (
    <svg viewBox="0 0 200 130" className={frame} role="img" aria-label="Carte électronique et réseau d'intelligence artificielle">
      <rect width="200" height="130" rx="18" fill="#fff2d1" />
      {/* carte */}
      <g className="drift">
        <rect x="14" y="30" width="86" height="72" rx="10" fill="#0e8f7a" />
        <rect x="26" y="42" width="40" height="40" rx="6" fill="#0e1647" />
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <rect x={30 + i * 7} y="36" width="3" height="8" fill="#ffc233" />
            <rect x={30 + i * 7} y="80" width="3" height="8" fill="#ffc233" />
          </g>
        ))}
        <circle cx="82" cy="52" r="7" fill="#ffc233" />
        <circle cx="82" cy="78" r="7" fill="#ff6b5b" />
        <rect x="70" y="90" width="22" height="6" rx="3" fill="#fff" opacity="0.8" />
      </g>
      {/* réseau neuronal */}
      <g className="drift-2">
        <g stroke="#2740d6" strokeWidth="2" opacity="0.55">
          {[30, 62, 94].map((y1) => [22, 54, 86].map((y2) => <line key={`${y1}-${y2}`} x1="124" y1={y1} x2="152" y2={y2 + 6} />))}
          {[22, 54, 86].map((y1) => [38, 78].map((y2) => <line key={`b${y1}-${y2}`} x1="152" y1={y1 + 6} x2="180" y2={y2} />))}
        </g>
        {[30, 62, 94].map((y) => <circle key={y} cx="124" cy={y} r="8" fill="#2740d6" />)}
        {[28, 60, 92].map((y) => <circle key={y} cx="152" cy={y} r="8" fill="#19c9a0" />)}
        {[38, 78].map((y) => <circle key={y} cx="180" cy={y} r="8" fill="#ff6b5b" />)}
      </g>
    </svg>
  );
}

type IconName = "shield" | "phone" | "trophy" | "users" | "clock" | "chat";

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...p}>
      {name === "shield" && <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" />}
      {name === "phone" && (
        <>
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </>
      )}
      {name === "trophy" && <path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H4v1a3 3 0 003 3M16 6h4v1a3 3 0 01-3 3M12 13v4M8.5 20.5h7M10 17h4" />}
      {name === "users" && (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M17 14c2.5 0 4 2 4 4.5" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === "chat" && <path d="M4 5h16v11H9l-5 4V5z" />}
    </svg>
  );
}
