let products = [];
const cart = new Map(JSON.parse(localStorage.getItem("aq-cart")||"[]").filter(([id])=>!/^\\d+$/.test(String(id))).map(([id,qty])=>[String(id),qty]));
const wishlist = new Set(JSON.parse(localStorage.getItem("aq-wishlist")||"[]").filter(id=>!/^\\d+$/.test(String(id))).map(String));
const money = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const cartProductId = key => String(key).split("::")[0];
const cartVariantLabel = key => {try{return JSON.parse(decodeURIComponent(String(key).split("::")[1]||"{}"));}catch{return {};}};
const grid = document.getElementById("productGrid");
const toast = document.getElementById("toast");
let activeFilter = "Todos";
let realCatalogConnected = false;
let searchTerm = "";
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
function renderProducts(){
  const visible=products.filter(p=>(activeFilter==="Todos"||p.type===activeFilter)&&(!searchTerm||[p.name,p.category].join(" ").toLowerCase().includes(searchTerm)));
  grid.innerHTML=visible.length?visible.map(p=>{
    const id=escapeHTML(p.id),name=escapeHTML(p.name),category=escapeHTML(p.category),tag=escapeHTML(p.tag);
    const image=safeImageURL(p.image_url);
    return `<article class="product-card" data-product-open="${id}"><div class="product-image"><span class="product-placeholder">${image?`<img src="${escapeHTML(image)}" alt="${name}" loading="lazy" decoding="async">`:"AQ"}</span><span class="product-tag">${tag}</span><button class="heart ${wishlist.has(String(p.id))?"active":""}" data-wish="${id}" aria-label="Favoritar ${name}" aria-pressed="${wishlist.has(String(p.id))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></button></div><div class="product-info"><span class="product-category">${category}</span><h3>${name}</h3><div class="product-price">${money(Number(p.price)||0)}</div>${realCatalogConnected?`<span class="stock-alert">${p.stock>0?`Em estoque: ${Number(p.stock)}`:"Indisponível"}</span>`:`<span class="stock-alert">Demonstração</span><small>Valor e estoque ilustrativos para demonstração</small>`}<div class="product-actions"><button class="detail-link" type="button" data-detail="${id}">Ver detalhes</button><button class="add-cart icon-add" ${realCatalogConnected&&p.stock<=0?"disabled":""} data-add="${id}" aria-label="Adicionar ${name}" title="Adicionar ao carrinho"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg></button></div></div></article>`
  }).join(""):'<div class="catalog-empty"><span class="eyebrow">AQ / CATÁLOGO</span><h3>Produtos em preparação</h3><p>Os produtos serão apresentados aqui assim que o catálogo oficial for cadastrado.</p></div>';
}
function renderCart(){
  const count=[...cart.values()].reduce((a,b)=>a+b,0);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("wishCount").textContent=wishlist.size;
  const lines=[...cart.entries()];
  document.getElementById("cartItems").innerHTML=lines.length?lines.map(([id,qty])=>{const p=products.find(x=>String(x.id)===cartProductId(id));if(!p)return "";const safeId=escapeHTML(id);const chosen=cartVariantLabel(id);const chosenText=Object.entries(chosen).map(([k,v])=>`${k}: ${v}`).join(" · ");return `<div class="cart-line"><div><strong>${escapeHTML(p.name)}</strong><small>${chosenText?escapeHTML(chosenText)+" · ":""}${money(Number(p.price)||0)} cada</small></div><div class="qty-controls"><button data-dec="${safeId}" aria-label="Diminuir quantidade de ${escapeHTML(p.name)}">−</button><span>${qty}</span><button data-inc="${safeId}" aria-label="Aumentar quantidade de ${escapeHTML(p.name)}">+</button></div></div>`}).join(""):'<p class="empty-cart">Seu carrinho está vazio.</p>';
  const subtotal=lines.reduce((sum,[id,qty])=>{const p=products.find(x=>String(x.id)===cartProductId(id));return sum+(p?p.price*qty:0)},0);document.getElementById("cartSubtotal").textContent=money(subtotal);localStorage.setItem("aq-cart",JSON.stringify([...cart]));localStorage.setItem("aq-wishlist",JSON.stringify([...wishlist]));
}
grid.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");const wish=e.target.closest("[data-wish]");const detail=e.target.closest("[data-detail]");const card=e.target.closest("[data-product-open]");
  if(detail){openProductDetail(detail.dataset.detail);return;}
  if(card&&!add&&!wish){openProductDetail(card.dataset.productOpen);return;}
  if(add){const id=add.dataset.add;const product=products.find(p=>String(p.id)===String(id));if(realCatalogConnected&&(!product||product.stock<=0)){notify("Produto indisponível no momento.");return;}cart.set(id,(cart.get(id)||0)+1);renderCart();notify("Produto adicionado ao carrinho.");openCart();}
  if(wish){const id=wish.dataset.wish;wishlist.has(id)?wishlist.delete(id):wishlist.add(id);renderProducts();renderCart();}
});
document.addEventListener("click",e=>{
  const inc=e.target.closest("[data-inc]"),dec=e.target.closest("[data-dec]");
  if(inc){const id=inc.dataset.inc;const product=products.find(p=>String(p.id)===cartProductId(id));const next=(cart.get(id)||0)+1;if(realCatalogConnected&&product&&next>product.stock){notify("Quantidade disponível em estoque atingida.");return;}cart.set(id,next);renderCart();}
  if(dec){const id=dec.dataset.dec,n=(cart.get(id)||0)-1;n<=0?cart.delete(id):cart.set(id,n);renderCart();}
});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");activeFilter=btn.dataset.filter;renderProducts()}));
document.querySelectorAll("[data-category]").forEach(btn=>btn.addEventListener("click",()=>{searchTerm=btn.dataset.category.toLowerCase();document.getElementById("searchInput").value=btn.dataset.category;document.getElementById("searchPanel").classList.add("open");document.getElementById("destaques").scrollIntoView();renderProducts();}));
document.getElementById("searchToggle").addEventListener("click",()=>document.getElementById("searchPanel").classList.toggle("open"));
document.getElementById("searchClear").addEventListener("click",()=>{document.getElementById("searchPanel").classList.remove("open");document.getElementById("searchInput").value="";searchTerm="";renderProducts()});
document.getElementById("searchInput").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();activeFilter="Todos";document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));renderProducts()});
const drawer=document.getElementById("cartDrawer"),backdrop=document.getElementById("drawerBackdrop");
function openCart(){drawer.classList.add("open");backdrop.classList.add("open")}
function closeCart(){drawer.classList.remove("open");backdrop.classList.remove("open")}
document.getElementById("cartToggle").addEventListener("click",openCart);
document.getElementById("cartClose").addEventListener("click",closeCart);
backdrop.addEventListener("click",closeCart);
const checkoutBtn=document.getElementById("checkoutBtn");
checkoutBtn.addEventListener("click",()=>notify("A finalização será habilitada quando pagamentos e entregas estiverem configurados."));

