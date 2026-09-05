'use client';

import Image from 'next/image';
import { FormEvent, PointerEvent, ReactNode, useEffect, useState } from 'react';

type View = 'load' | 'use' | 'vehicle' | 'history';
type Operation = 'load' | 'use' | 'transfer' | 'waste' | 'correction';
type Material = { id:string; name:string; category:string; unit:string; stock:number; cost:number; image:string | null; symbol:string };
type Vehicle = { id:string; name:string; plate:string; tone:string };
type Cart = Record<string, number>;
type StockMap = Record<string, number>;
type VehicleStocks = Record<string, StockMap>;
type Line = { materialId:string; name:string; qty:number; unit:string; cost:number };
type Movement = { id:string; type:Operation; time:string; user:string; vehicleId:string; targetVehicleId?:string; address?:string; pole?:string; reason?:string; note?:string; items:Line[]; totalCost:number; edited?:boolean };

const materials:Material[] = [
  {id:'MAT-001',name:'T84 尺燈管',category:'照明燈具',unit:'支',stock:42,cost:185,image:'/materials/t8-light.jpg',symbol:'│'},
  {id:'MAT-002',name:'16W 黃光燈泡',category:'照明燈具',unit:'個',stock:84,cost:95,image:'/materials/warm-led-bulb.jpg',symbol:'●'},
  {id:'MAT-003',name:'LED 燈泡',category:'照明燈具',unit:'個',stock:38,cost:180,image:'/materials/led-bulb.png',symbol:'●'},
  {id:'MAT-004',name:'景觀燈',category:'照明燈具',unit:'組',stock:16,cost:720,image:'/materials/path-light.png',symbol:'⌂'},
  {id:'MAT-005',name:'投光燈',category:'照明燈具',unit:'組',stock:26,cost:1350,image:'/materials/flood-light.jpg',symbol:'▣'},
  {id:'MAT-006',name:'短路帽',category:'五金配件',unit:'個',stock:120,cost:38,image:null,symbol:'⌒'},
  {id:'MAT-007',name:'無熔絲開關 30A2P',category:'開關設備',unit:'個',stock:52,cost:460,image:'/materials/circuit-breaker.jpg',symbol:'▤'},
  {id:'MAT-008',name:'無熔絲開關 15A2P',category:'開關設備',unit:'個',stock:46,cost:390,image:'/materials/circuit-breaker.jpg',symbol:'▤'},
  {id:'MAT-009',name:'120/150W Power',category:'電源設備',unit:'個',stock:191,cost:680,image:'/materials/led-driver.jpg',symbol:'ϟ'},
  {id:'MAT-010',name:'7W Power',category:'電源設備',unit:'個',stock:23,cost:280,image:'/materials/compact-led-driver.png',symbol:'ϟ'},
  {id:'MAT-011',name:'2.0 2C 電纜線',category:'電線電纜',unit:'米',stock:1362,cost:42,image:'/materials/multicore-cable.jpg',symbol:'◎'},
  {id:'MAT-012',name:'5.5 1C 電纜線',category:'電線電纜',unit:'米',stock:300,cost:76,image:'/materials/single-core-cable.jpg',symbol:'◎'},
];
const vehicles:Vehicle[] = [
  {id:'CAR-01',name:'工程車 1',plate:'BFX-2186',tone:'blue'},
  {id:'CAR-02',name:'工程車 2',plate:'BKE-7319',tone:'green'},
  {id:'CAR-03',name:'工程車 3',plate:'BML-5068',tone:'orange'},
];
const seedVehicleStocks:VehicleStocks = {
  'CAR-01':{'MAT-001':5,'MAT-002':12,'MAT-003':4,'MAT-005':2,'MAT-006':18,'MAT-007':3,'MAT-009':5,'MAT-011':85,'MAT-012':30},
  'CAR-02':{'MAT-001':3,'MAT-002':8,'MAT-004':2,'MAT-006':12,'MAT-008':4,'MAT-010':5,'MAT-011':60},
  'CAR-03':{'MAT-002':6,'MAT-003':5,'MAT-005':1,'MAT-006':8,'MAT-007':2,'MAT-009':4,'MAT-011':42,'MAT-012':18},
};
const seedMovements:Movement[] = [
  {id:'USE-0906-018',type:'use',time:'今天 16:42',user:'王志明',vehicleId:'CAR-01',address:'桃園市中壢區中正路 128 號',pole:'中壢 1842',items:[{materialId:'MAT-002',name:'16W 黃光燈泡',qty:2,unit:'個',cost:95},{materialId:'MAT-006',name:'短路帽',qty:3,unit:'個',cost:38}],totalCost:304},
  {id:'LOAD-0906-011',type:'load',time:'今天 08:15',user:'陳建宏',vehicleId:'CAR-02',items:[{materialId:'MAT-011',name:'2.0 2C 電纜線',qty:50,unit:'米',cost:42}],totalCost:2100},
  {id:'WASTE-0905-006',type:'waste',time:'昨天 18:03',user:'林俊傑',vehicleId:'CAR-03',reason:'施工裁切剩料',items:[{materialId:'MAT-012',name:'5.5 1C 電纜線',qty:4,unit:'米',cost:76}],totalCost:304},
];
const typeMeta:Record<Operation,{label:string;sign:string;className:string}> = {
  load:{label:'裝車',sign:'＋',className:'load'}, use:{label:'工程用料',sign:'−',className:'use'}, transfer:{label:'車輛轉移',sign:'⇄',className:'transfer'}, waste:{label:'報廢',sign:'−',className:'waste'}, correction:{label:'更正',sign:'±',className:'correction'},
};
const categories = ['全部','照明燈具','開關設備','電源設備','電線電纜','五金配件'];
const STORAGE = 'junrong-inventory-v3';

