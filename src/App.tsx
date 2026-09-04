import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from "react";
import catalogSeed from "../server/data/products.json";

// ─────────────────────────── IMAGES ───────────────────────────────────────────
const IMG = {
  iphone1: "https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?w=800&h=800&fit=crop&auto=format",
  iphone2: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop&auto=format",
  iphone3: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&h=800&fit=crop&auto=format",
  samsung1:"https://images.unsplash.com/photo-1709744722656-9b850470293f?w=800&h=800&fit=crop&auto=format",
  samsung2:"https://images.unsplash.com/photo-1738830251513-a7bfef4b53c6?w=800&h=800&fit=crop&auto=format",
  samsung3:"https://images.unsplash.com/photo-1707438095940-1eee18e85400?w=800&h=800&fit=crop&auto=format",
  oneplus1:"https://images.unsplash.com/photo-1673718424704-51d0d2ca1fd2?w=800&h=800&fit=crop&auto=format",
  oneplus2:"https://images.unsplash.com/photo-1673718424091-5fb734062c05?w=800&h=800&fit=crop&auto=format",
  oneplus3:"https://images.unsplash.com/photo-1757847505239-ce2fb51da67d?w=800&h=800&fit=crop&auto=format",
  hero:    "https://images.unsplash.com/photo-1787773776290-d81c88d33d07?w=1400&h=900&fit=crop&auto=format",
  finance: "https://images.unsplash.com/photo-1645226880663-81561dcab0ae?w=1200&h=700&fit=crop&auto=format",
  lifestyle1:"https://images.unsplash.com/photo-1573152143286-0c422b4d2175?w=1400&h=600&fit=crop&auto=format",
  lifestyle2:"https://images.unsplash.com/photo-1532356884227-66d7c0e9e4c2?w=800&h=600&fit=crop&auto=format",
  team1:   "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&h=600&fit=crop&auto=format",
  team2:   "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop&auto=format",
  neon:    "https://images.unsplash.com/photo-1621947081720-86970823b77a?w=1400&h=600&fit=crop&auto=format",
};

// ─────────────────────────── TYPES ────────────────────────────────────────────
type PageType = "home"|"products"|"how-it-works"|"support"|"product"|"payment";
interface PaymentState { product: Product; variant: Variant; plan: EmiPlan; }
interface EmiPlan { id:string; months:number; monthly:number; interest:number; cashback:number; recommended:boolean; }
interface Variant  { id:string; name:string; color:string; colorLabel:string; storage:string; mrp:number; price:number; stock:boolean; image:string; }
interface SpecSection { section:string; rows:[string,string][]; }
interface Product  { slug:string; name:string; brand:string; category:string; badge:string; badgeColor:string; description:string; accentColor:string; features:string[]; variants:Variant[]; emiPlans:Record<string,EmiPlan[]>; specs?:SpecSection[]; }

const FALLBACK_PRODUCTS = catalogSeed.products as Product[];

const ProductsContext = createContext<Product[]>([]);
const useProducts = () => useContext(ProductsContext);

// ─────────────────────────── UTILS ────────────────────────────────────────────
// Font helpers applied via className
// font-display → Outfit  |  font-mono → DM Mono  |  body → Inter

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
const pct = (n: number, t: number) => Math.round((1 - n / t) * 100);

// CSS-variable shorthand helpers
const bg   = (alpha=1, light=false) => light ? `rgba(245,244,248,${alpha})` : `rgba(7,7,15,${alpha})`;
const S = {
  card:   { background:"var(--surface)",  border:"1px solid var(--border)" },
  card2:  { background:"var(--surface2)", border:"1px solid var(--border2)" },
  accent: { background:"var(--accentBg)", border:"1px solid var(--accentBd)" },
  green:  { background:"var(--greenBg)",  border:"1px solid var(--greenBd)", color:"var(--green)" },
  red:    { background:"var(--redBg)",    border:"1px solid var(--redBd)",   color:"var(--red)" },
};

// ─────────────────────────── SHARED UI ────────────────────────────────────────

// Lazy image
function Img({ src, alt, className="" }: { src:string; alt:string; className?:string }) {
  const [s, setS] = useState<"loading"|"ok"|"err">("loading");
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background:"var(--surface)" }}>
      {s==="loading" && <div className="absolute inset-0 animate-pulse" style={{ background:"var(--surface2)" }} />}
      {s==="err"
        ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color:"var(--text4)" }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-mono text-xs">Photo</span>
          </div>
        : <img src={src} alt={alt} loading="lazy"
            onLoad={()=>setS("ok")} onError={()=>setS("err")}
            className={`w-full h-full object-cover transition-all duration-700 ${s==="ok"?"opacity-100 scale-100":"opacity-0 scale-105"}`} />}
    </div>
  );
}

// 3D tilt
function Tilt({ children, className="", intensity=12 }: { children:React.ReactNode; className?:string; intensity?:number }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const move = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-0.5, y = (e.clientY-r.top)/r.height-0.5;
      el.style.transform = `perspective(900px) rotateY(${x*intensity}deg) rotateX(${-y*intensity}deg) scale(1.03)`;
      el.style.setProperty("--mx", `${(x+0.5)*100}%`);
      el.style.setProperty("--my", `${(y+0.5)*100}%`);
    });
  }, [intensity]);
  const leave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current; if (!el) return;
    el.style.transition = "transform 0.55s cubic-bezier(0.23,1,0.32,1)";
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)";
    setTimeout(() => { if (el) el.style.transition = ""; }, 600);
  }, []);
  return (
    <div ref={ref} className={`relative ${className}`} style={{ transformStyle:"preserve-3d", willChange:"transform" }} onMouseMove={move} onMouseLeave={leave}>
      {children}
    </div>
  );
}

// Background orbs + grid
function BgOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0 }}>
      <div className="absolute rounded-full blur-3xl transition-all duration-700" style={{ width:700, height:700, top:"-15%", left:"-15%", background:"radial-gradient(circle, var(--orb1), transparent)", animation:"pulse 8s ease-in-out infinite" }} />
      <div className="absolute rounded-full blur-3xl transition-all duration-700" style={{ width:500, height:500, top:"50%", right:"-10%", background:"radial-gradient(circle, var(--orb2), transparent)", animation:"pulse 6s ease-in-out 3s infinite" }} />
      <div className="absolute rounded-full blur-3xl transition-all duration-700" style={{ width:350, height:350, bottom:"5%", left:"25%", background:"radial-gradient(circle, var(--orb3), transparent)", animation:"pulse 7s ease-in-out 1.5s infinite" }} />
      <div className="absolute inset-0 transition-all duration-700" style={{ backgroundImage:"linear-gradient(var(--gridLine) 1px,transparent 1px),linear-gradient(90deg,var(--gridLine) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
    </div>
  );
}