document.getElementById("wishlistToggle").addEventListener("click",()=>{activeFilter="Todos";searchTerm="";renderProducts();document.getElementById("destaques").scrollIntoView({behavior:"smooth"});notify(wishlist.size?wishlist.size+" produto(s) favoritado(s).":"Sua lista de favoritos está vazia.")});
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
  if(updateUrl&&new URL(window.location.href).searchParams.has("produto")){const url=new URL(window.location.href);url.searchParams.delete("produto");history.pushState({},"",url);}
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
  if (!config.url || !config.publishableKey || !window.supabase?.createClient) { renderProducts(); renderCart(); return; }
  try {
    const client = window.supabase.createClient(config.url, config.publishableKey);
    const [{data:items,error:productsError},{data:cats,error:categoriesError}] = await Promise.all([
      client.from("products").select("id,name,slug,description,sku,price,compare_at_price,stock_quantity,image_url,images,variants,is_featured,is_active,categories(name)").eq("is_active",true).order("created_at",{ascending:false}),
      client.from("categories").select("id,name,is_active").eq("is_active",true).order("sort_order")
    ]);
    if (productsError) throw productsError;
    if (categoriesError) throw categoriesError;
    realCatalogConnected = true;
    products = (items || []).map(p => ({
      id:p.id,name:p.name,slug:p.slug,description:p.description || "",sku:p.sku || "",category:p.categories?.name || "Outros",price:Number(p.price),compare_at_price:p.compare_at_price==null?null:Number(p.compare_at_price),
      tag:p.is_featured?"DESTAQUE":"AQ",type:p.is_featured?"Destaques":"Novidades",
      stock:Number(p.stock_quantity),image_url:p.image_url || null,images:Array.isArray(p.images)?p.images:[],variants:Array.isArray(p.variants)?p.variants:[]
    }));
    const validIds = new Set(products.map(p => String(p.id)));
    for (const id of [...cart.keys()]) if (!validIds.has(String(id))) cart.delete(id);
    for (const id of [...wishlist]) if (!validIds.has(String(id))) wishlist.delete(id);
    if (!products.length) renderProducts();
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