const blankFactory = () => Object.fromEntries(materials.map(m => [m.id,m.stock]));
const stockOf = (stocks:StockMap,id:string) => stocks[id] || 0;
const money = (n:number) => new Intl.NumberFormat('zh-TW',{style:'currency',currency:'TWD',maximumFractionDigits:0}).format(n);
const now = () => `今天 ${new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})}`;
const makeId = (prefix:string) => `${prefix}-${Date.now().toString().slice(-8)}`;

export default function Home(){
  const [user,setUser] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const [entering,setEntering] = useState(false);
  const [authMode,setAuthMode] = useState<'login'|'register'>('login');
  const [view,setView] = useState<View>('load');
  const [selectedVehicle,setSelectedVehicle] = useState('CAR-01');
  const [factoryStock,setFactoryStock] = useState<StockMap>(blankFactory);
  const [vehicleStocks,setVehicleStocks] = useState<VehicleStocks>(seedVehicleStocks);
  const [movements,setMovements] = useState<Movement[]>(seedMovements);
  const [loadCart,setLoadCart] = useState<Cart>({});
  const [useCart,setUseCart] = useState<Cart>({});
  const [address,setAddress] = useState('');
  const [pole,setPole] = useState('');
  const [confirmOpen,setConfirmOpen] = useState(false);
  const [manage,setManage] = useState<'transfer'|'waste'|null>(null);
  const [editing,setEditing] = useState<Movement|null>(null);
  const [userMenu,setUserMenu] = useState(false);
  const [toast,setToast] = useState('');
  const [hydrated,setHydrated] = useState(false);

  useEffect(()=>{
    const session=localStorage.getItem('junrong-user'); if(session)setUser(session);
    try{const saved=localStorage.getItem(STORAGE);if(saved){const d=JSON.parse(saved);setFactoryStock(d.factoryStock||blankFactory());setVehicleStocks(d.vehicleStocks||seedVehicleStocks);setMovements(d.movements||seedMovements);setSelectedVehicle(d.selectedVehicle||'CAR-01')}}catch{}
    const t=setTimeout(()=>setLoading(false),1200);setHydrated(true);return()=>clearTimeout(t);
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem(STORAGE,JSON.stringify({factoryStock,vehicleStocks,movements,selectedVehicle}))},[factoryStock,vehicleStocks,movements,selectedVehicle,hydrated]);

  const activeCart=view==='load'?loadCart:useCart;
  const activeStock=view==='load'?factoryStock:(vehicleStocks[selectedVehicle]||{});
  const items=materials.filter(m=>(activeCart[m.id]||0)>0);
  const totalQty=Object.values(activeCart).reduce((a,b)=>a+b,0);
  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2600)};
  const login=(name:string)=>{setEntering(true);window.setTimeout(()=>{localStorage.setItem('junrong-user',name);setUser(name);setEntering(false);show(`歡迎回來，${name}師傅`)},1300)};
  const changeCart=(m:Material,delta:number)=>{const setter=view==='load'?setLoadCart:setUseCart;setter(c=>({...c,[m.id]:Math.max(0,Math.min(stockOf(activeStock,m.id),(c[m.id]||0)+delta))}))};
  const openConfirm=()=>{if(!totalQty)return;if(view==='use'&&(!address.trim()||!pole.trim())){show('請先填寫施工地址與路燈編號');return}setConfirmOpen(true)};
  const submitPrimary=()=>{
    if(!user||!items.length)return;
    const lines=items.map(m=>({materialId:m.id,name:m.name,qty:activeCart[m.id],unit:m.unit,cost:m.cost}));
    const totalCost=lines.reduce((s,x)=>s+x.qty*x.cost,0);
    if(view==='load'){
      setFactoryStock(s=>({...s,...Object.fromEntries(lines.map(x=>[x.materialId,stockOf(s,x.materialId)-x.qty]))}));
      setVehicleStocks(s=>({...s,[selectedVehicle]:{...(s[selectedVehicle]||{}),...Object.fromEntries(lines.map(x=>[x.materialId,stockOf(s[selectedVehicle]||{},x.materialId)+x.qty]))}}));
      setMovements(m=>[{id:makeId('LOAD'),type:'load',time:now(),user,vehicleId:selectedVehicle,items:lines,totalCost},...m]);setLoadCart({});show('裝車完成，材料已移至工程車');
    }else{
      setVehicleStocks(s=>({...s,[selectedVehicle]:{...(s[selectedVehicle]||{}),...Object.fromEntries(lines.map(x=>[x.materialId,stockOf(s[selectedVehicle]||{},x.materialId)-x.qty]))}}));
      setMovements(m=>[{id:makeId('USE'),type:'use',time:now(),user,vehicleId:selectedVehicle,address:address.trim(),pole:pole.trim(),items:lines,totalCost},...m]);setUseCart({});setAddress('');setPole('');setView('history');show('工程用料已回報，車上庫存已扣除');
    }
    setConfirmOpen(false);
  };
  const finishManage=(kind:'transfer'|'waste',cart:Cart,target:string,reason:string)=>{
    if(!user)return;const selected=materials.filter(m=>cart[m.id]>0);if(!selected.length)return;
    const lines=selected.map(m=>({materialId:m.id,name:m.name,qty:cart[m.id],unit:m.unit,cost:m.cost}));
    setVehicleStocks(s=>{const next={...s,[selectedVehicle]:{...(s[selectedVehicle]||{})}};lines.forEach(x=>next[selectedVehicle][x.materialId]=stockOf(next[selectedVehicle],x.materialId)-x.qty);if(kind==='transfer'){next[target]={...(s[target]||{})};lines.forEach(x=>next[target][x.materialId]=stockOf(next[target],x.materialId)+x.qty)}return next});
    setMovements(m=>[{id:makeId(kind==='transfer'?'MOVE':'WASTE'),type:kind,time:now(),user,vehicleId:selectedVehicle,targetVehicleId:kind==='transfer'?target:undefined,reason:kind==='waste'?reason:undefined,items:lines,totalCost:lines.reduce((s,x)=>s+x.qty*x.cost,0)},...m]);
    setManage(null);show(kind==='transfer'?'材料轉移完成':'報廢已登記，成本已計入');
  };
  const saveCorrection=(original:Movement,nextCart:Cart,note:string)=>{
    if(!user)return;const revised=original.items.map(x=>({...x,qty:nextCart[x.materialId]??x.qty})).filter(x=>x.qty>0);const delta:Record<string,number>={};original.items.forEach(x=>delta[x.materialId]=(delta[x.materialId]||0)+x.qty);revised.forEach(x=>delta[x.materialId]=(delta[x.materialId]||0)-x.qty);
    setVehicleStocks(s=>({...s,[original.vehicleId]:{...(s[original.vehicleId]||{}),...Object.fromEntries(Object.entries(delta).map(([id,d])=>[id,stockOf(s[original.vehicleId]||{},id)+d]))}}));
    setMovements(list=>[{id:makeId('FIX'),type:'correction',time:now(),user,vehicleId:original.vehicleId,note,items:Object.entries(delta).filter(([,d])=>d!==0).map(([id,d])=>{const m=materials.find(x=>x.id===id)!;return{materialId:id,name:m.name,qty:-d,unit:m.unit,cost:m.cost}}),totalCost:0},...list.map(x=>x.id===original.id?{...x,items:revised,totalCost:revised.reduce((s,i)=>s+i.qty*i.cost,0),edited:true}:x)]);setEditing(null);show('回報已更正，庫存同步調整');
  };

  if(loading||entering)return <Splash entering={entering}/>;
  if(!user)return <Auth mode={authMode} setMode={setAuthMode} login={login}/>;
  const vehicle=vehicles.find(v=>v.id===selectedVehicle)!;
  return <div className="app-shell">
    <Topbar user={user} vehicle={vehicle} selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle} menu={userMenu} setMenu={setUserMenu} logout={()=>{localStorage.removeItem('junrong-user');setUser(null);setUserMenu(false)}}/>
    <Swipe view={view} setView={setView}>
      {view==='load'&&<MaterialPage mode="load" user={user} vehicle={vehicle} stock={factoryStock} cart={loadCart} change={changeCart} openConfirm={openConfirm}/>} 
      {view==='use'&&<MaterialPage mode="use" user={user} vehicle={vehicle} stock={vehicleStocks[selectedVehicle]||{}} cart={useCart} change={changeCart} openConfirm={openConfirm} address={address} setAddress={setAddress} pole={pole} setPole={setPole}/>} 
      {view==='vehicle'&&<VehiclePage vehicle={vehicle} stock={vehicleStocks[selectedVehicle]||{}} totalFactory={factoryStock} onTransfer={()=>setManage('transfer')} onWaste={()=>setManage('waste')}/>} 
      {view==='history'&&<HistoryPage movements={movements} selectedVehicle={selectedVehicle} edit={setEditing}/>} 
    </Swipe>
    <BottomNav view={view} setView={setView}/>
    {confirmOpen&&<ConfirmSheet mode={view==='load'?'load':'use'} vehicle={vehicle} items={items} cart={activeCart} address={address} pole={pole} close={()=>setConfirmOpen(false)} submit={submitPrimary}/>} 
    {manage&&<ManageSheet kind={manage} source={vehicle} stock={vehicleStocks[selectedVehicle]||{}} close={()=>setManage(null)} submit={(cart,target,reason)=>finishManage(manage,cart,target,reason)}/>} 
    {editing&&<CorrectionSheet movement={editing} close={()=>setEditing(null)} save={saveCorrection}/>} 
    {toast&&<div className="toast">✓　{toast}</div>}
  </div>;
}

