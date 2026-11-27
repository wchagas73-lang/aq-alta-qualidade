let products = [];
const demoProducts = [
  {id:"demo-001",name:"Conjunto Fitness Essential",slug:"conjunto-fitness-essential",category:"Moda Fitness",price:189.90,compare_at_price:229.90,promo_ends_at:"2026-12-15T23:59:59-03:00",description:"Conjunto fitness demonstrativo, com proposta de conforto e liberdade de movimento. Produto, preço e disponibilidade fictícios para apresentação.",image_url:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=82",images:[],variants:[{name:"Tamanho",options:["P","M","G"]},{name:"Cor",options:["Preto","Grafite"]}],is_featured:true,is_hero_featured:true,hero_title:"Movimento com identidade.",hero_text:"Conheça a seleção fitness da AQ. Conteúdo e produto ilustrativos.",stock:12,type:"Destaques"},
  {id:"demo-002",name:"Perfume Signature",slug:"perfume-signature",category:"Perfumes",price:139.90,compare_at_price:179.90,promo_ends_at:"2026-12-15T23:59:59-03:00",description:"Fragrância demonstrativa para apresentar a página de produto e sua galeria.",image_url:"https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=82",images:[],variants:[],is_featured:true,is_hero_featured:true,hero_title:"Detalhes que deixam presença.",hero_text:"Uma vitrine para destacar lançamentos e escolhas da loja.",stock:8,type:"Destaques"},
  {id:"demo-003",name:"Whey Protein 900 g",slug:"whey-protein-900g",category:"Suplementos",price:119.90,compare_at_price:null,description:"Produto demonstrativo. Informações nutricionais, marca, composição e disponibilidade reais deverão ser cadastradas pela loja.",image_url:"https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=82",images:[],variants:[],is_featured:false,is_hero_featured:true,hero_title:"Sua rotina, seu ritmo.",hero_text:"Demonstração de banner promocional com produto em destaque.",stock:15,type:"Novidades"},
  {id:"demo-004",name:"Camisa Casual Premium",slug:"camisa-casual-premium",category:"Moda Casual e Social",price:119.90,compare_at_price:null,description:"Peça demonstrativa para mostrar detalhes, preço, seleção de tamanho e experiência de compra.",image_url:"https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=82",images:[],variants:[{name:"Tamanho",options:["P","M","G","GG"]},{name:"Cor",options:["Preto","Branco"]}],is_featured:false,is_hero_featured:false,stock:10,type:"Novidades"},
  {id:"demo-005",name:"Relógio Minimal",slug:"relogio-minimal",category:"Acessórios",price:99.90,compare_at_price:null,description:"Acessório ilustrativo para apresentar a vitrine e o carrinho.",image_url:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",images:[],variants:[],is_featured:false,is_hero_featured:false,stock:6,type:"Novidades"},
  {id:"demo-006",name:"Tênis Urban",slug:"tenis-urban",category:"Bem-estar",price:219.90,compare_at_price:null,description:"Imagem e produto demonstrativos. Cadastro comercial oficial será fornecido pela loja.",image_url:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82",images:[],variants:[{name:"Tamanho",options:["38","39","40","41","42"]}],is_featured:false,is_hero_featured:false,stock:9,type:"Novidades"}
];
function useDemoCatalog(){products=demoProducts.map(product=>({...product}));realCatalogConnected=false;renderProducts();renderCart();}
function readStoredArray(key){
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
const cart = new Map(readStoredArray("aq-cart")
  .filter(entry => Array.isArray(entry) && entry.length === 2 && !/^\\d+$/.test(String(entry[0])) && Number.isInteger(Number(entry[1])) && Number(entry[1]) > 0)
  .map(([id,qty]) => [String(id),Number(qty)]));
const wishlist = new Set(readStoredArray("aq-wishlist")
  .filter(id => !/^\\d+$/.test(String(id)) && (typeof id === "string" || typeof id === "number"))
  .map(String));
const money = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const cartProductId = key => String(key).split("::")[0];
const cartVariantLabel = key => {try{return JSON.parse(decodeURIComponent(String(key).split("::")[1]||"{}"));}catch{return {};}};
const grid = document.getElementById("productGrid");
const toast = document.getElementById("toast");
let activeFilter = "Todos";
let realCatalogConnected = false;
let searchTerm = "";
let showingWishlist = false;
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2300)}
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function safeImageURL(value){
  try {
    const url = new URL(String(value || ""), window.location.origin);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}
function productCardMarkup(p, spotlight = "") {
  const id=escapeHTML(p.id),name=escapeHTML(p.name),category=escapeHTML(p.category);
  const image=safeImageURL(p.image_url);
  const onSale=Number(p.compare_at_price)>Number(p.price);
  const discount=onSale?Math.round((1-(Number(p.price)/Number(p.compare_at_price)))*100):0;
  const label=onSale?"OFERTA":"AQ";
  const shortDescription=String(p.description||"").trim();
  const compactDescription=shortDescription.length>92?shortDescription.slice(0,89).trimEnd()+"…":shortDescription;
  const variants=(Array.isArray(p.variants)?p.variants:[]).filter(v=>v&&typeof v==="object"&&Array.isArray(v.options)&&v.options.length);
  const variantsMarkup=variants.map(variant=>{
    const variantName=String(variant.name||"Opções");
    const options=variant.options.filter(option=>option!==null&&option!==undefined&&String(option).trim());
    if(!options.length)return "";
    return `<div class="product-variant-group"><span class="product-variant-label">${escapeHTML(variantName)}</span><div class="product-variant-options">${options.map(option=>`<button type="button" class="variant-option" data-variant-name="${escapeHTML(variantName)}" data-variant-option="${escapeHTML(option)}" aria-pressed="false">${escapeHTML(option)}</button>`).join("")}</div></div>`;
  }).join("");
  const unavailable=realCatalogConnected&&Number(p.stock)<=0;
  return `<article class="product-card ${spotlight==="promo"?"product-card-promo":""}" data-product-card="${id}">
    <div class="product-image"><span class="product-placeholder">${image?`<img src="${escapeHTML(image)}" alt="${name}" loading="lazy" decoding="async">`:"AQ"}</span>
    <span class="product-tag ${onSale?"product-tag-sale":""}">${label}</span>
    ${onSale?`<span class="discount-badge">-${discount}%</span>`:""}
    <button class="heart ${wishlist.has(String(p.id))?"active":""}" data-wish="${id}" aria-label="Favoritar ${name}" aria-pressed="${wishlist.has(String(p.id))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></button></div>
    <div class="product-info"><span class="product-category">${category}</span><h3>${name}</h3>
    <div class="product-price-line">${onSale?`<del>${money(Number(p.compare_at_price))}</del>`:""}<strong class="product-price ${onSale?"sale-price":""}">${money(Number(p.price)||0)}</strong></div>
    ${compactDescription?`<p class="product-short-description">${escapeHTML(compactDescription)}</p>`:""}
    ${variantsMarkup? `<div class="product-variants">${variantsMarkup}</div>`:""}
    ${onSale&&p.promo_ends_at&&new Date(p.promo_ends_at).getTime()>Date.now()?`<div class="promo-countdown" data-countdown="${escapeHTML(p.promo_ends_at)}"><span class="promo-countdown-label">Oferta termina em</span><time>Calculando...</time></div>`:""}
    ${realCatalogConnected?`<span class="stock-alert">${unavailable?"Indisponível":`Em estoque: ${Number(p.stock)}`}</span>`:`<span class="stock-alert">Demonstração</span><small>Valor e estoque ilustrativos</small>`}
    <button class="add-cart product-add-button" type="button" ${unavailable?"disabled":""} data-add="${id}">${unavailable?"Indisponível":"Adicionar ao carrinho"}</button></div></article>`;
}
function renderHeroCarousel(){
  const root=document.getElementById("heroSlides");
  if(!root)return;
  const slides=products.filter(p=>p.is_hero_featured && p.image_url);
  if(!slides.length){
    root.innerHTML=`<article class="hero-slide hero-slide-default is-active">
      <div class="hero-copy"><span class="eyebrow">AQ ALTA QUALIDADE · JUIZ DE FORA</span><h1>Seu estilo.<br><em>Suas escolhas.</em></h1>
      <p>Moda, beleza, bem-estar e acessórios reunidos em uma experiência de compra simples e elegante.</p>
      <div class="hero-actions"><a class="gold-button" href="#destaques">Explorar produtos <span aria-hidden="true">↗</span></a><a class="hero-secondary-link" href="#categorias">Conhecer categorias</a></div></div>
      <div class="hero-side-note" aria-hidden="true"><span>CURADORIA AQ</span><strong>ALTA<br>QUALIDADE</strong><i></i><small>MODA · BELEZA · BEM-ESTAR</small></div>
      <div class="hero-bottom"><span>JUIZ DE FORA · MG</span><span>UMA SELEÇÃO PARA O SEU DIA A DIA</span></div></article>`;
    document.getElementById("heroPrev").hidden=true;document.getElementById("heroNext").hidden=true;document.getElementById("heroDots").hidden=true;return;
  }
  const mediaMarkup=(p,index)=>{
    const url=safeImageURL(p.image_url),isVideo=/\.(mp4|webm|ogv|ogg)(?:[?#]|$)/i.test(String(p.image_url||""));
    if(isVideo){
      const ext=(String(p.image_url).match(/\.(mp4|webm|ogv|ogg)(?:[?#]|$)/i)||[])[1]?.toLowerCase();
      const mime=ext==="webm"?"video/webm":ext==="ogv"||ext==="ogg"?"video/ogg":"video/mp4";
      return {isVideo:true,markup:`<video class="hero-slide-product-image hero-slide-banner-video" muted playsinline autoplay preload="metadata" aria-label="${escapeHTML(p.name)}"><source src="${escapeHTML(url)}" type="${mime}"></video>`};
    }
    return {isVideo:false,markup:`<img class="hero-slide-product-image" src="${escapeHTML(url)}" alt="${escapeHTML(p.name)}" fetchpriority="${index===0?"high":"low"}" loading="${index===0?"eager":"lazy"}">`};
  };
  root.innerHTML=slides.map((p,index)=>{
    const name=escapeHTML(p.name),description=escapeHTML(p.hero_text || p.description || "Conheça este produto da Alta Qualidade JF.");
    const sale=Number(p.compare_at_price)>Number(p.price),media=mediaMarkup(p,index);
    const timer=sale&&p.promo_ends_at&&new Date(p.promo_ends_at).getTime()>Date.now()?'<div class="promo-countdown" data-countdown="'+escapeHTML(p.promo_ends_at)+'"><span class="promo-countdown-label">Termina em</span><time>Calculando...</time></div>':"";
    return `<article class="hero-slide hero-slide-product ${media.isVideo?"hero-slide-video":"hero-slide-image"} ${index===0?"is-active":""}" aria-hidden="${index!==0}">
      ${media.markup}
      <div class="hero-media-label">${sale?"OFERTA AQ":"ALTA QUALIDADE"}</div>
      <div class="hero-product-panel"><strong>${name}</strong><small class="hero-product-description">${description}</small><div class="hero-media-price">${sale&&p.compare_at_price?'<del>'+money(p.compare_at_price)+'</del>':""}<b>${money(p.price)}</b></div>${timer}<a href="#destaques" data-hero-product="${escapeHTML(p.id)}">Ver produto ↗</a></div>
      <div class="hero-bottom"><span>AQ ALTA QUALIDADE</span><span>${media.isVideo?"VÍDEO":"VITRINE DA LOJA"}</span></div></article>`;
  }).join("")+(realCatalogConnected?"":`<article class="hero-slide hero-slide-video" aria-hidden="true"><video class="hero-slide-product-image hero-slide-banner-video" muted playsinline autoplay preload="metadata" poster="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=82"><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">Seu navegador não consegue reproduzir este vídeo.</video><div class="hero-media-label">VÍDEO ILUSTRATIVO</div><div class="hero-product-panel"><strong>Conjunto Fitness Essential</strong><small class="hero-product-description">Oferta demonstrativa da vitrine AQ.</small><div class="hero-media-price"><del>R$ 229,90</del><b>R$ 189,90</b></div><a href="#ofertas">Ver promoções ↗</a></div><div class="hero-bottom"><span>AQ ALTA QUALIDADE</span><span>VÍDEO</span></div></article>`);
  const dots=document.getElementById("heroDots"),allSlides=[...root.querySelectorAll(".hero-slide")],totalSlides=allSlides.length;
  dots.hidden=totalSlides<2;
  dots.innerHTML=Array.from({length:totalSlides},(_,i)=>'<button class="hero-dot" type="button" data-hero-dot="'+i+'" aria-label="Ir para banner '+(i+1)+'" aria-current="'+(i===0)+'"></button>').join("");
  document.getElementById("heroPrev").hidden=totalSlides<2;document.getElementById("heroNext").hidden=totalSlides<2;
  let current=0,timer=null;
  const clearTimer=()=>{if(timer){clearTimeout(timer);timer=null;}};
  const stopVideo=slide=>{const video=slide?.querySelector("video");if(video){video.pause();try{video.currentTime=0;}catch{}}};
  const scheduleCurrent=()=>{
    clearTimer();
    const active=allSlides[current],video=active?.querySelector("video");
    if(video){
      video.onended=()=>{if(allSlides[current]===active)show(current+1);};
      video.onerror=()=>{if(allSlides[current]===active)show(current+1);};
      const play=video.play();
      if(play&&typeof play.catch==="function")play.catch(()=>{});
    }else if(active?.querySelector("img")){
      timer=setTimeout(()=>show(current+1),7000);
    }
  };
  function show(next){
    clearTimer();
    stopVideo(allSlides[current]);
    current=(next+totalSlides)%totalSlides;
    allSlides.forEach((slide,i)=>{slide.classList.toggle("is-active",i===current);slide.setAttribute("aria-hidden",String(i!==current));});
    dots.querySelectorAll(".hero-dot").forEach((dot,i)=>dot.setAttribute("aria-current",String(i===current)));
    scheduleCurrent();
  }
  document.getElementById("heroPrev").onclick=()=>show(current-1);
  document.getElementById("heroNext").onclick=()=>show(current+1);
  dots.onclick=e=>{const dot=e.target.closest("[data-hero-dot]");if(dot)show(Number(dot.dataset.heroDot));};
  root.querySelectorAll("[data-hero-product]").forEach(link=>link.addEventListener("click",e=>{e.preventDefault();openProductDetail(link.dataset.heroProduct);}));
  let startX=null;root.onpointerdown=e=>{startX=e.clientX;};root.onpointerup=e=>{if(startX===null)return;const delta=e.clientX-startX;startX=null;if(Math.abs(delta)>45)show(current+(delta<0?1:-1));};root.onpointercancel=()=>{startX=null;};
  scheduleCurrent();
}
function updatePromoCountdowns(){
  const now=Date.now();document.querySelectorAll("[data-countdown]").forEach(node=>{
    const end=new Date(node.dataset.countdown).getTime(),output=node.querySelector("time");
    if(!Number.isFinite(end)||end<=now){node.remove();return;}
    const seconds=Math.floor((end-now)/1000),days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),secs=seconds%60;
    if(output)output.textContent=days>0?`${days}d ${String(hours).padStart(2,"0")}h ${String(minutes).padStart(2,"0")}m`:`${String(hours).padStart(2,"0")}h ${String(minutes).padStart(2,"0")}m ${String(secs).padStart(2,"0")}s`;
  });
}
if(!window.aqCountdownTicker)window.aqCountdownTicker=setInterval(updatePromoCountdowns,1000);
function renderSpotlights(){
  const promotions=products.filter(p=>Number(p.compare_at_price)>Number(p.price));
  const offersSection=document.getElementById("ofertas");
  if(offersSection){offersSection.hidden=!promotions.length;document.getElementById("promotionGrid").innerHTML=promotions.map(p=>productCardMarkup(p,"promo")).join("");}
}
function renderProducts(){
  const visible=products.filter(p=>(!showingWishlist||wishlist.has(String(p.id)))&&(activeFilter==="Todos"||(activeFilter==="Promoções"?Number(p.compare_at_price)>Number(p.price):p.type===activeFilter))&&(!searchTerm||[p.name,p.category].join(" ").toLowerCase().includes(searchTerm)));
  grid.innerHTML=visible.length?visible.map(p=>productCardMarkup(p)).join(""):showingWishlist?'<div class="catalog-empty"><span class="eyebrow">AQ / FAVORITOS</span><h3>Sua lista está vazia</h3><p>Marque os produtos com o coração para guardá-los nesta lista.</p></div>':'<div class="catalog-empty"><span class="eyebrow">AQ / CATÁLOGO</span><h3>Produtos em preparação</h3><p>Os produtos serão apresentados aqui assim que o catálogo oficial for cadastrado.</p></div>';
  renderSpotlights();
  renderHeroCarousel();
  updatePromoCountdowns();
}
function renderCart(){
  const count=[...cart.values()].reduce((a,b)=>a+b,0);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("wishCount").textContent=wishlist.size;
  const lines=[...cart.entries()];
  document.getElementById("cartItems").innerHTML=lines.length?lines.map(([id,qty])=>{const p=products.find(x=>String(x.id)===cartProductId(id));if(!p)return "";const safeId=escapeHTML(id);const chosen=cartVariantLabel(id);const chosenText=Object.entries(chosen).map(([k,v])=>`${k}: ${v}`).join(" · ");return `<div class="cart-line"><div><strong>${escapeHTML(p.name)}</strong><small>${chosenText?escapeHTML(chosenText)+" · ":""}${money(Number(p.price)||0)} cada</small></div><div class="qty-controls"><button data-dec="${safeId}" aria-label="Diminuir quantidade de ${escapeHTML(p.name)}">−</button><span>${qty}</span><button data-inc="${safeId}" aria-label="Aumentar quantidade de ${escapeHTML(p.name)}">+</button></div></div>`}).join(""):'<p class="empty-cart">Seu carrinho está vazio.</p>';
  const subtotal=lines.reduce((sum,[id,qty])=>{const p=products.find(x=>String(x.id)===cartProductId(id));return sum+(p?p.price*qty:0)},0);document.getElementById("cartSubtotal").textContent=money(subtotal);localStorage.setItem("aq-cart",JSON.stringify([...cart]));localStorage.setItem("aq-wishlist",JSON.stringify([...wishlist]));
}
document.addEventListener("click",e=>{
  const option=e.target.closest("[data-variant-option]");
  if(option){
    const group=option.closest(".product-variant-group");
    group?.querySelectorAll("[data-variant-option]").forEach(button=>{
      const active=button===option;
      button.classList.toggle("is-selected",active);
      button.setAttribute("aria-pressed",String(active));
    });
    return;
  }
  const add=e.target.closest("[data-add]");
  const wish=e.target.closest("[data-wish]");
  if(add){
    const id=String(add.dataset.add),product=products.find(p=>String(p.id)===id);
    if(!product)return;
    if(realCatalogConnected&&Number(product.stock)<=0){notify("Produto indisponível no momento.");return;}
    const card=add.closest("[data-product-card]");
    const selections={};
    let incomplete=false;
    (Array.isArray(product.variants)?product.variants:[]).filter(v=>v&&typeof v==="object"&&Array.isArray(v.options)&&v.options.length).forEach(variant=>{
      const group=[...(card?.querySelectorAll(".product-variant-group")||[])].find(el=>el.querySelector("[data-variant-name]")?.dataset.variantName===String(variant.name||"Opções"));
      const selected=group?.querySelector(".variant-option.is-selected");
      if(!selected)incomplete=true;
      else selections[String(variant.name||"Opções")]=selected.dataset.variantOption;
    });
    if(incomplete){notify("Escolha as opções disponíveis antes de adicionar.");return;}
    const variantKey=Object.keys(selections).length?"::"+encodeURIComponent(JSON.stringify(selections)):"";
    const cartId=id+variantKey;
    const totalForProduct=[...cart.entries()].filter(([key])=>cartProductId(key)===id).reduce((sum,[,qty])=>sum+qty,0)+1;
    if(realCatalogConnected&&totalForProduct>Number(product.stock)){notify("Quantidade disponível em estoque atingida.");return;}
    cart.set(cartId,(cart.get(cartId)||0)+1);renderCart();notify("Produto adicionado ao carrinho.");openCart();return;
  }
  if(wish){const id=String(wish.dataset.wish);wishlist.has(id)?wishlist.delete(id):wishlist.add(id);renderProducts();renderCart();}
});
document.addEventListener("click",e=>{
  const inc=e.target.closest("[data-inc]"),dec=e.target.closest("[data-dec]");
  if(inc){const id=inc.dataset.inc;const product=products.find(p=>String(p.id)===cartProductId(id));const next=(cart.get(id)||0)+1;if(realCatalogConnected&&product&&next>product.stock){notify("Quantidade disponível em estoque atingida.");return;}cart.set(id,next);renderCart();}
  if(dec){const id=dec.dataset.dec,n=(cart.get(id)||0)-1;n<=0?cart.delete(id):cart.set(id,n);renderCart();}
});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{showingWishlist=false;document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");activeFilter=btn.dataset.filter;renderProducts()}));
document.querySelectorAll("[data-category]").forEach(btn=>btn.addEventListener("click",()=>{showingWishlist=false;activeFilter="Todos";document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));searchTerm=btn.dataset.category.toLowerCase();document.getElementById("searchInput").value=btn.dataset.category;document.getElementById("searchPanel").classList.add("open");document.getElementById("destaques").scrollIntoView();renderProducts();}));
document.getElementById("searchToggle").addEventListener("click",()=>document.getElementById("searchPanel").classList.toggle("open"));
document.getElementById("searchClear").addEventListener("click",()=>{document.getElementById("searchPanel").classList.remove("open");document.getElementById("searchInput").value="";searchTerm="";renderProducts()});
document.getElementById("searchInput").addEventListener("input",e=>{showingWishlist=false;searchTerm=e.target.value.trim().toLowerCase();activeFilter="Todos";document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));renderProducts()});
const drawer=document.getElementById("cartDrawer"),backdrop=document.getElementById("drawerBackdrop");
function openCart(){drawer.classList.add("open");backdrop.classList.add("open")}
function closeCart(){drawer.classList.remove("open");backdrop.classList.remove("open")}
document.getElementById("cartToggle").addEventListener("click",openCart);
document.getElementById("cartClose").addEventListener("click",closeCart);
backdrop.addEventListener("click",closeCart);
const checkoutBtn=document.getElementById("checkoutBtn");
checkoutBtn.addEventListener("click",()=>notify("A finalização será habilitada quando pagamentos e entregas estiverem configurados."));

document.getElementById("wishlistToggle").addEventListener("click",()=>{showingWishlist=!showingWishlist;activeFilter="Todos";searchTerm="";document.getElementById("searchInput").value="";document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));renderProducts();document.getElementById("destaques").scrollIntoView({behavior:"smooth"});notify(showingWishlist?"Exibindo seus favoritos.":"Exibindo todos os produtos.")});
document.getElementById("menuToggle").addEventListener("click",()=>{const nav=document.getElementById("mainNav");nav.classList.toggle("open");document.getElementById("menuToggle").setAttribute("aria-expanded",nav.classList.contains("open"))});
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));

const detailOverlay=document.getElementById("productDetailOverlay");
let activeDetailProduct=null;
function openProductDetail(id,updateUrl=true){
  const product=products.find(p=>String(p.id)===String(id));
  if(!product)return;
  activeDetailProduct=product;
  const slug=product.slug || String(product.name||"produto").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  if(updateUrl){const url=new URL(window.location.href);url.searchParams.set("produto",slug);history.pushState({aqProduct:slug},"",url);}
  document.getElementById("detailCategory").textContent=product.category||"AQ ALTA QUALIDADE";
  document.getElementById("detailName").textContent=product.name;
  document.getElementById("detailPrice").textContent=money(Number(product.price)||0);
  const compare=document.getElementById("detailCompare");
  compare.hidden=!(product.compare_at_price>product.price);
  compare.textContent=compare.hidden?"":money(product.compare_at_price);
  document.getElementById("detailStock").textContent=realCatalogConnected?(product.stock>0?("Disponibilidade: "+product.stock+" unidade(s)"):"Produto indisponível"):"Produto demonstrativo. Estoque não confirmado.";
  document.getElementById("detailDescription").textContent=product.description || (realCatalogConnected?"Descrição não informada pelo cadastro.":"Descrição oficial será adicionada quando o catálogo real for cadastrado.");
  const variantBox=document.getElementById("detailVariants");variantBox.replaceChildren();
  (product.variants||[]).forEach(variant=>{
    if(!variant||typeof variant!=="object")return;
    const group=document.createElement("div");group.className="detail-variant-group";
    const heading=document.createElement("strong");heading.textContent=String(variant.name||"Opções");
    const values=document.createElement("div");values.className="detail-variant-options";
    const select=document.createElement("select");select.className="detail-variant-select";select.dataset.variantName=String(variant.name||"Opções");
    const prompt=document.createElement("option");prompt.value="";prompt.textContent="Selecione";prompt.selected=true;select.appendChild(prompt);
    (Array.isArray(variant.options)?variant.options:[]).forEach(option=>{const choice=document.createElement("option");choice.value=String(option);choice.textContent=String(option);select.appendChild(choice);});
    values.appendChild(select);group.append(heading,values);variantBox.appendChild(group);
  });
  variantBox.hidden=!variantBox.childElementCount;
  const gallery=document.getElementById("detailGallery");gallery.replaceChildren();
  const imageUrls=[product.image_url,...(product.images||[]).map(item=>typeof item==="string"?item:item?.url)].map(safeImageURL).filter(Boolean);
  if(imageUrls.length){imageUrls.forEach((src,index)=>{const img=document.createElement("img");img.src=src;img.alt=product.name+" imagem "+(index+1);img.loading=index?"lazy":"eager";gallery.appendChild(img);});}
  else{const placeholder=document.createElement("div");placeholder.className="detail-placeholder";placeholder.textContent="AQ";gallery.appendChild(placeholder);}
  document.getElementById("detailAdd").disabled=realCatalogConnected&&product.stock<=0;
  document.getElementById("detailDemo").hidden=realCatalogConnected;
  detailOverlay.classList.add("open");detailOverlay.setAttribute("aria-hidden","false");document.body.classList.add("detail-open");
}
function closeProductDetail(updateUrl=true){
  detailOverlay.classList.remove("open");detailOverlay.setAttribute("aria-hidden","true");document.body.classList.remove("detail-open");activeDetailProduct=null;
  if(updateUrl&&new URL(window.location.href).searchParams.has("produto")){const url=new URL(window.location.href);url.searchParams.delete("produto");history.replaceState({},"",url);}
}
document.getElementById("detailClose").addEventListener("click",()=>closeProductDetail());
detailOverlay.addEventListener("click",e=>{if(e.target===detailOverlay)closeProductDetail();});
document.getElementById("detailAdd").addEventListener("click",()=>{
  if(!activeDetailProduct)return;
  if(realCatalogConnected&&activeDetailProduct.stock<=0){notify("Produto indisponível no momento.");return;}
  const selections={};let incomplete=false;
  document.querySelectorAll("#detailVariants select").forEach(select=>{if(!select.value)incomplete=true;else selections[select.dataset.variantName]=select.value;});
  if(incomplete){notify("Selecione todas as opções do produto.");return;}
  const baseId=String(activeDetailProduct.id),variantKey=Object.keys(selections).length?"::"+encodeURIComponent(JSON.stringify(selections)):"",id=baseId+variantKey,next=(cart.get(id)||0)+1;
  const totalForProduct=[...cart.entries()].filter(([key])=>cartProductId(key)===baseId).reduce((sum,[,qty])=>sum+qty,0)+1;
  if(realCatalogConnected&&totalForProduct>activeDetailProduct.stock){notify("Quantidade disponível em estoque atingida.");return;}
  cart.set(id,next);renderCart();closeProductDetail();notify("Produto adicionado ao carrinho.");openCart();
});
window.addEventListener("popstate",()=>{
  const slug=new URL(window.location.href).searchParams.get("produto");
  if(!slug){if(detailOverlay.classList.contains("open"))closeProductDetail(false);return;}
  const product=products.find(p=>(p.slug||"")===slug);if(product)openProductDetail(product.id,false);
});

document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();
if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll(".section,.benefits,.promo-band,.category-card").forEach(el=>{el.classList.add("reveal");observer.observe(el)})}

