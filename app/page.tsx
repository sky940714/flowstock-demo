'use client';
import { useState } from 'react';

const nav = ['總覽','訂單中心','商品管理','庫存管理','採購管理','倉庫調撥','內部領用'];
const icons = ['▦','▤','◇','▥','▣','⇄','↗'];
const metrics = [['今日待處理','18','較昨日 +4',''],['待出庫','12','最早 09:40',''],['待驗收入庫','3','共 126 件','amber'],['低庫存','7','2 項即將售罄','red'],['異常','2','需要立即處理','red']];
const tasks = [['庫存不足','蝦皮訂單 #SP20260829021','TRAVO 玩一趟','urgent'],['等待出庫','安鑫訂單 #AX8821','台北門市倉','pending'],['等待驗收','採購單 PO-08291','豪盛生活用品','incoming'],['調撥待確認','桃園總倉 → 台中倉','TR-0829-03','transfer']];
const movements = [['14:32','旅行收納袋 6 件組','SP-0829021','訂單出庫','-2','out'],['14:28','全球萬用轉接頭','PO-08291','採購入庫','+50','in'],['14:20','真空壓縮袋 M','王小明 · 拍攝用','內部領用','-3','out'],['13:55','折疊旅行袋 32L','桃園 → 台北','倉庫調撥','-10','move'],['13:42','北歐抗菌砧板','退貨單 RT-3124','退貨入庫','+1','in']];
const moduleRows:Record<string,string[][]>={
 '訂單中心':[['#SP20260829021','TRAVO · 蝦皮','林怡君','桃園總倉','庫存不足'],['#AX8821','安鑫 · 門市 POS','王家豪','台北門市倉','待出庫'],['#CC24082916','采采 · 官網','張雅婷','台中倉','揀貨中'],['#LN2026082911','TRAVO · LINE','陳冠宇','桃園總倉','待確認']],
 '商品管理':[['TRV-ORG-6PC','旅行收納袋 6 件組','TRAVO 玩一趟','84','銷售中'],['TRV-ADP-GR','全球萬用轉接頭','TRAVO 玩一趟','17','低庫存'],['ANX-CB-02','北歐抗菌砧板','安鑫購物','142','銷售中'],['CCI-VAC-M','真空壓縮袋 M','采采購物','31','銷售中']],
 '庫存管理':[['TRV-ORG-6PC','旅行收納袋','桃園 48 · 台北 21 · 台中 15','20','84'],['TRV-ADP-GR','萬用轉接頭','桃園 5 · 台北 8 · 台中 4','30','17'],['ANX-CB-02','北歐抗菌砧板','桃園 72 · 台北 51 · 台中 19','25','142']],
 '採購管理':[['PO-08291','豪盛生活用品','全球萬用轉接頭 · 50','桃園總倉','等待驗收'],['PO-08287','好旅國際','收納袋 · 120','桃園總倉','運送中'],['PO-08276','家適選物','砧板 · 80','台北門市倉','待到貨']],
 '倉庫調撥':[['TR-0829-03','折疊旅行袋 · 10','桃園總倉','台中倉','待確認'],['TR-0828-07','北歐抗菌砧板 · 15','桃園總倉','台北門市倉','運送中'],['TR-0827-02','旅行收納袋 · 6','台中倉','台北門市倉','已完成']],
 '內部領用':[['USE-0829-04','王小明','真空壓縮袋 · 商品拍攝','桃園總倉','待確認'],['USE-0828-11','李佳蓉','旅行收納袋 · 門市陳列','台北門市倉','已出庫'],['USE-0827-06','周柏翰','萬用轉接頭 · 品質檢測','桃園總倉','已出庫']]
};