function Splash({entering}:{entering:boolean}){return <div className={`splash ${entering?'entering':''}`}><div className="splash-orb"/><Image src="/junrong-logo.png" alt="浚榮水電工程" width={300} height={300} priority/><div className="loader"><span/></div><small>{entering?'正在準備你的工程車庫存':'浚榮材料管理系統'}</small></div>}

function Auth({mode,setMode,login}:{mode:'login'|'register';setMode:(m:'login'|'register')=>void;login:(n:string)=>void}){
  const[name,setName]=useState('');const[phone,setPhone]=useState('');const[password,setPassword]=useState('');const[error,setError]=useState('');
  const submit=(e:FormEvent)=>{e.preventDefault();setError('');const p=phone.replace(/\s/g,'');if(!/^09\d{8}$/.test(p)){setError('請輸入正確的 10 碼手機號碼');return}if(password.length<4){setError('密碼至少需要 4 個字元');return}const users:{name:string;phone:string;password:string}[]=JSON.parse(localStorage.getItem('junrong-users')||'[]');if(mode==='register'){if(!name.trim()){setError('請輸入師傅姓名');return}localStorage.setItem('junrong-users',JSON.stringify([...users.filter(u=>u.phone!==p),{name:name.trim(),phone:p,password}]));login(name.trim())}else{const found=users.find(u=>u.phone===p&&u.password===password);if(!found){setError('手機號碼或密碼不正確，可使用示範帳號');return}login(found.name)}};
  return <main className="auth"><section className="auth-story"><div className="brand"><Image src="/junrong-logo.png" alt="浚榮" width={64} height={64}/><div><b>浚榮庫存</b><small>JUN RONG INVENTORY</small></div></div><div><span className="chip">師傅行動端</span><h1>每一份材料，<br/>從工廠到現場都有紀錄。</h1><p>今晚裝車、明日施工、車上剩料與報廢，全部用手機幾秒完成。</p></div><div className="story-flow"><span>工廠</span><i>→</i><span>工程車</span><i>→</i><span>施工現場</span></div></section><section className="auth-side"><form className="auth-card" onSubmit={submit}><Image className="auth-logo" src="/junrong-logo.png" alt="浚榮水電工程" width={112} height={112}/><div className="segmented"><button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('')}}>登入</button><button type="button" className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('')}}>註冊</button></div><small className="eyebrow">{mode==='login'?'WELCOME BACK':'CREATE ACCOUNT'}</small><h2>{mode==='login'?'師傅登入':'建立師傅帳號'}</h2><p>{mode==='login'?'登入後會自動帶入你的姓名與操作紀錄。':'首次建立後，即可用手機快速回報材料。'}</p>{mode==='register'&&<Field label="師傅姓名"><input value={name} onChange={e=>setName(e.target.value)} placeholder="例如：王志明"/></Field>}<Field label="手機號碼"><input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" placeholder="0912 345 678"/></Field><Field label="登入密碼"><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="至少 4 個字元"/></Field>{error&&<div className="form-error">!　{error}</div>}<button className="primary auth-submit"><span>{mode==='login'?'登入系統':'完成註冊'}</span><b>→</b></button>{mode==='login'&&<button className="demo-button" type="button" onClick={()=>login('王志明')}>使用示範帳號登入</button>}</form><small className="auth-foot">浚榮水電工程・內部材料管理</small></section></main>
}

