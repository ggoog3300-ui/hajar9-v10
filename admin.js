const cfg=window.KHUDARNA_CONFIG||{};const $=id=>document.getElementById(id);let sb=null,categories=[],orders=[];const money=n=>new Intl.NumberFormat('en-US').format(n)+' د.ع';const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function configured(){return window.supabase&&cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes('YOUR_')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_')}
function msg(s){const n=$('notice');n.textContent=s;n.classList.remove('hidden');n.classList.remove('pop');void n.offsetWidth;n.classList.add('pop')}
async function start(){if(!configured()){msg('إعداد Supabase ناقص. عدّل config.js ثم أعد تحميل الصفحة.');return}sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);const {data:{session}}=await sb.auth.getSession();if(session)await enter();sb.auth.onAuthStateChange((_e,session)=>{if(!session){$('app').classList.add('hidden');$('loginPanel').classList.remove('hidden')}})}
$('loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)msg('فشل تسجيل الدخول: '+error.message);else await enter()};
async function enter(){const {data:{user}}=await sb.auth.getUser();const {data:profile,error}=await sb.from('kh_profiles').select('role,active').eq('id',user.id).single();if(error||!profile||profile.role!=='admin'||!profile.active){await sb.auth.signOut();msg('هذا الحساب ليس لديه صلاحية إدارة نشطة.');return}$('loginPanel').classList.add('hidden');$('app').classList.remove('hidden');msg('تم تسجيل الدخول بأمان.');await loadAll()}
$('logout').onclick=()=>sb.auth.signOut();document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));$(b.dataset.tab).classList.remove('hidden');document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
async function loadAll(){await Promise.all([loadCats(),loadProducts(),loadOrders(),loadZones(),loadCustomers()])}
async function loadCats(){const {data,error}=await sb.from('kh_categories').select('id,name').eq('active',true).order('sort_order');if(error){msg(error.message);return}categories=data||[];$('categorySelect').innerHTML=categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}
async function loadProducts(){const {data,error}=await sb.from('kh_products').select('id,name,category_id,price_iqd,unit,stock_quantity,is_available,emoji,kh_categories(name)').order('created_at',{ascending:false});if(error){msg(error.message);return}const a=data||[];FX.count($('statProducts'),a.length);$('productRows').innerHTML=a.map(p=>`<tr><td>${esc(p.emoji)} ${esc(p.name)}</td><td>${esc(p.kh_categories?.name||'—')}</td><td>${money(p.price_iqd)}</td><td>${p.stock_quantity}</td><td><span class="badge ${p.is_available?'b-yes':'b-no'}">${p.is_available?'نعم':'لا'}</span></td><td><button class="btn" data-toggle="${p.id}" data-on="${p.is_available}">${p.is_available?'إخفاء':'إظهار'}</button> <button class="btn danger" data-delete="${p.id}">حذف</button></td></tr>`).join('');document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('kh_products').update({is_available:b.dataset.on!=='true',updated_at:new Date().toISOString()}).eq('id',b.dataset.toggle);if(error)msg(error.message);else loadProducts()});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف المنتج؟'))return;const {error}=await sb.from('kh_products').delete().eq('id',b.dataset.delete);if(error)msg(error.message);else loadProducts()})}
$('productForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const item={name:f.get('name').trim(),category_id:Number(f.get('category_id')),price_iqd:Number(f.get('price_iqd')),unit:f.get('unit'),emoji:f.get('emoji')||'🥬',stock_quantity:Number(f.get('stock_quantity')||0),description:f.get('description')||'',is_available:true};const {error}=await sb.from('kh_products').insert(item);if(error)msg('تعذر حفظ المنتج: '+error.message);else{msg('تم حفظ المنتج.');e.currentTarget.reset();await loadProducts()}};
async function loadOrders(){const {data,error}=await sb.from('kh_orders').select('id,order_number,customer_name,customer_phone,area,total_iqd,status,created_at').order('created_at',{ascending:false}).limit(200);if(error){msg(error.message);return}orders=data||[];FX.count($('statOrders'),orders.filter(o=>o.status==='new').length);FX.count($('statAll'),orders.length);const labels={new:'جديد',confirmed:'مؤكد',preparing:'قيد التجهيز',assigned:'تم تعيين مندوب',out_for_delivery:'في الطريق',delivered:'تم التسليم',cancelled:'ملغي'};$('orderRows').innerHTML=orders.map(o=>`<tr><td>${o.order_number}</td><td>${esc(o.customer_name)}</td><td>${esc(o.customer_phone)}</td><td>${esc(o.area)}</td><td>${money(o.total_iqd)}</td><td><span class="badge st-${esc(o.status)}">${labels[o.status]||esc(o.status)}</span></td><td><select data-status="${o.id}">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select></td></tr>`).join('');document.querySelectorAll('[data-status]').forEach(s=>s.onchange=async()=>{const {error}=await sb.functions.invoke('admin-update-order',{body:{order_id:s.dataset.status,status:s.value}});if(error){msg('تعذر تحديث الحالة. تأكد من نشر Edge Function.');await loadOrders()}else{msg('تم تحديث حالة الطلب.');await loadOrders()}})}
async function loadZones(){const {data,error}=await sb.from('kh_delivery_zones').select('*').order('name');if(error){msg(error.message);return}$('zoneRows').innerHTML=(data||[]).map(z=>`<tr><td>${esc(z.name)}</td><td>${money(z.fee_iqd)}</td><td><span class="badge ${z.active?'b-yes':'b-no'}">${z.active?'نعم':'لا'}</span></td><td><button class="btn" data-zone-toggle="${z.id}" data-on="${z.active}">${z.active?'إيقاف':'تفعيل'}</button> <button class="btn danger" data-zone-delete="${z.id}">حذف</button></td></tr>`).join('');document.querySelectorAll('[data-zone-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('kh_delivery_zones').update({active:b.dataset.on!=='true'}).eq('id',b.dataset.zoneToggle);if(error)msg(error.message);else loadZones()});document.querySelectorAll('[data-zone-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف المنطقة؟'))return;const {error}=await sb.from('kh_delivery_zones').delete().eq('id',b.dataset.zoneDelete);if(error)msg(error.message);else loadZones()})}
$('zoneForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await sb.from('kh_delivery_zones').insert({name:f.get('name').trim(),fee_iqd:Number(f.get('fee_iqd'))});if(error)msg('تعذر إضافة المنطقة: '+error.message);else{msg('تمت إضافة المنطقة.');e.currentTarget.reset();loadZones()}};
/* ---------- الزبائن ---------- */
let customers=[];
const fmt=d=>d?new Date(d).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—';
async function loadCustomers(){const {data,error}=await sb.from('kh_customers').select('id,full_name,phone,email,created_at,last_login_at,logins').order('created_at',{ascending:false});if(error){msg('تعذر تحميل الزبائن: '+error.message);return}customers=data||[];renderCustomers()}
function renderCustomers(){const q=($('custSearch').value||'').trim().toLowerCase();const a=customers.filter(c=>((c.full_name||'')+' '+(c.phone||'')+' '+(c.email||'')).toLowerCase().includes(q));$('custCount').textContent=customers.length;$('customerRows').innerHTML=a.map(c=>`<tr><td>${esc(c.full_name||'—')}</td><td>${c.phone?`<a href="tel:${esc(c.phone)}" dir="ltr">${esc(c.phone)}</a>`:'—'}</td><td dir="ltr" style="text-align:right">${esc(c.email||'—')}</td><td>${fmt(c.created_at)}</td><td>${fmt(c.last_login_at)}</td><td>${c.logins||0}</td></tr>`).join('')||'<tr><td colspan="6">لا يوجد زبائن مطابقون.</td></tr>'}
$('custSearch').oninput=renderCustomers;
start();
/* ========== إدارة المندوبين وتعيينهم للطلبات ========== */
const toast = (typeof msg === "function") ? msg : (s) => alert(s);
let couriers = [];

async function loadCouriers() {
  const { data, error } = await sb.from("kh_profiles").select("id,full_name,phone,active").eq("role", "courier").order("full_name");
  if (error) { console.error(error); couriers = []; return; }
  couriers = data || [];
}

function courierOptionsHtml(selectedId) {
  return '<option value="">— بدون مندوب —</option>' +
    couriers.map(c => `<option value="${esc(c.id)}" ${String(c.id) === String(selectedId) ? "selected" : ""}>${esc(c.full_name || c.phone || "مندوب")}</option>`).join("");
}

function addCourierColumnToOrders() {
  const rowsEl = $("orderRows");
  if (!rowsEl) return;
  const table = rowsEl.closest("table");
  if (table) {
    const headRow = table.querySelector("thead tr");
    if (headRow && !headRow.querySelector("[data-courier-head]")) {
      const th = document.createElement("th");
      th.textContent = "المندوب";
      th.dataset.courierHead = "1";
      headRow.appendChild(th);
    }
  }
  const trs = rowsEl.querySelectorAll("tr");
  trs.forEach((tr, i) => {
    if (tr.querySelector("[data-assign-courier]")) return;
    const order = orders[i];
    if (!order) return;
    const td = document.createElement("td");
    td.innerHTML = `<select data-assign-courier="${esc(order.id)}">${courierOptionsHtml(order.courier_id)}</select>`;
    tr.appendChild(td);
    td.querySelector("select").onchange = async (e) => {
      const sel = e.currentTarget;
      sel.disabled = true;
      try {
        const { error } = await sb.functions.invoke("admin-assign-courier", { body: { order_id: order.id, courier_id: sel.value || null } });
        if (error) throw error;
        toast("تم تعيين المندوب");
      } catch (err) {
        console.error(err);
        toast("تعذر تعيين المندوب. تحقق من إعداد Edge Function.");
      } finally {
        sel.disabled = false;
      }
    };
  });
}

const _origLoadOrders = loadOrders;
loadOrders = async function (...args) {
  await _origLoadOrders.apply(this, args);
  await loadCouriers();
  const ids = orders.map(o => o.id);
  if (ids.length) {
    const { data: courierData } = await sb.from("kh_orders").select("id,courier_id").in("id", ids);
    (courierData || []).forEach(cd => {
      const o = orders.find(x => x.id === cd.id);
      if (o) o.courier_id = cd.courier_id;
    });
  }
  addCourierColumnToOrders();
};

function renderCouriersTable() {
  const rows = $("couriersRows");
  if (!rows) return;
  rows.innerHTML = couriers.length ? couriers.map(c => `
    <tr>
      <td>${esc(c.full_name || "—")}</td>
      <td>${esc(c.phone || "—")}</td>
      <td>${c.active ? "نشط" : "موقوف"}</td>
      <td><button class="btn" data-courier-toggle="${esc(c.id)}">${c.active ? "إيقاف" : "تفعيل"}</button></td>
    </tr>`).join("") : '<tr><td colspan="4">لا يوجد مندوبين بعد</td></tr>';
  rows.querySelectorAll("[data-courier-toggle]").forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.courierToggle;
      const c = couriers.find(x => x.id === id);
      if (!c) return;
      const { error } = await sb.from("kh_profiles").update({ active: !c.active }).eq("id", id);
      if (error) { toast("تعذر التحديث"); return; }
      await loadCouriers();
      renderCouriersTable();
    };
  });
}

function injectCourierTab() {
  const anyTabBtn = document.querySelector("[data-tab]");
  if (!anyTabBtn || document.querySelector('[data-tab="couriersTab"]')) return;
  const tabsWrap = anyTabBtn.parentElement;
  const btn = document.createElement("button");
  btn.className = anyTabBtn.className;
  btn.dataset.tab = "couriersTab";
  btn.textContent = "المندوبين";
  tabsWrap.appendChild(btn);

  const mainEl = document.querySelector("main");
  const section = document.createElement("section");
  section.id = "couriersTab";
  section.className = "hidden";
  section.innerHTML = `
    <h2>إضافة مندوب جديد</h2>
    <form id="courierForm">
      <div class="field"><label>الاسم الكامل</label><input name="full_name" required></div>
      <div class="field"><label>رقم الهاتف</label><input name="phone" required></div>
      <div class="field"><label>البريد الإلكتروني</label><input name="email" type="email" required></div>
      <div class="field"><label>كلمة المرور</label><input name="password" type="password" required minlength="6"></div>
      <button class="btn" type="submit">إضافة مندوب</button>
    </form>
    <h2>قائمة المندوبين</h2>
    <table><thead><tr><th>الاسم</th><th>الهاتف</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody id="couriersRows"></tbody></table>`;
  mainEl.appendChild(section);

  btn.onclick = async () => {
    document.querySelectorAll("main section").forEach(s => s.classList.add("hidden"));
    section.classList.remove("hidden");
    document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === btn));
    await loadCouriers();
    renderCouriersTable();
  };

  $("courierForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      full_name: f.get("full_name").trim(),
      phone: f.get("phone").trim(),
      email: f.get("email").trim(),
      password: f.get("password")
    };
    const submitBtn = e.currentTarget.querySelector("button");
    submitBtn.disabled = true; submitBtn.textContent = "جارٍ الإضافة...";
    try {
      const { error } = await sb.functions.invoke("admin-create-courier", { body });
      if (error) throw error;
      toast("تمت إضافة المندوب بنجاح");
      e.currentTarget.reset();
      await loadCouriers();
      renderCouriersTable();
    } catch (err) {
      console.error(err);
      toast("تعذر إضافة المندوب. تحقق من إعداد Edge Function.");
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = "إضافة مندوب";
    }
  };
}

injectCourierTab();
