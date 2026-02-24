const API_BASE = "http://localhost:8000";

let currentOffset = 0;
const pageSize = 5;  // change to 10 or 25 if needed

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  // helpful error handling
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }
  return data;
}

function renderProducts(products) {
  const tbody = document.querySelector("#productsTable tbody");
  tbody.innerHTML = "";
  for (const p of products) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.id}</td><td>${p.sku}</td><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td>`;
    tbody.appendChild(tr);
  }
}

function renderCustomers(customers) {
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";
  for (const c of customers) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.id}</td><td>${c.name}</td><td>${c.email}</td>`;
    tbody.appendChild(tr);
  }
}

function renderOrders(orders) {
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  for (const o of orders) {
    const itemsText = (o.items || [])
      .map(i => `${i.product.sku} (${i.product.name}) x${i.qty}`)
      .join(", ");

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${o.id}</td><td>${o.customer.name}</td><td>${itemsText}</td>`;
    tbody.appendChild(tr);
  }
}

async function refreshOrders() {
  const orders = await api("/orders");
  renderOrders(orders);
}

document.getElementById("refreshOrders").addEventListener("click", () => {
  refreshOrders().catch(err => alert(err.message));
});

async function refreshCustomers() {
  const customers = await api("/customers");
  renderCustomers(customers);
}

function fillSelect(el, items, getValue, getLabel) {
  el.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    el.appendChild(opt);
  }
}

async function loadOrderFormOptions() {
  const [customers, products] = await Promise.all([
    api("/customers"),
    api("/products"),
  ]);

  const customerSel = document.getElementById("orderCustomer");
  const productSel = document.getElementById("orderProduct");

  fillSelect(customerSel, customers, c => c.id, c => `${c.id} — ${c.name}`);
  fillSelect(productSel, products, p => p.id, p => `${p.id} — ${p.sku} (${p.stock} in stock)`);
}

async function refreshProducts() {
  const products = await api(`/products?limit=${pageSize}&offset=${currentOffset}`);
  renderProducts(products);

  const currentPage = Math.floor(currentOffset / pageSize) + 1;
  document.getElementById("pageInfo").textContent = `Page ${currentPage}`;
}

function formatMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

async function refreshRevenue() {
  const data = await api("/reports/revenue");

  const revenue = data.total_revenue ?? 0;

  document.getElementById("revenueBig").textContent =
    formatMoney(revenue);
}

function renderLowStock(items) {
  const list = document.getElementById("lowStockList");
  const empty = document.getElementById("lowStockEmpty");

  list.innerHTML = "";

  if (!items || items.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const p of items) {
    const li = document.createElement("li");
    li.className = "alert";
    li.innerHTML = `
      <strong>⚠️ ${p.sku} — ${p.name}</strong>
      <small>Stock: ${p.stock} • Price: ${p.price}</small>
    `;
    list.appendChild(li);
  }
}

async function refreshLowStock() {
  const threshold = Number(document.getElementById("lowStockThreshold").value || 5);
  const data = await api(`/reports/low-stock?threshold=${encodeURIComponent(threshold)}`);
  console.log("Low stock data:", data);
  renderLowStock(data);
}

document.getElementById("nextPage").addEventListener("click", async () => {
  currentOffset += pageSize;
  await refreshProducts();
});

document.getElementById("prevPage").addEventListener("click", async () => {
  currentOffset = Math.max(0, currentOffset - pageSize);
  await refreshProducts();
});


document.getElementById("refreshLowStock").addEventListener("click", () => {
  refreshLowStock().catch(err => alert(err.message));
});


document.getElementById("refreshRevenue").addEventListener("click", () => {
  refreshRevenue().catch(err => alert(err.message));
});



document.getElementById("refreshCustomers").addEventListener("click", () => {
  refreshCustomers().catch(err => alert(err.message));
});

document.getElementById("customerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("cname").value.trim(),
    email: document.getElementById("cemail").value.trim(),
  };

  const out = document.getElementById("customerCreateResult");
  out.textContent = "Creating...";
  try {
    const created = await api("/customers", { method: "POST", body: JSON.stringify(payload) });
    out.textContent = JSON.stringify(created, null, 2);
    await refreshCustomers();
    e.target.reset();
  } catch (err) {
    out.textContent = err.message;
  }
});


document.getElementById("refreshProducts").addEventListener("click", () => {
  refreshProducts().catch(err => alert(err.message));
});

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    sku: document.getElementById("sku").value.trim(),
    name: document.getElementById("name").value.trim(),
    price: Number(document.getElementById("price").value),
    stock: Number(document.getElementById("stock").value),
  };

  const out = document.getElementById("productCreateResult");
  out.textContent = "Creating...";
  try {
    const created = await api("/products", { method: "POST", body: JSON.stringify(payload) });
    out.textContent = JSON.stringify(created, null, 2);
    currentOffset = 0;
    await refreshProducts();
    await loadOrderFormOptions();
    e.target.reset();
    document.getElementById("stock").value = 0;
  } catch (err) {
    out.textContent = err.message;
  }
});

document.getElementById("loadRevenue").addEventListener("click", async () => {
  const out = document.getElementById("reportsOut");
  out.textContent = "Loading...";
  try {
    const data = await api("/reports/revenue");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = err.message;
  }
});

document.getElementById("loadTop").addEventListener("click", async () => {
  const out = document.getElementById("reportsOut");
  out.textContent = "Loading...";
  try {
    const data = await api("/reports/top-products?limit=5");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = err.message;
  }
});

document.getElementById("loadLowStock").addEventListener("click", async () => {
  const out = document.getElementById("reportsOut");
  out.textContent = "Loading...";
  try {
    const data = await api("/reports/low-stock?threshold=5");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = err.message;
  }
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const customer_id = Number(document.getElementById("orderCustomer").value);
  const product_id = Number(document.getElementById("orderProduct").value);
  const qty = Number(document.getElementById("orderQty").value);

  const payload = {
    customer_id,
    items: [{ product_id, qty }]
  };

  const out = document.getElementById("orderCreateResult");
  out.textContent = "Placing order...";
  try {
    const created = await api("/orders", { method: "POST", body: JSON.stringify(payload) });
    out.textContent = JSON.stringify(created, null, 2);

    await refreshProducts(); // refresh UI so you SEE stock drop
    await loadOrderFormOptions(); // updates product dropdown stock labels
    await refreshOrders();
    await refreshLowStock();
  } catch (err) {
    out.textContent = err.message;
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("refreshLowStock");

  console.log("Low stock button found:", btn);

  if (!btn) {
    console.error("refreshLowStock button not found in DOM");
    return;
  }

  btn.addEventListener("click", async (e) => {
    e.preventDefault(); // prevents form submit issues
    console.log("Low stock refresh clicked");

    try {
      await refreshLowStock();
    } catch (err) {
      console.error("Low stock error:", err);
      alert(err.message);
    }
  });

  // initial load
  refreshProducts().catch(() => {});
  refreshCustomers().catch(() => {});
  loadOrderFormOptions().catch(() => {});
  refreshOrders().catch(() => {});
  refreshRevenue().catch(() => {});
  refreshLowStock().catch(() => {});
});


