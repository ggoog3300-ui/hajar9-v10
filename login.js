/* خضارنا — تسجيل الدخول وإنشاء الحساب (Supabase Auth) */
const cfg=window.KHUDARNA_CONFIG||{};
const $=id=>document.getElementById(id);
const configured=!!(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes('YOUR_')&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_'));
const sb=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const recovering=/type=recovery/.test(location.hash);
const home=()=>new URL('index.html',location.href).href;

/* ---------- رسائل ---------- */
function msg(kind,text){const m=$('msg');m.hidden=false;m.className='amsg '+kind;m.textContent=text;m.style.animation='none';void m.offsetWidth;m.style.animation=''}
function clearMsg(){$('msg').hidden=true}
const ERR=[
  [/invalid login credentials/i,'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
  [/email not confirmed/i,'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد على بريدك ثم سجّل دخولك.'],
  [/already registered|already been registered|user already/i,'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.'],
  [/password should be at least|weak password|password.*characters/i,'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.'],
  [/rate limit|too many|security purposes/i,'محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.'],
  [/invalid.*email|unable to validate email/i,'صيغة البريد الإلكتروني غير صحيحة.'],
  [/signups? not allowed|signup.*disabled/i,'إنشاء الحسابات الجديدة متوقف حالياً.'],
  [/same password|different from the old/i,'اختر كلمة مرور مختلفة عن القديمة.'],
  [/network|failed to fetch/i,'تعذر الاتصال بالإنترنت. تحقق من الشبكة وأعد المحاولة.']
];
const ar=e=>{const t=String(e&&e.message||e||'');const hit=ERR.find(([r])=>r.test(t));return hit?hit[1]:'حدث خطأ غير متوقع. أعد المحاولة.'};

/* ---------- التبديل بين الواجهات ---------- */
const VIEWS={login:'loginForm',signup:'signupForm',reset:'resetForm',newpass:'newPassForm'};
function view(name){
  clearMsg();
  Object.entries(VIEWS).forEach(([k,id])=>{const f=$(id);const on=k===name;f.classList.toggle('hidden',!on)});
  const tabs=$('tabs');
  tabs.hidden=!(name==='login'||name==='signup');
  if(name==='login'||name==='signup'){tabs.dataset.on=name;tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.t===name;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)})}
  const first=$(VIEWS[name]).querySelector('input');if(first&&matchMedia('(pointer:fine)').matches)setTimeout(()=>first.focus(),60);
}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)view(b.dataset.t)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)view(b.dataset.go)});

/* إظهار/إخفاء كلمة المرور */
document.querySelectorAll('.eye').forEach(b=>b.addEventListener('click',()=>{const i=b.parentElement.querySelector('input');const show=i.type==='password';i.type=show?'text':'password';b.textContent=show?'🙈':'👁'}));

/* مؤشر قوة كلمة المرور */
$('sp').addEventListener('input',e=>{
  const v=e.target.value;let s=0;
  if(v.length>=8)s++;if(v.length>=12)s++;if(/[A-Za-z]/.test(v)&&/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v)||(/[a-z]/.test(v)&&/[A-Z]/.test(v)))s++;
  const m=document.querySelector('.meter');m.dataset.s=v?Math.max(1,s):0;
  $('meterTxt').textContent=!v?'8 أحرف على الأقل، والأفضل أرقام وحروف معاً.':['','ضعيفة','مقبولة','جيدة','قوية 💪'][Math.max(1,s)];
});

/* ---------- أدوات النماذج ---------- */
function busy(btn,on,label){btn.disabled=on;if(on){btn.dataset.l=btn.textContent;btn.textContent=label;btn.classList.add('loading')}else{btn.textContent=btn.dataset.l||btn.textContent;btn.classList.remove('loading')}}
function shake(el){const f=el.closest('.aform');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake')}
function bad(input,text){msg('err',text);shake(input);input.focus();input.classList.add('invalid');input.addEventListener('input',()=>input.classList.remove('invalid'),{once:true})}
function needBackend(){if(sb)return false;msg('err','الاتصال بالخادم غير مُعدّ بعد. أكمل إعداد config.js وربط Supabase.');return true}
function success(text){msg('ok',text)}

/* ---------- دخول ---------- */
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();if(needBackend())return;
  const f=e.currentTarget,email=f.email.value.trim(),password=f.password.value,btn=f.querySelector('[type=submit]');
  if(!email||!/^\S+@\S+\.\S+$/.test(email))return bad(f.email,'اكتب بريداً إلكترونياً صحيحاً.');
  if(!password)return bad(f.password,'اكتب كلمة المرور.');
  busy(btn,true,'جارٍ الدخول...');
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){busy(btn,false);msg('err',ar(error));shake(f.password);return}
  success('تم تسجيل الدخول ✓ جارٍ فتح المتجر...');
  setTimeout(()=>location.replace(home()),500);
});

