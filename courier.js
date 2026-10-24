const cfg=window.KHUDARNA_CONFIG||{};const $=id=>document.getElementById(id);let sb;
const money=n=>new Intl.NumberFormat('en-US').format(n)+' د.ع';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={assigned:'بانتظار الاستلام',out_for_delivery:'في الطريق',delivered:'تم التسليم'};
function msg(s){const n=$('notice');n.textContent=s;n.classList.remove('hidden');n.classList.remove('pop');void n.offsetWidth;n.classList.add('pop')}
async function start(){
  if(!window.supabase||!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes('YOUR_')||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_ANON_KEY.includes('YOUR_')){msg('إعداد Supabase ناقص في config.js.');return}
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const {data:{session}}=await sb.auth.getSession();if(session)await enter();
}
$('loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)msg('فشل تسجيل الدخول: '+error.message);else await enter()};
async function enter(){
  const {data:{user}}=await sb.auth.getUser();
  const {data:p,error}=await sb.from('kh_profiles').select('role,active').eq('id',user.id).single();
  if(error||!p||p.role!=='courier'||!p.active){await sb.auth.signOut();msg('هذا الحساب ليس لديه صلاحية مندوب نشطة.');return}
  $('loginPanel').classList.add('hidden');$('app').classList.remove('hidden');await load();
}
$('logout').onclick=()=>sb.auth.signOut();
async function load(){
  const {data,error}=await sb.from('kh_orders').select('id,order_number,customer_name,customer_phone,area,address,total_iqd,status').order('created_at',{ascending:false});
  if(error){msg(error.message);return}
  const allowed=['assigned','out_for_delivery','delivered'];
  const rows=(data||[]).filter(o=>allowed.includes(o.status));
  $('rows').innerHTML=rows.map((o,i)=>`<article class="ocard" style="--i:${i}"><div class="row"><h3>طلب #${esc(o.order_number)}</h3><span class="badge st-${esc(o.status)}">${labels[o.status]||esc(o.status)}</span></div><div class="meta">👤 ${esc(o.customer_name)}<br>📍 ${esc(o.area)} — ${esc(o.address)}</div><div class="acts"><span class="total">${money(o.total_iqd)}</span><a class="btn call" href="tel:${esc(o.customer_phone)}">📞 ${esc(o.customer_phone)}</a><select data-id="${o.id}"><option value="assigned" ${o.status==='assigned'?'selected':''}>استلام المهمة</option><option value="out_for_delivery" ${o.status==='out_for_delivery'?'selected':''}>في الطريق</option><option value="delivered" ${o.status==='delivered'?'selected':''}>تم التسليم</option></select></div></article>`).join('')||'<div class="panel" style="text-align:center">🛵 لا توجد طلبات مسندة حالياً.</div>';
  document.querySelectorAll('[data-id]').forEach(s=>s.onchange=async()=>{
    const {error}=await sb.from('kh_orders').update({status:s.value,updated_at:new Date().toISOString()}).eq('id',s.dataset.id);
    if(error)msg('تعذر تحديث الحالة.');else{msg('تم تحديث حالة الطلب.');if(s.value==='delivered'&&window.FX)FX.confetti(24);load()}
  });
}
start();
