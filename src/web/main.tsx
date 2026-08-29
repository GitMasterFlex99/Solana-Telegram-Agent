import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Token = { symbol: string; score: number; liquidity: string; volume: string; change: string; risk: string };
const tokens: Token[] = [
  { symbol: "$SOL", score: 91, liquidity: "$1.2B", volume: "$2.8B", change: "+4.2%", risk: "Low" },
  { symbol: "$TOKEN", score: 78, liquidity: "$84K", volume: "$310K", change: "+28.4%", risk: "Medium" },
  { symbol: "$MEME", score: 71, liquidity: "$42K", volume: "$185K", change: "+17.1%", risk: "Medium" },
];

function App() {
  const [tab, setTab] = useState("scan");
  const [selected, setSelected] = useState<Token | null>(null);
  const title = useMemo(() => tab === "scan" ? "Scan" : tab === "wallet" ? "Wallet" : tab === "watch" ? "Watchlist" : "Settings", [tab]);

  if (selected) return <main className="app"><button className="back" onClick={() => setSelected(null)}>← Back</button><section className="card hero"><div className="eyebrow">TOKEN</div><h1>{selected.symbol}</h1><div className="score">{selected.score}<span>/100</span></div><div className="grid"><Stat label="Liquidity" value={selected.liquidity}/><Stat label="24h volume" value={selected.volume}/><Stat label="24h" value={selected.change}/><Stat label="Risk" value={selected.risk}/></div><button className="primary" disabled>🤖 AI Analysis — coming next</button><button className="secondary" disabled>👁 Watch — coming next</button></section><p className="note">Research score only — not a buy signal.</p></main>;

  return <main className="app"><header><div><div className="eyebrow">SOLANA AGENT</div><h1>{title}</h1></div><div className="dot" /></header>
    {tab === "scan" && <><button className="primary big">🔎 Scan markets</button><div className="list">{tokens.map(t => <button className="token" key={t.symbol} onClick={() => setSelected(t)}><div><strong>{t.symbol}</strong><small>{t.liquidity} liquidity · {t.risk} risk</small></div><b>{t.score}</b></button>)}</div></>}
    {tab === "wallet" && <section className="card"><h2>Wallet connection is locked</h2><p>Real Wallet Standard/mobile-wallet connection is intentionally disabled until the devnet and security gates pass. No wallet is connected by this screen.</p><p className="note">When enabled, use a separate trading wallet. Do not connect your main wallet.</p><button className="primary" disabled>Connect wallet — coming next</button></section>}
    {tab === "watch" && <section className="empty"><div>👁</div><h2>No watched tokens</h2><p>Watchlist support is not enabled yet.</p></section>}
    {tab === "settings" && <section className="card"><h2>Settings</h2><div className="row"><span>AI analysis</span><span className="muted">Optional BYOK · not enabled</span></div><div className="row"><span>Wallet</span><span className="muted">Not connected</span></div></section>}
    <nav><Nav active={tab} id="scan" icon="🔎" label="Scan" set={setTab}/><Nav active={tab} id="wallet" icon="💼" label="Wallet" set={setTab}/><Nav active={tab} id="watch" icon="👁" label="Watch" set={setTab}/><Nav active={tab} id="settings" icon="⚙️" label="Settings" set={setTab}/></nav>
  </main>;
}
const Stat = ({label,value}:{label:string,value:string}) => <div className="stat"><small>{label}</small><strong>{value}</strong></div>;
const Nav = ({active,id,icon,label,set}:{active:string,id:string,icon:string,label:string,set:(s:string)=>void}) => <button className={active===id?"active":""} onClick={() => set(id)}><span>{icon}</span>{label}</button>;

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