async function loadAQCatalog() {
  const config = window.AQ_SUPABASE_CONFIG || {};
  if (!config.url || !config.publishableKey || !window.supabase?.createClient) { useDemoCatalog(); return; }
  try {
    const client = window.supabase.createClient(config.url, config.publishableKey);
    const [{data:items,error:productsError},{data:cats,error:categoriesError}] = await Promise.all([
      client.from("products").select("id,name,slug,description,sku,price,compare_at_price,promo_ends_at,stock_quantity,image_url,images,variants,is_featured,is_hero_featured,hero_title,hero_text,is_active,categories(name)").eq("is_active",true).order("created_at",{ascending:false}),
      client.from("categories").select("id,name,is_active").eq("is_active",true).order("sort_order")
    ]);
    if (productsError) throw productsError;
    if (categoriesError) throw categoriesError;
    realCatalogConnected = true;
    products = (items || []).map(p => {
      const expiredPromotion = Boolean(p.promo_ends_at && new Date(p.promo_ends_at).getTime() <= Date.now());
      const effectivePrice = expiredPromotion && p.compare_at_price != null ? Number(p.compare_at_price) : Number(p.price);
      const activeComparePrice = expiredPromotion ? null : (p.compare_at_price==null?null:Number(p.compare_at_price));
      return {
        id:p.id,name:p.name,slug:p.slug,description:p.description || "",sku:p.sku || "",category:p.categories?.name || "Outros",price:effectivePrice,compare_at_price:activeComparePrice,promo_ends_at:expiredPromotion?null:(p.promo_ends_at || null),hero_title:p.hero_title || "",hero_text:p.hero_text || "",is_hero_featured:Boolean(p.is_hero_featured),
        tag:activeComparePrice!=null&&activeComparePrice>effectivePrice?"OFERTA":p.is_featured?"DESTAQUE":"AQ",type:p.is_featured?"Destaques":"Novidades",is_featured:Boolean(p.is_featured),
        stock:Number(p.stock_quantity),image_url:p.image_url || null,images:Array.isArray(p.images)?p.images:[],variants:Array.isArray(p.variants)?p.variants:[]
      };
    });
    const validIds = new Set(products.map(p => String(p.id)));
    // Carrinhos podem armazenar a variante no sufixo "::..."; validar pelo ID base.
    for (const id of [...cart.keys()]) if (!validIds.has(cartProductId(id))) cart.delete(id);
    for (const id of [...wishlist]) if (!validIds.has(String(id))) wishlist.delete(id);
    if (!products.length) useDemoCatalog();
    else renderProducts();
    if (cats?.length) {
      const categoryGrid = document.querySelector(".category-grid");
      document.querySelectorAll("[data-category]").forEach(card => {
        const exists = cats.some(c => c.name === card.dataset.category);
        card.hidden = !exists;
      });
      cats.filter(c => ![...document.querySelectorAll("[data-category]")].some(card => card.dataset.category === c.name)).forEach((c,i) => {
        const card = document.createElement("button");
        card.className = "category-card";
        card.dataset.category = c.name;
        const label = document.createElement("span"); label.textContent = "AQ / CATEGORIA";
        const title = document.createElement("strong"); title.textContent = c.name;
        const arrow = document.createElement("i"); arrow.textContent = "↗";
        card.append(label,title,arrow);
        card.addEventListener("click", () => {
          showingWishlist = false;
          activeFilter = "Todos";
          document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active",x.dataset.filter==="Todos"));
          searchTerm = c.name.toLowerCase();
          document.getElementById("searchInput").value = c.name;
          document.getElementById("searchPanel").classList.add("open");
          document.getElementById("destaques").scrollIntoView();
          renderProducts();
        });
        categoryGrid.appendChild(card);
      });
    }
    renderCart();
    document.querySelector(".demo-note")?.remove();
    window.dispatchEvent(new Event("aq:catalog-ready"));
  } catch (error) {
    console.error("AQ catalog connection:",error);
  }
}
loadAQCatalog();
const requestedProduct=new URL(window.location.href).searchParams.get("produto");
if(requestedProduct){
  const openRequested=()=>{const product=products.find(p=>(p.slug||"")===requestedProduct);if(product)openProductDetail(product.id,false);};
  openRequested();window.addEventListener("aq:catalog-ready",openRequested,{once:true});
}