export default function Home(){
 const [active,setActive]=useState('總覽'); const [notice,setNotice]=useState('');
 const show=(m:string)=>{setNotice(m);window.setTimeout(()=>setNotice(''),2400)};
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><span className="brand-mark">流</span><div><strong>FlowStock</strong><small>營運整合中心</small></div></div>
   <div className="workspace"><span className="workspace-logo">群</span><div><small>目前工作區</small><b>群禾零售事業</b></div><span className="chev">⌄</span></div>
   <nav><p className="nav-label">營運管理</p>{nav.map((item,i)=><button key={item} className={active===item?'active':''} onClick={()=>setActive(item)}><span className="nav-icon">{icons[i]}</span>{item}{item==='訂單中心'&&<em>18</em>}</button>)}<p className="nav-label second">系統管理</p>{['供應商管理','員工與權限','串接管理','系統設定'].map((item,i)=><button key={item} onClick={()=>show(`${item}為展示版預留功能`)}><span className="nav-icon">{['♙','♚','⌘','⚙'][i]}</span>{item}</button>)}</nav>
   <div className="sidebar-foot"><div className="avatar">陳</div><div><b>陳昱安</b><small>系統管理員</small></div><span>⋮</span></div>
  </aside>
  <main><header><div><p className="breadcrumb">營運管理　/　<span>{active}</span></p><h1>{active==='總覽'?'早安，昱安':active}</h1><p className="subtitle">{active==='總覽'?'今天有 18 筆事項等待處理，以下是目前營運狀況。':'集中管理所有品牌與通路資訊。'}</p></div><div className="header-actions"><button className="icon-btn">⌕</button><button className="icon-btn alert">♢<i/></button><button className="primary" onClick={()=>show('已開啟「建立訂單」流程')}>＋ 建立訂單</button></div></header>
   {active!=='總覽'?<section className="module"><div className="module-toolbar"><div><button className="selected">全部</button><button>待處理</button><button>進行中</button><button>已完成</button></div><div><input placeholder="搜尋編號、商品或 SKU"/><button onClick={()=>show('篩選條件已套用')}>篩選</button></div></div>{active==='採購管理'&&<div className="flowline">供應商　→　建立進貨單　→　待到貨　→　<strong>驗收入庫</strong>　→　庫存增加</div>}<div className="module-head"><span>編號 / SKU</span><span>品牌 / 人員 / 商品</span><span>內容</span><span>倉庫</span><span>狀態 / 數量</span></div>{moduleRows[active].map(row=><button className="module-row" key={row[0]} onClick={()=>show(`正在查看：${row[0]}`)}>{row.map((cell,i)=><span key={i} className={i===0?'strong':i===4?'state':''}>{cell}</span>)}</button>)}<button className="floating-action" onClick={()=>show(active==='採購管理'?'PO-08291 已驗收入庫，庫存增加 50':'已建立一筆新紀錄')}>＋ {active==='採購管理'?'驗收入庫':'建立新紀錄'}</button></section>:<>
    <section className="metrics">{metrics.map(([label,value,note,tone])=><article key={label} className={`metric ${tone}`}><div><span>{label}</span><i>→</i></div><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className="top-grid"><article className="panel tasks"><div className="panel-head"><div><h2>今日待辦</h2><p>依優先順序排列需要處理的事項</p></div><button onClick={()=>setActive('訂單中心')}>查看全部 <span>→</span></button></div>{tasks.map(([status,title,meta,tone])=><div className="task-row" key={title}><span className={`status-icon ${tone}`}>{tone==='urgent'?'!':tone==='pending'?'•':tone==='incoming'?'↓':'⇄'}</span><div><b>{title}</b><small>{meta}</small></div><span className={`tag ${tone}`}>{status}</span><button className="row-arrow" onClick={()=>show(`正在查看：${title}`)}>›</button></div>)}</article>
     <article className="panel orders"><div className="panel-head"><div><h2>今日訂單</h2><p>共 101 筆 · 較昨日 <span className="up">↑ 12.4%</span></p></div><button>近 7 天 ⌄</button></div><div className="order-total"><strong>101</strong><span>筆訂單</span></div><div className="bar"><i className="b1"/><i className="b2"/><i className="b3"/></div><div className="brand-orders"><div><span className="dot d1"/>TRAVO 玩一趟 <b>32</b></div><div><span className="dot d2"/>安鑫購物 <b>48</b></div><div><span className="dot d3"/>采采購物 <b>21</b></div></div></article></section>
    <section className="bottom-grid"><article className="panel movements"><div className="panel-head"><div><h2>最近庫存異動</h2><p>跨品牌、平台與倉庫的即時紀錄</p></div><button onClick={()=>setActive('庫存管理')}>完整紀錄 <span>→</span></button></div><div className="table-head"><span>時間</span><span>商品 / SKU</span><span>來源</span><span>異動類型</span><span>數量</span></div>{movements.map(([time,product,source,type,qty,tone])=><div className="movement" key={time}><span>{time}</span><span><b>{product}</b><small>SKU-{product.slice(0,2)}-{time.replace(':','')}</small></span><span>{source}</span><span><i className={`move-dot ${tone}`}/>{type}</span><strong className={qty.startsWith('+')?'positive':'negative'}>{qty}</strong></div>)}</article>
     <article className="panel warehouses"><div className="panel-head"><div><h2>倉庫狀況</h2><p>即時庫存與今日作業量</p></div><button>管理倉庫</button></div>{[['桃園總倉','主要出貨倉','4,826','78%'],['台北門市倉','門市 ＋ 線上下單','1,284','61%'],['台中倉','中南部出貨','936','45%']].map(([name,desc,count,fill],i)=><div className="warehouse" key={name}><div className={`warehouse-icon w${i}`}>⌂</div><div className="warehouse-info"><b>{name}</b><small>{desc}</small><div className="capacity"><i style={{width:fill}}/></div></div><div className="stock-count"><b>{count}</b><small>可用庫存</small></div></div>)}</article></section>
   </>}
  </main>{notice&&<div className="toast">✓　{notice}</div>}
 </div>
}