/* ---------- حساب جديد ---------- */
const phoneOk=p=>/^(\+?964|0)?7\d{9}$/.test(p.replace(/[\s-]/g,''));
$('signupForm').addEventListener('submit',async e=>{
  e.preventDefault();if(needBackend())return;
  const f=e.currentTarget,btn=f.querySelector('[type=submit]');
  const full_name=f.full_name.value.trim(),phone=f.phone.value.trim(),email=f.email.value.trim(),pw=f.password.value,pw2=f.password2.value;
  if(full_name.length<3)return bad(f.full_name,'اكتب اسمك الكامل.');
  if(!phoneOk(phone))return bad(f.phone,'رقم الهاتف غير صحيح. مثال: 07701234567');
  if(!/^\S+@\S+\.\S+$/.test(email))return bad(f.email,'اكتب بريداً إلكترونياً صحيحاً.');
  if(pw.length<8)return bad(f.password,'كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
  if(pw!==pw2)return bad(f.password2,'كلمتا المرور غير متطابقتين.');
  busy(btn,true,'جارٍ إنشاء الحساب...');
  const {data,error}=await sb.auth.signUp({email,password:pw,options:{data:{app:'khudarna',full_name,phone:phone.replace(/[\s-]/g,'')},emailRedirectTo:home()}});
  if(error){busy(btn,false);msg('err',ar(error));return}
  /* بريد مسجّل مسبقاً: Supabase يرجع مستخدماً بدون هويات عند تفعيل حماية التعداد */
  if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){busy(btn,false);msg('err',ar('User already registered'));return}
  if(data.session){success('تم إنشاء حسابك 🎉 جارٍ فتح المتجر...');FX.confetti&&FX.confetti(30);setTimeout(()=>location.replace(home()),900);return}
  busy(btn,false);f.reset();
  view('login');success('تم إنشاء حسابك 🎉 أرسلنا رسالة تأكيد إلى بريدك. افتحها واضغط الرابط، ثم سجّل دخولك.');
  $('le').value=email;
});

/* ---------- استرجاع كلمة المرور ---------- */
$('resetForm').addEventListener('submit',async e=>{
  e.preventDefault();if(needBackend())return;
  const f=e.currentTarget,email=f.email.value.trim(),btn=f.querySelector('[type=submit]');
  if(!/^\S+@\S+\.\S+$/.test(email))return bad(f.email,'اكتب بريداً إلكترونياً صحيحاً.');
  busy(btn,true,'جارٍ الإرسال...');
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:new URL('login.html',location.href).href});
  busy(btn,false);
  if(error)return msg('err',ar(error));
  success('إذا كان البريد مسجّلاً سيصلك رابط تعيين كلمة المرور خلال لحظات.');
});
$('newPassForm').addEventListener('submit',async e=>{
  e.preventDefault();if(needBackend())return;
  const f=e.currentTarget,btn=f.querySelector('[type=submit]');
  if(f.password.value.length<8)return bad(f.password,'كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
  busy(btn,true,'جارٍ الحفظ...');
  const {error}=await sb.auth.updateUser({password:f.password.value});
  if(error){busy(btn,false);return msg('err',ar(error))}
  success('تم تغيير كلمة المرور ✓');history.replaceState(null,'',location.pathname);setTimeout(()=>location.replace(home()),700);
});

/* ---------- البداية ---------- */
(async function start(){
  if(!sb){msg('warn','الاتصال بالخادم غير مُعدّ بعد (config.js). يمكنك رؤية التصميم فقط.');return}
  sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY')view('newpass')});
  if(recovering){view('newpass');return}
  const {data:{session}}=await sb.auth.getSession();
  if(session){location.replace(home());return}
  if(new URLSearchParams(location.search).get('mode')==='signup')view('signup');
})();
