import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard, MessageSquare, Activity, Megaphone, Users,
  MapPin, Bot, BarChart3, Settings, ChevronLeft, Bell,
  Plus, RefreshCw, Upload, Send, Phone, AlertTriangle,
  Eye, Mail, Wifi, WifiOff, CalendarClock, ArrowUpRight,
  Inbox, X, Check, Smile, Paperclip, CheckCheck,
  Download, Filter, MoreVertical, UserPlus, FileText,
  Package, ChevronRight, Clock, Star, Zap,
  Building2, Hash, User, Navigation, RotateCcw, ExternalLink,
  Layers, TrendingUp, Info, ChevronDown, Edit3
} from "lucide-react"

// ─── DATA ─────────────────────────────────────────────────────────────────────
const VENTAS_EMPTY = { orden:"", estado:"PENDIENTE", cliente:"", rut:"", fibra:"", fechaEmision:"", fechaAgenda:"", bloque:"", ventana:"", tecnico:"", obs:"", telefono:"", direccion:"" }

const VENTAS = [
  { orden:"4521893", estado:"AGENDADA", cliente:"María González", rut:"12.345.678-9", fibra:"FTTH 600MB", fechaEmision:"20/02/2026", fechaAgenda:"02/03/2026", bloque:"08:00-12:00", ventana:"09:00-11:00", tecnico:"Carlos Muñoz", obs:"", telefono:"+56 9 1234 5678", direccion:"Av. Providencia 1234, Santiago" },
  { orden:"4521764", estado:"EN PROCESO", cliente:"Juan Pérez", rut:"15.678.901-2", fibra:"FTTH 300MB", fechaEmision:"22/02/2026", fechaAgenda:"01/03/2026", bloque:"14:00-18:00", ventana:"15:00-17:00", tecnico:"Pedro Soto", obs:"Cliente pide llamar antes", telefono:"+56 9 8765 4321", direccion:"Los Leones 456, Providencia" },
  { orden:"4521456", estado:"NO REALIZADA", cliente:"Ana Martínez", rut:"9.876.543-1", fibra:"FTTH 600MB", fechaEmision:"18/02/2026", fechaAgenda:"28/02/2026", bloque:"08:00-12:00", ventana:"10:00-12:00", tecnico:"Luis Torres", obs:"Sin acceso al edificio", telefono:"+56 9 1122 2333", direccion:"Gran Avenida 789, San Miguel" },
  { orden:"4521123", estado:"COMPLETADA", cliente:"Roberto Silva", rut:"11.222.333-4", fibra:"FTTH 1GB", fechaEmision:"15/02/2026", fechaAgenda:"25/02/2026", bloque:"08:00-12:00", ventana:"08:00-10:00", tecnico:"Miguel Rojas", obs:"", telefono:"+56 9 4455 5666", direccion:"Vicuña Mackenna 321, Macul" },
  { orden:"—", estado:"PENDIENTE", cliente:"Carmen López", rut:"16.789.012-3", fibra:"—", fechaEmision:"28/02/2026", fechaAgenda:"—", bloque:"—", ventana:"—", tecnico:"—", obs:"", telefono:"+56 9 5566 6777", direccion:"Irarrázaval 567, Ñuñoa" },
]

const CHATS = [
  { id:1, nombre:"María González", num:"+56 9 1234 5678", ultimo:"¿Cuándo llega el técnico?", hora:"10:42", unread:2, online:true, msgs:[
    { id:1, from:"c", text:"Hola buenas tardes", t:"10:30" },
    { id:2, from:"a", text:"Hola María, soy el asistente de Movistar. ¿En qué te puedo ayudar?", t:"10:31" },
    { id:3, from:"c", text:"Quiero saber cuándo viene el técnico", t:"10:35" },
    { id:4, from:"a", text:"Tu instalación está agendada para el 2 de marzo en el bloque 08:00-12:00. El técnico asignado es Carlos Muñoz.", t:"10:36" },
    { id:5, from:"c", text:"Perfecto, ¿me pueden avisar cuando esté en camino?", t:"10:40" },
    { id:6, from:"c", text:"¿Cuándo llega el técnico?", t:"10:42" },
  ]},
  { id:2, nombre:"Juan Pérez", num:"+56 9 8765 4321", ultimo:"¿Ya tiene fecha mi instalación?", hora:"09:15", unread:1, online:false, msgs:[
    { id:1, from:"c", text:"Buenos días", t:"09:00" },
    { id:2, from:"a", text:"Buenos días Juan, ¿cómo te puedo ayudar?", t:"09:01" },
    { id:3, from:"c", text:"¿Ya tiene fecha mi instalación?", t:"09:15" },
  ]},
  { id:3, nombre:"Ana Martínez", num:"+56 9 1122 2333", ultimo:"No han dado respuesta del reagendamiento", hora:"Ayer", unread:0, online:false, msgs:[
    { id:1, from:"a", text:"Hola Ana, la visita técnica no pudo realizarse. Gestionando nuevo horario.", t:"Ayer" },
    { id:2, from:"c", text:"No han dado respuesta del reagendamiento", t:"Ayer" },
  ]},
  { id:4, nombre:"Roberto Silva", num:"+56 9 4455 5666", ultimo:"Instalación completada. ¡Gracias!", hora:"25/02", unread:0, online:false, msgs:[
    { id:1, from:"a", text:"¡Roberto! Tu servicio de Fibra 1GB ya está activo.", t:"25/02" },
    { id:2, from:"c", text:"Instalación completada. ¡Gracias!", t:"25/02" },
  ]},
  { id:5, nombre:"Carmen López", num:"+56 9 5566 6777", ultimo:"¿Cuándo me confirman la venta?", hora:"Hoy", unread:3, online:true, msgs:[
    { id:1, from:"c", text:"¿Cuándo me confirman la venta?", t:"Hoy" },
  ]},
]