function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}

function Topbar({user,vehicle,selectedVehicle,setSelectedVehicle,menu,setMenu,logout}:{user:string;vehicle:Vehicle;selectedVehicle:string;setSelectedVehicle:(s:string)=>void;menu:boolean;setMenu:(b:boolean)=>void;logout:()=>void}){return <header className="topbar"><div className="top-brand"><Image src="/junrong-logo.png" alt="浚榮" width={46} height={46}/><div><b>浚榮庫存</b><small>材料流向一目了然</small></div></div><div className="top-actions"><label className="vehicle-select"><span className={`vehicle-dot ${vehicle.tone}`}/><select value={selectedVehicle} onChange={e=>setSelectedVehicle(e.target.value)}>{vehicles.map(v=><option key={v.id} value={v.id}>{v.name}・{v.plate}</option>)}</select><i>⌄</i></label><button className="avatar" onClick={()=>setMenu(!menu)}>{user.slice(0,1)}</button>{menu&&<div className="user-menu"><b>{user}師傅</b><small>{vehicle.name}・{vehicle.plate}</small><button onClick={logout}>登出帳號</button></div>}</div></header>}

function Swipe({view,setView,children}:{view:View;setView:(v:View)=>void;children:ReactNode}){const[start,setStart]=useState<{x:number;y:number}|null>(null);const tabs:View[]=['load','use','vehicle','history'];const down=(e:PointerEvent<HTMLElement>)=>{if((e.target as HTMLElement).closest('button,input,select,textarea'))return;setStart({x:e.clientX,y:e.clientY})};const up=(e:PointerEvent<HTMLElement>)=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;setStart(null);if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.2){const i=Math.max(0,Math.min(3,tabs.indexOf(view)+(dx<0?1:-1)));setView(tabs[i])}};return <main className="content" onPointerDown={down} onPointerUp={up}>{children}</main>}