// Ticker
function Ticker() {
  const items = ["Apple · iPhone 17 Pro","Samsung · Galaxy S24 Ultra","OnePlus · OnePlus 12","0% EMI up to 24 months","Cashback up to ₹8,500","Instant approval · 60 seconds","SEBI Regulated Mutual Funds","No credit card needed","7 EMI Tenures Available"];
  return (
    <div className="border-y py-3 overflow-hidden transition-all duration-300" style={{ borderColor:"var(--border)", maskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)" }}>
      <div style={{ display:"flex", gap:48, whiteSpace:"nowrap", animation:"marquee 28s linear infinite" }}>
        {[...items,...items].map((s,i) => (
          <span key={i} className="font-mono text-xs uppercase tracking-widest flex items-center gap-3 transition-colors duration-300" style={{ color:"var(--text3)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:"var(--accentBd)" }} />{s}
          </span>
        ))}
      </div>
    </div>
  );
}

// FAQ accordion
function FaqList({ items }: { items: {q:string;a:string}[] }) {
  const [open, setOpen] = useState<number|null>(null);
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl overflow-hidden transition-all duration-300" style={{ background: open===i ? "var(--accentBg)" : "var(--surface)", border:`1px solid ${open===i ? "var(--accentBd)" : "var(--border)"}` }}>
          <button className="w-full flex items-center justify-between p-5 text-left" onClick={()=>setOpen(open===i?null:i)}>
            <span className="font-display text-lg font-light transition-colors duration-300" style={{ color:"var(--text)" }}>{item.q}</span>
            <span className="ml-4 flex-shrink-0 transition-transform duration-300" style={{ transform:open===i?"rotate(45deg)":"rotate(0deg)", color:"var(--text3)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
            </span>
          </button>
          {open===i && (
            <div className="px-5 pb-5" style={{ animation:"pageIn 0.25s ease-out" }}>
              <p className="leading-relaxed" style={{ color:"var(--text2)" }}>{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// Toast
function Toast({ plan, variant, product, onClose }: { plan:EmiPlan; variant:Variant; product:Product; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose,5000); return ()=>clearTimeout(t); }, [onClose]);
  const id = useMemo(()=>"ORD-"+Math.random().toString(36).slice(2,8).toUpperCase(),[]);
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl p-5 w-80 shadow-2xl" style={{ background:"var(--bg2)", border:"1px solid var(--accentBd)", backdropFilter:"blur(24px)", boxShadow:"0 0 50px rgba(124,58,237,0.2),0 25px 60px var(--shadow)", animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={S.green}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color:"var(--green)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color:"var(--text)" }}>Order Confirmed!</p>
          <p className="text-xs font-mono" style={{ color:"var(--text3)" }}>{id}</p>
        </div>
        <button onClick={onClose} className="ml-auto transition-colors" style={{ color:"var(--text3)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="rounded-xl p-3 space-y-1" style={S.card}>
        <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{product.name}</p>
        <p className="text-xs font-mono" style={{ color:"var(--text3)" }}>{variant.colorLabel} · {variant.storage}</p>
        <p className="font-mono text-sm font-semibold" style={{ color:"var(--accent)" }}>{fmt(plan.monthly)}<span className="font-normal" style={{ color:"var(--text3)" }}>/mo × {plan.months} months</span></p>
        {plan.cashback>0 && <p className="font-mono text-xs" style={{ color:"var(--green)" }}>+{fmt(plan.cashback)} cashback applied</p>}
      </div>
    </div>
  );
}

// Theme toggle button
function ThemeToggle({ isDark, toggle }: { isDark:boolean; toggle:()=>void }) {
  return (
    <button onClick={toggle}
      className="relative w-14 h-7 rounded-full transition-all duration-500 flex items-center overflow-hidden"
      style={{ background: isDark ? "rgba(124,58,237,0.3)" : "rgba(0,0,0,0.08)", border:`1px solid ${isDark?"rgba(124,58,237,0.5)":"rgba(0,0,0,0.12)"}` }}
      title={isDark ? "Switch to Light" : "Switch to Dark"}>
      {/* Track icons */}
      <span className="absolute left-1.5 text-[11px]">🌙</span>
      <span className="absolute right-1.5 text-[11px]">☀️</span>
      {/* Thumb */}
      <span className="absolute w-5 h-5 rounded-full shadow-md transition-all duration-400 flex items-center justify-center text-[10px]"
        style={{ left: isDark ? 2 : "calc(100% - 22px)", background: isDark ? "#a855f7" : "#ffffff", boxShadow:"0 2px 8px rgba(0,0,0,0.25)" }}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

// Logo mark
function LogoMark({ size=36 }: { size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lga" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c084fc"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#4f46e5"/></linearGradient>
      </defs>
      <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="url(#lga)"/>
      <path d="M20 6 L32 13 L32 27 L20 34 L8 27 L8 13 Z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <text x="9" y="27" fontFamily="'DM Mono',monospace" fontSize="15" fontWeight="700" fill="white">1Fi</text>
    </svg>
  );
}
function Logo({ onHome }: { onHome:()=>void }) {
  return (
    <button onClick={onHome} className="flex items-center gap-2.5 group">
      <div style={{ animation:"logoFloat 4s ease-in-out infinite" }}><LogoMark size={38}/></div>
      <div className="leading-none">
        <span className="block font-display font-light text-xl tracking-tight leading-none transition-colors duration-300" style={{ color:"var(--text)" }}>
          EMI<span style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Store</span>
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] mt-0.5 transition-colors duration-300" style={{ color:"var(--text4)" }}>by 1Fi · Mutual Fund EMI</span>
      </div>
    </button>
  );
}

// ─────────────────────────── NAV ──────────────────────────────────────────────
function Nav({ page, isDark, toggleTheme, navigate }: { page:PageType; isDark:boolean; toggleTheme:()=>void; navigate:(p:PageType,slug?:string)=>void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY>30);
    window.addEventListener("scroll", fn); return ()=>window.removeEventListener("scroll",fn);
  }, []);
  const links: {label:string;page:PageType}[] = [{label:"Products",page:"products"},{label:"How it Works",page:"how-it-works"},{label:"Support",page:"support"}];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ height:62, background: scrolled ? "var(--navBg)" : "transparent", backdropFilter: scrolled?"blur(24px)":"none", borderBottom: scrolled?"1px solid var(--border)":"none" }}>
      <div className="max-w-7xl mx-auto h-full px-5 md:px-10 flex items-center gap-4">
        <Logo onHome={()=>navigate("home")}/>
        <div className="hidden md:flex items-center gap-1 ml-6">
          {links.map(l=>(
            <button key={l.page} onClick={()=>navigate(l.page)}
              className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-200"
              style={{ color: page===l.page ? "var(--accent)" : "var(--text3)", background: page===l.page ? "var(--accentBg)" : "transparent", border: page===l.page ? "1px solid var(--accentBd)" : "1px solid transparent" }}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle isDark={isDark} toggle={toggleTheme}/>
          <button onClick={()=>navigate("products")} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 4px 20px rgba(124,58,237,0.3)" }}>
            Shop Now →
          </button>
          <button className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg" style={S.card} onClick={()=>setMenuOpen(!menuOpen)}>
            <span className="w-5 h-0.5 rounded transition-all" style={{ background:"var(--text2)", transform:menuOpen?"rotate(45deg) translateY(6px)":"none"}}/>
            <span className="w-5 h-0.5 rounded transition-all" style={{ background:"var(--text2)", opacity:menuOpen?0:1}}/>
            <span className="w-5 h-0.5 rounded transition-all" style={{ background:"var(--text2)", transform:menuOpen?"rotate(-45deg) translateY(-6px)":"none"}}/>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 space-y-1 transition-all duration-300" style={{ background:"var(--navBg)", backdropFilter:"blur(24px)", borderBottom:"1px solid var(--border)" }}>
          {links.map(l=>(
            <button key={l.page} onClick={()=>{navigate(l.page);setMenuOpen(false);}}
              className="w-full text-left px-4 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
              style={{ color:page===l.page?"var(--accent)":"var(--text2)", background:page===l.page?"var(--accentBg)":"transparent" }}>
              {l.label}
            </button>
          ))}
          <button onClick={()=>{navigate("products");setMenuOpen(false);}} className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>Shop Now →</button>
        </div>
      )}
    </nav>
  );
}

function Footer({ navigate }: { navigate:(p:PageType,slug?:string)=>void }) {
  return (
    <footer className="relative z-10 border-t py-12 px-5 md:px-10 transition-colors duration-300" style={{ borderColor:"var(--border)", background:"var(--footerBg)" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <Logo onHome={()=>navigate("home")}/>
          <p className="text-sm leading-relaxed mt-4 max-w-xs" style={{ color:"var(--text3)" }}>India's first mutual fund-backed EMI store. Premium devices, zero interest, instant approval.</p>
        </div>
        {[
          {title:"Store",links:[
            {label:"All Products",page:"products",slug:undefined},
            {label:"iPhone 17 Pro",page:"product",slug:"iphone-17-pro"},
            {label:"Galaxy S24 Ultra",page:"product",slug:"galaxy-s24-ultra"},
            {label:"OnePlus 12",page:"product",slug:"oneplus-12"},
          ]},
          {title:"Company",links:[
            {label:"How it Works",page:"how-it-works",slug:undefined},
            {label:"Support",page:"support",slug:undefined},
            {label:"About 1Fi",page:"how-it-works",slug:undefined},
            {label:"Careers",page:"support",slug:undefined},
          ]},
        ].map(col=>(
          <div key={col.title}>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:"var(--text3)" }}>{col.title}</p>
            <div className="space-y-2">
              {col.links.map(l=>(<button key={l.label} onClick={()=>navigate(l.page as PageType, l.slug)} className="block text-sm text-left transition-opacity hover:opacity-100" style={{ color:"var(--text2)" }}>{l.label}</button>))}
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t text-center" style={{ borderColor:"var(--border)" }}>
        <p className="font-mono text-xs tracking-widest" style={{ color:"var(--text4)" }}>© 2024 1FI EMI STORE · SEBI REGULATED · NO HIDDEN CHARGES · MUTUAL FUND BACKED</p>
      </div>
    </footer>
  );
}

// ─────────────────────────── PRODUCT CARD ─────────────────────────────────────
function ProductCard({ product, onView }: { product:Product; onView:()=>void }) {
  const v = product.variants[0];
  const bestPlan = product.emiPlans[v.id].find(p=>p.recommended)||product.emiPlans[v.id][2];
  return (
    <Tilt intensity={9}>
      <div onClick={onView} className="relative rounded-2xl overflow-hidden cursor-pointer group transition-shadow duration-300"
        style={{ background:"var(--surface)", border:"1px solid var(--border)", boxShadow:"0 4px 24px var(--shadow)" }}>
        {/* Spotlight */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl" style={{ background:"radial-gradient(circle 220px at var(--mx,50%) var(--my,50%), var(--cardHover), transparent 70%)" }}/>
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height:256 }}>
          <Img src={v.image} alt={product.name} className="w-full h-full"/>
          <div className="absolute inset-0" style={{ background:"linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.0) 55%, transparent 100%)" }}/>
          <div className="absolute top-3 left-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{ background:`${product.badgeColor}22`, border:`1px solid ${product.badgeColor}55`, color:product.badgeColor }}>{product.badge}</span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg" style={S.red}>{pct(v.price,v.mrp)}% OFF</span>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {product.variants.map(pv=>(<div key={pv.id} className="w-3.5 h-3.5 rounded-full border" style={{ background:pv.color, borderColor:"rgba(255,255,255,0.3)"}}/>))}
            <span className="font-mono text-[10px] ml-1" style={{ color:"rgba(255,255,255,0.5)" }}>{product.variants.length} finishes</span>
          </div>
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ background:`${product.accentColor}60`, border:`1px solid ${product.accentColor}90` }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
        {/* Content */}
        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color:`${product.accentColor}99` }}>{product.brand}</p>
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-display text-2xl font-light leading-snug" style={{ color:"var(--text)" }}>{product.name}</h3>
            <div className="text-right flex-shrink-0">
              <p className="font-mono text-xs line-through" style={{ color:"var(--text4)" }}>{fmt(v.mrp)}</p>
              <p className="font-mono font-bold text-xl" style={{ color:"var(--text)" }}>{fmt(v.price)}</p>
              <p className="font-mono text-[10px]" style={{ color:"var(--green)" }}>Save {fmt(v.mrp-v.price)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {product.features.slice(0,3).map(f=>(<span key={f} className="font-mono text-[9px] px-2 py-0.5 rounded-md" style={S.card}>{f}</span>))}
          </div>
          <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)" }}>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color:"var(--text3)" }}>Starting EMI</p>
              <p className="font-mono font-bold text-lg" style={{ color:"var(--accent)" }}>{fmt(bestPlan.monthly)}<span className="font-normal text-xs" style={{ color:"var(--text3)" }}>/mo</span></p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color:"var(--text3)" }}>Tenure</p>
              <p className="font-mono text-sm" style={{ color:"var(--text2)" }}>{bestPlan.months} months</p>
            </div>
            <span className="font-mono text-[9px] px-2 py-1 rounded-md" style={S.green}>0% Int.</span>
          </div>
          <button className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg" style={{ background:`linear-gradient(135deg,${product.accentColor}ee,${product.accentColor}aa)`, boxShadow:`0 4px 24px ${product.accentColor}30` }}>
            View EMI Plans →
          </button>
        </div>
      </div>
    </Tilt>
  );
}

// ─────────────────────────── HOME PAGE ────────────────────────────────────────
function HomePage({ navigate }: { navigate:(p:PageType,slug?:string)=>void }) {
  const products = useProducts();
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  useEffect(()=>{
    const fn=()=>{ if(heroRef.current) heroRef.current.style.transform=`translateY(${window.scrollY*0.28}px)`; };
    window.addEventListener("scroll",fn,{passive:true}); return()=>window.removeEventListener("scroll",fn);
  },[]);

  const features=[
    {icon:"⚡",label:"60s Approval",desc:"Instant eligibility using your PAN & mutual fund portfolio. No paperwork, no branch visits."},
    {icon:"🏛️",label:"SEBI Regulated",desc:"All EMI plans backed by SEBI-approved mutual fund structures. Transparent and safe."},
    {icon:"🎁",label:"Cashback Rewards",desc:"Earn up to ₹8,500 cashback on select EMI tenures. The more you commit, the more you earn."},
    {icon:"📉",label:"Zero Interest",desc:"Pay 0% interest on tenures up to 24 months. The price you see is the price you pay."},
  ];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", transition:"background 0.35s ease" }}>
      <BgOrbs/>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight:"100vh" }}>
        <div ref={heroRef} className="absolute inset-0 pointer-events-none">
          <Img src={IMG.hero} alt="smartphones" className="w-full h-full"/>
          <div className="absolute inset-0" style={{ background:"var(--heroOverlay)" }}/>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pt-36 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center min-h-[92vh]">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full" style={S.accent}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:"#fff" }}/>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color:"#fff" }}>India's First Mutual Fund Backed EMI</span>
              </div>
              <h1 className="font-display font-light leading-[0.88] tracking-tight mb-8" style={{ fontSize:"clamp(52px,9vw,118px)", color:"var(--text)" }}>
                Own it<br/>
                <em className="not-italic" style={{ background:"linear-gradient(135deg,#c084fc 0%,#7c3aed 45%,#4f46e5 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>today.</em><br/>
                Pay on<br/>your terms.
              </h1>
              <p className="text-xl leading-relaxed mb-10 max-w-lg" style={{ color:"var(--text2)" }}>
                Premium smartphones with zero-interest EMI plans — no credit card, no hidden charges. Powered by your mutual funds.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                {[["0%","Interest up to 24mo"],["₹8,500","Max Cashback"],["60s","Approval Time"],["3+","Premium Brands"]].map(([v,l])=>(
                  <div key={l} className="rounded-2xl px-5 py-4" style={S.card}>
                    <p className="font-mono font-bold text-2xl leading-none mb-1" style={{ color:"var(--accent2)" }}>{v}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"var(--text3)" }}>{l}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 flex-wrap">
                <button onClick={()=>navigate("products")} className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 10px 40px rgba(124,58,237,0.4)" }}>
                  Explore Products →
                </button>
                <button onClick={()=>navigate("how-it-works")} className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)" }}>
                  How it Works
                </button>
              </div>
            </div>
            <div className="hidden lg:block lg:col-span-2 relative h-[500px]">
              {products.map((p,i)=>(
                <div key={p.slug} onClick={()=>navigate("product",p.slug)}
                  className="absolute rounded-2xl overflow-hidden cursor-pointer hover:z-20 transition-all duration-500 hover:scale-110"
                  style={{ width:175, height:215, top:i===0?"0%":i===1?"38%":"14%", left:i===0?"2%":i===1?"32%":"64%", animation:`float ${7+i*1.5}s ease-in-out ${i*1.2}s infinite`, border:"1px solid rgba(255,255,255,0.15)", boxShadow:"0 24px 64px rgba(0,0,0,0.35)", transform:`rotate(${[-5,3,-2][i]}deg)` }}>
                  <Img src={p.variants[0].image} alt={p.name} className="w-full h-full"/>
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%)"}}/>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-display text-white text-sm font-light leading-tight">{p.name}</p>
                    <p className="font-mono text-purple-300 text-xs mt-0.5">{fmt(p.variants[0].price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce" style={{ color:"var(--text3)" }}>
          <span className="font-mono text-[10px] uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>

      <Ticker/>

      {/* Why section */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent)" }}>Why 1Fi EMI Store</p>
            <h2 className="font-display font-light leading-tight mb-6" style={{ fontSize:"clamp(36px,5vw,60px)", color:"var(--text)" }}>Finance, reimagined<br/><em className="not-italic" style={{ color:"var(--text3)" }}>for India.</em></h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color:"var(--text2)" }}>Traditional EMI plans trap you with hidden charges, mandatory credit cards, and opaque interest structures. We built something different — transparent, mutual-fund-backed financing that puts you in control.</p>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f,i)=>(
                <div key={f.label} onMouseEnter={()=>setActiveFeature(i)}
                  className="rounded-xl p-4 cursor-default transition-all duration-300"
                  style={{ background:activeFeature===i?"var(--accentBg)":"var(--surface)", border:`1px solid ${activeFeature===i?"var(--accentBd)":"var(--border)"}` }}>
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="font-display text-base font-light mb-1" style={{ color:"var(--text)" }}>{f.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color:"var(--text3)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio:"4/3" }}>
              <Img src={IMG.finance} alt="finance technology" className="w-full h-full"/>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl p-5" style={{ background:"var(--bg2)", border:"1px solid var(--accentBd)", backdropFilter:"blur(20px)", boxShadow:"0 20px 60px var(--shadow)" }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color:"var(--text3)" }}>Avg. savings vs traditional EMI</p>
              <p className="font-display text-4xl font-light" style={{ color:"var(--green)" }}>₹12,400</p>
              <p className="font-mono text-xs mt-1" style={{ color:"var(--text3)" }}>per device · over 24 months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured products */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color:"var(--accent)" }}>Featured</p>
            <h2 className="font-display text-5xl font-light" style={{ color:"var(--text)" }}>Our Picks</h2>
          </div>
          <button onClick={()=>navigate("products")} className="font-mono text-xs uppercase tracking-widest transition-colors" style={{ color:"var(--text3)" }}>View All Products →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p=><ProductCard key={p.slug} product={p} onView={()=>navigate("product",p.slug)}/>)}
        </div>
      </div>

      {/* CTA banner */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-28">
        <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)" }}>
          <div className="absolute inset-0 pointer-events-none"><Img src={IMG.neon} alt="neon" className="w-full h-full"/><div className="absolute inset-0" style={{ background:"var(--imgOverlay)" }}/></div>
          <div className="relative z-10">
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent2)" }}>Ready to start?</p>
            <h2 className="font-display text-5xl md:text-6xl font-light mb-6" style={{ color:"var(--text)" }}>Get your dream phone<br/><em className="not-italic" style={{ color:"var(--accent2)" }}>today.</em></h2>
            <p className="text-lg mb-10 max-w-md mx-auto" style={{ color:"var(--text2)" }}>No waiting. No paperwork. Just pick a phone, choose your plan, and it's yours.</p>
            <button onClick={()=>navigate("products")} className="px-10 py-5 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 12px 48px rgba(124,58,237,0.45)" }}>Browse All Products →</button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────── PRODUCTS PAGE ────────────────────────────────────
