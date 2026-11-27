const products = [
  {id:1,name:"Conjunto Performance",category:"Moda Fitness",price:129.90,tag:"DESTAQUE",type:"Destaques",symbol:"AQ",stock:5},
  {id:2,name:"Essência Intensa",category:"Perfumes",price:89.90,tag:"NOVIDADE",type:"Novidades",symbol:"✧",stock:4},
  {id:3,name:"Linha Energia",category:"Suplementos",price:99.90,tag:"DESTAQUE",type:"Destaques",symbol:"＋",stock:2},
  {id:4,name:"Camisa Urban",category:"Moda Casual e Social",price:119.90,tag:"NOVIDADE",type:"Novidades",symbol:"AQ",stock:7},
  {id:5,name:"Acessório Clássico",category:"Acessórios",price:59.90,tag:"SELEÇÃO AQ",type:"Destaques",symbol:"◇",stock:3},
  {id:6,name:"Kit Bem-estar",category:"Bem-estar",price:74.90,tag:"NOVIDADE",type:"Novidades",symbol:"♡",stock:6},
  {id:7,name:"Peça Essencial",category:"Moda Casual e Social",price:109.90,tag:"SELEÇÃO AQ",type:"Destaques",symbol:"AQ",stock:4},
  {id:8,name:"Coleção Movimento",category:"Moda Fitness",price:139.90,tag:"NOVIDADE",type:"Novidades",symbol:"✧",stock:2}
];
const cart = new Map(JSON.parse(localStorage.getItem("aq-cart")||"[]"));
const wishlist = new Set(JSON.parse(localStorage.getItem("aq-wishlist")||"[]"));
const money = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const grid = document.getElementById("productGrid");
const toast = document.getElementById("toast");
let activeFilter = "Todos";
let searchTerm = "";
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2300)}
function renderProducts(){
  const visible=products.filter(p=>(activeFilter==="Todos"||p.type===activeFilter)&&(!searchTerm||[p.name,p.category].join(" ").toLowerCase().includes(searchTerm)));
  grid.innerHTML=visible.length?visible.map(p=>`<article class="product-card"><div class="product-image"><span class="product-placeholder">AQ</span><span class="product-tag">${p.tag}</span><button class="heart ${wishlist.has(p.id)?"active":""}" data-wish="${p.id}" aria-label="Favoritar ${p.name}"><svg viewBox="0 0 24 24"><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></button></div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><div class="product-price">${money(p.price)}</div><span class="stock-alert">Restam só ${p.stock}</span><small>Valor e estoque ilustrativos para demonstração</small><button class="add-cart icon-add" data-add="${p.id}" aria-label="Adicionar ${p.name} ao carrinho" title="Adicionar ao carrinho"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg></button></div></article>`).join(""):'<p class="empty-cart">Nenhum item encontrado. Tente outra busca.</p>';
}
function renderCart(){
  const count=[...cart.values()].reduce((a,b)=>a+b,0);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("wishCount").textContent=wishlist.size;
  const lines=[...cart.entries()];
  document.getElementById("cartItems").innerHTML=lines.length?lines.map(([id,qty])=>{const p=products.find(x=>x.id===id);return `<div class="cart-line"><div><strong>${p.name}</strong><small>${money(p.price)} cada</small></div><div class="qty-controls"><button data-dec="${id}" aria-label="Diminuir">−</button><span>${qty}</span><button data-inc="${id}" aria-label="Aumentar">+</button></div></div>`}).join(""):'<p class="empty-cart">Seu carrinho está vazio.</p>';
  const subtotal=lines.reduce((sum,[id,qty])=>sum+products.find(p=>p.id===id).price*qty,0);document.getElementById("cartSubtotal").textContent=money(subtotal);localStorage.setItem("aq-cart",JSON.stringify([...cart]));localStorage.setItem("aq-wishlist",JSON.stringify([...wishlist]));
}
grid.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");const wish=e.target.closest("[data-wish]");
  if(add){const id=Number(add.dataset.add);cart.set(id,(cart.get(id)||0)+1);renderCart();notify("Produto adicionado ao carrinho.");openCart();}
  if(wish){const id=Number(wish.dataset.wish);wishlist.has(id)?wishlist.delete(id):wishlist.add(id);renderProducts();renderCart();}
});
document.addEventListener("click",e=>{
  const inc=e.target.closest("[data-inc]"),dec=e.target.closest("[data-dec]");
  if(inc){const id=Number(inc.dataset.inc);cart.set(id,(cart.get(id)||0)+1);renderCart();}
  if(dec){const id=Number(dec.dataset.dec),n=(cart.get(id)||0)-1;n<=0?cart.delete(id):cart.set(id,n);renderCart();}
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
const checkoutOverlay=document.getElementById("checkoutOverlay");
const checkoutForm=document.getElementById("checkoutForm");
function closeCheckout(){checkoutOverlay.classList.remove("open");checkoutOverlay.setAttribute("aria-hidden","true");}
document.getElementById("checkoutBtn").addEventListener("click",()=>{
  if(!cart.size){notify("Adicione pelo menos um produto para continuar.");return;}
  checkoutOverlay.classList.add("open");checkoutOverlay.setAttribute("aria-hidden","false");closeCart();
});
document.getElementById("checkoutClose").addEventListener("click",closeCheckout);
checkoutOverlay.addEventListener("click",e=>{if(e.target===checkoutOverlay)closeCheckout();});
checkoutForm.addEventListener("submit",e=>{
  e.preventDefault();
  if(!checkoutForm.reportValidity())return;
  const data=Object.fromEntries(new FormData(checkoutForm).entries());
  const address=[data.street+", "+data.number,data.complement,data.district,data.city+" / "+data.state,"CEP: "+data.postalCode].filter(Boolean).join("\\n");
  document.getElementById("checkoutCustomerSummary").textContent=data.name+"\\n"+data.email+"\\n"+data.phone+"\\n"+address;
  const orderLines=[...cart.entries()].map(([id,qty])=>{const p=products.find(x=>x.id===id);return p.name+" | "+qty+" x "+money(p.price)+" = "+money(p.price*qty);});
  const subtotal=[...cart.entries()].reduce((sum,[id,qty])=>sum+products.find(p=>p.id===id).price*qty,0);
  orderLines.push("Subtotal: "+money(subtotal));
  orderLines.push("Frete: a calcular após integração");
  document.getElementById("checkoutOrderSummary").textContent=orderLines.join("\\n");
  document.getElementById("customerStep").hidden=true;
  document.getElementById("reviewStep").hidden=false;
  document.getElementById("stepCustomer").classList.remove("active");
  document.getElementById("stepReview").classList.add("active");
});
document.getElementById("checkoutBack").addEventListener("click",()=>{
  document.getElementById("reviewStep").hidden=true;
  document.getElementById("customerStep").hidden=false;
  document.getElementById("stepReview").classList.remove("active");
  document.getElementById("stepCustomer").classList.add("active");
});
document.getElementById("checkoutPending").addEventListener("click",()=>notify("Dados revisados. A compra será habilitada após as integrações."));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&checkoutOverlay.classList.contains("open"))closeCheckout();});
document.getElementById("wishlistToggle").addEventListener("click",()=>{activeFilter="Todos";searchTerm="";renderProducts();document.getElementById("destaques").scrollIntoView({behavior:"smooth"});notify(wishlist.size?wishlist.size+" produto(s) favoritado(s).":"Sua lista de favoritos está vazia.")});
document.getElementById("menuToggle").addEventListener("click",()=>{const nav=document.getElementById("mainNav");nav.classList.toggle("open");document.getElementById("menuToggle").setAttribute("aria-expanded",nav.classList.contains("open"))});
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();
if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll(".section,.benefits,.promo-band,.category-card").forEach(el=>{el.classList.add("reveal");observer.observe(el)})}