function PageHero({kicker,title,description,aside}:{kicker:string;title:string;description:string;aside:ReactNode}){return <section className="page-hero"><div><small>{kicker}</small><h1>{title}</h1><p>{description}</p></div>{aside}</section>}

function MaterialPage({mode,user,vehicle,stock,cart,change,openConfirm,address='',setAddress,pole='',setPole}:{mode:'load'|'use';user:string;vehicle:Vehicle;stock:StockMap;cart:Cart;change:(m:Material,d:number)=>void;openConfirm:()=>void;address?:string;setAddress?:(s:string)=>void;pole?:string;setPole?:(s:string)=>void}){
  const total=Object.values(cart).reduce((a,b)=>a+b,0);const value=materials.reduce((s,m)=>s+(cart[m.id]||0)*m.cost,0);
  return <div className="page-enter"><PageHero kicker={mode==='load'?'STEP 1・今晚備料':'STEP 2・完工回報'} title={mode==='load'?'今晚要裝哪些料？':'這一場用了哪些料？'} description={mode==='load'?`從工廠庫存移到 ${vehicle.name}，送出後立即完成。`:`由 ${user}師傅回報，送出後直接扣除 ${vehicle.name} 庫存。`} aside={<div className="hero-badge"><span className={`vehicle-dot ${vehicle.tone}`}/><div><small>目前工程車</small><b>{vehicle.name}</b><em>{vehicle.plate}</em></div></div>}/>{mode==='load'?<div className="notice"><span>今晚裝車</span><p>材料會從「工廠」轉入「{vehicle.name}」，不是直接算成工程用掉。</p></div>:<div className="job-form"><div><Field label="施工地址"><input value={address} onChange={e=>setAddress?.(e.target.value)} placeholder="貼上或輸入地址"/></Field><Field label="路燈／電線桿編號"><input value={pole} onChange={e=>setPole?.(e.target.value)} placeholder="例如：中壢 1842"/></Field></div><small>不用建立完整場次，只保留能追查材料去向的基本資料。</small></div>}<MaterialPicker stock={stock} cart={cart} change={change}/>{total>0&&<button className="action-bar" onClick={openConfirm}><span><b>{total}</b>{mode==='load'?'件待裝車':'件待回報'}<small>預估成本 {money(value)}</small></span><strong>{mode==='load'?'確認今晚裝車':'確認工程用料'}　→</strong></button>}</div>
}