function ProductsPage({ navigate }: { navigate:(p:PageType,slug?:string)=>void }) {
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [brand, setBrand] = useState("all");
  const filtered = products.filter(p=>(brand==="all"||p.brand.toLowerCase()===brand)&&(p.name.toLowerCase().includes(search.toLowerCase())||p.brand.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>sort==="low"?a.variants[0].price-b.variants[0].price:sort==="high"?b.variants[0].price-a.variants[0].price:0);
  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", transition:"background 0.35s ease" }}>
      <BgOrbs/>
      <div className="relative z-10 pt-24 pb-28">
        <div className="relative overflow-hidden mb-16" style={{ height:310 }}>
          <Img src={IMG.lifestyle1} alt="products" className="w-full h-full"/>
          <div className="absolute inset-0" style={{ background:"var(--heroOverlay)" }}/>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent2)" }}>Full Catalog</p>
            <h1 className="font-display font-light mb-4" style={{ fontSize:"clamp(48px,8vw,88px)", color:"var(--text)" }}>All Products</h1>
            <p className="text-lg max-w-lg" style={{ color:"var(--text2)" }}>{products.length} premium smartphones · Zero-interest EMI · Instant approval</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="rounded-2xl p-5 mb-10 flex flex-col md:flex-row gap-4 items-start md:items-center" style={S.card}>
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color:"var(--text3)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all" style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all","apple","samsung","oneplus"].map(b=>(
                <button key={b} onClick={()=>setBrand(b)} className="px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all" style={{ background:brand===b?"var(--accentBg)":"var(--surface)", border:`1px solid ${brand===b?"var(--accentBd)":"var(--border)"}`, color:brand===b?"var(--accent)":"var(--text2)" }}>
                  {b==="all"?"All Brands":b.charAt(0).toUpperCase()+b.slice(1)}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="px-4 py-3 rounded-xl font-mono text-xs focus:outline-none cursor-pointer ml-auto" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)", colorScheme:"var(--scheme,dark)" } as React.CSSProperties}>
              <option value="featured">Featured</option><option value="low">Price: Low → High</option><option value="high">Price: High → Low</option>
            </select>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color:"var(--text3)" }}>{filtered.length} product{filtered.length!==1?"s":""} found</p>
          {filtered.length===0
            ? <div className="text-center py-32"><p className="font-display text-6xl mb-4" style={{ color:"var(--text4)" }}>No results</p><p className="font-mono text-sm" style={{ color:"var(--text3)" }}>Try a different search or filter</p></div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">{filtered.map(p=><ProductCard key={p.slug} product={p} onView={()=>navigate("product",p.slug)}/>)}</div>}
          {/* Comparison table */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color:"var(--accent)" }}>Compare</p>
              <h2 className="font-display text-4xl font-light" style={{ color:"var(--text)" }}>Side by Side</h2>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <div className="grid grid-cols-4 border-b" style={{ borderColor:"var(--border)" }}>
                <div className="p-4 border-r" style={{ borderColor:"var(--border)" }}/>
                {products.map(p=>(
                  <div key={p.slug} className="p-4 text-center border-r last:border-0" style={{ borderColor:"var(--border)" }}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden mx-auto mb-2"><Img src={p.variants[0].image} alt={p.name} className="w-full h-full"/></div>
                    <p className="font-display text-sm font-light" style={{ color:"var(--text)" }}>{p.name}</p>
                  </div>
                ))}
              </div>
              {[
                {label:"Starting Price",vals:products.map(p=>fmt(p.variants[0].price))},
                {label:"Best EMI",vals:products.map(p=>fmt(p.emiPlans[p.variants[0].id].find(x=>x.recommended)?.monthly||0)+"/mo")},
                {label:"Max Cashback",vals:products.map(p=>fmt(Math.max(...p.emiPlans[p.variants[0].id].map(x=>x.cashback))))},
                {label:"0% Tenure",vals:products.map(p=>"Up to "+Math.max(...p.emiPlans[p.variants[0].id].filter(x=>x.interest===0).map(x=>x.months))+"mo")},
                {label:"Variants",vals:products.map(p=>p.variants.length+" options")},
              ].map(row=>(
                <div key={row.label} className="grid grid-cols-4 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                  <div className="p-4 border-r" style={{ borderColor:"var(--border)" }}><p className="font-mono text-xs" style={{ color:"var(--text3)" }}>{row.label}</p></div>
                  {row.vals.map((v,i)=>(<div key={i} className="p-4 text-center border-r last:border-0" style={{ borderColor:"var(--border)" }}><p className="font-mono text-sm" style={{ color:"var(--text2)" }}>{v}</p></div>))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── HOW IT WORKS PAGE ────────────────────────────────
function HowItWorksPage({ navigate }: { navigate:(p:PageType)=>void }) {
  const [activeStep, setActiveStep] = useState(0);
  const steps=[
    {num:"01",icon:"🎯",title:"Choose Your Device",desc:"Browse our curated catalog of premium smartphones. Filter by brand, price, or features to find your perfect match.",detail:"Our catalog is hand-picked for quality and value. Each device comes with a full manufacturer warranty and certified stock guarantee.",img:IMG.lifestyle2},
    {num:"02",icon:"💳",title:"Pick Your EMI Plan",desc:"Select from 6–7 flexible tenures, 3 to 60 months. Zero interest available up to 24 months.",detail:"Our real-time EMI calculator shows total payable, interest, and cashback for every plan. The 12-month plan is the most popular — zero interest with maximum cashback.",img:IMG.finance},
    {num:"03",icon:"⚡",title:"Instant Approval",desc:"No credit card required. Verify eligibility using PAN and mutual fund portfolio in under 60 seconds.",detail:"Our AI-powered engine checks your mutual fund portfolio value and gives instant approval. No CIBIL score impact, no lengthy paperwork, no branch visit needed.",img:IMG.team1},
    {num:"04",icon:"📦",title:"Delivered in 2 Days",desc:"Once confirmed, your device is dispatched the same day and delivered in 2 business days across India.",detail:"We partner with premium logistics providers for perfect-condition delivery. Real-time tracking, signature-on-delivery, and free returns within 7 days.",img:IMG.team2},
  ];
  const faqs=[
    {q:"Do I need a credit card?",a:"No. 1Fi EMI Store works entirely through your mutual fund portfolio. No credit card, no bank loan needed."},
    {q:"How is the interest calculated?",a:"For tenures up to 24 months, the interest is 0%. For 36–60 month plans, a flat 10.5% p.a. is applied to the principal."},
    {q:"What is the minimum mutual fund balance required?",a:"You need a minimum portfolio value of 1.5× the device price to qualify for instant approval."},
    {q:"Can I foreclose my EMI?",a:"Yes. You can foreclose at any time with zero charges after the first 3 months."},
    {q:"Is my data secure?",a:"Absolutely. We use bank-grade 256-bit encryption and are fully compliant with RBI and SEBI data protection norms."},
  ];
  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", transition:"background 0.35s ease" }}>
      <BgOrbs/>
      <div className="relative z-10 pt-24 pb-28">
        <div className="relative overflow-hidden mb-24" style={{ height:320 }}>
          <Img src={IMG.neon} alt="how it works" className="w-full h-full"/>
          <div className="absolute inset-0" style={{ background:"var(--heroOverlay)" }}/>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent2)" }}>The Process</p>
            <h1 className="font-display font-light mb-4" style={{ fontSize:"clamp(48px,8vw,88px)", color:"var(--text)" }}>How it Works</h1>
            <p className="text-lg max-w-lg" style={{ color:"var(--text2)" }}>Four simple steps from choosing your phone to holding it in your hands</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
            {steps.map((s,i)=>(
              <button key={i} onClick={()=>setActiveStep(i)} className="rounded-2xl p-5 text-left transition-all duration-300" style={{ background:activeStep===i?"var(--accentBg)":"var(--surface)", border:`1px solid ${activeStep===i?"var(--accentBd)":"var(--border)"}` }}>
                <div className="flex items-center gap-2 mb-3"><span className="font-mono text-[10px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>{s.num}</span><span className="text-xl">{s.icon}</span></div>
                <p className="font-display text-base font-light" style={{ color:"var(--text)" }}>{s.title}</p>
              </button>
            ))}
          </div>
          <div key={activeStep} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24" style={{ animation:"pageIn 0.4s ease-out" }}>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono font-bold" style={{ fontSize:80, color:"var(--border2)", letterSpacing:"-0.04em" }}>{steps[activeStep].num}</span>
                <span className="text-5xl">{steps[activeStep].icon}</span>
              </div>
              <h2 className="font-display text-5xl font-light mb-5" style={{ color:"var(--text)" }}>{steps[activeStep].title}</h2>
              <p className="text-xl leading-relaxed mb-6" style={{ color:"var(--text2)" }}>{steps[activeStep].desc}</p>
              <p className="text-base leading-relaxed mb-8" style={{ color:"var(--text3)" }}>{steps[activeStep].detail}</p>
              <div className="flex gap-3">
                {steps.map((_,i)=>(<button key={i} onClick={()=>setActiveStep(i)} className="h-1.5 rounded-full transition-all duration-300" style={{ width:i===activeStep?40:8, background:i===activeStep?"var(--accent)":"var(--border2)" }}/>))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio:"4/3" }}>
              <Img src={steps[activeStep].img} alt={steps[activeStep].title} className="w-full h-full"/>
              <div className="absolute top-4 left-4 px-3 py-2 rounded-xl" style={{ background:"var(--bg2)", border:"1px solid var(--accentBd)", backdropFilter:"blur(12px)" }}>
                <p className="font-mono text-xs font-semibold" style={{ color:"var(--accent)" }}>Step {steps[activeStep].num}</p>
              </div>
            </div>
          </div>
          {/* Timeline */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color:"var(--accent)" }}>At a glance</p>
              <h2 className="font-display text-4xl font-light" style={{ color:"var(--text)" }}>The Full Journey</h2>
            </div>
            <div className="relative">
              <div className="absolute top-8 left-8 right-8 h-0.5 hidden md:block" style={{ background:"linear-gradient(90deg,transparent,var(--accentBd),var(--accentBd),transparent)" }}/>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((s,i)=>(
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 relative z-10" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)", boxShadow:"0 0 24px var(--accentBg)" }}>{s.icon}</div>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color:"var(--accent)" }}>{s.num}</p>
                    <p className="font-display text-lg font-light mb-2" style={{ color:"var(--text)" }}>{s.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color:"var(--text3)" }}>{s.desc.split(".")[0]}.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* FAQ */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color:"var(--accent)" }}>Got Questions?</p>
              <h2 className="font-display text-4xl font-light" style={{ color:"var(--text)" }}>Frequently Asked</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-3"><FaqList items={faqs}/></div>
          </div>
          <div className="text-center rounded-3xl p-16" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)" }}>
            <h2 className="font-display text-5xl font-light mb-6" style={{ color:"var(--text)" }}>Ready to try it?</h2>
            <p className="text-lg mb-8" style={{ color:"var(--text2)" }}>Takes less than 2 minutes. Zero risk, zero commitment until you proceed.</p>
            <button onClick={()=>navigate("products")} className="px-10 py-5 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 10px 40px rgba(124,58,237,0.4)" }}>Explore Products →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── SUPPORT PAGE ─────────────────────────────────────
