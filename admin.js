import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.AQ_SUPABASE_CONFIG || {};
const loginView = document.getElementById("loginView");
const adminApp = document.getElementById("adminApp");
const notice = document.getElementById("notice");
const dialog = document.getElementById("entityDialog");
const form = document.getElementById("entityForm");
const fields = document.getElementById("dialogFields");
let supabase = null;
let currentUser = null;
let activeRole = null;
let editingId = null;
let currentEntity = null;
let categoriesCache = [];

const $ = (id) => document.getElementById(id);
const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "Não definida";
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const statusNames = { pending:"Pendente", paid:"Pago", processing:"Em preparação", shipped:"Enviado", completed:"Concluído", cancelled:"Cancelado", approved:"Aprovado", rejected:"Recusado", refunded:"Estornado" };

function showNotice(message, error = false) {
  notice.textContent = message;
  notice.className = error ? "notice error" : "notice";
  notice.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function setLoginFeedback(message, error = true) {
  $("loginFeedback").textContent = message;
  $("loginFeedback").style.color = error ? "#e5a29a" : "#9bd1a7";
}
function setConnection(ok, label) {
  $("connectionDot").className = "connection-dot " + (ok ? "online" : "offline");
  $("connectionText").textContent = label;
}
function requireConfig() {
  if (!cfg.url || !cfg.publishableKey) {
    setConnection(false, "Supabase não configurado");
    setLoginFeedback("Aguardando a configuração do projeto Supabase do proprietário.", true);
    $("loginButton").disabled = true;
    return false;
  }
  supabase = createClient(cfg.url, cfg.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  $("loginButton").disabled = false;
  return true;
}
function setView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".nav-item").forEach(v => v.classList.toggle("active", v.dataset.view === name));
  const item = document.querySelector('.nav-item[data-view="' + name + '"]');
  $("viewTitle").textContent = item ? item.textContent.trim() : "Painel";
  $("sidebar").classList.remove("open");
  const loaders = { overview:loadOverview, products:loadProducts, categories:loadCategories, orders:loadOrders, coupons:loadCoupons, admins:loadAdmins, settings:loadSettings };
  if (loaders[name]) loaders[name]().catch(e => showNotice(e.message, true));
}
function roleCan(roles) {
  return activeRole === "owner" || activeRole === "manager" || roles.includes(activeRole);
}
async function verifyAdmin(user) {
  const { data, error } = await supabase.from("admin_users").select("role,is_active,full_name,email").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (!data || !data.is_active) throw new Error("Este usuário não está autorizado no painel. Solicite ao proprietário a liberação do seu acesso.");
  currentUser = user;
  activeRole = data.role;
  $("accountEmail").textContent = data.full_name || user.email;
  $("accountRole").textContent = data.role === "owner" ? "Proprietário" : "Administrador: " + data.role;
  loginView.hidden = true;
  adminApp.hidden = false;
  setConnection(true, "Supabase conectado");
  applyRoleAccess();
  setView("overview");
}
function applyRoleAccess() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    const v = btn.dataset.view;
    const allowed = v === "overview" || v === "products" && roleCan(["catalog"]) ||
      v === "categories" && roleCan(["catalog"]) ||
      v === "orders" && roleCan(["orders"]) ||
      v === "coupons" && roleCan([]) ||
      v === "admins" && activeRole === "owner" ||
      v === "settings" && roleCan([]);
    btn.hidden = !allowed;
  });
}
async function signIn(event) {
  event.preventDefault();
  if (!supabase) return;
  $("loginButton").disabled = true;
  setLoginFeedback("Validando acesso...", false);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    });
    if (error) throw error;
    await verifyAdmin(data.user);
    setLoginFeedback("", false);
  } catch (e) {
    setLoginFeedback(e.message || "Não foi possível entrar.");
    await supabase.auth.signOut();
  } finally {
    $("loginButton").disabled = false;
  }
}
async function signOut() {
  if (supabase) await supabase.auth.signOut();
  currentUser = null;
  activeRole = null;
  adminApp.hidden = true;
  loginView.hidden = false;
  $("loginPassword").value = "";
  setConnection(false, "Sessão encerrada");
}
async function loadOverview() {
  const canOrders = roleCan(["orders"]);
  const canCatalog = roleCan(["catalog"]);
  const [orders, products] = await Promise.all([
    canOrders ? supabase.from("orders").select("id,order_number,customer_name,created_at,order_status,total").order("created_at", { ascending:false }).limit(8) : Promise.resolve({data:[],error:null}),
    canCatalog ? supabase.from("products").select("id,stock_quantity,low_stock_threshold,is_active") : Promise.resolve({data:[],error:null})
  ]);
  if (orders.error) throw orders.error;
  if (products.error) throw products.error;
  const allOrders = orders.data || [];
  const allProducts = products.data || [];
  $("metricOrders").textContent = allOrders.length;
  const revenue = allOrders.filter(o => o.order_status !== "cancelled").reduce((s,o) => s + Number(o.total || 0), 0);
  $("metricRevenue").textContent = money(revenue);
  $("metricProducts").textContent = allProducts.filter(p => p.is_active).length;
  $("metricLowStock").textContent = allProducts.filter(p => p.is_active && Number(p.stock_quantity) <= Number(p.low_stock_threshold)).length;
  $("recentOrders").innerHTML = allOrders.length ? allOrders.map(o => `<tr><td>#${esc(o.order_number)}</td><td>${esc(o.customer_name)}</td><td>${date(o.created_at)}</td><td><span class="status-pill ${o.order_status === "cancelled" ? "bad" : ""}">${statusNames[o.order_status] || esc(o.order_status)}</span></td><td>${money(o.total)}</td></tr>`).join("") : '<tr><td colspan="5" class="empty-cell">Nenhum pedido registrado.</td></tr>';
}
async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("id,name,slug,is_active,products(id)").order("sort_order").order("name");
  if (error) throw error;
  categoriesCache = data || [];
  $("categoriesTable").innerHTML = categoriesCache.length ? categoriesCache.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.slug)}</td><td>${(c.products || []).length}</td><td><span class="status-pill ${c.is_active ? "good" : "bad"}">${c.is_active ? "Ativa" : "Oculta"}</span></td><td><button class="table-action" data-edit-category="${c.id}">Editar</button><button class="table-action danger" data-delete-category="${c.id}">Excluir</button></td></tr>`).join("") : '<tr><td colspan="5" class="empty-cell">Nenhuma categoria cadastrada.</td></tr>';
}
async function loadProducts() {
  const { data, error } = await supabase.from("products").select("id,name,sku,price,stock_quantity,low_stock_threshold,is_active,categories(name)").order("created_at", { ascending:false });
  if (error) throw error;
  $("productsTable").innerHTML = data?.length ? data.map(p => `<tr><td><strong>${esc(p.name)}</strong><br><small>${esc(p.sku || "Sem SKU")}</small></td><td>${esc(p.categories?.name || "Sem categoria")}</td><td>${money(p.price)}</td><td>${p.stock_quantity}</td><td><span class="status-pill ${p.is_active ? "good" : "bad"}">${p.is_active ? "Publicado" : "Oculto"}</span></td><td><button class="table-action" data-edit-product="${p.id}">Editar</button><button class="table-action danger" data-delete-product="${p.id}">Excluir</button></td></tr>`).join("") : '<tr><td colspan="6" class="empty-cell">Nenhum produto cadastrado. Cadastre os produtos reais da loja.</td></tr>';
}
async function loadOrders() {
  const filter = $("orderFilter").value;
  let query = supabase.from("orders").select("id,order_number,customer_name,customer_email,created_at,order_status,payment_status,total").order("created_at", { ascending:false }).limit(200);
  if (filter) query = query.eq("order_status", filter);
  const { data, error } = await query;
  if (error) throw error;
  $("ordersTable").innerHTML = data?.length ? data.map(o => `<tr><td>#${esc(o.order_number)}</td><td>${esc(o.customer_name)}<br><small>${esc(o.customer_email)}</small></td><td>${date(o.created_at)}</td><td>${statusNames[o.payment_status] || esc(o.payment_status)}</td><td><span class="status-pill">${statusNames[o.order_status] || esc(o.order_status)}</span></td><td>${money(o.total)}</td><td><button class="table-action" data-order="${o.id}">Atualizar status</button></td></tr>`).join("") : '<tr><td colspan="7" class="empty-cell">Nenhum pedido encontrado.</td></tr>';
}
async function loadCoupons() {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending:false });
  if (error) throw error;
  $("couponsTable").innerHTML = data?.length ? data.map(c => `<tr><td><strong>${esc(c.code)}</strong></td><td>${c.discount_type === "percentage" ? esc(c.discount_value) + "%" : money(c.discount_value)}</td><td>${date(c.expires_at)}</td><td>${c.used_count}${c.max_uses == null ? "" : " / " + c.max_uses}</td><td><span class="status-pill ${c.is_active ? "good" : "bad"}">${c.is_active ? "Ativo" : "Inativo"}</span></td><td><button class="table-action" data-edit-coupon="${c.id}">Editar</button><button class="table-action danger" data-delete-coupon="${c.id}">Excluir</button></td></tr>`).join("") : '<tr><td colspan="6" class="empty-cell">Nenhum cupom configurado.</td></tr>';
}
async function loadAdmins() {
  const { data, error } = await supabase.from("admin_users").select("user_id,email,full_name,role,is_active,created_at").order("created_at");
  if (error) throw error;
  $("adminsTable").innerHTML = data?.length ? data.map(a => `<tr><td>${esc(a.full_name || "Sem nome")}</td><td>${esc(a.email)}</td><td>${esc(a.role)}</td><td><span class="status-pill ${a.is_active ? "good" : "bad"}">${a.is_active ? "Ativo" : "Revogado"}</span></td><td><span class="data-note">Gerenciado pelo proprietário</span></td></tr>`).join("") : '<tr><td colspan="5" class="empty-cell">Nenhum administrador liberado.</td></tr>';
}
async function loadSettings() {
  const { data, error } = await supabase.from("store_settings").select("key,value");
  if (error) throw error;
  const settings = Object.fromEntries((data || []).map(x => [x.key, x.value]));
  const f = $("settingsForm");
  for (const key of ["store_name","whatsapp","support_email","instagram_url","low_stock_threshold"]) {
    if (settings[key] !== undefined && f.elements[key]) f.elements[key].value = settings[key].value ?? settings[key];
  }
}
function field(label, name, type = "text", value = "", extra = "") {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function selectField(label, name, options, value = "") {
  return `<label>${label}<select name="${name}">${options.map(([v,l]) => `<option value="${v}" ${v === value ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
}
function openDialog(title, entity, id, html) {
  editingId = id || null;
  currentEntity = entity;
  $("dialogTitle").textContent = title;
  fields.innerHTML = html;
  $("dialogFeedback").textContent = "";
  dialog.showModal();
}
async function productDialog(id = null) {
  await loadCategoryOptions();
  let p = {};
  if (id) {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) throw error;
    p = data;
  }
  const categoryOptions = [["","Sem categoria"], ...categoriesCache.map(c => [c.id,c.name])];
  openDialog(id ? "Editar produto" : "Novo produto", "product", id,
    field("Nome do produto","name","text",p.name || "",'required maxlength="140"') +
    field("SKU","sku","text",p.sku || "",'maxlength="80"') +
    selectField("Categoria","category_id",categoryOptions,p.category_id || "") +
    field("Preço (R$)","price","number",p.price ?? "",'required min="0" step="0.01"') +
    field("Preço anterior (opcional)","compare_at_price","number",p.compare_at_price ?? "",'min="0" step="0.01"') +
    field("Quantidade em estoque","stock_quantity","number",p.stock_quantity ?? 0,'required min="0" step="1"') +
    field("Alerta de estoque baixo","low_stock_threshold","number",p.low_stock_threshold ?? 5,'required min="0" step="1"') +
    field("URL da imagem principal","image_url","url",p.image_url || "",'class="full"') +
    `<label class="full">Descrição<textarea name="description" maxlength="4000">${esc(p.description || "")}</textarea></label>` +
    selectField("Visibilidade","is_active", [["false","Rascunho / oculto"],["true","Publicado"]],String(p.is_active ?? false)) +
    selectField("Destaque na vitrine","is_featured",[["false","Não"],["true","Sim"]],String(p.is_featured ?? false)) +
    '<p class="full data-note">Use uma URL pública de imagem por enquanto. Upload direto ao Storage será habilitado quando o projeto do proprietário estiver conectado.</p>');
}
async function loadCategoryOptions() {
  const { data, error } = await supabase.from("categories").select("id,name,slug,is_active").order("name");
  if (error) throw error;
  categoriesCache = data || [];
}
async function categoryDialog(id = null) {
  let c = {};
  if (id) {
    const { data, error } = await supabase.from("categories").select("*").eq("id",id).single();
    if (error) throw error;
    c = data;
  }
  openDialog(id ? "Editar categoria" : "Nova categoria", "category", id,
    field("Nome","name","text",c.name || "",'required maxlength="80"') +
    field("Slug (URL)","slug","text",c.slug || "",'required maxlength="100" pattern="[a-z0-9-]+"') +
    field("Ordem de exibição","sort_order","number",c.sort_order ?? 0,'min="0" step="1"') +
    selectField("Status","is_active",[["true","Ativa"],["false","Oculta"]],String(c.is_active ?? true)));
}
async function couponDialog(id = null) {
  let c = {};
  if (id) {
    const { data, error } = await supabase.from("coupons").select("*").eq("id",id).single();
    if (error) throw error;
    c = data;
  }
  openDialog(id ? "Editar cupom" : "Novo cupom", "coupon", id,
    field("Código","code","text",c.code || "",'required maxlength="40"') +
    selectField("Tipo de desconto",[["percentage","Percentual"],["fixed","Valor fixo"]],c.discount_type || "percentage") +
    field("Valor do desconto","discount_value","number",c.discount_value ?? "",'required min="0.01" step="0.01"') +
    field("Pedido mínimo (R$)","minimum_subtotal","number",c.minimum_subtotal ?? 0,'min="0" step="0.01"') +
    field("Limite de usos","max_uses","number",c.max_uses ?? "",'min="0" step="1" placeholder="Sem limite"') +
    field("Início","starts_at","datetime-local",c.starts_at ? c.starts_at.slice(0,16) : "") +
    field("Validade","expires_at","datetime-local",c.expires_at ? c.expires_at.slice(0,16) : "") +
    selectField("Status",[["false","Inativo"],["true","Ativo"]],String(c.is_active ?? false)));
}
async function saveEntity(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  $("dialogSave").disabled = true;
  try {
    let table, payload;
    if (currentEntity === "product") {
      table = "products";
      payload = { name:values.name.trim(), sku:values.sku.trim() || null, category_id:values.category_id || null, price:Number(values.price), compare_at_price:values.compare_at_price === "" ? null : Number(values.compare_at_price), stock_quantity:Number(values.stock_quantity), low_stock_threshold:Number(values.low_stock_threshold), image_url:values.image_url || null, description:values.description || null, is_active:values.is_active === "true", is_featured:values.is_featured === "true", slug:slugify(values.name) };
    } else if (currentEntity === "category") {
      table = "categories";
      payload = { name:values.name.trim(), slug:values.slug.trim(), sort_order:Number(values.sort_order || 0), is_active:values.is_active === "true" };
    } else {
      table = "coupons";
      payload = { code:values.code.trim().toUpperCase(), discount_type:values.discount_type, discount_value:Number(values.discount_value), minimum_subtotal:Number(values.minimum_subtotal || 0), max_uses:values.max_uses === "" ? null : Number(values.max_uses), starts_at:values.starts_at ? new Date(values.starts_at).toISOString() : null, expires_at:values.expires_at ? new Date(values.expires_at).toISOString() : null, is_active:values.is_active === "true" };
    }
    const query = editingId ? supabase.from(table).update(payload).eq("id",editingId) : supabase.from(table).insert(payload);
    const { error } = await query;
    if (error) throw error;
    dialog.close();
    showNotice("Cadastro salvo.");
    if (currentEntity === "product") await loadProducts();
    if (currentEntity === "category") await loadCategories();
    if (currentEntity === "coupon") await loadCoupons();
  } catch (e) {
    $("dialogFeedback").textContent = e.message;
  } finally {
    $("dialogSave").disabled = false;
  }
}
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
async function removeRecord(table, id, label, reload) {
  if (!confirm("Excluir " + label + "? Esta ação não poderá ser desfeita.")) return;
  const { error } = await supabase.from(table).delete().eq("id",id);
  if (error) throw error;
  showNotice(label + " excluído.");
  await reload();
}
async function updateOrderStatus(id) {
  const { data, error } = await supabase.from("orders").select("order_status").eq("id",id).single();
  if (error) throw error;
  openDialog("Atualizar pedido","order",id,selectField("Novo status","order_status",Object.entries(statusNames).filter(([k]) => ["pending","paid","processing","shipped","completed","cancelled"].includes(k)),data.order_status));
}
async function saveOrderStatus(event) {
  event.preventDefault();
  const status = new FormData(form).get("order_status");
  const { error } = await supabase.from("orders").update({order_status:status,updated_at:new Date().toISOString()}).eq("id",editingId);
  if (error) { $("dialogFeedback").textContent = error.message; return; }
  dialog.close(); showNotice("Status do pedido atualizado."); await loadOrders();
}
async function saveSettings(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const rows = Object.entries(data).map(([key,value]) => ({key,value: key === "low_stock_threshold" ? Number(value) : value,updated_by:currentUser.id,updated_at:new Date().toISOString()}));
  const { error } = await supabase.from("store_settings").upsert(rows,{onConflict:"key"});
  $("settingsFeedback").textContent = error ? error.message : "Configurações salvas.";
  if (error) $("settingsFeedback").style.color = "#e5a29a";
}
function wireEvents() {
  $("loginForm").addEventListener("submit", signIn);
  $("logoutButton").addEventListener("click", signOut);
  $("menuButton").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  document.querySelectorAll(".nav-item").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => setView(b.dataset.go)));
  $("refreshOverview").addEventListener("click", () => loadOverview().catch(e => showNotice(e.message,true)));
  $("newProduct").addEventListener("click", () => productDialog().catch(e => showNotice(e.message,true)));
  $("newCategory").addEventListener("click", () => categoryDialog().catch(e => showNotice(e.message,true)));
  $("newCoupon").addEventListener("click", () => couponDialog().catch(e => showNotice(e.message,true)));
  $("orderFilter").addEventListener("change", () => loadOrders().catch(e => showNotice(e.message,true)));
  $("settingsForm").addEventListener("submit", saveSettings);
  $("dialogClose").addEventListener("click", () => dialog.close());
  $("dialogCancel").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", e => currentEntity === "order" ? saveOrderStatus(e) : saveEntity(e));
  document.addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    try {
      if (b.dataset.editProduct) await productDialog(b.dataset.editProduct);
      if (b.dataset.deleteProduct) await removeRecord("products",b.dataset.deleteProduct,"produto",loadProducts);
      if (b.dataset.editCategory) await categoryDialog(b.dataset.editCategory);
      if (b.dataset.deleteCategory) await removeRecord("categories",b.dataset.deleteCategory,"categoria",loadCategories);
      if (b.dataset.editCoupon) await couponDialog(b.dataset.editCoupon);
      if (b.dataset.deleteCoupon) await removeRecord("coupons",b.dataset.deleteCoupon,"cupom",loadCoupons);
      if (b.dataset.order) await updateOrderStatus(b.dataset.order);
    } catch (err) { showNotice(err.message,true); }
  });
}
async function boot() {
  wireEvents();
  if (!requireConfig()) return;
  const { data, error } = await supabase.auth.getSession();
  if (error) { setLoginFeedback(error.message); return; }
  if (data.session) {
    try { await verifyAdmin(data.session.user); }
    catch (e) { await supabase.auth.signOut(); setLoginFeedback(e.message); }
  } else {
    setConnection(true, "Supabase pronto para login");
  }
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      adminApp.hidden = true;
      loginView.hidden = false;
      currentUser = null;
      activeRole = null;
    } else if (event === "SIGNED_IN" && session && !currentUser) {
      try { await verifyAdmin(session.user); }
      catch (e) { setLoginFeedback(e.message); await supabase.auth.signOut(); }
    }
  });
}
boot();
