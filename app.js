const products = [
  {id:1,name:"Conjunto Performance",category:"Moda Fitness",price:129.90,tag:"DESTAQUE",type:"Destaques",symbol:"AQ"},
  {id:2,name:"Essência Intensa",category:"Perfumes",price:89.90,tag:"NOVIDADE",type:"Novidades",symbol:"✧"},
  {id:3,name:"Linha Energia",category:"Suplementos",price:99.90,tag:"DESTAQUE",type:"Destaques",symbol:"＋"},
  {id:4,name:"Camisa Urban",category:"Moda Casual e Social",price:119.90,tag:"NOVIDADE",type:"Novidades",symbol:"AQ"},
  {id:5,name:"Acessório Clássico",category:"Acessórios",price:59.90,tag:"SELEÇÃO AQ",type:"Destaques",symbol:"◇"},
  {id:6,name:"Kit Bem-estar",category:"Bem-estar",price:74.90,tag:"NOVIDADE",type:"Novidades",symbol:"♡"},
  {id:7,name:"Peça Essencial",category:"Moda Casual e Social",price:109.90,tag:"SELEÇÃO AQ",type:"Destaques",symbol:"AQ"},
  {id:8,name:"Coleção Movimento",category:"Moda Fitness",price:139.90,tag:"NOVIDADE",type:"Novidades",symbol:"✧"}
];
const cart = new Map();
const wishlist = new Set();
const money = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const grid = document.getElementById("productGrid");
const toast = document.getElementById("toast");
let activeFilter = "Todos";
let searchTerm = "";
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2300)}
function renderProducts(){
  const visible=products.filter(p=>(activeFilter==="Todos"||p.type===activeFilter)&&(!searchTerm||[p.name,p.category].join(" ").toLowerCase().includes(searchTerm)));
  grid.innerHTML=visible.length?visible.map(p=>`<article class="product-card"><div class="product-image"><span class="product-placeholder">${p.symbol}</span><span class="product-tag">${p.tag}</span><button class="heart ${wishlist.has(p.id)?"active":""}" data-wish="${p.id}" aria-label="Favoritar ${p.name}">${wishlist.has(p.id)?"♥":"♡"}</button></div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><div class="product-price">${money(p.price)}</div><small>Valor ilustrativo para demonstração</small><button class="add-cart" data-add="${p.id}">ADICIONAR À SACOLA +</button></div></article>`).join(""):'<p class="empty-cart">Nenhum item encontrado. Tente outra busca.</p>';
}
function renderCart(){
  const count=[...cart.values()].reduce((a,b)=>a+b,0);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("wishCount").textContent=wishlist.size;
  const lines=[...cart.entries()];
  document.getElementById("cartItems").innerHTML=lines.length?lines.map(([id,qty])=>{const p=products.find(x=>x.id===id);return `<div class="cart-line"><div><strong>${p.name}</strong><small>${money(p.price)} cada</small></div><div class="qty-controls"><button data-dec="${id}" aria-label="Diminuir">−</button><span>${qty}</span><button data-inc="${id}" aria-label="Aumentar">+</button></div></div>`}).join(""):'<p class="empty-cart">Sua sacola está vazia.</p>';
  document.getElementById("cartSubtotal").textContent=money(lines.reduce((sum,[id,qty])=>sum+products.find(p=>p.id===id).price*qty,0));
}
grid.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");const wish=e.target.closest("[data-wish]");
  if(add){const id=Number(add.dataset.add);cart.set(id,(cart.get(id)||0)+1);renderCart();notify("Produto adicionado à sacola.");}
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
document.getElementById("checkoutBtn").addEventListener("click",()=>notify("Checkout demonstrativo. Pagamentos serão integrados em uma próxima etapa."));
document.getElementById("wishlistToggle").addEventListener("click",()=>{activeFilter="Todos";searchTerm="";renderProducts();document.getElementById("destaques").scrollIntoView();notify(wishlist.size?wishlist.size+" produto(s) favoritado(s).":"Sua lista de favoritos está vazia.")});
document.getElementById("menuToggle").addEventListener("click",()=>{const nav=document.getElementById("mainNav");nav.classList.toggle("open");document.getElementById("menuToggle").setAttribute("aria-expanded",nav.classList.contains("open"))});
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();