function SupportPage({ navigate }: { navigate:(p:PageType)=>void }) {
  const [form, setForm] = useState({name:"",email:"",subject:"general",message:""});
  const [sent, setSent] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const categories=[{icon:"🔧",label:"Technical",count:12},{icon:"💰",label:"Billing & EMI",count:8},{icon:"📦",label:"Orders",count:6},{icon:"🔒",label:"Account",count:5},{icon:"↩️",label:"Returns",count:4}];
  const faqs=[
    [{q:"My phone isn't switching on.",a:"Try a force restart by holding power + volume down for 10 seconds. If it persists, contact us and we'll arrange an immediate replacement."},{q:"Is my device under warranty?",a:"Yes, all devices carry a full 1-year manufacturer warranty. Extended plans are available at checkout."}],
    [{q:"Can I change my EMI date?",a:"Yes, once per 12-month period. Log into your 1Fi account and go to 'Manage EMI'."},{q:"What if I miss an EMI payment?",a:"A 7-day grace period applies. After that, a 2% per month penalty is charged. We recommend setting up auto-debit."}],
    [{q:"How do I track my order?",a:"You'll receive a tracking link via SMS and email within 4 hours of dispatch."},{q:"Order shows delivered but I haven't received it.",a:"Contact us immediately. We'll investigate with the logistics partner and resolve within 48 hours."}],
    [{q:"How do I update my PAN details?",a:"Go to Profile → KYC Documents → Edit PAN. Changes reflect within 24–48 hours."},{q:"I forgot my password.",a:"Click 'Forgot Password' on the login screen. A reset link will be sent to your registered email."}],
    [{q:"What is the return policy?",a:"Unopened devices can be returned within 7 days. Opened devices within 3 days if defective."},{q:"How long does a refund take?",a:"5–7 business days to your original payment method or as an EMI credit."}],
  ];
  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", transition:"background 0.35s ease" }}>
      <BgOrbs/>
      <div className="relative z-10 pt-24 pb-28">
        <div className="relative overflow-hidden mb-20" style={{ height:300 }}>
          <Img src={IMG.team1} alt="support" className="w-full h-full"/>
          <div className="absolute inset-0" style={{ background:"var(--heroOverlay)" }}/>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent2)" }}>We're here for you</p>
            <h1 className="font-display font-light mb-4" style={{ fontSize:"clamp(48px,8vw,88px)", color:"var(--text)" }}>Support Center</h1>
            <p className="text-lg" style={{ color:"var(--text2)" }}>24/7 help · Average response under 2 hours</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
            {[{icon:"💬",title:"Live Chat",desc:"Chat with a support agent now. Available 9 AM – 9 PM IST.",action:"Start Chat →",color:"#7c3aed"},{icon:"📞",title:"Call Us",desc:"Speak to our team directly. Toll-free, no wait time promise.",action:"1800-123-4567",color:"#3b82f6"},{icon:"✉️",title:"Email Support",desc:"Send a detailed query and we'll respond within 2 hours.",action:"help@1fi.in",color:"#10b981"}].map(c=>(
              <Tilt key={c.title} intensity={8}>
                <div className="rounded-2xl p-7 h-full transition-all duration-300" style={S.card}>
                  <div className="text-4xl mb-4">{c.icon}</div>
                  <h3 className="font-display text-2xl font-light mb-2" style={{ color:"var(--text)" }}>{c.title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color:"var(--text2)" }}>{c.desc}</p>
                  <span className="font-mono text-sm font-semibold" style={{ color:c.color }}>{c.action}</span>
                </div>
              </Tilt>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:"var(--text3)" }}>Categories</p>
              {categories.map((c,i)=>(
                <button key={i} onClick={()=>setActiveCat(i)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all" style={{ background:activeCat===i?"var(--accentBg)":"var(--surface)", border:`1px solid ${activeCat===i?"var(--accentBd)":"var(--border)"}` }}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono text-sm flex-1" style={{ color:activeCat===i?"var(--accent)":"var(--text2)" }}>{c.label}</span>
                  <span className="font-mono text-xs" style={{ color:"var(--text3)" }}>{c.count}</span>
                </button>
              ))}
            </div>
            <div className="lg:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:"var(--text3)" }}>{categories[activeCat].label} · {faqs[activeCat]?.length||0} articles</p>
              <div className="space-y-3"><FaqList items={faqs[activeCat]||[]}/></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent)" }}>Contact Us</p>
              <h2 className="font-display font-light mb-6" style={{ fontSize:"clamp(36px,5vw,56px)", color:"var(--text)" }}>Send us a message.</h2>
              <p className="leading-relaxed mb-8" style={{ color:"var(--text2)" }}>Can't find what you're looking for? Fill in the form and our team will get back to you within 2 hours.</p>
              <div className="space-y-4">
                {[{icon:"⏱",label:"Response Time",val:"Under 2 hours"},{icon:"🌐",label:"Languages",val:"English, Hindi, Tamil, Telugu"},{icon:"📅",label:"Availability",val:"Mon–Sat · 9 AM to 9 PM IST"}].map(s=>(
                  <div key={s.label} className="flex items-center gap-4 p-4 rounded-xl" style={S.card}>
                    <span className="text-2xl">{s.icon}</span>
                    <div><p className="font-mono text-[10px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>{s.label}</p><p className="text-sm" style={{ color:"var(--text2)" }}>{s.val}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-8" style={S.card}>
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl" style={S.green}>✓</div>
                  <h3 className="font-display text-3xl font-light mb-3" style={{ color:"var(--text)" }}>Message Sent!</h3>
                  <p className="mb-6" style={{ color:"var(--text2)" }}>We'll get back to you at <span style={{ color:"var(--accent)" }}>{form.email}</span></p>
                  <button onClick={()=>setSent(false)} className="font-mono text-xs uppercase tracking-widest transition-colors" style={{ color:"var(--text3)" }}>Send Another →</button>
                </div>
              ) : (
                <form onSubmit={e=>{e.preventDefault();setSent(true);}} className="space-y-4">
                  {[{key:"name",label:"Name",type:"text",ph:"Your name"},{key:"email",label:"Email",type:"email",ph:"you@example.com"}].map(f=>(
                    <div key={f.key}>
                      <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>{f.label}</label>
                      <input required type={f.type} placeholder={f.ph} value={(form as any)[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                        className="w-full px-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all"
                        style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text)" }}
                        onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    </div>
                  ))}
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Subject</label>
                    <select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="w-full px-4 py-3 rounded-xl font-mono text-sm focus:outline-none cursor-pointer" style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text2)", colorScheme:"var(--scheme,dark)" } as React.CSSProperties}>
                      <option value="general">General Inquiry</option><option value="emi">EMI & Billing</option><option value="order">Order & Delivery</option><option value="technical">Technical Issue</option><option value="return">Returns & Refunds</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Message</label>
                    <textarea required rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Describe your issue..."
                      className="w-full px-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all resize-none"
                      style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text)" }}
                      onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  </div>
                  <button type="submit" className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.02]" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 6px 28px rgba(124,58,237,0.3)" }}>Send Message →</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── PRODUCT REVIEWS ──────────────────────────────────