const REGISTRO_VENTAS = [
  { id:"RV001", tipo:"nueva", bo:"BO N°Q1301", rut:"24.166.909-2", nombre:"Heggert Escobar Aliaga", direccionLimpia:"Av. La Tirana 3158", direccionInst:"Av. La Tirana 3158, Iquique", comuna:"Iquique", region:"Tarapacá", servicio:"DUO IPtv básico de 800", adicional:"2 decos gratis + 1 deco adicional", promo:"Oferta 800MB", ejecutivo:"Betzabel Alvarado", supervisor:"Luis Campos", contacto:"982172191", fono:"982172191", ciclo:"15", correo:"escobarhg89@gmail.com", estado:"enviada", fecha:"28/02/2026 11:02" },
  { id:"RV002", tipo:"reemision", bo:"ORDEN CANCELADA: 4521001", rut:"16.789.012-3", nombre:"Carmen López", direccionLimpia:"Irarrázaval 567", direccionInst:"Irarrázaval 567 Dpto 32, Ñuñoa", comuna:"Ñuñoa", region:"Metropolitana", servicio:"Fibra 600MB + Disney+", adicional:"—", promo:"Promo fibra verano", ejecutivo:"Luis Campos", supervisor:"Luis Campos", contacto:"+56 9 5566 6777", fono:"955666777", ciclo:"1", correo:"carmen.lopez@gmail.com", estado:"pendiente_envio", fecha:"28/02/2026 09:15" },
  { id:"RV003", tipo:"nueva", bo:"BO N°Q1287", rut:"11.222.333-4", nombre:"Roberto Silva", direccionLimpia:"Vicuña Mackenna 321", direccionInst:"Vicuña Mackenna 321, Macul", comuna:"Macul", region:"Metropolitana", servicio:"Fibra 1GB", adicional:"Router premium", promo:"Promo Gbps", ejecutivo:"Luis Campos", supervisor:"Luis Campos", contacto:"+56 9 4455 5666", fono:"944555666", ciclo:"5", correo:"roberto.silva@email.com", estado:"enviada", fecha:"25/02/2026 14:30" },
]


const EC = {
  "AGENDADA":     { bg:"bg-sky-500/10",   text:"text-sky-400",     border:"border-sky-500/20",  dot:"bg-sky-400" },
  "EN PROCESO":   { bg:"bg-amber-500/10", text:"text-amber-400",   border:"border-amber-500/20",dot:"bg-amber-400" },
  "NO REALIZADA": { bg:"bg-rose-500/10",  text:"text-rose-400",    border:"border-rose-500/20", dot:"bg-rose-400" },
  "COMPLETADA":   { bg:"bg-emerald-500/10",text:"text-emerald-400",border:"border-emerald-500/20",dot:"bg-emerald-400" },
  "PENDIENTE":    { bg:"bg-slate-500/10", text:"text-slate-400",   border:"border-slate-500/20",dot:"bg-slate-500" },
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "sm", color = "emerald" }) => {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
  const s = size === "sm" ? "w-9 h-9 text-xs" : size === "md" ? "w-11 h-11 text-sm" : "w-14 h-14 text-base"
  const c = color === "emerald" ? "from-emerald-500 to-teal-600" : "from-slate-600 to-slate-700"
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${c} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

const Badge = ({ estado }) => {
  const e = EC[estado] || EC["PENDIENTE"]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${e.bg} ${e.text} border ${e.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`}/>
      {estado}
    </span>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"panel",    icon:LayoutDashboard, label:"Panel" },
  { id:"bandeja",  icon:Inbox,           label:"Bandeja",    badge:6 },
  { id:"ventas",   icon:Activity,        label:"Ventas",     badge:5 },
  { id:"registro", icon:Package,         label:"Registro Ventas" },
  { id:"campanas", icon:Megaphone,       label:"Campañas" },
  { id:"contactos",icon:Users,           label:"Contactos" },
  { id:"bot",      icon:Zap,             label:"Super Agente" },
  { id:"stats",    icon:BarChart3,       label:"Analíticas" },
]

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside className={`flex flex-col border-r transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed?"w-[60px]":"w-[200px]"}`}
      style={{ background:"#07090F", borderColor:"#141928" }}>
      {/* Logo */}
      <div className={`flex items-center border-b py-4 ${collapsed?"justify-center px-3":"px-4 gap-2.5"}`} style={{borderColor:"#141928"}}>
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <MessageSquare className="w-3.5 h-3.5 text-white"/>
        </div>
        {!collapsed && <span className="text-white font-bold text-sm tracking-tight">WhatsSend</span>}
        {!collapsed && (
          <button onClick={()=>setCollapsed(true)} className="ml-auto text-slate-600 hover:text-slate-400 transition-colors">
            <ChevronLeft className="w-4 h-4"/>
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={()=>setCollapsed(false)} className="flex justify-center py-2 text-slate-600 hover:text-slate-400 transition-colors border-b" style={{borderColor:"#141928"}}>
          <ChevronRight className="w-4 h-4"/>
        </button>
      )}
      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon:Icon, label, badge }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={()=>setActive(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center rounded-lg text-sm transition-all duration-150 group ${collapsed?"justify-center p-2.5":"gap-2.5 px-3 py-2"} ${
                isActive
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/4"
              }`}>
              <Icon className={`flex-shrink-0 transition-colors ${collapsed?"w-4.5 h-4.5":"w-4 h-4"} ${isActive?"text-emerald-400":"text-slate-500 group-hover:text-slate-300"}`}
                style={collapsed?{width:18,height:18}:{width:15,height:15}}/>
              {!collapsed && <span className="flex-1 text-left font-medium text-xs">{label}</span>}
              {!collapsed && badge && (
                <span className="text-xs bg-emerald-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">{badge}</span>
              )}
            </button>
          )
        })}
      </nav>
      {/* Bottom */}
      <div className="px-2 pb-3 pt-2 border-t" style={{borderColor:"#141928"}}>
        <button onClick={()=>setActive("config")}
          title={collapsed?"Configuración":undefined}
          className={`w-full flex items-center rounded-lg text-sm transition-all group ${collapsed?"justify-center p-2.5":"gap-2.5 px-3 py-2"} ${
            active==="config" ? "text-emerald-400 bg-emerald-500/12" : "text-slate-500 hover:text-slate-200 hover:bg-white/4"
          }`}>
          <Settings style={{width:15,height:15}} className={`flex-shrink-0 ${active==="config"?"text-emerald-400":"text-slate-500 group-hover:text-slate-300"}`}/>
          {!collapsed && <span className="font-medium text-xs">Configuración</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between px-6 border-b h-14 flex-shrink-0" style={{background:"#07090F", borderColor:"#141928"}}>
      <div>
        <h1 className="text-white font-semibold text-sm">{title}</h1>
        {subtitle && <p className="text-slate-600 text-xs">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
          <Bell style={{width:16,height:16}}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"/>
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l" style={{borderColor:"#141928"}}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20">LC</div>
          <span className="text-slate-300 text-xs font-medium">Luis Campos</span>
        </div>
      </div>
    </header>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon:Icon, accent, trend }) {
  return (
    <div className="rounded-xl p-4 border relative overflow-hidden group hover:border-white/8 transition-all duration-200"
      style={{background:"#0C0F1A", borderColor:"#141928"}}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{background:`radial-gradient(ellipse at 100% 0%, ${accent}08 0%, transparent 60%)`}}/>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-slate-500 text-xs font-medium">{title}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${accent}18`}}>
            <Icon style={{width:13,height:13,color:accent}}/>
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <p className="text-slate-600 text-xs mt-1">{sub}</p>
        {trend && <span className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-0.5"><TrendingUp style={{width:10,height:10}}/> {trend}</span>}
      </div>
    </div>
  )
}

