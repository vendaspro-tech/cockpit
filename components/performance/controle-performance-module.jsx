"use client";
/* eslint-disable react-hooks/static-components, react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key, shared = false) => {
      const storageKey = shared ? `shared__${key}` : key;
      const value = window.localStorage.getItem(storageKey);
      if (value === null) throw new Error(`Key not found: ${key}`);
      return { key, value, shared };
    },
    set: async (key, value, shared = false) => {
      const storageKey = shared ? `shared__${key}` : key;
      const resolvedValue = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(storageKey, resolvedValue);
      return { key, value: resolvedValue, shared };
    },
    delete: async (key, shared = false) => {
      const storageKey = shared ? `shared__${key}` : key;
      window.localStorage.removeItem(storageKey);
      return { key, deleted: true, shared };
    },
    list: async (prefix = "", shared = false) => {
      const resolvedPrefix = shared ? `shared__${prefix}` : prefix;
      const keys = Object.keys(window.localStorage).filter((itemKey) =>
        itemKey.startsWith(resolvedPrefix)
      );
      return { keys, prefix, shared };
    },
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const YEAR = 2026;
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_FIELDS = ["leadsRecebidos","leadsContatados","sessoesAbertas","oportunidades","callAgendadas","callRealizadas","vendas","valor"];
const DEFAULT_CONFIG = { products:["Produto A","Produto B"], vendors:Array.from({length:10},(_,i)=>`Vendedor ${i+1}`) };

// ─── Brand ────────────────────────────────────────────────────────────────────
const B = {
  bg: "var(--background)",
  bgLight: "color-mix(in oklab, var(--muted) 88%, var(--background) 12%)",
  bgDeep: "color-mix(in oklab, var(--muted) 76%, var(--background) 24%)",
  surface: "var(--card)",
  surfaceHover: "color-mix(in oklab, var(--card) 85%, var(--muted) 15%)",
  border: "var(--border)",
  borderLight: "color-mix(in oklab, var(--border) 70%, var(--background) 30%)",
  text: "var(--foreground)",
  textMid: "color-mix(in oklab, var(--foreground) 72%, var(--muted-foreground) 28%)",
  textSoft: "var(--muted-foreground)",
  textLight: "color-mix(in oklab, var(--muted-foreground) 65%, var(--background) 35%)",
  accent: "var(--primary)",
  green: "var(--chart-2)",
  amber: "var(--chart-4)",
  red: "var(--destructive)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const num = v => parseFloat(v)||0;
const pct = (a,b) => b>0 ? (a/b*100).toFixed(1)+"%" : "—";
const fmtBRL = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const sumF = (arr,f) => arr.reduce((s,d)=>s+num(d[f]),0);
const hashStr = s => { let h=0; for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;} return h.toString(16); };
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const isWeekend = d => [0,6].includes(d.getDay());
const fmtDate = d => d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});

function getMonthWeeks(year, monthIdx) {
  const total = daysInMonth(year, monthIdx);
  const weeks = []; let day=1, wn=1;
  while(day<=total){
    const wdays=[];
    for(let i=0;i<7&&day<=total;i++,day++){
      const date=new Date(year,monthIdx,day);
      wdays.push({day,date,label:fmtDate(date),isWeekend:isWeekend(date)});
    }
    weeks.push({
      name:`Semana ${wn}`,
      days:wdays,
      start:wdays[0].date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),
      end:wdays[wdays.length-1].date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),
    });
    wn++;
  }
  return weeks;
}

function calcTotals(dayDataArr){
  const lr=sumF(dayDataArr,"leadsRecebidos"),lc=sumF(dayDataArr,"leadsContatados");
  const sa=sumF(dayDataArr,"sessoesAbertas"),op=sumF(dayDataArr,"oportunidades");
  const ca=sumF(dayDataArr,"callAgendadas"),cr=sumF(dayDataArr,"callRealizadas");
  const vd=sumF(dayDataArr,"vendas"),vl=sumF(dayDataArr,"valor");
  return {lr,lc,sa,op,ca,cr,vd,vl,
    pctContatados:pct(lc,lr),pctSessoes:pct(sa,lr),pctOport:pct(op,sa),
    pctCallAg:pct(ca,op),pctCallReal:pct(cr,ca),pctConvLead:pct(vd,lr),pctConvCall:pct(vd,cr),
  };
}

function pctColor(str){
  if(!str||str==="—") return B.textLight;
  const v=parseFloat(str);
  if(v>=100)return B.green; if(v>=70)return B.amber; if(v>=40)return"#B05A2E"; return B.red;
}
function pctBg(str){
  if(!str||str==="—") return"transparent";
  const v=parseFloat(str);
  if(v>=100)return"color-mix(in oklab, var(--chart-2) 16%, var(--background) 84%)";
  if(v>=70)return"color-mix(in oklab, var(--chart-4) 16%, var(--background) 84%)";
  if(v>=40)return"color-mix(in oklab, var(--chart-1) 16%, var(--background) 84%)";
  return"color-mix(in oklab, var(--destructive) 16%, var(--background) 84%)";
}

// ─── Data factory ─────────────────────────────────────────────────────────────
// Structure: data[product][monthName] = { metaVendas, metaCash, vendors:[{name, days:{1:{...fields}, 2:{...}, ...}}] }
function makeVendorDays(year, monthIdx){
  const total=daysInMonth(year,monthIdx);
  const days={};
  for(let d=1;d<=total;d++) days[d]=Object.fromEntries(DAY_FIELDS.map(f=>[f,""]));
  return days;
}
function makeMonth(vendorNames, year, monthIdx){
  return {
    metaVendas:"", metaCash:"",
    vendors: vendorNames.map(name=>({ name, days:makeVendorDays(year,monthIdx) }))
  };
}
function makeClientData(config){
  const d={};
  config.products.forEach(p=>{ d[p]={}; MONTHS.forEach((m,mi)=>{ d[p][m]=makeMonth(config.vendors,YEAR,mi); }); });
  return d;
}

// Ensure a month has the right number of days (in case of data migration)
function ensureMonthDays(monthData, vendorNames, year, monthIdx){
  const total=daysInMonth(year,monthIdx);
  const md=JSON.parse(JSON.stringify(monthData));
  // Ensure vendor count matches
  while(md.vendors.length<vendorNames.length){
    const name=vendorNames[md.vendors.length];
    const days={};
    for(let d=1;d<=total;d++) days[d]=Object.fromEntries(DAY_FIELDS.map(f=>[f,""]));
    md.vendors.push({name,days});
  }
  md.vendors=md.vendors.slice(0,vendorNames.length);
  // Ensure each vendor has all days
  md.vendors.forEach((v,vi)=>{
    v.name=vendorNames[vi];
    for(let d=1;d<=total;d++){
      if(!v.days[d]) v.days[d]=Object.fromEntries(DAY_FIELDS.map(f=>[f,""]));
    }
  });
  return md;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.cp-root{width:100%;max-width:100%;overflow-x:clip}
.cp-root *,.cp-root *::before,.cp-root *::after{box-sizing:border-box}
.cp-root input[type=number]{-moz-appearance:textfield}
.cp-root input::-webkit-outer-spin-button,.cp-root input::-webkit-inner-spin-button{-webkit-appearance:none}
.cp-root ::-webkit-scrollbar{width:5px;height:5px}
.cp-root ::-webkit-scrollbar-track{background:${B.bgDeep}}
.cp-root ::-webkit-scrollbar-thumb{background:${B.border};border-radius:3px}
.cp-root ::-webkit-scrollbar-thumb:hover{background:${B.textLight}}
.cp-root .mh:hover{background:${B.bgDeep}!important}
.cp-root .wh:hover{background:${B.bgLight}!important}
.cp-root .vr:hover{background:${B.surfaceHover}!important}
.cp-root .dr:hover td{background:color-mix(in oklab, var(--card) 94%, var(--muted) 6%)!important}
.cp-root .ic:focus{border-color:${B.accent}!important;background:${B.surface}!important;outline:none;box-shadow:0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent)!important}
.cp-root .btn-primary{background:${B.accent};border:none;color:var(--primary-foreground);padding:10px 22px;border-radius:8px;font-family:var(--font-urbanist),ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s}
.cp-root .btn-primary:hover{background:${B.textMid}}
.cp-root .btn-ghost{background:transparent;border:1.5px solid ${B.border};color:${B.textMid};padding:7px 14px;border-radius:8px;font-family:var(--font-urbanist),ui-sans-serif,system-ui,sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s}
.cp-root .btn-ghost:hover{background:${B.surface};border-color:${B.accent};color:${B.accent}}
.cp-root .btn-danger{background:transparent;border:1px solid color-mix(in oklab, var(--destructive) 35%, var(--background) 65%);color:${B.red};padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;transition:all 0.15s;font-family:var(--font-urbanist),ui-sans-serif,system-ui,sans-serif}
.cp-root .btn-danger:hover{background:color-mix(in oklab, var(--destructive) 12%, var(--background) 88%)}
.cp-root .tab-btn{background:transparent;border:none;padding:14px 18px;color:${B.textSoft};font-family:var(--font-urbanist),ui-sans-serif,system-ui,sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;border-bottom:2px solid transparent}
.cp-root .tab-btn:hover{color:${B.text}}
.cp-root .tab-btn.active{color:${B.text};border-bottom:2px solid ${B.accent};font-weight:700}
@keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.cp-root .fu{animation:fu 0.2s ease forwards}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.cp-root .si{animation:slideIn 0.22s ease forwards}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.cp-root .pl{animation:pulse 1.4s ease infinite}
.cp-root td,.cp-root th{white-space:nowrap}
.cp-root .modal-overlay{position:fixed;inset:0;background:rgba(30,37,53,0.35);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(6px)}
.cp-root .modal{background:${B.surface};border:1px solid ${B.borderLight};border-radius:16px;padding:32px;min-width:440px;max-width:600px;width:90%;box-shadow:0 20px 60px rgba(30,37,53,0.15);max-height:85vh;overflow-y:auto}
.cp-root .cp-header-row{display:flex;align-items:center;gap:0;min-width:0;flex-wrap:wrap}
.cp-root .cp-shell{max-width:100%}
.cp-root .cp-main{min-width:0}
.cp-root .cp-products,.cp-root .cp-viewtoggle,.cp-root .cp-header-right{min-width:0}
@media (max-width:1280px){
  .cp-root .cp-shell{grid-template-columns:minmax(0,1fr)!important;padding:16px!important}
  .cp-root .cp-month-sidebar{position:static!important}
  .cp-root .cp-header-row{gap:8px}
  .cp-root .cp-products{order:3;width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}
  .cp-root .cp-viewtoggle{order:4;margin-left:0!important;margin-right:auto!important}
  .cp-root .cp-header-right{margin-left:auto}
}
@media (max-width:900px){
  .cp-root .cp-header-padding{padding:0 16px!important}
  .cp-root .cp-shell{padding:12px!important}
}
`;

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({config,onSave,onClose}){
  const [products,setProducts]=useState([...config.products]);
  const [vendors,setVendors]=useState([...config.vendors]);
  const [newProduct,setNewProduct]=useState("");
  const [newVendor,setNewVendor]=useState("");
  const [tab,setTab]=useState("vendors");
  const inp={background:B.bgLight,border:`1.5px solid ${B.border}`,borderRadius:8,padding:"9px 12px",color:B.text,fontSize:13,fontFamily:"'Manrope',sans-serif",fontWeight:500,transition:"all 0.15s",width:"100%"};
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal si" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div style={{fontSize:18,fontWeight:800,color:B.text}}>Configurações</div>
          <button className="btn-ghost" onClick={onClose} style={{padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:2,marginBottom:22,borderBottom:`1.5px solid ${B.borderLight}`}}>
          {[["vendors","Vendedores"],["products","Produtos"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"10px 18px",border:"none",background:"transparent",borderBottom:tab===t?`2px solid ${B.accent}`:"2px solid transparent",color:tab===t?B.text:B.textSoft,fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:tab===t?700:500,cursor:"pointer",transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
        {tab==="vendors"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:12,color:B.textSoft,marginBottom:4,fontWeight:500}}>Edite, adicione ou remova vendedores.</p>
            {vendors.map((v,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:B.textLight,fontFamily:"'DM Mono',monospace",width:22,textAlign:"right"}}>{i+1}</span>
                <input className="ic" value={v} onChange={e=>{const n=[...vendors];n[i]=e.target.value;setVendors(n);}} style={{...inp,flex:1}}/>
                <button className="btn-danger" onClick={()=>setVendors(vendors.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <input className="ic" value={newVendor} onChange={e=>setNewVendor(e.target.value)} placeholder="Nome do novo vendedor" style={{...inp,flex:1}}
                onKeyDown={e=>{if(e.key==="Enter"&&newVendor.trim()){setVendors([...vendors,newVendor.trim()]);setNewVendor("");}}}/>
              <button className="btn-ghost" onClick={()=>{if(newVendor.trim()){setVendors([...vendors,newVendor.trim()]);setNewVendor("");}}} style={{whiteSpace:"nowrap"}}>+ Adicionar</button>
            </div>
          </div>
        )}
        {tab==="products"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:12,color:B.textSoft,marginBottom:4,fontWeight:500}}>Adicione ou remova produtos.</p>
            {products.map((p,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="ic" value={p} onChange={e=>{const n=[...products];n[i]=e.target.value;setProducts(n);}} style={{...inp,flex:1}}/>
                <button className="btn-danger" onClick={()=>products.length>1&&setProducts(products.filter((_,j)=>j!==i))} style={{opacity:products.length<=1?0.3:1}}>✕</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <input className="ic" value={newProduct} onChange={e=>setNewProduct(e.target.value)} placeholder="Nome do produto" style={{...inp,flex:1}}
                onKeyDown={e=>{if(e.key==="Enter"&&newProduct.trim()){setProducts([...products,newProduct.trim()]);setNewProduct("");}}}/>
              <button className="btn-ghost" onClick={()=>{if(newProduct.trim()){setProducts([...products,newProduct.trim()]);setNewProduct("");}}} style={{whiteSpace:"nowrap"}}>+ Adicionar</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:26,justifyContent:"flex-end"}}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={()=>onSave({products,vendors})}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────
const TH = ({label, sub, first}) => (
  <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:B.textSoft,fontFamily:"'DM Mono',monospace",letterSpacing:0.4,borderBottom:`2px solid ${B.border}`,background:B.bgLight,textAlign:first?"left":"center",whiteSpace:"nowrap"}}>
    {label}{sub&&<div style={{fontSize:9,color:B.textLight,marginTop:1}}>{sub}</div>}
  </th>
);
const TD = ({v,currency,bold,dim}) => {
  const n=num(v);
  return <td style={{padding:"7px 10px",fontFamily:"'DM Mono',monospace",fontSize:12,borderBottom:`1px solid ${B.borderLight}`,color:n>0?(bold?B.text:B.textMid):(dim?B.borderLight:B.textLight),fontWeight:bold?600:400,textAlign:"center"}}>
    {currency?fmtBRL(n):n>0?n.toLocaleString("pt-BR"):"0"}
  </td>;
};
const TDP = ({v,bold}) => {
  const color=pctColor(v), bg=bold?pctBg(v):"transparent";
  return <td style={{padding:"7px 10px",fontFamily:"'DM Mono',monospace",fontSize:12,borderBottom:`1px solid ${B.borderLight}`,textAlign:"center"}}>
    <span style={{background:bg,color,borderRadius:4,padding:bold?"2px 7px":"0",display:"inline-block",fontWeight:bold?700:500}}>{v||"—"}</span>
  </td>;
};
function TotalsRow({t,label,bg}){
  return <tr style={{background:bg||B.bgLight}}>
    <td colSpan={2} style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:B.text,borderBottom:`1px solid ${B.borderLight}`}}>{label}</td>
    <TD v={t.lr} bold/><TD v={t.lc} bold/><TDP v={t.pctContatados} bold/>
    <TD v={t.sa} bold/><TDP v={t.pctSessoes} bold/>
    <TD v={t.op} bold/><TDP v={t.pctOport} bold/>
    <TD v={t.ca} bold/><TDP v={t.pctCallAg} bold/>
    <TD v={t.cr} bold/><TDP v={t.pctCallReal} bold/>
    <TD v={t.vd} bold/><TDP v={t.pctConvLead} bold/><TDP v={t.pctConvCall} bold/>
    <TD v={t.vl} currency bold/>
  </tr>;
}
function ColHeaders(){
  return <thead><tr>
    <TH label="VENDEDOR" first/><TH label="DATA" first/>
    <TH label="LEADS" sub="RECEB."/><TH label="LEADS" sub="CONT."/><TH label="%" sub="CONTAT."/>
    <TH label="SESSÕES" sub="ABERTAS"/><TH label="%" sub="SESS."/>
    <TH label="OPOR-" sub="TUNIDADES"/><TH label="%" sub="OPOR."/>
    <TH label="CALL" sub="AGEND."/><TH label="%" sub="C.AG."/>
    <TH label="CALL" sub="REAL."/><TH label="%" sub="C.RL."/>
    <TH label="VENDAS"/><TH label="%" sub="CONV/L"/><TH label="%" sub="CONV/C"/>
    <TH label="VALOR" sub="R$"/>
  </tr></thead>;
}

// ─── Vendor row with inline rename ────────────────────────────────────────────
function VendorRow({vendor, vendorIdx, weekDays, monthIdx, onDayChange, onRename}){
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(false);
  const [nameVal,setNameVal]=useState(vendor.name);

  const vendorDayData = weekDays.map(d => vendor.days[d.day] || Object.fromEntries(DAY_FIELDS.map(f=>[f,""])));
  const t = useMemo(()=>calcTotals(vendorDayData),[vendor.days, weekDays]);
  const hasData = weekDays.some(d=>DAY_FIELDS.some(f=>num(vendor.days[d.day]?.[f])>0));

  const commitRename=()=>{
    setEditing(false);
    if(nameVal.trim()&&nameVal.trim()!==vendor.name) onRename(nameVal.trim());
    else setNameVal(vendor.name);
  };

  return <>
    <tr className="vr" onClick={()=>!editing&&setOpen(o=>!o)}
      style={{background:vendorIdx%2===0?"color-mix(in oklab, var(--card) 88%, var(--muted) 12%)":B.surface,borderTop:`2px solid ${B.border}`,cursor:"pointer"}}>
      <td style={{padding:"9px 10px 9px 14px",fontSize:13,color:B.text,fontWeight:600,borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{marginRight:7,color:B.textLight,fontSize:9,fontWeight:700}}>{open?"▼":"▶"}</span>
        {editing?(
          <input autoFocus className="ic" value={nameVal}
            onClick={e=>e.stopPropagation()}
            onChange={e=>setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e=>{if(e.key==="Enter")commitRename();if(e.key==="Escape"){setNameVal(vendor.name);setEditing(false);}}}
            style={{background:B.bgLight,border:`1.5px solid ${B.accent}`,borderRadius:6,padding:"3px 8px",color:B.text,fontSize:13,fontFamily:"'Manrope',sans-serif",fontWeight:600,width:160}}/>
        ):(
          <>
            {vendor.name}
            <span title="Editar nome" onClick={e=>{e.stopPropagation();setEditing(true);}}
              style={{marginLeft:7,color:B.textLight,fontSize:11,cursor:"text",opacity:0.4,transition:"opacity 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity=1}
              onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>✎</span>
          </>
        )}
        {hasData&&!editing&&<span style={{marginLeft:8,width:5,height:5,borderRadius:"50%",background:B.accent,display:"inline-block",verticalAlign:"middle"}}/>}
      </td>
      <td style={{padding:"9px 10px",fontSize:11,color:B.textLight,fontFamily:"'DM Mono',monospace",borderBottom:`1px solid ${B.borderLight}`}}>— semana</td>
      <TD v={t.lr} dim/><TD v={t.lc} dim/><TDP v={t.pctContatados}/>
      <TD v={t.sa} dim/><TDP v={t.pctSessoes}/>
      <TD v={t.op} dim/><TDP v={t.pctOport}/>
      <TD v={t.ca} dim/><TDP v={t.pctCallAg}/>
      <TD v={t.cr} dim/><TDP v={t.pctCallReal}/>
      <TD v={t.vd} dim/><TDP v={t.pctConvLead}/><TDP v={t.pctConvCall}/>
      <TD v={t.vl} currency dim/>
    </tr>

    {open && weekDays.map((d,di)=>{
      const dayData = vendor.days[d.day] || Object.fromEntries(DAY_FIELDS.map(f=>[f,""]));
      return (
        <tr key={di} className="dr" style={{background:d.isWeekend?"color-mix(in oklab, var(--muted) 80%, var(--background) 20%)":B.surface}}>
          <td colSpan={2} style={{padding:"4px 10px 4px 32px",borderBottom:`1px solid ${B.borderLight}`}}>
            <span style={{background:d.isWeekend?B.bgDeep:B.bgLight,borderRadius:5,padding:"3px 9px",fontSize:10,fontWeight:600,color:d.isWeekend?B.textSoft:B.textMid,display:"inline-block"}}>
              {d.label}
            </span>
            {d.isWeekend&&<span style={{fontSize:9,color:B.textLight,marginLeft:6,fontFamily:"'DM Mono',monospace"}}>FDS</span>}
          </td>
          {DAY_FIELDS.map(f=>(
            <td key={f} style={{padding:"3px 5px",borderBottom:`1px solid ${B.borderLight}`}}>
              <input type="number" className="ic" value={dayData[f]} onChange={e=>onDayChange(d.day,f,e.target.value)} placeholder="0"
                style={{width:f==="valor"?88:54,background:d.isWeekend?B.bgDeep:B.bgLight,border:`1px solid ${B.borderLight}`,borderRadius:5,padding:"4px 6px",color:B.text,fontSize:11,fontFamily:"'DM Mono',monospace",textAlign:"center",transition:"all 0.15s"}}/>
            </td>
          ))}
        </tr>
      );
    })}
  </>;
}

// ─── Week Section ─────────────────────────────────────────────────────────────
function WeekSection({week, weekIdx, vendors, monthIdx, onDayChange, onRename}){
  const [open,setOpen]=useState(weekIdx===0);

  const allDayData = vendors.flatMap(v => week.days.map(d => v.days[d.day] || Object.fromEntries(DAY_FIELDS.map(f=>[f,""]))));
  const t = useMemo(()=>calcTotals(allDayData),[vendors, week.days]);
  const hasData = vendors.some(v=>week.days.some(d=>DAY_FIELDS.some(f=>num(v.days[d.day]?.[f])>0)));

  return(
    <div style={{marginBottom:5}}>
      <div className="wh" onClick={()=>setOpen(o=>!o)} style={{background:B.bgLight,border:`1.5px solid ${B.border}`,borderRadius:open?"12px 12px 0 0":12,padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"background 0.1s"}}>
        <span style={{color:B.textLight,fontSize:10,fontWeight:700}}>{open?"▼":"▶"}</span>
        <span style={{fontWeight:800,fontSize:14,color:B.text}}>{week.name}</span>
        <span style={{fontSize:12,color:B.textSoft,fontFamily:"'DM Mono',monospace"}}>{week.start} → {week.end}</span>
        <span style={{fontSize:11,color:B.textLight}}>({week.days.length} dias)</span>
        <div style={{display:"flex",gap:16,marginLeft:8}}>
          {[["Leads",t.lr],["Calls",t.cr],["Vendas",t.vd]].map(([l,v])=>(
            <span key={l} style={{fontSize:12,color:B.textSoft}}>{l}: <span style={{color:v>0?B.textMid:B.textLight,fontFamily:"'DM Mono',monospace"}}>{v}</span></span>
          ))}
          {t.vl>0&&<span style={{fontSize:12,color:B.green,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{fmtBRL(t.vl)}</span>}
        </div>
        {hasData&&<span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:B.accent}}/>}
      </div>

      {open&&(
        <div style={{border:`1.5px solid ${B.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
          <div style={{overflowX:"auto",maxWidth:"100%"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <ColHeaders/>
              <tbody>
                <TotalsRow t={t} label={`Total ${week.name} · ${week.start}→${week.end}`} bg={B.bgLight}/>
                {vendors.map((vendor,vi)=>(
                  <VendorRow key={vi}
                    vendor={vendor} vendorIdx={vi}
                    weekDays={week.days} monthIdx={monthIdx}
                    onDayChange={(day,f,v)=>onDayChange(vi,day,f,v)}
                    onRename={name=>onRename(vi,name)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
const CC={lr:"#4A90B8",lc:"#7BB3CC",sa:"#5BA08A",op:"#8FBF6A",ca:"#D4A843",cr:"#C47B3A",vd:"#2E7D5E",vl:"#1E5E46"};

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 20px rgba(30,37,53,0.1)"}}>
      <div style={{fontSize:11,color:B.textSoft,fontWeight:700,marginBottom:6,fontFamily:"'DM Mono',monospace"}}>{label}</div>
      {payload.map(p=>(
        <div key={p.dataKey} style={{fontSize:12,display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.color,display:"inline-block"}}/>
          <span style={{color:B.textSoft}}>{p.name}:</span>
          <span style={{color:B.text,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{p.dataKey==="valor"?fmtBRL(p.value):p.value}</span>
        </div>
      ))}
    </div>
  );
};

function DashboardView({monthData, metaV, monthIdx}){
  const [chart,setChart]=useState("funil");

  const weeks=useMemo(()=>getMonthWeeks(YEAR,monthIdx),[monthIdx]);

  // Build per-day data for charts
  const daily=useMemo(()=>{
    const total=daysInMonth(YEAR,monthIdx);
    return Array.from({length:total},(_,i)=>{
      const day=i+1;
      const date=new Date(YEAR,monthIdx,day);
      const row={label:date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),leadsRecebidos:0,leadsContatados:0,sessoesAbertas:0,oportunidades:0,callAgendadas:0,callRealizadas:0,vendas:0,valor:0};
      monthData.vendors.forEach(v=>{
        DAY_FIELDS.forEach(f=>{row[f]+=num(v.days[day]?.[f]);});
      });
      return row;
    });
  },[monthData,monthIdx]);

  // Vendor ranking
  const ranking=useMemo(()=>{
    return monthData.vendors.map(v=>{
      const allDays=Object.values(v.days);
      const t=calcTotals(allDays);
      return{name:v.name,...t,
        pctConvLead:t.lr>0?(t.vd/t.lr*100).toFixed(1)+"%":"—",
        pctConvCall:t.cr>0?(t.vd/t.cr*100).toFixed(1)+"%":"—",
      };
    }).sort((a,b)=>b.vd-a.vd);
  },[monthData]);

  const mt=useMemo(()=>calcTotals(monthData.vendors.flatMap(v=>Object.values(v.days))),[monthData]);
  const hasData=daily.some(d=>d.leadsRecebidos>0||d.vendas>0);

  const ChartCard=({title,children})=>(
    <div style={{background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:14,padding:"20px 22px",boxShadow:"0 1px 6px rgba(30,37,53,0.04)"}}>
      <div style={{fontSize:13,fontWeight:700,color:B.text,marginBottom:16}}>{title}</div>
      {children}
    </div>
  );

  const kpis=[
    {label:"Leads Recebidos",value:mt.lr,color:CC.lr},
    {label:"Leads Contatados",value:mt.lc,color:CC.lc},
    {label:"Sessões Abertas",value:mt.sa,color:CC.sa},
    {label:"Oportunidades",value:mt.op,color:CC.op},
    {label:"Calls Realizadas",value:mt.cr,color:CC.cr},
    {label:"Vendas",value:mt.vd,color:CC.vd},
    {label:"Receita",value:fmtBRL(mt.vl),color:CC.vl,str:true},
    {label:"Conv. Lead→Venda",value:mt.lr>0?(mt.vd/mt.lr*100).toFixed(1)+"%":"—",color:B.green,str:true},
  ];

  if(!hasData) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
      <div style={{fontSize:48}}>📊</div>
      <div style={{fontSize:16,fontWeight:700,color:B.textMid}}>Sem dados para exibir</div>
      <div style={{fontSize:13,color:B.textLight,textAlign:"center",maxWidth:300,lineHeight:1.6}}>Preencha os dados na aba <strong>Planilha</strong> para ver os gráficos aqui.</div>
    </div>
  );

  return(
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))",gap:10}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:10,padding:"12px 14px",borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:9,color:B.textSoft,fontFamily:"'DM Mono',monospace",letterSpacing:0.5,marginBottom:5,fontWeight:600}}>{k.label.toUpperCase()}</div>
            <div style={{fontSize:k.str?13:20,fontWeight:800,color:k.color,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>

      <ChartCard title="Evolução por Dia">
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[["funil","Funil"],["leads","Leads"],["vendas","Vendas"],["calls","Calls"],["valor","Receita"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setChart(id)} style={{padding:"5px 13px",borderRadius:20,border:`1.5px solid ${chart===id?B.accent:B.border}`,background:chart===id?B.accent:"transparent",color:chart===id?"#fff":B.textSoft,fontFamily:"'Manrope',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{lbl}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {chart==="funil"?(
            <BarChart data={daily} margin={{top:0,right:4,left:-15,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={B.borderLight} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:8,fill:B.textLight,fontFamily:"'DM Mono',monospace"}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:9,fill:B.textLight}} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:11,fontFamily:"'Manrope',sans-serif"}}/>
              <Bar dataKey="leadsRecebidos" name="Leads" fill={CC.lr} radius={[2,2,0,0]}/>
              <Bar dataKey="sessoesAbertas" name="Sessões" fill={CC.sa} radius={[2,2,0,0]}/>
              <Bar dataKey="callRealizadas" name="Calls" fill={CC.cr} radius={[2,2,0,0]}/>
              <Bar dataKey="vendas" name="Vendas" fill={CC.vd} radius={[2,2,0,0]}/>
            </BarChart>
          ):chart==="leads"?(
            <AreaChart data={daily} margin={{top:0,right:4,left:-15,bottom:0}}>
              <defs>
                <linearGradient id="glr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CC.lr} stopOpacity={0.15}/><stop offset="95%" stopColor={CC.lr} stopOpacity={0}/></linearGradient>
                <linearGradient id="gsa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CC.sa} stopOpacity={0.15}/><stop offset="95%" stopColor={CC.sa} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={B.borderLight} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:8,fill:B.textLight}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:9,fill:B.textLight}} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="leadsRecebidos" name="Leads Recebidos" stroke={CC.lr} fill="url(#glr)" strokeWidth={2} dot={{r:1.5}} activeDot={{r:4}}/>
              <Area type="monotone" dataKey="sessoesAbertas" name="Sessões Abertas" stroke={CC.sa} fill="url(#gsa)" strokeWidth={2} dot={{r:1.5}} activeDot={{r:4}}/>
            </AreaChart>
          ):chart==="vendas"?(
            <AreaChart data={daily} margin={{top:0,right:4,left:-15,bottom:0}}>
              <defs><linearGradient id="gvd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CC.vd} stopOpacity={0.2}/><stop offset="95%" stopColor={CC.vd} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={B.borderLight} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:8,fill:B.textLight}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:9,fill:B.textLight}} tickLine={false} axisLine={false} allowDecimals={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="vendas" name="Vendas" stroke={CC.vd} fill="url(#gvd)" strokeWidth={2.5} dot={{r:2.5,fill:CC.vd}} activeDot={{r:5}}/>
            </AreaChart>
          ):chart==="calls"?(
            <BarChart data={daily} margin={{top:0,right:4,left:-15,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={B.borderLight} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:8,fill:B.textLight}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:9,fill:B.textLight}} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="callAgendadas" name="Agendadas" fill={CC.ca} radius={[2,2,0,0]}/>
              <Bar dataKey="callRealizadas" name="Realizadas" fill={CC.cr} radius={[2,2,0,0]}/>
            </BarChart>
          ):(
            <AreaChart data={daily} margin={{top:0,right:4,left:16,bottom:0}}>
              <defs><linearGradient id="gvl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CC.vl} stopOpacity={0.2}/><stop offset="95%" stopColor={CC.vl} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={B.borderLight} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:8,fill:B.textLight}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:9,fill:B.textLight}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="valor" name="Receita" stroke={CC.vl} fill="url(#gvl)" strokeWidth={2.5} dot={{r:2,fill:CC.vl}} activeDot={{r:5}}/>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="🏆 Ranking de Vendedores">
        <div style={{overflowX:"auto",maxWidth:"100%"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:B.bgLight}}>
              {["#","Vendedor","Leads","Contatados","Sessões","Calls","Vendas","Receita","Conv/Lead","Conv/Call"].map((h,i)=>(
                <th key={i} style={{padding:"9px 12px",fontSize:10,fontWeight:700,color:B.textSoft,fontFamily:"'DM Mono',monospace",textAlign:i<=1?"left":"center",borderBottom:`2px solid ${B.border}`,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ranking.map((v,i)=>{
                const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
                return(
                  <tr key={v.name} style={{background:i%2===0?B.surface:B.bgLight,borderBottom:`1px solid ${B.borderLight}`}} className="vr">
                    <td style={{padding:"10px 12px",fontSize:14,fontWeight:800}}>{medal||<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:B.textLight}}>{i+1}</span>}</td>
                    <td style={{padding:"10px 12px",fontWeight:i<3?700:500,fontSize:13,color:B.text}}>{v.name}</td>
                    {[
                      {val:v.lr},{val:v.lc},{val:v.sa},{val:v.cr},
                      {val:v.vd,green:true},
                      {val:fmtBRL(v.vl),green:true,str:true},
                      {val:v.pctConvLead,isPct:true},
                      {val:v.pctConvCall,isPct:true},
                    ].map(({val,green,str,isPct},ci)=>(
                      <td key={ci} style={{padding:"10px 12px",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:12,color:green&&(str?num(0)<num(v.vl):v.vd>0)?B.green:isPct?pctColor(val):B.textMid,fontWeight:green?700:400}}>
                        {val}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ProductTab({name, active, onClick, onRename}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(name);

  useEffect(()=>setVal(name),[name]);

  const commit=()=>{
    setEditing(false);
    if(val.trim()&&val.trim()!==name) onRename(val.trim());
    else setVal(name);
  };

  if(editing) return(
    <div style={{display:"flex",alignItems:"center",borderBottom:`2px solid ${B.accent}`,padding:"0 4px"}}>
      <input autoFocus className="ic" value={val}
        onChange={e=>setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setVal(name);setEditing(false);}}}
        style={{background:"transparent",border:"none",borderBottom:`1px solid ${B.accent}`,padding:"14px 6px",color:B.text,fontSize:13,fontFamily:"'Manrope',sans-serif",fontWeight:700,width:Math.max(val.length*9,80),outline:"none",boxShadow:"none"}}
      />
    </div>
  );

  return(
    <button className={`tab-btn${active?" active":""}`} onClick={onClick}
      onDoubleClick={e=>{e.stopPropagation();setEditing(true);}}
      title="Duplo clique para renomear"
      style={{position:"relative"}}>
      {name}
      {active&&<span title="Renomear" onClick={e=>{e.stopPropagation();setEditing(true);}}
        style={{marginLeft:6,fontSize:10,color:B.textLight,opacity:0.5,cursor:"text",transition:"opacity 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1}
        onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>✎</span>}
    </button>
  );
}

// ─── Dashboard (main) ─────────────────────────────────────────────────────────
function Dashboard({ user, company, workspaceId }){
  const [config,setConfig]=useState(null);
  const [salesData,setSalesData]=useState(null);
  const [prod,setProd]=useState(null);
  const [month,setMonth]=useState(MONTHS[new Date().getMonth()]);
  const [saving,setSaving]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [view,setView]=useState("planilha");

  const storageSuffix = `${workspaceId || "default"}_${user}`;
  const storageKey=`cpv5_${storageSuffix}`;
  const configKey=`cfgv5_${storageSuffix}`;

  useEffect(()=>{
    (async()=>{
      let cfg=DEFAULT_CONFIG,sd=null;
      try{const r=await window.storage.get(configKey);if(r?.value)cfg=JSON.parse(r.value);}catch{}
      try{const r=await window.storage.get(storageKey);if(r?.value)sd=JSON.parse(r.value);}catch{}
      if(!sd) sd=makeClientData(cfg);
      // Ensure all months have correct days
      cfg.products.forEach(p=>{
        MONTHS.forEach((m,mi)=>{
          if(!sd[p]) sd[p]={};
          if(!sd[p][m]) sd[p][m]=makeMonth(cfg.vendors,YEAR,mi);
          else sd[p][m]=ensureMonthDays(sd[p][m],cfg.vendors,YEAR,mi);
        });
      });
      setConfig(cfg);setSalesData(sd);setProd(cfg.products[0]);setLoaded(true);
    })();
  },[user]);

  const persist=useCallback(async(nd,nc)=>{
    setSaving(true);
    try{
      await window.storage.set(storageKey,JSON.stringify(nd));
      if(nc) await window.storage.set(configKey,JSON.stringify(nc));
    }catch{}
    setTimeout(()=>setSaving(false),500);
  },[storageKey,configKey]);

  // Change a single day field for a vendor
  const handleDayChange=useCallback((vendorIdx,day,field,value)=>{
    setSalesData(prev=>{
      const nd=JSON.parse(JSON.stringify(prev));
      if(!nd[prod][month].vendors[vendorIdx].days[day])
        nd[prod][month].vendors[vendorIdx].days[day]=Object.fromEntries(DAY_FIELDS.map(f=>[f,""]));
      nd[prod][month].vendors[vendorIdx].days[day][field]=value;
      persist(nd,null);
      return nd;
    });
  },[prod,month,persist]);

  const handleMeta=useCallback((field,value)=>{
    setSalesData(prev=>{
      const nd=JSON.parse(JSON.stringify(prev));
      nd[prod][month][field]=value;
      persist(nd,null);
      return nd;
    });
  },[prod,month,persist]);

  const handleRenameProduct=useCallback((productIdx,newName)=>{
    setConfig(prevCfg=>{
      const oldName=prevCfg.products[productIdx];
      const nc={...prevCfg,products:[...prevCfg.products]};
      nc.products[productIdx]=newName;
      setSalesData(prev=>{
        const nd={...prev};
        if(nd[oldName]){nd[newName]=nd[oldName];delete nd[oldName];}
        persist(nd,nc);
        return nd;
      });
      if(prod===oldName) setProd(newName);
      return nc;
    });
  },[prod,persist]);

  const handleRename=useCallback((vendorIdx,newName)=>{
    setConfig(prevCfg=>{
      const nc={...prevCfg,vendors:[...prevCfg.vendors]};
      nc.vendors[vendorIdx]=newName;
      setSalesData(prev=>{
        const nd=JSON.parse(JSON.stringify(prev));
        Object.keys(nd).forEach(p=>{ MONTHS.forEach(m=>{ if(nd[p][m]?.vendors?.[vendorIdx]) nd[p][m].vendors[vendorIdx].name=newName; }); });
        persist(nd,nc);
        return nd;
      });
      return nc;
    });
  },[persist]);

  const handleSaveConfig=useCallback((newConfig)=>{
    const nd={};
    newConfig.products.forEach(p=>{
      nd[p]={};
      MONTHS.forEach((m,mi)=>{
        const em=salesData[p]?.[m];
        if(em){
          nd[p][m]={metaVendas:em.metaVendas||"",metaCash:em.metaCash||"",
            vendors:newConfig.vendors.map((vname,vi)=>({
              name:vname,
              days:em.vendors?.[vi]?.days || makeVendorDays(YEAR,mi)
            }))
          };
        }else{
          nd[p][m]=makeMonth(newConfig.vendors,YEAR,mi);
        }
      });
    });
    setConfig(newConfig);setSalesData(nd);
    setProd(newConfig.products.includes(prod)?prod:newConfig.products[0]);
    persist(nd,newConfig);setShowSettings(false);
  },[salesData,prod,persist]);

  if(!loaded||!config||!salesData||!prod) return(
    <div className="cp-root" style={{minHeight:360,background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${B.borderLight}`,borderRadius:14}}>
      <style>{CSS}</style>
      <div style={{fontSize:12,color:B.textLight,fontFamily:"'DM Mono',monospace",letterSpacing:2}}>CARREGANDO...</div>
    </div>
  );

  const monthIdx=MONTHS.indexOf(month);
  const md=salesData[prod]?.[month];
  if(!md) return null;

  const weeks=getMonthWeeks(YEAR,monthIdx);
  const mt=calcTotals(md.vendors.flatMap(v=>Object.values(v.days)));
  const metaV=num(md.metaVendas),metaC=num(md.metaCash);
  const pctAt=metaV>0?pct(mt.vd,metaV):"—";
  const pctCash=metaC>0?pct(mt.vl,metaC):"—";

  const StatCard=({label,value,color,sub})=>(
    <div style={{background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:10,padding:"13px 15px"}}>
      <div style={{fontSize:9,color:B.textSoft,fontFamily:"'DM Mono',monospace",letterSpacing:0.5,marginBottom:5,fontWeight:600}}>{label}</div>
      <div style={{fontSize:19,fontWeight:800,color:color||B.text,fontFamily:"'DM Mono',monospace",letterSpacing:-0.5}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:B.textLight,marginTop:2,fontWeight:500}}>{sub}</div>}
    </div>
  );
  const MetaInput=({label,field})=>(
    <div style={{background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:10,padding:"13px 15px"}}>
      <div style={{fontSize:9,color:B.textSoft,fontFamily:"'DM Mono',monospace",letterSpacing:0.5,marginBottom:5,fontWeight:600}}>{label}</div>
      <input type="number" className="ic" value={md[field]} onChange={e=>handleMeta(field,e.target.value)} placeholder="0"
        style={{background:B.bgLight,border:`1.5px solid ${B.border}`,borderRadius:7,padding:"6px 10px",color:B.text,fontSize:17,fontWeight:800,fontFamily:"'DM Mono',monospace",width:"100%",transition:"all 0.15s"}}/>
    </div>
  );

  return(
    <div className="cp-root" style={{background:B.bg,fontFamily:"var(--font-urbanist),ui-sans-serif,system-ui,sans-serif",color:B.text,border:`1px solid ${B.borderLight}`,borderRadius:14,overflow:"hidden",width:"100%",maxWidth:"100%"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="cp-header-padding" style={{background:B.surface,borderBottom:`1px solid ${B.borderLight}`,padding:"0 28px",position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 12px rgba(30,37,53,0.06)"}}>
        <div className="cp-header-row" style={{maxWidth:1700,margin:"0 auto"}}>
          <div style={{padding:"12px 0",marginRight:22,borderRight:`1px solid ${B.borderLight}`,paddingRight:22}}>
            <div style={{fontSize:9,fontWeight:700,color:B.textLight,letterSpacing:2,marginBottom:1}}>COCKPIT COMERCIAL</div>
            <div style={{fontSize:16,fontWeight:800,color:B.text,letterSpacing:-0.5,lineHeight:1.1}}>Controle de Performance</div>
          </div>

          {/* Product tabs */}
          <div className="cp-products" style={{display:"flex",gap:1}}>
            {config.products.map((p,pi)=>(
              <ProductTab key={pi} name={p} active={prod===p} onClick={()=>setProd(p)}
                onRename={name=>handleRenameProduct(pi,name)}/>
            ))}
          </div>

          {/* View toggle */}
          <div className="cp-viewtoggle" style={{display:"flex",marginLeft:20,marginRight:"auto",background:B.bgLight,borderRadius:8,padding:3,gap:2}}>
            {[["planilha","📋 Planilha"],["dashboard","📊 Dashboard"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"6px 13px",borderRadius:6,border:"none",background:view===v?B.surface:"transparent",color:view===v?B.text:B.textSoft,fontFamily:"'Manrope',sans-serif",fontSize:12,fontWeight:view===v?700:500,cursor:"pointer",transition:"all 0.15s",boxShadow:view===v?"0 1px 4px rgba(30,37,53,0.08)":"none"}}>{l}</button>
            ))}
          </div>

          <div className="cp-header-right" style={{display:"flex",alignItems:"center",gap:12}}>
            <div className={saving?"pl":""} style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:saving?B.amber:B.textLight,fontWeight:500}}>{saving?"salvando...":"✓ salvo"}</div>
            <button className="btn-ghost" onClick={()=>setShowSettings(true)} style={{padding:"6px 13px",fontSize:12}}>⚙ Config</button>
            <div style={{height:20,width:1,background:B.borderLight}}/>
            <div style={{fontSize:12,color:B.textSoft,fontWeight:600}}>{company||user}</div>
          </div>
        </div>
      </div>

      <div className="cp-shell" style={{maxWidth:1700,margin:"0 auto",padding:"20px 26px",display:"grid",gridTemplateColumns:"152px minmax(0,1fr)",gap:20}}>

        {/* Month sidebar */}
        <div className="cp-month-sidebar" style={{position:"sticky",top:62,height:"fit-content"}}>
          <div style={{background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 6px rgba(30,37,53,0.04)"}}>
            <div style={{padding:"9px 13px 6px",fontSize:9,color:B.textLight,fontFamily:"'DM Mono',monospace",letterSpacing:1,borderBottom:`1px solid ${B.borderLight}`,fontWeight:600}}>MÊS · {YEAR}</div>
            {MONTHS.map((m,mi)=>{
              const hasD=salesData[prod]?.[m]?.vendors?.some(v=>Object.values(v.days).some(d=>DAY_FIELDS.some(f=>num(d[f])>0)));
              return(
                <button key={m} className="mh" onClick={()=>setMonth(m)} style={{width:"100%",padding:"9px 13px",border:"none",background:month===m?B.bgLight:"transparent",borderLeft:month===m?`3px solid ${B.accent}`:`3px solid transparent`,color:month===m?B.text:B.textSoft,fontFamily:"'Manrope',sans-serif",fontWeight:month===m?700:500,fontSize:12.5,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.1s"}}>
                  {m}
                  {hasD&&<span style={{width:6,height:6,borderRadius:"50%",background:month===m?B.accent:B.border,display:"inline-block"}}/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div className="fu cp-main" key={`${prod}-${month}-${view}`}>
          <div style={{marginBottom:14,display:"flex",alignItems:"baseline",gap:10}}>
            <h2 style={{fontSize:21,fontWeight:800,letterSpacing:-0.5,color:B.text}}>{month}</h2>
            <span style={{color:B.textLight,fontSize:12,fontWeight:500}}>{prod} · {YEAR} · {daysInMonth(YEAR,monthIdx)} dias</span>
          </div>

          {view==="dashboard"?(
            <DashboardView monthData={md} metaV={metaV} monthIdx={monthIdx}/>
          ):(
            <>
            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:11,marginBottom:18}}>
              <MetaInput label="META VENDAS" field="metaVendas"/>
              <MetaInput label="META CASH (R$)" field="metaCash"/>
              <StatCard label="TOTAL LEADS" value={mt.lr.toLocaleString("pt-BR")}/>
              <StatCard label="TOTAL CALLS" value={mt.cr.toLocaleString("pt-BR")}/>
              <StatCard label="VENDAS REALIZADAS" value={mt.vd.toLocaleString("pt-BR")} color={mt.vd>0?B.green:B.textLight}/>
              <StatCard label="% META ATINGIDO" value={pctAt} color={pctColor(pctAt)} sub={metaV>0?`${mt.vd} de ${metaV}`:undefined}/>
              <StatCard label="CONV. / LEADS" value={mt.lr>0?pct(mt.vd,mt.lr):"—"} color={pctColor(pct(mt.vd,mt.lr))}/>
              <StatCard label="CASH COLLECTED" value={fmtBRL(mt.vl)} color={mt.vl>0?B.green:B.textLight}/>
              <StatCard label="% META CASH" value={pctCash} color={pctColor(pctCash)} sub={metaC>0?`de ${fmtBRL(metaC)}`:undefined}/>
            </div>

            {/* Weeks with real dates */}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {weeks.map((week,wi)=>(
                <WeekSection key={wi} week={week} weekIdx={wi} vendors={md.vendors} monthIdx={monthIdx}
                  onDayChange={handleDayChange} onRename={handleRename}/>
              ))}
            </div>

            {/* Legend */}
            <div style={{marginTop:14,padding:"10px 16px",background:B.surface,border:`1px solid ${B.borderLight}`,borderRadius:10,display:"flex",gap:18,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,color:B.textLight,fontFamily:"'DM Mono',monospace",letterSpacing:0.5,fontWeight:500}}>LEGENDA:</span>
              {[["≥100%",B.green],["70–99%",B.amber],["40–69%","#B05A2E"],["<40%",B.red]].map(([l,c])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:B.textSoft,fontWeight:500}}>
                  <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>{l}
                </div>
              ))}
              <span style={{marginLeft:"auto",fontSize:11,color:B.textLight,fontWeight:500}}>💾 Dados salvos automaticamente</span>
            </div>
            </>
          )}
        </div>
      </div>

      {showSettings&&<SettingsModal config={config} onSave={handleSaveConfig} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}


// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App({ embeddedUser = null, embeddedCompany = "", workspaceId = "" } = {}){
  const user = embeddedUser || "usuario";
  const company = embeddedCompany || "Workspace";

  return <Dashboard user={user} company={company} workspaceId={workspaceId} />;
}