function MaterialPicker({stock,cart,change}:{stock:StockMap;cart:Cart;change:(m:Material,d:number)=>void}){const[category,setCategory]=useState('全部');const[search,setSearch]=useState('');const visible=materials.filter(m=>(category==='全部'||m.category===category)&&m.name.toLowerCase().includes(search.toLowerCase()));return <section className="picker"><div className="picker-heading"><div><h2>選擇材料</h2><p>像點餐一樣，點選材料再調整數量</p></div><span>{visible.length} 項材料</span></div><div className="search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋材料名稱或規格"/><button type="button">掃碼</button></div><div className="categories">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="material-grid">{visible.map(m=>{const available=stockOf(stock,m.id);return <article key={m.id} className={available<=2?'low':''}><div className="material-image">{m.image?<Image src={m.image} alt={m.name} fill sizes="(max-width:600px) 45vw, 220px"/>:<b>{m.symbol}</b>}{available<=2&&<em>庫存偏低</em>}</div><small>{m.category}・{m.id}</small><h3>{m.name}</h3><div className="material-meta"><span>可用 <b>{available.toLocaleString()}</b> {m.unit}</span><i>{money(m.cost)}/{m.unit}</i></div>{cart[m.id]?<div className="counter"><button onClick={()=>change(m,-1)}>−</button><strong>{cart[m.id]}</strong><button onClick={()=>change(m,1)}>＋</button></div>:<button className="add" disabled={!available} onClick={()=>change(m,1)}>{available?'＋ 加入清單':'目前無庫存'}</button>}</article>})}</div></section>}

function VehiclePage({vehicle,stock,totalFactory,onTransfer,onWaste}:{vehicle:Vehicle;stock:StockMap;totalFactory:StockMap;onTransfer:()=>void;onWaste:()=>void}){const kinds=materials.filter(m=>stockOf(stock,m.id)>0).length;const value=materials.reduce((s,m)=>s+stockOf(stock,m.id)*m.cost,0);return <div className="page-enter"><PageHero kicker="VEHICLE STOCK" title="車上現在還有什麼？" description="留在車上的料持續算在公司資產，不需要每天搬回工廠。" aside={<div className="hero-badge"><span className={`vehicle-dot ${vehicle.tone}`}/><div><small>查看中的車輛</small><b>{vehicle.name}</b><em>{vehicle.plate}</em></div></div>}/><section className="vehicle-summary"><div><small>車上材料</small><b>{kinds}<i> 種</i></b><p>由裝車、施工、轉移與報廢自動計算</p></div><div><small>車上材料成本</small><b>{money(value)}</b><p>依目前材料單位成本估算</p></div><button onClick={onTransfer}><span>⇄</span><b>轉移到其他工程車</b><small>多人共用車輛也能追蹤</small></button><button className="waste-button" onClick={onWaste}><span>⌫</span><b>登記報廢材料</b><small>丟棄也保留成本紀錄</small></button></section><section className="stock-table"><div className="table-head"><div><h2>{vehicle.name} 材料明細</h2><p>目前車上可使用的即時數量</p></div><span>工廠庫存對照</span></div>{materials.map(m=>{const qty=stockOf(stock,m.id);return <article key={m.id}><div className="stock-thumb">{m.image?<Image src={m.image} alt="" fill sizes="54px"/>:m.symbol}</div><div><b>{m.name}</b><small>{m.id}・{m.category}</small></div><div><small>車上</small><b className={qty<=2?'danger':''}>{qty.toLocaleString()} {m.unit}</b></div><div><small>工廠</small><b>{stockOf(totalFactory,m.id).toLocaleString()} {m.unit}</b></div></article>})}</section></div>}