// ─── PANEL ────────────────────────────────────────────────────────────────────
function PanelView({ setActive }) {
  return (
    <div className="space-y-5 p-6">
      <div>
        <h2 className="text-white font-semibold text-base">Buenos días, Luis 👋</h2>
        <p className="text-slate-600 text-xs mt-0.5">Resumen de hoy · Sábado 28 de febrero, 2026</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Ventas en Seguimiento" value="5" sub="órdenes activas" icon={Activity} accent="#10b981" trend="+2 esta semana"/>
        <StatCard title="Mensajes Hoy" value="47" sub="enviados / recibidos" icon={MessageSquare} accent="#38bdf8"/>
        <StatCard title="Contactos" value="128" sub="total en CRM" icon={Users} accent="#a78bfa"/>
        <StatCard title="No Realizadas" value="1" sub="requieren atención" icon={AlertTriangle} accent="#f43f5e"/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {/* Estado ventas */}
        <div className="col-span-1 rounded-xl border p-4" style={{background:"#0C0F1A",borderColor:"#141928"}}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-xs">Estado de Ventas</span>
            <button onClick={()=>setActive("ventas")} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5">Ver todo <ChevronRight style={{width:12,height:12}}/></button>
          </div>
          <div className="space-y-3">
            {[
              {label:"Agendada",n:1,color:"#38bdf8",pct:20},
              {label:"En Proceso",n:1,color:"#fbbf24",pct:20},
              {label:"Completada",n:1,color:"#10b981",pct:20},
              {label:"No Realizada",n:1,color:"#f43f5e",pct:20},
              {label:"Pendiente",n:1,color:"#64748b",pct:20},
            ].map(s=>(
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">{s.label}</span>
                <div className="flex-1 h-1 rounded-full" style={{background:"#141928"}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${s.pct}%`,background:s.color}}/>
                </div>
                <span className="text-slate-400 text-xs font-bold w-3">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Alertas */}
        <div className="col-span-2 rounded-xl border p-4" style={{background:"#0C0F1A",borderColor:"#141928"}}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-xs">Requieren Atención</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:"#f43f5e18",color:"#f43f5e",border:"1px solid #f43f5e20"}}>3 alertas</span>
          </div>
          <div className="space-y-2.5">
            {[
              { color:"#f43f5e", title:"Ana Martínez — No Realizada", desc:"Sin acceso al edificio · Pendiente reagendar con Backoffice Agenda", action:"ventas" },
              { color:"#fbbf24", title:"Carmen López — Esperando código BO", desc:"Biometría OK · Monitorear código en Excel de ingreso", action:"ventas" },
              { color:"#38bdf8", title:"6 mensajes sin responder", desc:"Carmen (3), María (2), Juan (1) · Bandeja de entrada", action:"bandeja" },
            ].map((a,i)=>(
              <div key={i} className="flex items-start gap-3 rounded-lg p-3 border group hover:border-white/8 cursor-pointer transition-all"
                style={{background:"#07090F",borderColor:"#141928"}}
                onClick={()=>setActive(a.action)}>
                <div className="w-1 h-full min-h-[2rem] rounded-full flex-shrink-0 mt-0.5" style={{background:a.color}}/>
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">{a.title}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{a.desc}</p>
                </div>
                <ArrowUpRight style={{width:14,height:14}} className="text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5"/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BANDEJA ──────────────────────────────────────────────────────────────────
function BandejaView() {
  const [chatActivo, setChatActivo] = useState(CHATS[0])
  const [msgs, setMsgs] = useState(CHATS[0].msgs)
  const [input, setInput] = useState("")
  const [showProfile, setShowProfile] = useState(false)
  const endRef = useRef(null)

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [msgs])

  const selectChat = (c) => { setChatActivo(c); setMsgs(c.msgs); setShowProfile(false) }

  const send = () => {
    if (!input.trim()) return
    setMsgs(p=>[...p, {id:p.length+1, from:"a", text:input, t:"Ahora"}])
    setInput("")
  }

  const venta = VENTAS.find(v=>v.telefono===chatActivo?.num)

  return (
    <div className="flex flex-1 overflow-hidden" style={{height:"calc(100vh - 56px)"}}>
      {/* ── Lista chats ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col border-r" style={{background:"#07090F",borderColor:"#141928"}}>
        {/* Header fijo */}
        <div className="flex-shrink-0 px-4 py-3 border-b" style={{borderColor:"#141928"}}>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Bandeja</span>
            <span className="text-slate-600 text-xs">{CHATS.length} chats</span>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            {["Todos","No leídos"].map(f=>(
              <button key={f} className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${f==="Todos"?"text-white font-medium":"text-slate-500 hover:text-slate-300"}`}
                style={f==="Todos"?{background:"#141928"}:{}}>{f}</button>
            ))}
          </div>
        </div>
        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto">
          {CHATS.map(c=>(
            <button key={c.id} onClick={()=>selectChat(c)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border-b transition-all text-left ${chatActivo?.id===c.id?"border-l-2":"border-l-2 border-l-transparent hover:bg-white/3"}`}
              style={{borderBottomColor:"#141928", ...(chatActivo?.id===c.id?{background:"#0C1118",borderLeftColor:"#10b981"}:{})}}>
              <div className="relative flex-shrink-0">
                <Avatar name={c.nombre} color={chatActivo?.id===c.id?"emerald":"default"}/>
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2" style={{borderColor:"#07090F"}}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className={`text-xs font-semibold truncate ${chatActivo?.id===c.id?"text-white":"text-slate-300"}`}>{c.nombre}</span>
                  <span className="text-slate-600 text-xs flex-shrink-0">{c.hora}</span>
                </div>
                <p className="text-slate-600 text-xs truncate mt-0.5">{c.ultimo}</p>
              </div>
              {c.unread>0 && <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat central ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{background:"#090C14"}}>
        {/* Header fijo - clickear nombre abre perfil */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 h-14 border-b" style={{background:"#07090F",borderColor:"#141928"}}>
          <Avatar name={chatActivo.nombre}/>
          <button className="flex-1 text-left group" onClick={()=>setShowProfile(p=>!p)}>
            <p className="text-white text-sm font-semibold group-hover:text-emerald-400 transition-colors">{chatActivo.nombre}</p>
            <p className="text-slate-600 text-xs">{chatActivo.online?"En línea":chatActivo.num}</p>
          </button>
          {venta && <Badge estado={venta.estado}/>}
          <button className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
            <MoreVertical style={{width:15,height:15}}/>
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" style={{background:"#090C14"}}>
          {msgs.map(m=>(
            <div key={m.id} className={`flex ${m.from==="a"?"justify-end":"justify-start"}`}>
              <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 ${m.from==="a"?"rounded-br-sm text-white":"rounded-bl-sm border"}`}
                style={m.from==="a"
                  ?{background:"#059669"}
                  :{background:"#0C0F1A",borderColor:"#1E2537",color:"#cbd5e1"}}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${m.from==="a"?"text-emerald-200/60":"text-slate-600"}`}>
                  <span className="text-xs">{m.t}</span>
                  {m.from==="a" && <CheckCheck style={{width:12,height:12}}/>}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        {/* Input fijo */}
        <div className="flex-shrink-0 px-5 py-3.5 border-t" style={{background:"#07090F",borderColor:"#141928"}}>
          <div className="flex items-end gap-2.5">
            <button className="p-2 rounded-xl text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"><Smile style={{width:18,height:18}}/></button>
            <button className="p-2 rounded-xl text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"><Paperclip style={{width:18,height:18}}/></button>
            <div className="flex-1 rounded-xl px-4 py-2.5 border transition-colors focus-within:border-emerald-500/30"
              style={{background:"#0C0F1A",borderColor:"#1E2537"}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}}
                placeholder="Escribe un mensaje..." rows={1}
                className="w-full bg-transparent text-slate-200 text-sm placeholder-slate-700 resize-none focus:outline-none"/>
            </div>
            <button onClick={send} className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Send style={{width:16,height:16}}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel perfil (se abre al hacer click en nombre) ── */}
      {showProfile && (
        <div className="w-[240px] flex-shrink-0 flex flex-col border-l" style={{background:"#07090F",borderColor:"#141928"}}>
          {/* Header fijo */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b" style={{borderColor:"#141928"}}>
            <span className="text-white font-semibold text-xs">Perfil</span>
            <button onClick={()=>setShowProfile(false)} className="text-slate-600 hover:text-slate-300 transition-colors"><X style={{width:15,height:15}}/></button>
          </div>
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center pb-4 border-b" style={{borderColor:"#141928"}}>
              <Avatar name={chatActivo.nombre} size="lg" color="emerald"/>
              <div className="mt-3">
                <p className="text-white font-semibold text-sm">{chatActivo.nombre}</p>
                <p className="text-slate-600 text-xs">{chatActivo.num}</p>
              </div>
            </div>
            {venta && (
              <div className="space-y-2 pb-4 border-b" style={{borderColor:"#141928"}}>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wider">Venta</p>
                {[
                  ["Plan", venta.plan],
                  ["Orden", `#${venta.orden}`],
                  ["RUT", venta.rut],
                  ["Agenda", venta.fechaAgenda],
                  ["Técnico", venta.tecnico],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-slate-600 text-xs">{k}</span>
                    <span className="text-slate-300 text-xs font-medium text-right">{v}</span>
                  </div>
                ))}
                <div className="pt-1"><Badge estado={venta.estado}/></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VENTAS ───────────────────────────────────────────────────────────────────
const TOA_FIELDS = [
  {key:"orden",     label:"🔢 Orden",         placeholder:"Nº orden TOA",         required:false},
  {key:"estado",    label:"📊 Estado",         placeholder:"Se actualiza via TOA",  required:false, readOnly:true},
  {key:"cliente",   label:"👤 Cliente",        placeholder:"Nombre completo",       required:false},
  {key:"rut",       label:"🪪 RUT",            placeholder:"12.345.678-9",          required:true},
  {key:"direccion", label:"📍 Dirección",      placeholder:"Dirección completa",    required:true},
  {key:"telefono",  label:"📞 Teléfonos",      placeholder:"+56 9 XXXX XXXX",      required:false},
  {key:"fechaEmision",label:"📆 Fecha Emisión",placeholder:"DD/MM/AAAA",           required:false},
  {key:"fechaAgenda",label:"📅 Fecha Agenda",  placeholder:"Se llena vía TOA",      required:false},
  {key:"bloque",    label:"⏰ Bloque Horario", placeholder:"HH:MM - HH:MM",         required:false},
  {key:"ventana",   label:"🚪 Ventana Llegada",placeholder:"HH:MM - HH:MM",         required:false},
  {key:"fibra",     label:"📌 Fibra",          placeholder:"FTTH / velocidad",      required:false},
  {key:"obs",       label:"🗒️ Observaciones",  placeholder:"Sin observaciones",     required:false},
  {key:"tecnico",   label:"🛠️ Técnico",        placeholder:"Se llena vía TOA",      required:false},
]

function ModalAgregarVenta({ onClose }) {
  const [orden, setOrden] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const valid = orden.trim().length >= 6

  const handleGuardar = () => {
    if (!valid) return
    setLoading(true)
    setError("")
    // Simula consulta TOA - en producción llama a la API FastAPI del script
    setTimeout(() => {
      setLoading(false)
      onClose()
      // En producción: fetch(`/api/toa/consultar/${orden}`).then(r=>r.json()).then(datos=>agregarVenta(datos))
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border w-full max-w-sm shadow-2xl overflow-hidden" style={{background:"#0C0F1A",borderColor:"#1E2537"}}>
        <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"#141928"}}>
          <div>
            <h3 className="text-white font-semibold text-sm">Agregar Venta</h3>
            <p className="text-slate-600 text-xs mt-0.5">Ingresa el número de orden — los datos se obtienen automáticamente desde TOA</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><X style={{width:16,height:16}}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-medium mb-2 block">🔢 Número de Orden TOA *</label>
            <input
              value={orden}
              onChange={e=>{ setOrden(e.target.value.replace(/\D/g,"")); setError("") }}
              placeholder="Ej: 1233441422"
              className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono tracking-widest border focus:outline-none transition-colors text-center"
              style={{background:"#07090F",borderColor:error?"#f43f5e50":orden&&valid?"#10b98130":"#1E2537",fontSize:16,letterSpacing:2}}
              maxLength={12}
            />
            {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
            {valid && !loading && <p className="text-emerald-500 text-xs mt-1.5 flex items-center gap-1"><Check style={{width:11,height:11}}/> Orden válida — listo para consultar TOA</p>}
          </div>
          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{background:"#07090F",borderColor:"#1E2537"}}>
              <RefreshCw style={{width:16,height:16}} className="text-emerald-400 animate-spin flex-shrink-0"/>
              <div>
                <p className="text-white text-xs font-semibold">Consultando TOA...</p>
                <p className="text-slate-600 text-xs">Extrayendo datos de la orden {orden}</p>
              </div>
            </div>
          )}
          {!loading && valid && (
            <div className="p-3 rounded-xl border" style={{background:"#07090F",borderColor:"#141928"}}>
              <p className="text-slate-600 text-xs">Al guardar se consultará TOA automáticamente y se llenarán:</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {["Estado","Cliente","Dirección","Fecha Agenda","Bloque","Ventana","Fibra","Técnico","Observaciones"].map(f=>(
                  <span key={f} className="text-xs px-2 py-0.5 rounded-full text-emerald-400 font-medium" style={{background:"#10b98110",border:"1px solid #10b98120"}}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex gap-2.5" style={{borderColor:"#141928"}}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-slate-500 text-xs font-medium" style={{background:"#07090F",borderColor:"#1E2537"}}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={!valid||loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${valid&&!loading?"bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20":"text-slate-600 cursor-not-allowed"}`}
            style={valid&&!loading?{}:{background:"#141928"}}>
            {loading ? <><RefreshCw style={{width:12,height:12}} className="animate-spin"/> Consultando TOA…</> : "Consultar y Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function VentasView() {
  const [sel, setSel] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [updating, setUpdating] = useState(null)
  const upd = (o)=>{ setUpdating(o); setTimeout(()=>setUpdating(null),1800) }

  const LEYENDA = [
    {icon:Eye, color:"text-sky-400 bg-sky-500/10", label:"Ver TOA"},
    {icon:RefreshCw, color:"text-emerald-400 bg-emerald-500/10", label:"Actualizar TOA"},
    {icon:Send, color:"text-violet-400 bg-violet-500/10", label:"Notificar cliente"},
    {icon:CalendarClock, color:"text-amber-400 bg-amber-500/10", label:"Reagendar (BA)"},
    {icon:Mail, color:"text-teal-400 bg-teal-500/10", label:"Enviar venta (BI)"},
  ]

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
          <Plus style={{width:13,height:13}}/> Agregar Venta
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 border transition-colors hover:border-white/10" style={{background:"#0C0F1A",borderColor:"#141928"}}>
          <Upload style={{width:13,height:13}}/> Importar Excel
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 border transition-colors hover:border-white/10" style={{background:"#0C0F1A",borderColor:"#141928"}}>
          <RefreshCw style={{width:13,height:13}}/> Actualizar Todo TOA
        </button>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 border transition-colors hover:border-white/10" style={{background:"#0C0F1A",borderColor:"#141928"}}>
            <Download style={{width:13,height:13}}/> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {l:"Total",v:"5",c:"#fff"},
          {l:"Agendadas",v:"1",c:"#38bdf8"},
          {l:"Completadas",v:"1",c:"#10b981"},
          {l:"No Realizadas",v:"1",c:"#f43f5e"},
          {l:"Pendientes",v:"2",c:"#64748b"},
        ].map(k=>(
          <div key={k.l} className="rounded-xl border p-3 text-center" style={{background:"#0C0F1A",borderColor:"#141928"}}>
            <div className="text-xl font-bold" style={{color:k.c}}>{k.v}</div>
            <div className="text-slate-600 text-xs mt-0.5">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabla con columnas TOA */}
      <div className="rounded-xl border overflow-hidden" style={{background:"#0C0F1A",borderColor:"#141928"}}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{minWidth:900}}>
            <thead>
              <tr className="border-b" style={{borderColor:"#141928"}}>
                {["🔢 Orden","👤 Cliente / RUT","📌 Fibra","📊 Estado","📅 Fecha Agenda","⏰ Bloque","🚪 Ventana","🛠️ Técnico","🗒️ Obs.","Acciones"].map(h=>(
                  <th key={h} className="text-left text-xs font-medium text-slate-600 px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENTAS.map((v)=>{
                const e = EC[v.estado]||EC["PENDIENTE"]
                return (
                  <tr key={v.orden} className="border-b transition-colors hover:bg-white/2" style={{borderColor:"#0F1219"}}>
                    <td className="px-3 py-3"><span className="text-emerald-500 font-mono font-bold text-xs">#{v.orden}</span></td>
                    <td className="px-3 py-3">
                      <div className="text-slate-200 font-medium text-xs">{v.cliente||<span className="text-slate-700">—</span>}</div>
                      <div className="text-slate-600 text-xs font-mono">{v.rut}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">{v.fibra}</td>
                    <td className="px-3 py-3"><Badge estado={v.estado}/></td>
                    <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">{v.fechaAgenda}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">{v.bloque}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">{v.ventana}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">{v.tecnico}</td>
                    <td className="px-3 py-3">
                      {v.obs
                        ? <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle style={{width:11,height:11}}/>{v.obs.slice(0,18)}…</span>
                        : <span className="text-slate-700 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setSel(v)} title="Ver TOA" className="p-1.5 rounded-lg transition-colors bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"><Eye style={{width:12,height:12}}/></button>
                        <button onClick={()=>upd(v.orden)} title="Actualizar TOA" className="p-1.5 rounded-lg transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><RefreshCw style={{width:12,height:12}} className={updating===v.orden?"animate-spin":""}/></button>
                        <button title="Notificar cliente" className="p-1.5 rounded-lg transition-colors bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"><Send style={{width:12,height:12}}/></button>
                        {v.estado==="NO REALIZADA" && <button title="Reagendar BA" className="p-1.5 rounded-lg transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"><CalendarClock style={{width:12,height:12}}/></button>}
                        {v.orden!=="—" && <button title="Enviar venta al BI" className="p-1.5 rounded-lg transition-colors bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"><Mail style={{width:12,height:12}}/></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 pt-1">
        {LEYENDA.map(l=>(
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`p-1 rounded-md ${l.color}`}><l.icon style={{width:10,height:10}}/></span>
            {l.label}
          </span>
        ))}
      </div>

      {/* Modal TOA detalle */}
      {sel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-sm shadow-2xl" style={{background:"#0C0F1A",borderColor:"#1E2537"}}>
            <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"#141928"}}>
              <div>
                <h3 className="text-white font-semibold text-sm">Resumen TOA</h3>
                <p className="text-slate-600 text-xs">Orden #{sel.orden}</p>
              </div>
              <button onClick={()=>setSel(null)} className="text-slate-600 hover:text-slate-300 transition-colors"><X style={{width:16,height:16}}/></button>
            </div>
            <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
              {TOA_FIELDS.map(f=>(
                <div key={f.key} className="flex gap-3">
                  <span className="text-slate-600 text-xs w-36 flex-shrink-0">{f.label}</span>
                  <span className="text-slate-200 text-xs font-medium">{sel[f.key]||"—"}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2.5" style={{borderColor:"#141928"}}>
              {sel.estado==="NO REALIZADA" && (
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-amber-500/15" style={{background:"#0C0F1A",borderColor:"#f59e0b30",color:"#fbbf24"}}>
                  <CalendarClock style={{width:13,height:13}}/> Reagendar BA
                </button>
              )}
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-emerald-500/15" style={{background:"#0C0F1A",borderColor:"#10b98130",color:"#10b981"}}>
                <Send style={{width:13,height:13}}/> Notificar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar venta */}
      {showAdd && <ModalAgregarVenta onClose={()=>setShowAdd(false)}/>}
    </div>
  )
}

// ─── REGISTRO VENTAS ──────────────────────────────────────────────────────────
const REGISTRO_FIELDS = [
  {key:"rut",            label:"RUT Cliente",           required:true,  ph:"12.345.678-9"},
  {key:"nombre",         label:"Nombre Cliente",         required:false, ph:"Nombre completo"},
  {key:"direccionLimpia",label:"Dirección Limpia",       required:false, ph:"Sin depto ni piso"},
  {key:"direccionInst",  label:"Dirección Instalación",  required:true,  ph:"Con depto/piso/block (obligatorio)"},
  {key:"comuna",         label:"Comuna",                 required:false, ph:"Ej: Santiago"},
  {key:"region",         label:"Región",                 required:false, ph:"Ej: Metropolitana"},
  {key:"servicio",       label:"Servicio que Contrata",  required:false, ph:"Ej: Fibra 600MB"},
  {key:"adicional",      label:"Servicio Adicional",     required:false, ph:"Ej: Deco adicional"},
  {key:"promo",          label:"Promoción",              required:false, ph:"Nombre de la promo"},
  {key:"ejecutivo",      label:"Ejecutivo",              required:false, ph:"Nombre ejecutivo"},
  {key:"supervisor",     label:"Supervisor",             required:false, ph:"Nombre supervisor"},
  {key:"contacto",       label:"Contacto Instalación",   required:false, ph:"+56 9 XXXX XXXX"},
  {key:"fono",           label:"Fono",                   required:false, ph:"9XXXXXXXX"},
  {key:"ciclo",          label:"Ciclo de Pago",          required:false, ph:"Ej: 5"},
  {key:"correo",         label:"Correo",                 required:false, ph:"cliente@email.com"},
]

const TIPOS = [
  {id:"bo",        label:"Código BO",          color:"#10b981", desc:"Emisión nueva BO N°XXXX"},
  {id:"reemision", label:"Reemisión de Venta", color:"#f59e0b", desc:"Orden cancelada a reemplazar"},
  {id:"biometria", label:"Biometría en Calle", color:"#a78bfa", desc:"Técnico hace el proceso in situ"},
]

const RV_EMPTY = { rut:"",nombre:"",direccionLimpia:"",direccionInst:"",comuna:"",region:"",servicio:"",adicional:"",promo:"",ejecutivo:"",supervisor:"",contacto:"",fono:"",ciclo:"",correo:"",bo:"",estado:"pendiente_envio",fecha:new Date().toLocaleDateString("es-CL") }

function ModalRegistro({ initial=null, onClose }) {
  const isNew = !initial
  const [tipo, setTipo] = useState(initial ? (initial.tipo||"bo") : "bo")
  const [form, setForm] = useState(initial ? {...initial} : {...RV_EMPTY})
  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const boLabel = tipo==="bo" ? "Código BO" : tipo==="reemision" ? "Nº Orden Cancelada" : null
  const boRequired = tipo==="bo" || tipo==="reemision"
  const valid = form.rut && form.direccionLimpia && (tipo==="biometria" || form.bo)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border w-full max-w-md shadow-2xl overflow-hidden" style={{background:"#0C0F1A",borderColor:"#1E2537"}}>
        <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"#141928"}}>
          <div>
            <h3 className="text-white font-semibold text-sm">{isNew ? "Nueva Venta" : "Editar Venta"}</h3>
            <p className="text-slate-600 text-xs mt-0.5">Los campos * son obligatorios según tipo de venta</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><X style={{width:16,height:16}}/></button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="text-slate-500 text-xs mb-2 block font-medium">Tipo de Venta *</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t=>(
                <button key={t.id} onClick={()=>setTipo(t.id)}
                  className="rounded-xl p-3 text-left border transition-all"
                  style={{background:tipo===t.id ? t.color+"12":"#07090F", borderColor:tipo===t.id ? t.color+"40":"#1E2537"}}>
                  <div className="text-xs font-semibold mb-0.5" style={{color:tipo===t.id?t.color:"#64748b"}}>{t.label}</div>
                  <div className="text-xs leading-tight" style={{color:"#475569"}}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {boLabel && (
            <div>
              <label className="text-slate-500 text-xs mb-1.5 flex items-center gap-1">
                {tipo==="bo" ? "🏷️" : "🔁"} {boLabel} <span className="text-rose-400">*</span>
              </label>
              <input value={form.bo||""} onChange={e=>set("bo",e.target.value)}
                placeholder={tipo==="bo" ? "BO N°Q1234" : "Nº orden cancelada"}
                className="w-full rounded-lg px-3 py-2 text-slate-200 text-xs border focus:outline-none focus:border-emerald-500/40 transition-colors"
                style={{background:"#07090F",borderColor:boRequired&&!form.bo?"#f43f5e30":"#1E2537"}}/>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {REGISTRO_FIELDS.map(f=>(
              <div key={f.key} className={f.key==="direccionLimpia"||f.key==="direccionInst"||f.key==="servicio"?"col-span-2":""}>
                <label className="text-slate-500 text-xs mb-1.5 flex items-center gap-1">
                  {f.label} {f.required && <span className="text-rose-400">*</span>}
                </label>
                <input value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-lg px-3 py-2 text-slate-200 text-xs border focus:outline-none focus:border-emerald-500/40 transition-colors"
                  style={{background:"#07090F",borderColor:f.required&&!form[f.key]?"#f43f5e30":"#1E2537"}}/>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex gap-2.5" style={{borderColor:"#141928"}}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-slate-500 text-xs font-medium transition-colors hover:border-slate-600" style={{background:"#07090F",borderColor:"#1E2537"}}>
            Cancelar
          </button>
          <button disabled={!valid}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${valid?"bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20":"text-slate-600 cursor-not-allowed"}`}
            style={valid?{}:{background:"#141928"}}>
            {valid ? (isNew ? "Registrar Venta" : "Guardar Cambios") : "Completa campos requeridos"}
          </button>
        </div>
      </div>
    </div>
  )
}

function RegistroView() {
  const [sel, setSel] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-sm">Registro de Ventas</h2>
          <p className="text-slate-600 text-xs mt-0.5">Formatos enviados al Backoffice de Ingreso</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 border hover:border-white/10 transition-colors" style={{background:"#0C0F1A",borderColor:"#141928"}}>
            <Filter style={{width:13,height:13}}/> Filtrar
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 border hover:border-white/10 transition-colors" style={{background:"#0C0F1A",borderColor:"#141928"}}>
            <Download style={{width:13,height:13}}/> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {REGISTRO_VENTAS.map(rv=>{
          const t = TIPOS.find(ti=>ti.id===rv.tipo)||TIPOS[0]
          return (
            <button key={rv.id} onClick={()=>setSel(rv)}
              className="rounded-xl border p-4 text-left hover:border-white/8 transition-all duration-200 group"
              style={{background:"#0C0F1A",borderColor:"#141928"}}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{color:t.color,background:t.color+"10",borderColor:t.color+"25"}}>{t.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${rv.estado==="enviada"?"text-emerald-400 border-emerald-500/20":"text-amber-400 border-amber-500/20"}`}
                  style={{background:rv.estado==="enviada"?"#10b98110":"#f59e0b10"}}>
                  {rv.estado==="enviada"?"Enviada":"Pendiente"}
                </span>
              </div>
              <div className="font-mono font-bold text-xs mb-2" style={{color:t.color}}>{rv.bo||"Sin código"}</div>
              <p className="text-white font-semibold text-sm">{rv.nombre}</p>
              <p className="text-slate-600 text-xs mt-0.5">{rv.rut}</p>
              <div className="mt-3 pt-3 border-t space-y-1" style={{borderColor:"#141928"}}>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Package style={{width:11,height:11}}/>{rv.servicio}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin style={{width:11,height:11}}/>{rv.comuna}</div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{borderColor:"#141928"}}>
                <span className="text-slate-700 text-xs">{rv.fecha}</span>
                <ExternalLink style={{width:12,height:12}} className="text-slate-700 group-hover:text-slate-400 transition-colors"/>
              </div>
            </button>
          )
        })}
        <button onClick={()=>setShowNew(true)}
          className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 transition-all group min-h-[200px]" style={{borderColor:"#141928"}}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Plus style={{width:18,height:18}} className="text-emerald-500"/>
          </div>
          <span className="text-slate-600 text-xs font-medium group-hover:text-slate-400 transition-colors">Nueva venta manual</span>
        </button>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-md shadow-2xl overflow-hidden" style={{background:"#0C0F1A",borderColor:"#1E2537"}}>
            <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"#141928"}}>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                  style={{color:TIPOS.find(t=>t.id===sel.tipo)?.color||"#10b981",background:(TIPOS.find(t=>t.id===sel.tipo)?.color||"#10b981")+"10",borderColor:(TIPOS.find(t=>t.id===sel.tipo)?.color||"#10b981")+"25"}}>
                  {TIPOS.find(t=>t.id===sel.tipo)?.label||"Nueva"}
                </span>
                <span className="text-white font-semibold text-sm">{sel.nombre}</span>
              </div>
              <button onClick={()=>setSel(null)} className="text-slate-600 hover:text-slate-300 transition-colors"><X style={{width:16,height:16}}/></button>
            </div>
            <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
              <div className="flex gap-3">
                <span className="text-slate-600 text-xs w-36 flex-shrink-0">{sel.tipo==="reemision"?"🔁 Orden Cancelada":sel.tipo==="biometria"?"🟣 Tipo":"🏷️ Código BO"}</span>
                <span className="text-slate-200 text-xs font-medium">{sel.bo||(sel.tipo==="biometria"?"Biometría en calle":"—")}</span>
              </div>
              {REGISTRO_FIELDS.map(f=>(
                <div key={f.key} className="flex gap-3">
                  <span className="text-slate-600 text-xs w-36 flex-shrink-0">{f.label}</span>
                  <span className="text-slate-200 text-xs">{sel[f.key]||"—"}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2" style={{borderColor:"#141928"}}>
              <button onClick={()=>{setEditing(sel);setSel(null)}}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-white/5" style={{borderColor:"#1E2537",color:"#94a3b8"}}>
                <Edit3 style={{width:13,height:13}}/> Editar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-white/5" style={{borderColor:"#1E2537",color:"#94a3b8"}}>
                <RotateCcw style={{width:13,height:13}}/> Reenviar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                <Mail style={{width:13,height:13}}/> Enviar BI
              </button>
            </div>
          </div>
        </div>
      )}
      {showNew && <ModalRegistro onClose={()=>setShowNew(false)}/>}
      {editing && <ModalRegistro initial={editing} onClose={()=>setEditing(null)}/>}
    </div>
  )
}

// ─── CAMPAÑAS ─────────────────────────────────────────────────────────────────
function CampanasView() {
  const [tab, setTab] = useState("campanas")
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{background:"#0C0F1A",border:"1px solid #141928"}}>
        {[{id:"campanas",label:"Campañas"},{id:"plantillas",label:"Plantillas"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===t.id?"text-white shadow-sm":"text-slate-500 hover:text-slate-300"}`}
            style={tab===t.id?{background:"#141928"}:{}}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="campanas" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-xs">3 campañas activas</span>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
              <Plus style={{width:13,height:13}}/> Nueva Campaña
            </button>
          </div>
          {[
            {name:"Fibra 600MB Promo Feb",enviados:142,estado:"activa",fecha:"28/02"},
            {name:"Seguimiento Instalaciones",enviados:38,estado:"activa",fecha:"27/02"},
            {name:"Bienvenida Nuevos Clientes",enviados:91,estado:"pausada",fecha:"25/02"},
          ].map(c=>(
            <div key={c.name} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border hover:border-white/8 transition-all" style={{background:"#0C0F1A",borderColor:"#141928"}}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Megaphone style={{width:14,height:14}} className="text-emerald-400"/>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 text-xs font-semibold">{c.name}</p>
                <p className="text-slate-600 text-xs">{c.enviados} mensajes enviados · {c.fecha}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${c.estado==="activa"?"text-emerald-400 border-emerald-500/20":"text-amber-400 border-amber-500/20"}`}
                style={{background:c.estado==="activa"?"#10b98110":"#f59e0b10"}}>
                {c.estado}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-xs">5 plantillas</span>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
              <Plus style={{width:13,height:13}}/> Nueva Plantilla
            </button>
          </div>
          {[
            {name:"Confirmación de Agendamiento",tipo:"seguimiento",usos:48},
            {name:"Aviso técnico en camino",tipo:"instalación",usos:31},
            {name:"Solicitud de documentos BP",tipo:"prechequeo",usos:22},
            {name:"Bienvenida post instalación",tipo:"post-venta",usos:17},
            {name:"Reagendamiento",tipo:"seguimiento",usos:9},
          ].map(p=>(
            <div key={p.name} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border hover:border-white/8 transition-all cursor-pointer" style={{background:"#0C0F1A",borderColor:"#141928"}}>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FileText style={{width:14,height:14}} className="text-violet-400"/>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 text-xs font-semibold">{p.name}</p>
                <p className="text-slate-600 text-xs capitalize">{p.tipo} · {p.usos} usos</p>
              </div>
              <button className="text-slate-700 hover:text-slate-400 transition-colors"><Edit3 style={{width:13,height:13}}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
function ConfigView() {
  const [connected, setConnected] = useState(false)
  const [showQR, setShowQR] = useState(false)
  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="rounded-xl border p-5" style={{background:"#0C0F1A",borderColor:"#141928"}}>
        <p className="text-white font-semibold text-xs mb-4">Perfil</p>
        <div className="grid grid-cols-2 gap-3">
          {[["Nombre","Luis Campos"],["Email","lcampos24@gmail.com"]].map(([l,v])=>(
            <div key={l}>
              <label className="text-slate-600 text-xs mb-1.5 block">{l}</label>
              <input defaultValue={v} className="w-full rounded-lg px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/40 transition-colors border" style={{background:"#07090F",borderColor:"#1E2537"}}/>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-5" style={{background:"#0C0F1A",borderColor:"#141928"}}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-semibold text-xs">WhatsApp</p>
            <p className="text-slate-600 text-xs mt-0.5">Evolution API · api.empathaiapp.net</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${connected?"text-emerald-400 border-emerald-500/20":"text-rose-400 border-rose-500/20"}`}
            style={{background:connected?"#10b98110":"#f43f5e10"}}>
            {connected?<Wifi style={{width:11,height:11}}/>:<WifiOff style={{width:11,height:11}}/>}
            {connected?"Conectado":"Desconectado"}
          </span>
        </div>
        {!connected ? (!showQR ? (
          <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{borderColor:"#1E2537"}}>
            <MessageSquare style={{width:32,height:32}} className="text-slate-700 mx-auto mb-2.5"/>
            <p className="text-white font-semibold text-xs mb-1">Sin número conectado</p>
            <p className="text-slate-600 text-xs mb-4">Escanea el QR para vincular WhatsApp</p>
            <button onClick={()=>setShowQR(true)} className="px-5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
              Generar Código QR
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-600 text-xs mb-3">WhatsApp → Dispositivos vinculados → Vincular</p>
            <div className="w-40 h-40 bg-white rounded-xl mx-auto flex items-center justify-center mb-3 p-2">
              <div className="w-full h-full grid grid-cols-9 gap-px">
                {Array.from({length:81}).map((_,i)=>(
                  <div key={i} className="rounded-sm" style={{background:Math.random()>0.45?"#000":"#fff"}}/>
                ))}
              </div>
            </div>
            <p className="text-slate-700 text-xs mb-3">Expira en 60 segundos</p>
            <div className="flex gap-2.5">
              <button onClick={()=>setShowQR(false)} className="flex-1 py-2 rounded-lg border text-slate-500 text-xs" style={{borderColor:"#1E2537"}}>Cancelar</button>
              <button onClick={()=>{setConnected(true);setShowQR(false)}} className="flex-1 py-2 rounded-lg text-xs font-semibold border" style={{background:"#10b98110",color:"#10b981",borderColor:"#10b98130"}}>
                ✓ Simular
              </button>
            </div>
          </div>
        )) : (
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{background:"#07090F",borderColor:"#1E2537"}}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Phone style={{width:16,height:16}} className="text-emerald-400"/>
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">+56 9 1234 5678</p>
              <p className="text-slate-600 text-xs">movistar-001 · Activo</p>
            </div>
            <button onClick={()=>setConnected(false)} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors" style={{borderColor:"#f43f5e20"}}>
              Desconectar
            </button>
          </div>
        )}
      </div>
      <div className="rounded-xl border p-5" style={{background:"#0C0F1A",borderColor:"#141928"}}>
        <p className="text-white font-semibold text-xs mb-1">Backoffices</p>
        <p className="text-slate-600 text-xs mb-4">Contactos que usará el Super Agente</p>
        {[
          {l:"BP Prechequeo",d:"RUT + Biometría",ph:"+56 9 XXXX XXXX",c:"#38bdf8"},
          {l:"BI Ingreso",d:"Formatos de venta",ph:"correo@movistar.cl",c:"#a78bfa"},
          {l:"BA Agenda",d:"Reagendamientos",ph:"+56 9 XXXX XXXX",c:"#fb923c"},
        ].map(b=>(
          <div key={b.l} className="flex items-center gap-3 mb-3 last:mb-0">
            <div className="w-28 flex-shrink-0">
              <p className="text-xs font-semibold" style={{color:b.c}}>{b.l}</p>
              <p className="text-slate-700 text-xs">{b.d}</p>
            </div>
            <input placeholder={b.ph} className="flex-1 rounded-lg px-3 py-2 text-slate-200 text-xs border focus:outline-none placeholder-slate-800" style={{background:"#07090F",borderColor:"#1E2537"}}/>
          </div>
        ))}
      </div>
      <button className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
        Guardar Configuración
      </button>
    </div>
  )
}

// ─── PLACEHOLDER ──────────────────────────────────────────────────────────────
function PlaceholderView({ title, icon:Icon }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-64">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
        <Icon style={{width:24,height:24}} className="text-emerald-500"/>
      </div>
      <p className="text-white font-semibold text-sm">{title}</p>
      <p className="text-slate-600 text-xs mt-1">Sección en construcción</p>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
const VIEWS = {
  panel:    { title:"Panel de Control",     subtitle:"Resumen de actividad",             comp:(p)=><PanelView {...p}/> },
  bandeja:  { title:"Bandeja de Entrada",   subtitle:"53 conversaciones",               comp:BandejaView, full:true },
  ventas:   { title:"Gestión de Ventas",    subtitle:"Seguimiento de órdenes TOA",       comp:VentasView },
  registro: { title:"Registro de Ventas",   subtitle:"Formatos enviados al BI",          comp:RegistroView },
  campanas: { title:"Campañas & Plantillas",subtitle:"Mensajes masivos y templates",     comp:CampanasView },
  contactos:{ title:"Contactos",            subtitle:"",                                 comp:()=><PlaceholderView title="Contactos" icon={Users}/> },
  bot:      { title:"Super Agente",         subtitle:"",                                 comp:()=><PlaceholderView title="Super Agente" icon={Zap}/> },
  stats:    { title:"Analíticas",           subtitle:"",                                 comp:()=><PlaceholderView title="Analíticas" icon={BarChart3}/> },
  config:   { title:"Configuración",        subtitle:"Cuenta y preferencias",            comp:ConfigView },
}

export default function App() {
  const [active, setActive] = useState("bandeja")
  const [collapsed, setCollapsed] = useState(false)
  const v = VIEWS[active] || VIEWS.panel
  const Comp = v.comp

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#07090F",fontFamily:"'Geist', 'Instrument Sans', system-ui, sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1E2537;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#2A3347}
        * { box-sizing: border-box; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={v.title} subtitle={v.subtitle}/>
        {v.full
          ? <Comp setActive={setActive}/>
          : <div className="flex-1 overflow-y-auto"><Comp setActive={setActive}/></div>
        }
      </div>
    </div>
  )
}