const SAMPLE_REVIEWS = [
  { id:1, name:"Arjun M.", rating:5, date:"Aug 2025", verified:true, title:"Best phone I've ever owned", body:"The camera quality is insane — night shots are crystal clear. EMI process was seamless, got approved in 30 seconds. Highly recommend the 1Fi EMI plan!" },
  { id:2, name:"Priya S.", rating:5, date:"Jul 2025", verified:true, title:"Smooth EMI, zero hassle", body:"I was skeptical about mutual fund backed EMI but it worked perfectly. Zero interest for 6 months and delivery was the next day. 10/10 experience." },
  { id:3, name:"Rahul K.", rating:4, date:"Jul 2025", verified:true, title:"Great product, fast delivery", body:"Arrived in just 18 hours. Build quality is premium. Only minor gripe is the box could have more accessories. But the phone itself is flawless." },
  { id:4, name:"Sneha T.", rating:5, date:"Jun 2025", verified:false, title:"Worth every rupee", body:"Switched from a mid-range phone — the display and performance difference is night and day. The 24-month EMI plan fits my budget perfectly." },
  { id:5, name:"Dev P.", rating:4, date:"Jun 2025", verified:true, title:"Solid choice with easy EMI", body:"Everything about the purchase was transparent. No hidden charges, real-time EMI tracking on the app. Would buy again without hesitation." },
];
function Stars({ n, size=14 }: { n:number; size?:number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=n?"#f59e0b":"none"} stroke={i<=n?"#f59e0b":"var(--border2)"} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </span>
  );
}
function ProductReviews({ product }: { product:Product }) {
  const avg = (SAMPLE_REVIEWS.reduce((s,r)=>s+r.rating,0)/SAMPLE_REVIEWS.length).toFixed(1);
  const dist = [5,4,3,2,1].map(n=>({ n, count:SAMPLE_REVIEWS.filter(r=>r.rating===n).length }));
  return (
    <div className="mt-20">
      <div className="mb-8"><p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color:"var(--text3)" }}>What customers say</p><h3 className="font-display text-3xl font-light" style={{ color:"var(--text)" }}>Reviews</h3></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
          <p className="font-display font-bold" style={{ fontSize:72, lineHeight:1, color:"var(--text)" }}>{avg}</p>
          <Stars n={Math.round(Number(avg))} size={20}/>
          <p className="font-mono text-xs mt-2" style={{ color:"var(--text3)" }}>Based on {SAMPLE_REVIEWS.length} reviews</p>
          <div className="w-full mt-6 space-y-2">
            {dist.map(d=>(
              <div key={d.n} className="flex items-center gap-2">
                <span className="font-mono text-[10px] w-3" style={{ color:"var(--text3)" }}>{d.n}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"var(--border2)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${(d.count/SAMPLE_REVIEWS.length)*100}%`, background:`linear-gradient(90deg,${product.accentColor},${product.accentColor}aa)` }}/>
                </div>
                <span className="font-mono text-[10px] w-3" style={{ color:"var(--text3)" }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {SAMPLE_REVIEWS.map(r=>(
            <div key={r.id} className="rounded-2xl p-5 transition-all hover:scale-[1.01] duration-300" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-semibold text-sm" style={{ color:"var(--text)" }}>{r.name}</span>
                    {r.verified && <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={S.green}>Verified</span>}
                  </div>
                  <Stars n={r.rating}/>
                </div>
                <span className="font-mono text-[10px] flex-shrink-0" style={{ color:"var(--text4)" }}>{r.date}</span>
              </div>
              <p className="font-display font-semibold text-sm mb-1" style={{ color:"var(--text)" }}>{r.title}</p>
              <p className="text-sm leading-relaxed" style={{ color:"var(--text2)" }}>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── PRODUCT DETAIL PAGE ──────────────────────────────
function ProductDetailPage({ slug, navigate, onPay }: { slug:string; navigate:(p:PageType,slug?:string)=>void; onPay:(s:PaymentState)=>void }) {
  const products = useProducts();
  const product = products.find(p=>p.slug===slug);
  if(!product) return <div className="relative z-10 pt-32 pb-40 text-center" style={{ color:"var(--text2)" }}>Product not found.</div>;
  const [activeVid, setActiveVid] = useState(product.variants[0].id);
  const [selectedPlanId, setSelectedPlanId] = useState<string|null>(null);
  const [toast, setToast] = useState<{plan:EmiPlan;variant:Variant}|null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(()=>{ window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>setEntered(true),50); },[slug]);
  const variant = product.variants.find(v=>v.id===activeVid)!;
  const plans = product.emiPlans[activeVid]||[];
  const selectedPlan = plans.find(p=>p.id===selectedPlanId);
  const total = selectedPlan ? selectedPlan.monthly*selectedPlan.months : 0;
  const interestAmt = selectedPlan ? Math.max(0,total-variant.price) : 0;
  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", transition:"background 0.35s ease" }}>
      <BgOrbs/>
      <div className="relative z-10 pt-24 pb-28 transition-all duration-500" style={{ opacity:entered?1:0, transform:entered?"translateY(0)":"translateY(16px)" }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="flex items-center gap-2 mb-10 pt-2">
            {[{label:"Home",page:"home"},{label:"Products",page:"products"},{label:product.name,page:""}].map((b,i,arr)=>(
              <span key={i} className="flex items-center gap-2">
                {i>0 && <span className="font-mono text-xs" style={{ color:"var(--text4)" }}>/</span>}
                {b.page ? <button onClick={()=>navigate(b.page as PageType)} className="font-mono text-xs transition-colors" style={{ color:"var(--text3)" }}>{b.label}</button> : <span className="font-mono text-xs" style={{ color:"var(--text2)" }}>{b.label}</span>}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-20">
            {/* LEFT */}
            <div className="space-y-5">
              <Tilt intensity={4}>
                <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio:"1/1", background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <Img src={variant.image} alt={variant.name} className="w-full h-full"/>
                  <div className="absolute top-5 left-5"><span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background:`${product.badgeColor}22`, border:`1px solid ${product.badgeColor}55`, color:product.badgeColor }}>{product.badge}</span></div>
                  <div className="absolute top-5 right-5"><span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl" style={S.red}>{pct(variant.price,variant.mrp)}% OFF</span></div>
                  <div className="absolute bottom-5 left-5 right-5 flex gap-2">
                    {[{l:"Color",v:variant.colorLabel},{l:"Storage",v:variant.storage}].map(s=>(
                      <div key={s.l} className="flex-1 py-2 px-3 rounded-xl text-center" style={{ background:"var(--navBg)", backdropFilter:"blur(12px)", border:"1px solid var(--border)" }}>
                        <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>{s.l}</p>
                        <p className="font-mono text-xs" style={{ color:"var(--text)" }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Tilt>
              <div className="grid grid-cols-3 gap-3">
                {product.variants.map(v=>(
                  <button key={v.id} onClick={()=>{ setActiveVid(v.id); setSelectedPlanId(null); }} className="rounded-xl overflow-hidden transition-all" style={{ aspectRatio:"1/1", border:`2px solid ${activeVid===v.id?product.accentColor:"var(--border)"}`, boxShadow:activeVid===v.id?`0 0 18px ${product.accentColor}44`:"none" }}>
                    <Img src={v.image} alt={v.name} className="w-full h-full"/>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl p-5" style={S.card}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:"var(--text3)" }}>Key Features</p>
                <div className="grid grid-cols-2 gap-2">
                  {product.features.map(f=>(
                    <div key={f} className="flex items-center gap-2 py-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:product.accentColor }}/>
                      <span className="font-mono text-xs" style={{ color:"var(--text2)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* RIGHT */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color:`${product.accentColor}99` }}>{product.brand}</p>
                  <span style={{ color:"var(--border2)" }}>·</span>
                  <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>{product.category}</p>
                </div>
                <h1 className="font-display font-light leading-tight mb-3" style={{ fontSize:"clamp(36px,5vw,60px)", color:"var(--text)" }}>{product.name}</h1>
                <p className="font-mono text-sm mb-6" style={{ color:"var(--text3)" }}>{variant.name}</p>
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono font-bold text-4xl" style={{ color:"var(--text)" }}>{fmt(variant.price)}</span>
                  <div>
                    <p className="font-mono text-lg line-through" style={{ color:"var(--text4)" }}>{fmt(variant.mrp)}</p>
                    <p className="font-mono text-xs" style={{ color:"var(--green)" }}>You save {fmt(variant.mrp-variant.price)}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color:"var(--text2)" }}>{product.description}</p>
              </div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full animate-pulse" style={{ background:"var(--green)" }}/><span className="font-mono text-xs" style={{ color:"var(--green)" }}>In Stock · Ships within 24 hours</span></div>
              {/* Variant picker */}
              <div className="rounded-2xl p-5" style={S.card}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:"var(--text3)" }}>Select Variant · {product.variants.length} options</p>
                <div className="flex gap-3 mb-3">
                  {product.variants.map(v=>(
                    <button key={v.id} onClick={()=>{ setActiveVid(v.id); setSelectedPlanId(null); }} className="w-8 h-8 rounded-full transition-all duration-200" style={{ background:v.color, border:`2px solid ${activeVid===v.id?"rgba(255,255,255,0.9)":"rgba(128,128,128,0.3)"}`, boxShadow:activeVid===v.id?`0 0 0 3px ${product.accentColor}66`:"none" }} title={v.colorLabel}/>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map(v=>(
                    <button key={v.id} onClick={()=>{ setActiveVid(v.id); setSelectedPlanId(null); }} className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background:activeVid===v.id?`${product.accentColor}22`:"var(--surface2)", border:`1px solid ${activeVid===v.id?product.accentColor+"55":"var(--border)"}`, color:activeVid===v.id?"var(--text)":"var(--text2)" }}>{v.storage}</button>
                  ))}
                </div>
              </div>
              {/* EMI Plans */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-xs uppercase tracking-widest" style={{ color:"var(--text3)" }}>EMI Plans · Mutual Fund Backed</p>
                  <span className="font-mono text-[10px]" style={{ color:"var(--text4)" }}>{plans.length} options</span>
                </div>
                <div className="space-y-2.5">
                  {plans.map(plan=>{
                    const isSel=plan.id===selectedPlanId;
                    const tot=plan.monthly*plan.months;
                    const intAmt=Math.max(0,tot-variant.price);
                    return (
                      <div key={plan.id} onClick={()=>setSelectedPlanId(isSel?null:plan.id)} className="relative rounded-xl p-4 cursor-pointer transition-all duration-200" style={{ background:isSel?`${product.accentColor}12`:"var(--surface)", border:`1px solid ${isSel?product.accentColor+"60":"var(--border)"}` }}>
                        {plan.recommended && <div className="absolute -top-2.5 left-4"><span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full font-semibold" style={S.green}>Best Value</span></div>}
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all" style={{ borderColor:isSel?product.accentColor:"var(--border2)", background:isSel?product.accentColor:"transparent" }}>
                            {isSel&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xl" style={{ color:"var(--text)" }}>{fmt(plan.monthly)}</span>
                              <span className="font-mono text-xs" style={{ color:"var(--text3)" }}>× {plan.months} months</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="font-mono text-xs" style={{ color:plan.interest===0?"var(--green)":"var(--text3)" }}>{plan.interest===0?"0% interest ✓":`${plan.interest}% p.a.`}</span>
                              {plan.cashback>0&&<span className="font-mono text-xs" style={{ color:"var(--green)" }}>+{fmt(plan.cashback)} cashback</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-xs" style={{ color:"var(--text3)" }}>{fmt(tot)}</p>
                            {intAmt>0&&<p className="font-mono text-[10px]" style={{ color:"var(--text4)" }}>+{fmt(intAmt)} int.</p>}
                          </div>
                        </div>
                        {isSel&&(
                          <div className="mt-3 pt-3 border-t" style={{ borderColor:"var(--border)" }}>
                            <div className="flex justify-between mb-1.5">
                              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"var(--text3)" }}>Tenure</span>
                              <span className="font-mono text-[10px]" style={{ color:"var(--text3)" }}>{plan.months} / 60 months</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background:"var(--border2)" }}>
                              <div className="h-full rounded-full transition-all duration-500" style={{ width:`${(plan.months/60)*100}%`, background:`linear-gradient(90deg,${product.accentColor},${product.accentColor}88)` }}/>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedPlan&&(
                <div className="rounded-2xl p-5" style={{ background:`${product.accentColor}0e`, border:`1px solid ${product.accentColor}28`, animation:"pageIn 0.3s ease-out" }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color:`${product.accentColor}80` }}>Plan Summary</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[{l:"Monthly EMI",v:fmt(selectedPlan.monthly)},{l:"Total Amount",v:fmt(total)},{l:"Total Interest",v:fmt(interestAmt)}].map(s=>(
                      <div key={s.l}><p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color:"var(--text3)" }}>{s.l}</p><p className="font-mono font-semibold text-sm" style={{ color:"var(--text)" }}>{s.v}</p></div>
                    ))}
                  </div>
                  {selectedPlan.cashback>0&&(
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor:"var(--border)" }}>
                      <div><p className="font-mono text-[9px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>Cashback</p><p className="font-mono font-semibold" style={{ color:"var(--green)" }}>–{fmt(selectedPlan.cashback)}</p></div>
                      <div className="text-right"><p className="font-mono text-[9px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>Net Cost</p><p className="font-mono font-bold text-xl" style={{ color:"var(--text)" }}>{fmt(total-selectedPlan.cashback)}</p></div>
                    </div>
                  )}
                </div>
              )}
              <button disabled={!selectedPlan} onClick={()=>{ if(selectedPlan) onPay({product,variant,plan:selectedPlan}); }} className="w-full py-5 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02]"
                style={selectedPlan?{background:`linear-gradient(135deg,${product.accentColor},${product.accentColor}bb)`,boxShadow:`0 10px 40px ${product.accentColor}44`}:{background:"var(--surface2)",cursor:"not-allowed",color:"var(--text4)"}}>
                {selectedPlan?`Proceed to Payment · ${fmt(selectedPlan.monthly)}/mo × ${selectedPlan.months}m →`:"Select an EMI Plan to Continue"}
              </button>
              <div className="flex items-center justify-center gap-6">
                {["No hidden charges","Instant approval","SEBI regulated"].map(t=>(
                  <span key={t} className="font-mono text-[10px] flex items-center gap-1.5" style={{ color:"var(--text3)" }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color:"var(--green)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* ── SHIPPING DETAILS ── */}
          <div className="mt-20">
            <div className="mb-8"><p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color:"var(--text3)" }}>Delivery & Shipping</p><h3 className="font-display text-3xl font-light" style={{ color:"var(--text)" }}>Shipping Details</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon:"🚀", title:"Express Delivery", desc:"Order before 12 PM for same-day delivery in metro cities. Other cities within 24–48 hours.", badge:"Free" },
                { icon:"📦", title:"Secure Packaging", desc:"Triple-layer tamper-proof packaging with GPS tracking on every shipment.", badge:"Insured" },
                { icon:"🔄", title:"Easy Returns", desc:"10-day hassle-free returns. Pick-up from your doorstep at no extra charge.", badge:"No cost" },
              ].map(s=>(
                <div key={s.title} className="rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{s.icon}</span>
                    <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full" style={S.green}>{s.badge}</span>
                  </div>
                  <h4 className="font-display font-semibold mb-2" style={{ color:"var(--text)" }}>{s.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color:"var(--text2)" }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl p-5 flex flex-wrap items-center gap-6" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
              {[["Estimated Delivery","2–5 business days"],["Shipping Partner","BlueDart / FedEx"],["Track Order","Real-time tracking via SMS & Email"],["COD Available","On orders above ₹5,000"]].map(([l,v])=>(
                <div key={l}><p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color:"var(--text3)" }}>{l}</p><p className="font-mono text-xs" style={{ color:"var(--text)" }}>{v}</p></div>
              ))}
            </div>
          </div>

          {/* ── PRODUCT DETAILS / SPECS ── */}
          <div className="mt-20">
            <div className="mb-8"><p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color:"var(--text3)" }}>Technical Specifications</p><h3 className="font-display text-3xl font-light" style={{ color:"var(--text)" }}>Product Details</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(product.specs || [
                { section:"Display", rows:[["Size","6.7-inch Super Retina XDR"],["Resolution","2796 × 1290 px at 460 ppi"],["Technology","ProMotion OLED, 1–120Hz"],["Brightness","2000 nits peak (outdoor)"]] },
                { section:"Performance", rows:[["Chip","A18 Pro (3nm)"],["CPU","6-core (2 performance + 4 efficiency)"],["GPU","6-core"],["Neural Engine","16-core, 35 TOPS"]] },
                { section:"Camera", rows:[["Main","48 MP, f/1.8, sensor-shift OIS"],["Telephoto","12 MP, 5× optical zoom"],["Ultrawide","48 MP, f/2.2, autofocus"],["Front","12 MP TrueDepth, f/1.9"]] },
                { section:"Battery & Charging", rows:[["Capacity","~3,274 mAh"],["Wired","27W USB-C (MagSafe 25W)"],["Wireless","15W MagSafe / 7.5W Qi"],["Video Playback","Up to 27 hours"]] },
              ]).map((sec:SpecSection)=>(
                <div key={sec.section} className="rounded-2xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
                  <div className="px-5 py-3" style={{ background:`${product.accentColor}12`, borderBottom:"1px solid var(--border)" }}>
                    <span className="font-display font-semibold text-sm" style={{ color:product.accentColor }}>{sec.section}</span>
                  </div>
                  <div className="divide-y" style={{ borderColor:"var(--border)" }}>
                    {sec.rows.map(([label,val])=>(
                      <div key={label} className="flex items-center px-5 py-3 gap-4">
                        <span className="font-mono text-xs w-36 flex-shrink-0" style={{ color:"var(--text3)" }}>{label}</span>
                        <span className="font-mono text-xs" style={{ color:"var(--text)" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── REVIEWS ── */}
          <ProductReviews product={product} />

          {/* Related */}
          <div className="mt-24">
            <div className="flex items-end justify-between mb-10">
              <div><p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color:"var(--text3)" }}>You may also like</p><h3 className="font-display text-4xl font-light" style={{ color:"var(--text)" }}>More Products</h3></div>
              <button onClick={()=>navigate("products")} className="font-mono text-xs uppercase tracking-widest transition-colors" style={{ color:"var(--text3)" }}>View All →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{products.filter(p=>p.slug!==slug).map(p=><ProductCard key={p.slug} product={p} onView={()=>navigate("product",p.slug)}/>)}</div>
          </div>
        </div>
      </div>
      {toast&&<Toast plan={toast.plan} variant={toast.variant} product={product} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ─────────────────────────── PAYMENT PAGE ─────────────────────────────────────
type PayMethod = "upi"|"card"|"netbanking"|"mutualfund";
type PayStep = "method"|"details"|"otp"|"success";

function CardVisual({ num, name, expiry, cvv, flipped }: { num:string; name:string; expiry:string; cvv:string; flipped:boolean }) {
  const display = (num.replace(/\s/g,"").padEnd(16,"•")).match(/.{1,4}/g)!.join(" ");
  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height:200, perspective:1000 }}>
      <div className="absolute inset-0 transition-all duration-700" style={{ transformStyle:"preserve-3d", transform: flipped?"rotateY(180deg)":"rotateY(0deg)" }}>
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility:"hidden", background:"linear-gradient(135deg,#1e0a3c 0%,#4c1d95 40%,#7c3aed 80%,#a855f7 100%)", boxShadow:"0 24px 60px rgba(124,58,237,0.5)" }}>
          <div className="absolute inset-0" style={{ backgroundImage:"radial-gradient(ellipse at 80% 20%,rgba(255,255,255,0.12),transparent 60%)" }}/>
          {/* chip */}
          <div className="absolute top-6 left-6 w-10 h-8 rounded-md" style={{ background:"linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow:"inset 0 1px 3px rgba(0,0,0,0.3)" }}/>
          {/* logo */}
          <div className="absolute top-5 right-5"><LogoMark size={32}/></div>
          {/* number */}
          <div className="absolute bottom-16 left-6 right-6">
            <p className="font-mono text-white text-xl tracking-[0.22em] font-medium">{display}</p>
          </div>
          {/* name + expiry */}
          <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="font-mono text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
              <p className="font-mono text-white text-sm uppercase tracking-wider">{name||"YOUR NAME"}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
              <p className="font-mono text-white text-sm">{expiry||"MM/YY"}</p>
            </div>
          </div>
          {/* Visa mark */}
          <div className="absolute bottom-5 right-6">
            <p className="font-mono text-white/30 text-xs italic font-bold">VISA</p>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility:"hidden", transform:"rotateY(180deg)", background:"linear-gradient(135deg,#1e0a3c,#4c1d95)", boxShadow:"0 24px 60px rgba(124,58,237,0.5)" }}>
          <div className="absolute top-8 left-0 right-0 h-12 bg-gray-900"/>
          <div className="absolute top-24 left-6 right-6">
            <div className="h-10 rounded-md flex items-center justify-end px-4" style={{ background:"rgba(255,255,255,0.9)" }}>
              <p className="font-mono text-gray-800 text-lg font-bold tracking-widest">{cvv||"•••"}</p>
            </div>
            <p className="font-mono text-white/40 text-[9px] uppercase tracking-widest mt-2 text-right">CVV / CVC</p>
          </div>
          <div className="absolute bottom-5 left-6 right-6 text-center">
            <p className="font-mono text-white/25 text-[9px]">This card is property of 1Fi EMI Store. If found, please return to the nearest branch.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentPage({ state, navigate }: { state: PaymentState; navigate:(p:PageType,slug?:string)=>void }) {
  const { product, variant, plan } = state;
  const [step, setStep] = useState<PayStep>("method");
  const [method, setMethod] = useState<PayMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [card, setCard] = useState({ num:"", name:"", expiry:"", cvv:"" });
  const [cardFlipped, setCardFlipped] = useState(false);
  const [bank, setBank] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanResult, setScanResult] = useState("");
  const scannerVideoRef = useRef<HTMLVideoElement>(null);
  const [otp, setOtp] = useState(["","","","","",""]);
  const otpRefs = useRef<(HTMLInputElement|null)[]>([]);
  const [otpTimer, setOtpTimer] = useState(30);
  const [orderId] = useState("ORD-"+Math.random().toString(36).slice(2,8).toUpperCase());
  const total = plan.monthly * plan.months;
  const net = total - (plan.cashback||0);

  useEffect(()=>{ window.scrollTo({top:0,behavior:"smooth"}); },[]);

  // OTP countdown
  useEffect(()=>{
    if(step!=="otp") return;
    setOtpTimer(30);
    const t = setInterval(()=>setOtpTimer(n=>n>0?n-1:0),1000);
    return ()=>clearInterval(t);
  },[step]);

  useEffect(()=>{
    if(!scannerOpen) return;
    let stream: MediaStream | undefined;
    let frame = 0;
    if(!navigator.mediaDevices?.getUserMedia) {
      setScannerError("Camera scanning is not supported in this browser.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:"environment" } }, audio:false })
      .then(nextStream=>{
        stream = nextStream;
        const video = scannerVideoRef.current;
        if(!video) return;
        video.srcObject = nextStream;
        const BarcodeDetector = (window as unknown as { BarcodeDetector?: new (options?: { formats:string[] }) => { detect: (source:HTMLVideoElement) => Promise<{ rawValue:string }[]> } }).BarcodeDetector;
        if(!BarcodeDetector) {
          setScannerError("Live QR detection is not supported here. Enter your UPI ID manually below.");
          return;
        }
        const detector = new BarcodeDetector({ formats:["qr_code"] });
        const scan = async () => {
          if(!scannerVideoRef.current || scannerVideoRef.current.readyState < 2) {
            frame = requestAnimationFrame(scan);
            return;
          }
          const codes = await detector.detect(scannerVideoRef.current);
          const value = codes[0]?.rawValue;
          if(value) {
            setScanResult(value);
            setUpiId(value);
            setUpiVerified(value.includes("@"));
            setScannerOpen(false);
            return;
          }
          frame = requestAnimationFrame(scan);
        };
        video.onloadedmetadata = () => { void video.play(); void scan(); };
      })
      .catch(()=>setScannerError("Camera access was unavailable. Check your browser permission and try again."));
    return ()=>{
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track=>track.stop());
    };
  },[scannerOpen]);

  const formatCard = (v:string) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = (v:string) => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?d.slice(0,2)+"/"+d.slice(2):d; };

  const handleOtp = (i:number, v:string) => {
    const d = v.replace(/\D/g,"").slice(-1);
    const next = [...otp]; next[i]=d; setOtp(next);
    if(d && i<5) otpRefs.current[i+1]?.focus();
  };
  const handleOtpKey = (i:number, e:React.KeyboardEvent) => {
    if(e.key==="Backspace"&&!otp[i]&&i>0) otpRefs.current[i-1]?.focus();
  };
  const otpFilled = otp.every(d=>d!=="");
  const validMobileNumber = mobileNumber.replace(/\D/g,"").length===10;

  const sendOtp = () => {
    if(!validMobileNumber) return;
    setOtpSent(true);
    setOtp(["","","","","",""]);
    setOtpTimer(30);
  };

  const proceedToOtp = () => {
    if(!validMobileNumber||!otpSent) return;
    if(method==="upi"&&!upiVerified) return;
    if(method==="card"&&(!card.num.replace(/\s/g,"").length||!card.name||!card.expiry||!card.cvv)) return;
    if(method==="netbanking"&&!bank) return;
    setStep("otp");
  };

  const banks = ["State Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Kotak Mahindra Bank","Punjab National Bank","Bank of Baroda","Canara Bank"];

  const stepIndex = {method:0,details:1,otp:2,success:3}[step];

  if(step==="success") return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <BgOrbs/>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center">
        {/* Burst rings */}
        <div className="relative mb-10">
          {[1,2,3].map(i=>(
            <div key={i} className="absolute inset-0 rounded-full" style={{ border:"2px solid var(--accentBd)", animation:`burst ${0.8+i*0.3}s ease-out ${i*0.15}s forwards`, opacity:0 }}/>
          ))}
          <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 0 80px rgba(124,58,237,0.6)" }}>
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color:"var(--accent2)" }}>Payment Successful</p>
        <h1 className="font-display font-light mb-3" style={{ fontSize:"clamp(40px,7vw,80px)", color:"var(--text)" }}>You're all set!</h1>
        <p className="text-xl mb-2" style={{ color:"var(--text2)" }}>Your <strong style={{ color:"var(--text)" }}>{product.name}</strong> is on its way.</p>
        <p className="font-mono mb-10" style={{ color:"var(--accent2)" }}>{orderId}</p>
        <div className="rounded-2xl p-6 mb-10 w-full max-w-md text-left space-y-3" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
          {[
            ["Product", variant.name],
            ["EMI", `${fmt(plan.monthly)}/mo × ${plan.months} months`],
            ["Total", fmt(total)],
            ...(plan.cashback>0?[["Cashback", `-${fmt(plan.cashback)}`]]:[] as [string,string][]),
            ["Net Paid Today", fmt(plan.monthly)],
            ["First EMI", new Date(Date.now()+30*864e5).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})],
            ["Delivery", "Within 2 business days"],
          ].map(([l,v])=>(
            <div key={l} className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color:"var(--text3)" }}>{l}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: l==="Cashback"?"var(--green)":l==="Net Paid Today"?"var(--accent)":"var(--text)" }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={()=>navigate("products")} className="px-8 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 8px 32px rgba(124,58,237,0.4)" }}>
            Continue Shopping →
          </button>
          <button onClick={()=>navigate("home")} className="px-8 py-4 rounded-2xl font-semibold transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)" }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <BgOrbs/>
      <div className="relative z-10 pt-20 pb-28">
        <div className="max-w-5xl mx-auto px-5 md:px-10 pt-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <button onClick={()=>navigate("product",product.slug)} className="font-mono text-xs transition-colors" style={{ color:"var(--text3)" }}>← Back to Product</button>
          </div>

          {/* Step bar */}
          <div className="flex items-center gap-0 mb-12 max-w-lg mx-auto">
            {["Payment Method","Details","Verify OTP"].map((s,i)=>(
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300"
                    style={{ background: stepIndex>i?"var(--accent)":stepIndex===i?"linear-gradient(135deg,#7c3aed,#a855f7)":"var(--surface)", border:`2px solid ${stepIndex>=i?"var(--accent)":"var(--border)"}`, color: stepIndex>=i?"white":"var(--text3)", boxShadow: stepIndex===i?"0 0 20px rgba(124,58,237,0.5)":"none" }}>
                    {stepIndex>i ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : i+1}
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mt-1.5 text-center w-20" style={{ color:stepIndex>=i?"var(--accent)":"var(--text4)" }}>{s}</p>
                </div>
                {i<2 && <div className="flex-1 h-0.5 mb-4 mx-1 transition-all duration-500" style={{ background:stepIndex>i?"var(--accent)":"var(--border)" }}/>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main panel */}
            <div className="lg:col-span-3 space-y-5">

              {/* STEP: METHOD */}
              {step==="method" && (
                <div style={{ animation:"pageIn 0.35s ease-out" }}>
                  <h2 className="font-display font-light text-4xl mb-6" style={{ color:"var(--text)" }}>How would you like to pay?</h2>
                  <div className="space-y-3">
                    {([
                      {id:"upi",   icon:"📲", label:"UPI",           sub:"Pay via any UPI app — PhonePe, GPay, Paytm"},
                      {id:"card",  icon:"💳", label:"Credit / Debit Card", sub:"Visa, Mastercard, RuPay — all cards accepted"},
                      {id:"netbanking",icon:"🏛️",label:"Net Banking",  sub:"Pay directly from your bank account"},
                      {id:"mutualfund",icon:"📈",label:"Mutual Fund Direct",sub:"Pledge units from your portfolio — instant"},
                    ] as {id:PayMethod;icon:string;label:string;sub:string}[]).map(m=>(
                      <button key={m.id} onClick={()=>setMethod(m.id)}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200"
                        style={{ background:method===m.id?"var(--accentBg)":"var(--surface)", border:`2px solid ${method===m.id?"var(--accent)":"var(--border)"}`, boxShadow:method===m.id?"0 0 0 4px var(--accentBg)":"none" }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:method===m.id?"var(--accentBg)":"var(--surface2)", border:"1px solid var(--border)" }}>{m.icon}</div>
                        <div className="flex-1">
                          <p className="font-display text-lg font-light" style={{ color:"var(--text)" }}>{m.label}</p>
                          <p className="font-mono text-xs" style={{ color:"var(--text3)" }}>{m.sub}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor:method===m.id?"var(--accent)":"var(--border2)", background:method===m.id?"var(--accent)":"transparent" }}>
                          {method===m.id && <div className="w-2 h-2 rounded-full bg-white"/>}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setStep("details")} className="w-full mt-6 py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-[1.02]" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 8px 32px rgba(124,58,237,0.4)" }}>
                    Continue with {({upi:"UPI",card:"Card",netbanking:"Net Banking",mutualfund:"Mutual Fund"} as Record<PayMethod,string>)[method]} →
                  </button>
                </div>
              )}

              {/* STEP: DETAILS */}
              {step==="details" && (
                <div style={{ animation:"pageIn 0.35s ease-out" }} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>setStep("method")} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <h2 className="font-display font-light text-3xl" style={{ color:"var(--text)" }}>
                      {{upi:"Enter UPI ID",card:"Card Details",netbanking:"Select Bank",mutualfund:"Mutual Fund"}[method]}
                    </h2>
                  </div>

                  {/* UPI */}
                  {method==="upi" && (
                    <div className="space-y-5">
                      {/* QR */}
                      <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                        <p className="font-mono text-xs uppercase tracking-widest" style={{ color:"var(--text3)" }}>Scan QR Code</p>
                        <div className="w-40 h-40 rounded-xl overflow-hidden relative" style={{ background:"white", padding:8 }}>
                          {/* Simulated QR */}
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <rect width="100" height="100" fill="white"/>
                            {/* QR pattern simulation */}
                            {[0,1,2,3,4,5,6].flatMap(r=>[0,1,2,3,4,5,6].map(c=>{
                              const skip=[[3,0],[3,1],[3,2],[3,3],[3,4],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3]].some(([a,b])=>a===r&&b===c);
                              const corner=r<3&&c<3||r<3&&c>3||r>3&&c<3;
                              return <rect key={`${r}${c}`} x={r*13+5} y={c*13+5} width={10} height={10} fill={skip?"white":corner?"#4c1d95":Math.random()>0.4?"#4c1d95":"white"} rx={1}/>;
                            }))}
                            <rect x={2} y={2} width={38} height={38} fill="none" stroke="#4c1d95" strokeWidth={3} rx={3}/>
                            <rect x={60} y={2} width={38} height={38} fill="none" stroke="#4c1d95" strokeWidth={3} rx={3}/>
                            <rect x={2} y={60} width={38} height={38} fill="none" stroke="#4c1d95" strokeWidth={3} rx={3}/>
                          </svg>
                        </div>
                        <p className="font-mono text-xs" style={{ color:"var(--text3)" }}>pay@1fi.upi</p>
                        <div className="flex items-center gap-3 w-full"><div className="flex-1 h-px" style={{ background:"var(--border)" }}/><span className="font-mono text-xs" style={{ color:"var(--text3)" }}>OR</span><div className="flex-1 h-px" style={{ background:"var(--border)" }}/></div>
                        <p className="font-mono text-xs uppercase tracking-widest" style={{ color:"var(--text3)" }}>Enter UPI ID manually</p>
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>UPI ID</label>
                        <div className="flex gap-3">
                          <input value={upiId} onChange={e=>{setUpiId(e.target.value);setUpiVerified(false);}} placeholder="yourname@upi" className="flex-1 px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                          <button onClick={()=>upiId.includes("@")&&setUpiVerified(true)} className="px-5 py-3 rounded-xl font-mono text-sm font-semibold transition-all" style={{ background:upiVerified?"var(--greenBg)":"var(--accentBg)", border:`1px solid ${upiVerified?"var(--greenBd)":"var(--accentBd)"}`, color:upiVerified?"var(--green)":"var(--accent)" }}>
                            {upiVerified?"✓ Verified":"Verify"}
                          </button>
                        </div>
                        {upiVerified && <p className="font-mono text-xs mt-2" style={{ color:"var(--green)" }}>✓ UPI ID verified successfully</p>}
                      </div>
                    </div>
                  )}

                  {/* CARD */}
                  {method==="card" && (
                    <div className="space-y-5">
                      <CardVisual num={card.num} name={card.name} expiry={card.expiry} cvv={card.cvv} flipped={cardFlipped}/>
                      <div className="space-y-4">
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Card Number</label>
                          <input value={card.num} onChange={e=>setCard({...card,num:formatCard(e.target.value)})} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none tracking-widest transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                        </div>
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Cardholder Name</label>
                          <input value={card.name} onChange={e=>setCard({...card,name:e.target.value.toUpperCase()})} placeholder="AS ON CARD" className="w-full px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none uppercase transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Expiry</label>
                            <input value={card.expiry} onChange={e=>setCard({...card,expiry:formatExpiry(e.target.value)})} placeholder="MM/YY" maxLength={5} className="w-full px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                          </div>
                          <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>CVV</label>
                            <input value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value.replace(/\D/g,"").slice(0,3)})} placeholder="•••" maxLength={3} type="password" className="w-full px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>{e.target.style.borderColor="var(--accent)";setCardFlipped(true);}} onBlur={e=>{e.target.style.borderColor="var(--border)";setCardFlipped(false);}}/>
                          </div>
                        </div>
                        <button onClick={()=>{ setScannerError(""); setScanResult(""); setScannerOpen(open=>!open); }} className="w-full mt-4 py-3 rounded-xl font-mono text-sm font-semibold transition-all" style={{ background:scannerOpen?"var(--greenBg)":"var(--accentBg)", border:`1px solid ${scannerOpen?"var(--greenBd)":"var(--accentBd)"}`, color:scannerOpen?"var(--green)":"var(--accent)" }}>
                          {scannerOpen ? "Close QR Scanner" : "Scan QR with Camera"}
                        </button>
                        {scannerOpen && (
                          <div className="mt-4 overflow-hidden rounded-xl" style={{ background:"#050509", border:"1px solid var(--accentBd)" }}>
                            <video ref={scannerVideoRef} autoPlay muted playsInline className="w-full aspect-video object-cover" />
                            <p className="p-3 text-center font-mono text-xs" style={{ color:scannerError?"var(--accent)":"var(--text3)" }}>{scannerError || "Point your camera at a UPI QR code to scan it."}</p>
                          </div>
                        )}
                        {scanResult && <p className="font-mono text-xs mt-2" style={{ color:"var(--green)" }}>✓ QR scanned and UPI ID filled: {scanResult}</p>}
                      </div>
                    </div>
                  )}

                  {/* NET BANKING */}
                  {method==="netbanking" && (
                    <div className="space-y-3">
                      {banks.map(b=>(
                        <button key={b} onClick={()=>setBank(b)} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all" style={{ background:bank===b?"var(--accentBg)":"var(--surface)", border:`1px solid ${bank===b?"var(--accentBd)":"var(--border)"}` }}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white flex-shrink-0" style={{ background:`hsl(${banks.indexOf(b)*42},65%,45%)` }}>{b.split(" ").map(w=>w[0]).slice(0,3).join("")}</div>
                          <span className="font-mono text-sm" style={{ color:"var(--text)" }}>{b}</span>
                          {bank===b && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color:"var(--accent)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* MUTUAL FUND */}
                  {method==="mutualfund" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl p-5" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)" }}>
                        <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color:"var(--accent)" }}>Portfolio Linked</p>
                        <div className="space-y-2">
                          {[{name:"Axis Bluechip Fund",val:"₹2,34,500",alloc:"50%"},{name:"Mirae Asset Emerging Bluechip",val:"₹1,18,200",alloc:"30%"},{name:"Parag Parikh Flexi Cap",val:"₹82,300",alloc:"20%"}].map(f=>(
                            <div key={f.name} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                              <div><p className="font-mono text-xs" style={{ color:"var(--text)" }}>{f.name}</p><p className="font-mono text-[10px]" style={{ color:"var(--text3)" }}>Lien: {f.alloc}</p></div>
                              <p className="font-mono text-sm font-semibold" style={{ color:"var(--text)" }}>{f.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl p-4" style={{ background:"var(--greenBg)", border:"1px solid var(--greenBd)" }}>
                        <p className="font-mono text-xs" style={{ color:"var(--green)" }}>✓ Portfolio value ₹4,35,000 exceeds required ₹{Math.round(variant.price*1.5).toLocaleString("en-IN")}. You're eligible!</p>
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2" style={{ color:"var(--text3)" }}>Folio Number</label>
                        <input defaultValue="123456789" className="w-full px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none transition-all" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl p-5 space-y-3" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>Send OTP to another number</p>
                      <p className="text-sm mt-1" style={{ color:"var(--text2)" }}>Use a mobile number you can access to verify this payment.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex items-center px-4 rounded-xl font-mono text-sm" style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text2)" }}>+91</div>
                      <input value={mobileNumber} onChange={e=>{ setMobileNumber(e.target.value.replace(/\D/g,"").slice(0,10)); setOtpSent(false); }} inputMode="numeric" placeholder="98765 43210" className="flex-1 px-4 py-3.5 rounded-xl font-mono text-sm focus:outline-none" style={{ background:"var(--surface)", border:`1px solid ${mobileNumber&&!validMobileNumber?"var(--red)":"var(--border)"}`, color:"var(--text)" }} />
                      <button onClick={sendOtp} disabled={!validMobileNumber} className="px-4 py-3 rounded-xl font-mono text-sm font-semibold transition-all" style={{ background:otpSent?"var(--greenBg)":"var(--accentBg)", border:`1px solid ${otpSent?"var(--greenBd)":"var(--accentBd)"}`, color:otpSent?"var(--green)":"var(--accent)", opacity:validMobileNumber?1:0.5, cursor:validMobileNumber?"pointer":"not-allowed" }}>
                        {otpSent ? "OTP Sent ✓" : "Send OTP"}
                      </button>
                    </div>
                    {mobileNumber&&!validMobileNumber && <p className="font-mono text-xs" style={{ color:"var(--red)" }}>Enter a valid 10-digit mobile number.</p>}
                    {otpSent && <p className="font-mono text-xs" style={{ color:"var(--green)" }}>OTP sent to +91 {mobileNumber}. Use any 6 digits in this demo.</p>}
                  </div>

                  <button onClick={proceedToOtp} disabled={!validMobileNumber||!otpSent||(method==="upi"&&!upiVerified)} className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed" style={{ background:validMobileNumber&&otpSent&&(method!=="upi"||upiVerified)?"linear-gradient(135deg,#7c3aed,#a855f7)":"var(--surface2)", boxShadow:validMobileNumber&&otpSent&&(method!=="upi"||upiVerified)?"0 8px 32px rgba(124,58,237,0.4)":"none", color:validMobileNumber&&otpSent&&(method!=="upi"||upiVerified)?"white":"var(--text4)" }}>
                    Proceed to Verify →
                  </button>
                </div>
              )}

              {/* STEP: OTP */}
              {step==="otp" && (
                <div style={{ animation:"pageIn 0.35s ease-out" }} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>setStep("details")} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <h2 className="font-display font-light text-3xl" style={{ color:"var(--text)" }}>Verify OTP</h2>
                  </div>

                  <div className="rounded-2xl p-6 text-center" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background:"var(--accentBg)", border:"1px solid var(--accentBd)" }}>🔐</div>
                    <p className="font-display text-xl font-light mb-2" style={{ color:"var(--text)" }}>We sent a 6-digit code</p>
                    <p className="font-mono text-sm" style={{ color:"var(--text3)" }}>to your registered mobile number <strong style={{ color:"var(--text2)" }}>+91 ••••• ••789</strong></p>
                  </div>

                  {/* OTP inputs */}
                  <div className="flex gap-3 justify-center">
                    {otp.map((d,i)=>(
                      <input key={i} ref={el=>{ otpRefs.current[i]=el; }} value={d} onChange={e=>handleOtp(i,e.target.value)} onKeyDown={e=>handleOtpKey(i,e)} maxLength={1} className="w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl focus:outline-none transition-all"
                        style={{ background:"var(--surface)", border:`2px solid ${d?"var(--accent)":"var(--border)"}`, color:"var(--text)", boxShadow:d?"0 0 12px var(--accentBg)":"none" }}/>
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="text-center">
                    {otpTimer>0
                      ? <p className="font-mono text-sm" style={{ color:"var(--text3)" }}>Resend in <span style={{ color:"var(--accent)" }}>{otpTimer}s</span></p>
                      : <button onClick={()=>{ setOtp(["","","","","",""]); setOtpTimer(30); }} className="font-mono text-sm transition-colors" style={{ color:"var(--accent)" }}>Resend OTP →</button>}
                  </div>

                  <button disabled={!otpFilled} onClick={()=>setStep("success")} className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-300"
                    style={otpFilled?{background:"linear-gradient(135deg,#7c3aed,#a855f7)",boxShadow:"0 8px 32px rgba(124,58,237,0.4)",transform:"scale(1)"}:{background:"var(--surface2)",cursor:"not-allowed",color:"var(--text4)"}}>
                    {otpFilled ? `Confirm Payment of ${fmt(plan.monthly)} →` : "Enter OTP to continue"}
                  </button>

                  <div className="flex items-center justify-center gap-6">
                    {["256-bit encrypted","RBI compliant","Instant settlement"].map(t=>(
                      <span key={t} className="font-mono text-[10px] flex items-center gap-1.5" style={{ color:"var(--text3)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color:"var(--green)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl overflow-hidden" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <div className="relative h-40 overflow-hidden">
                    <Img src={variant.image} alt={variant.name} className="w-full h-full"/>
                    <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom,transparent 40%,var(--bg) 100%)" }}/>
                    <div className="absolute bottom-3 left-4">
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-md font-semibold" style={{ background:`${product.badgeColor}22`, border:`1px solid ${product.badgeColor}55`, color:product.badgeColor }}>{product.badge}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color:`${product.accentColor}88` }}>{product.brand}</p>
                    <p className="font-display text-xl font-light" style={{ color:"var(--text)" }}>{product.name}</p>
                    <p className="font-mono text-xs" style={{ color:"var(--text3)" }}>{variant.colorLabel} · {variant.storage}</p>
                    <div className="h-px" style={{ background:"var(--border)" }}/>
                    <div className="space-y-2">
                      {[
                        {l:"Device Price",v:fmt(variant.price)},
                        {l:`EMI · ${plan.months} months`,v:fmt(plan.monthly)+"/mo"},
                        {l:"Interest",v:plan.interest===0?"0% ✓":`${plan.interest}% p.a.`},
                        ...(plan.cashback>0?[{l:"Cashback",v:`–${fmt(plan.cashback)}`}]:[]),
                        {l:"Total Payable",v:fmt(total)},
                      ].map(r=>(
                        <div key={r.l} className="flex justify-between items-center">
                          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color:"var(--text3)" }}>{r.l}</span>
                          <span className="font-mono text-xs font-semibold" style={{ color: r.l==="Cashback"?"var(--green)":r.l==="Interest"&&plan.interest===0?"var(--green)":r.l==="Total Payable"?"var(--text)":"var(--text2)" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px" style={{ background:"var(--border)" }}/>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text)" }}>Pay Today</span>
                      <span className="font-mono text-xl font-bold" style={{ color:"var(--accent)" }}>{fmt(plan.monthly)}</span>
                    </div>
                    {plan.cashback>0 && (
                      <div className="rounded-lg p-2.5 text-center" style={{ background:"var(--greenBg)", border:"1px solid var(--greenBd)" }}>
                        <p className="font-mono text-xs font-semibold" style={{ color:"var(--green)" }}>🎁 {fmt(plan.cashback)} cashback will be credited in 7 days</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                  {[{icon:"🔒",t:"Bank-grade SSL encryption"},{icon:"🏛️",t:"RBI & SEBI compliant"},{icon:"↩️",t:"7-day hassle-free returns"},{icon:"📦",t:"Delivery within 2 days"}].map(b=>(
                    <div key={b.t} className="flex items-center gap-3">
                      <span className="text-lg">{b.icon}</span>
                      <span className="font-mono text-xs" style={{ color:"var(--text2)" }}>{b.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── APP ──────────────────────────────────────────────
function routeFromPath(pathname:string): { page:PageType; slug:string } {
  const parts = pathname.split("/").filter(Boolean);
  if(parts[0]==="products"&&parts[1]) return { page:"product", slug:decodeURIComponent(parts[1]) };
  if(parts[0]==="products") return { page:"products", slug:"" };
  if(parts[0]==="how-it-works"||parts[0]==="support") return { page:parts[0], slug:"" };
  if(parts[0]==="payment") return { page:"payment", slug:"" };
  return { page:"home", slug:"" };
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const initialRoute = routeFromPath(window.location.pathname);
  const [page, setPage] = useState<PageType>(initialRoute.page);
  const [productSlug, setProductSlug] = useState(initialRoute.slug);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState|null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  useEffect(() => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    fetch(`${apiBaseUrl}/api/products`)
      .then(response => {
        if(!response.ok) throw new Error("Catalog request failed");
        return response.json() as Promise<Product[]>;
      })
      .then(setProducts)
      .catch(() => setProducts(FALLBACK_PRODUCTS));
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const route = routeFromPath(window.location.pathname);
      setPage(route.page);
      setProductSlug(route.slug);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((p: PageType, slug?: string) => {
    setPage(p);
    if (slug) setProductSlug(slug);
    const path = p==="product"&&slug ? `/products/${encodeURIComponent(slug)}` : p==="home" ? "/" : `/${p}`;
    window.history.pushState({}, "", path);
    window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  const handlePay = useCallback((state: PaymentState) => {
    setPaymentState(state);
    setPage("payment");
    window.history.pushState({}, "", "/payment");
    window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  if(catalogError) return <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background:"var(--bg)", color:"var(--text2)" }}>{catalogError}</div>;
  if(!products.length) return <div className="min-h-screen flex items-center justify-center px-6 text-center font-mono text-sm" style={{ background:"var(--bg)", color:"var(--text3)" }}>Loading product catalog...</div>;

  return (
    <ProductsContext.Provider value={products}>
      <div style={{ minHeight:"100vh", background:"var(--bg)", transition:"background 0.35s ease" }}>
        <Nav page={page} isDark={isDark} toggleTheme={()=>setIsDark(d=>!d)} navigate={navigate}/>
        <div key={page==="product"?productSlug:page==="payment"?"payment":page} style={{ animation:"pageIn 0.4s ease-out" }}>
          {page==="home"         && <HomePage navigate={navigate}/>} 
          {page==="products"     && <ProductsPage navigate={navigate}/>} 
          {page==="how-it-works" && <HowItWorksPage navigate={navigate}/>} 
          {page==="support"      && <SupportPage navigate={navigate}/>} 
          {page==="product" && productSlug && <ProductDetailPage slug={productSlug} navigate={navigate} onPay={handlePay}/>} 
          {page==="payment" && paymentState && <PaymentPage state={paymentState} navigate={navigate}/>} 
        </div>
        <Footer navigate={navigate}/>
      </div>
    </ProductsContext.Provider>
  );
}