function HistoryPage({movements,selectedVehicle,edit}:{movements:Movement[];selectedVehicle:string;edit:(m:Movement)=>void}){const[filter,setFilter]=useState<'all'|'mine'>('all');const list=filter==='all'?movements:movements.filter(m=>m.vehicleId===selectedVehicle);return <div className="page-enter"><PageHero kicker="AUDIT TRAIL" title="每一筆材料都找得到" description="誰、哪台車、什麼時間、用了什麼料，都集中在同一處。" aside={<div className="history-total"><small>本月材料紀錄</small><b>{movements.length}</b><span>筆異動</span></div>}/><div className="history-filter"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>全部紀錄</button><button className={filter==='mine'?'active':''} onClick={()=>setFilter('mine')}>目前工程車</button></div><section className="timeline">{list.map(m=>{const meta=typeMeta[m.type];const vehicle=vehicles.find(v=>v.id===m.vehicleId);return <article key={m.id}><div className={`movement-icon ${meta.className}`}>{meta.sign}</div><div className="movement-body"><div className="movement-title"><div><span className={`tag ${meta.className}`}>{meta.label}</span><small>{m.time}・{m.user}師傅</small></div><b>{m.type==='correction'?'庫存數量更正':money(m.totalCost)}</b></div><h3>{m.items.map(x=>`${x.name} ${x.qty>0?x.qty:`${x.qty}`} ${x.unit}`).join('、')}</h3><p>{vehicle?.name}・{vehicle?.plate}{m.targetVehicleId?` → ${vehicles.find(v=>v.id===m.targetVehicleId)?.name}`:''}</p>{m.address&&<div className="job-ref"><span>⌖</span><div><b>{m.address}</b><small>路燈／電線桿：{m.pole}</small></div></div>}{m.reason&&<small className="reason">原因：{m.reason}</small>}{m.note&&<small className="reason">更正說明：{m.note}</small>}</div>{m.type==='use'&&<button className="edit-button" onClick={()=>edit(m)}>{m.edited?'再次修改':'修改回報'}</button>}</article>})}</section></div>}

function BottomNav({view,setView}:{view:View;setView:(v:View)=>void}){const tabs:{id:View;icon:string;label:string}[]=[{id:'load',icon:'▣',label:'今晚裝車'},{id:'use',icon:'✓',label:'工程用料'},{id:'vehicle',icon:'▰',label:'車上庫存'},{id:'history',icon:'≡',label:'我的紀錄'}];const active=tabs.findIndex(t=>t.id===view);const[drag,setDrag]=useState<number|null>(null);const position=(e:PointerEvent<HTMLElement>)=>{const r=e.currentTarget.getBoundingClientRect();return Math.max(0,Math.min(3,((e.clientX-r.left)/r.width)*4-.5))};return <nav className="bottom-nav" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag(position(e))}} onPointerMove={e=>drag!==null&&setDrag(position(e))} onPointerUp={e=>{if(drag!==null)setView(tabs[Math.round(position(e))].id);setDrag(null)}} onPointerCancel={()=>setDrag(null)}><div className="nav-pill" style={{transform:`translateX(${(drag??active)*100}%)`}}/>{tabs.map(t=><button key={t.id} className={view===t.id?'active':''} onClick={()=>setView(t.id)}><i>{t.icon}</i><span>{t.label}</span></button>)}</nav>}

function Overlay({children,close}:{children:ReactNode;close:()=>void}){return <><button className="overlay" onClick={close} aria-label="關閉"/><section className="sheet"><div className="sheet-handle"/>{children}</section></>}
function SheetHead({eyebrow,title,close}:{eyebrow:string;title:string;close:()=>void}){return <div className="sheet-head"><div><small>{eyebrow}</small><h2>{title}</h2></div><button onClick={close}>×</button></div>}
function SheetItems({items,cart}:{items:Material[];cart:Cart}){return <div className="sheet-items">{items.map(m=><article key={m.id}><div className="sheet-thumb">{m.image?<Image src={m.image} alt="" fill sizes="44px"/>:m.symbol}</div><div><b>{m.name}</b><small>{money(m.cost)} / {m.unit}</small></div><strong>{cart[m.id]} {m.unit}</strong></article>)}</div>}

