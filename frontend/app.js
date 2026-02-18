const API_BASE = "http://localhost:8000";

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

async function refreshProducts() {
  const products = await api("/products");
  renderProducts(products);
}

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
    await refreshProducts();
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

// initial load
refreshProducts().catch(() => {});