function initReviewCarousel(){
  const viewport=document.querySelector(".reviews-window");
  const track=viewport?.querySelector(".reviews-track");
  if(!viewport||!track||viewport.dataset.carouselReady)return;
  viewport.dataset.carouselReady="true";
  let paused=false,dragging=false,startX=0,startScroll=0,frame=0;
  const tick=()=>{
    if(!paused&&!dragging&&viewport.scrollWidth>viewport.clientWidth){
      const loopPoint=track.scrollWidth/2;
      viewport.scrollLeft+=0.45;
      if(loopPoint>0&&viewport.scrollLeft>=loopPoint)viewport.scrollLeft=0;
    }
    frame=requestAnimationFrame(tick);
  };
  const pause=()=>{paused=true;};
  const resume=()=>{paused=false;};
  viewport.addEventListener("pointerdown",e=>{
    pause();
    if(e.pointerType==="mouse"){dragging=true;startX=e.clientX;startScroll=viewport.scrollLeft;viewport.classList.add("is-dragging");}
  });
  viewport.addEventListener("pointermove",e=>{if(dragging)viewport.scrollLeft=startScroll-(e.clientX-startX);});
  const release=()=>{dragging=false;viewport.classList.remove("is-dragging");resume();};
  viewport.addEventListener("pointerup",release);
  viewport.addEventListener("pointercancel",release);
  viewport.addEventListener("pointerleave",()=>{if(dragging)release();});
  viewport.addEventListener("touchstart",pause,{passive:true});
  viewport.addEventListener("touchend",resume,{passive:true});
  viewport.addEventListener("touchcancel",resume,{passive:true});
  viewport.addEventListener("mouseenter",pause);
  viewport.addEventListener("mouseleave",()=>{if(!dragging)resume();});
  viewport.addEventListener("focusin",pause);
  viewport.addEventListener("focusout",resume);
  frame=requestAnimationFrame(tick);
  window.addEventListener("pagehide",()=>cancelAnimationFrame(frame),{once:true});
}
initReviewCarousel();