function ConfirmSheet({mode,vehicle,items,cart,address,pole,close,submit}:{mode:'load'|'use';vehicle:Vehicle;items:Material[];cart:Cart;address:string;pole:string;close:()=>void;submit:()=>void}){const total=items.reduce((s,m)=>s+(cart[m.id]||0)*m.cost,0);return <Overlay close={close}><SheetHead eyebrow={mode==='load'?'裝車確認':'工程用料確認'} title={mode==='load'?`移入 ${vehicle.name}`:'送出本場用料'} close={close}/>{mode==='use'&&<div className="sheet-job"><b>{address}</b><small>路燈／電線桿：{pole}</small></div>}<SheetItems items={items} cart={cart}/><div className="sheet-cost"><span>預估材料成本</span><b>{money(total)}</b><small>{mode==='load'?'只移動庫存位置，不會列為用料成本。':'送出後立即扣除車上庫存，不需主管確認。'}</small></div><button className="primary sheet-submit" onClick={submit}>{mode==='load'?'確認並完成裝車':'確認並完成回報'} <span>→</span></button></Overlay>}

function ManageSheet({kind,source,stock,close,submit}:{kind:'transfer'|'waste';source:Vehicle;stock:StockMap;close:()=>void;submit:(c:Cart,t:string,r:string)=>void}){const[cart,setCart]=useState<Cart>({});const[target,setTarget]=useState(vehicles.find(v=>v.id!==source.id)?.id||'');const[reason,setReason]=useState('施工裁切剩料');const selected=materials.filter(m=>cart[m.id]>0);const change=(m:Material,d:number)=>setCart(c=>({...c,[m.id]:Math.max(0,Math.min(stockOf(stock,m.id),(c[m.id]||0)+d))}));return <Overlay close={close}><SheetHead eyebrow={kind==='transfer'?'車輛庫存移轉':'材料損耗紀錄'} title={kind==='transfer'?'轉移材料':'登記報廢'} close={close}/><div className="manage-fields">{kind==='transfer'?<Field label="轉入哪一台車"><select value={target} onChange={e=>setTarget(e.target.value)}>{vehicles.filter(v=>v.id!==source.id).map(v=><option key={v.id} value={v.id}>{v.name}・{v.plate}</option>)}</select></Field>:<Field label="報廢原因"><select value={reason} onChange={e=>setReason(e.target.value)}><option>施工裁切剩料</option><option>材料損壞</option><option>規格不符無法使用</option><option>其他</option></select></Field>}<p>來源：{source.name}・{source.plate}</p></div><div className="manage-list">{materials.filter(m=>stockOf(stock,m.id)>0).map(m=><article key={m.id}><div><b>{m.name}</b><small>車上 {stockOf(stock,m.id)} {m.unit}</small></div><div className="counter small"><button onClick={()=>change(m,-1)}>−</button><strong>{cart[m.id]||0}</strong><button onClick={()=>change(m,1)}>＋</button></div></article>)}</div><button className="primary sheet-submit" disabled={!selected.length} onClick={()=>submit(cart,target,reason)}>{kind==='transfer'?'確認轉移':'確認報廢並計入成本'} <span>→</span></button></Overlay>}

function CorrectionSheet({movement,close,save}:{movement:Movement;close:()=>void;save:(m:Movement,c:Cart,n:string)=>void}){const[cart,setCart]=useState<Cart>(Object.fromEntries(movement.items.map(x=>[x.materialId,x.qty])));const[note,setNote]=useState('數量輸入錯誤');return <Overlay close={close}><SheetHead eyebrow="CORRECTION" title="修改工程用料回報" close={close}/><div className="sheet-job"><b>{movement.address}</b><small>路燈／電線桿：{movement.pole}</small></div><div className="manage-list">{movement.items.map(x=><article key={x.materialId}><div><b>{x.name}</b><small>原回報 {x.qty} {x.unit}</small></div><div className="counter small"><button onClick={()=>setCart(c=>({...c,[x.materialId]:Math.max(0,c[x.materialId]-1)}))}>−</button><strong>{cart[x.materialId]}</strong><button onClick={()=>setCart(c=>({...c,[x.materialId]:c[x.materialId]+1}))}>＋</button></div></article>)}</div><Field label="更正說明"><input value={note} onChange={e=>setNote(e.target.value)} placeholder="為什麼需要修改？"/></Field><p className="correction-note">儲存後會同步補回或扣除車上庫存，並保留一筆更正紀錄。</p><button className="primary sheet-submit" onClick={()=>save(movement,cart,note)}>儲存更正 <span>→</span></button></Overlay>}
