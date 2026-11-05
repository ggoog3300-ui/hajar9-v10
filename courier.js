
const cfg = window.KHUDARNA_CONFIG || {};
const $ = (id) => document.getElementById(id);

let sb;
let currentUser = null;
let loading = false;

const SUPABASE_URL = "https://evcjgbwlmvfbgqsgqyvf.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_Z4C6jDppXEW1ZDBB489MVg_0k1MMdSX";

const labels = {
  assigned: "بانتظار الاستلام",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
};

const money = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n) || 0) + " د.ع";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

function msg(message) {
  const notice = $("notice");
  if (!notice) {
    alert(message);
    return;
  }

  notice.textContent = message;
  notice.classList.remove("hidden", "pop");
  void notice.offsetWidth;
  notice.classList.add("pop");
}

function waLink(phone) {
  let number = String(phone || "").replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "964" + number.slice(1);
  } else if (!number.startsWith("964")) {
    number = "964" + number;
  }

  const text = encodeURIComponent(
    "مرحباً، أنا مندوب خضارنا 🛵 يرجى دعمي بالموقع لإيصال طلبكم."
  );

  return `https://wa.me/${number}?text=${text}`;
}

async function initSupabase() {
  if (!window.supabase?.createClient) {
    msg("تعذر تحميل مكتبة Supabase. تحقق من اتصال الإنترنت.");
    return false;
  }

  sb = window.supabase.createClient(
    cfg.SUPABASE_URL || SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
  );

  return true;
}

async function start() {
  if (!(await initSupabase())) return;

  try {
    const { data, error } = await sb.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await enter();
    }
  } catch (error) {
    msg("تعذر التحقق من جلسة الدخول.");
    console.error(error);
  }
}

$("loginForm").onsubmit = async (event) => {
  event.preventDefault();

  if (!sb) {
    msg("الاتصال بقاعدة البيانات غير جاهز.");
    return;
  }

  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!email || !password) {
    msg("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
    return;
  }

  try {
    const { error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await enter();
  } catch (error) {
    msg("فشل تسجيل الدخول: " + (error.message || "خطأ غير معروف"));
  }
};

async function enter() {
  try {
    const { data, error } = await sb.auth.getUser();

    if (error || !data.user) {
      throw error || new Error("لم يتم العثور على المستخدم.");
    }

    currentUser = data.user;

    const { data: profile, error: profileError } = await sb
      .from("kh_profiles")
      .select("role, active")
      .eq("id", currentUser.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "courier" ||
      profile.active !== true
    ) {
      await sb.auth.signOut();
      currentUser = null;
      msg("هذا الحساب ليس لديه صلاحية مندوب نشطة.");
      return;
    }

    $("loginPanel").classList.add("hidden");
    $("app").classList.remove("hidden");

    await load();
  } catch (error) {
    console.error(error);
    msg("تعذر التحقق من صلاحيات المندوب.");
  }
}

$("logout").onclick = async () => {
  try {
    await sb.auth.signOut();
    currentUser = null;
    $("app").classList.add("hidden");
    $("loginPanel").classList.remove("hidden");
  } catch (error) {
    msg("تعذر تسجيل الخروج.");
  }
};

async function load() {
  if (!sb || !currentUser || loading) return;

  loading = true;

  try {
    const { data, error } = await sb
      .from("kh_orders")
      .select(
        "id, order_number, customer_name, customer_phone, area, address, total_iqd, status"
      )
      .in("status", ["assigned", "out_for_delivery", "delivered"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    renderOrders(data || []);
  } catch (error) {
    console.error(error);
    msg("تعذر تحميل الطلبات: " + (error.message || ""));
  } finally {
    loading = false;
  }
}

function renderOrders(orders) {
  const rows = $("rows");
  if (!rows) return;

  rows.innerHTML = orders.map((order, index) => {
    const delivered = order.status === "delivered";

    return `
      <article class="ocard" style="--i:${index}">
        <div class="row">
          <h3>طلب #${esc(order.order_number)}</h3>
          <span class="badge st-${esc(order.status)}">
            ${esc(labels[order.status] || order.status)}
          </span>
        </div>

        <div class="meta">
          👤 ${esc(order.customer_name)}<br>
          📍 ${esc(order.area)} — ${esc(order.address)}
        </div>

        <div class="acts">
          <span class="total">${money(order.total_iqd)}</span>

          <a class="btn call" href="tel:${esc(order.customer_phone)}">
            📞 ${esc(order.customer_phone)}
          </a>

          <a class="btn wa"
             href="${waLink(order.customer_phone)}"
             target="_blank"
             rel="noopener noreferrer">
            💬 واتساب
          </a>

          ${
            delivered
              ? '<span class="delivered-status">تم التوصيل ✓</span>'
              : `
                <select data-id="${esc(order.id)}"
                        data-current="${esc(order.status)}">
                  <option value="assigned"
                    ${order.status === "assigned" ? "selected" : ""}>
                    استلام المهمة
                  </option>
                  <option value="out_for_delivery"
                    ${order.status === "out_for_delivery" ? "selected" : ""}>
                    في الطريق
                  </option>
                  <option value="delivered">
                    تم التسليم
                  </option>
                </select>
              `
          }
        </div>
      </article>
    `;
  }).join("") ||
    '<div class="panel" style="text-align:center">🛵 لا توجد طلبات مسندة حالياً.</div>';

  rows.querySelectorAll("select[data-id]").forEach((select) => {
    select.onchange = async () => {
      const orderId = select.dataset.id;
      const previousStatus = select.dataset.current;
      const newStatus = select.value;

      if (newStatus === "delivered") {
        const confirmed = confirm(
          "هل أنت متأكد من إتمام توصيل الطلب؟ لا يمكن التراجع عن هذه العملية."
        );

        if (!confirmed) {
          select.value = previousStatus;
          return;
        }
      }

      select.disabled = true;

      try {
        const { data, error } = await sb
          .from("kh_orders")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...(newStatus === "delivered"
              ? { delivered_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", orderId)
          .eq("status", previousStatus)
          .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
          msg("لم يتم تحديث الطلب. ربما تم تعديله مسبقاً.");
          await load();
          return;
        }

        msg("تم تحديث حالة الطلب.");

        if (newStatus === "delivered" && window.FX) {
          window.FX.confetti(24);
        }

        await load();
      } catch (error) {
        console.error(error);
        msg("تعذر تحديث حالة الطلب: " + (error.message || ""));
        select.value = previousStatus;
      } finally {
        select.disabled = false;
      }
    };
  });
}

start();
