"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = { id: string; name: string; slug: string; shortDescription: string; publicationStatus: string; availabilityMode: string; variants?: Array<{ id: string; name: string; sku: string; fulfillmentMode: string; price: number }> };
type Category = { id: string; name: string; slug: string; hidden: boolean };
const initial = { name: "", slug: "", shortDescription: "", publicationStatus: "DRAFT", categoryId: "" };

export function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]); const [form, setForm] = useState(initial); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]); const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [variantForm, setVariantForm] = useState({ productId: "", sku: "", name: "", price: "", fulfillmentMode: "MANUAL_WHATSAPP", sharedDeliveryValue: "", entries: "" });
  const refresh = async () => { const [productsResponse, categoriesResponse] = await Promise.all([fetch("/api/admin/products", { cache: "no-store" }), fetch("/api/admin/categories", { cache: "no-store" })]); if (productsResponse.ok) setProducts(await productsResponse.json()); if (categoriesResponse.ok) setCategories(await categoriesResponse.json()); };
  useEffect(() => { void refresh(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, categoryId: form.categoryId || null, publicationStatus: form.publicationStatus }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setNotice(data.error || "Gagal membuat produk."); return; }
    setForm(initial); setNotice("Produk dibuat sebagai draft. Tambahkan varian dari API/admin berikutnya."); void refresh();
  }
  async function submitCategory(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); const response = await fetch("/api/admin/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(categoryForm) }); const data = await response.json(); setBusy(false); if (!response.ok) setNotice(data.error || "Kategori gagal dibuat."); else { setCategoryForm({ name: "", slug: "" }); setNotice("Kategori berhasil dibuat."); void refresh(); } }
  async function editCategory(category: Category) { const name = window.prompt("Nama kategori", category.name); if (!name?.trim()) return; const response = await fetch(`/api/admin/categories/${category.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() }) }); if (!response.ok) setNotice("Kategori gagal diubah."); else void refresh(); }
  async function toggleCategory(category: Category) { const response = await fetch(`/api/admin/categories/${category.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ hidden: !category.hidden }) }); if (!response.ok) setNotice("Status kategori gagal diubah."); else void refresh(); }
  async function toggle(product: Product) {
    const publicationStatus = product.publicationStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicationStatus }) });
    if (!response.ok) setNotice("Status produk gagal diubah."); else void refresh();
  }
  async function submitVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const payload = { ...variantForm, price: Number(variantForm.price), sharedDeliveryValue: variantForm.sharedDeliveryValue || undefined };
    const response = await fetch("/api/admin/variants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "Varian gagal dibuat."); setBusy(false); return; }
    if (variantForm.fulfillmentMode === "UNIQUE_POOL" && variantForm.entries.trim()) {
      const importResponse = await fetch(`/api/admin/variants/${data.id}/inventory`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entries: variantForm.entries }) });
      const imported = await importResponse.json();
      if (!importResponse.ok) { setNotice(imported.error || "Varian dibuat, tetapi import stok gagal."); setBusy(false); return; }
      setNotice(`Varian dibuat dan ${imported.imported} akses unik diimpor.`);
    } else setNotice("Varian berhasil dibuat.");
    setVariantForm({ productId: "", sku: "", name: "", price: "", fulfillmentMode: "MANUAL_WHATSAPP", sharedDeliveryValue: "", entries: "" }); setBusy(false); void refresh();
  }
  return <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Catalog CRUD</p><h2>Produk & ketersediaan</h2></div><p>Single delivery, manual WhatsApp, dan pool kode unik dikonfigurasi per varian.</p></div>
    <form className="admin-product-form admin-category-form" onSubmit={submitCategory}><div className="wide"><p className="eyebrow">Category CRUD</p><h3>Kategori katalog</h3><p className="admin-hint">Gunakan slug <code>chatgpt-plus</code> untuk kategori yang akan tampil di halaman <code>/gpt</code>.</p></div><label>Nama kategori<input required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="ChatGPT Plus" /></label><label>Slug kategori<input required pattern="[a-z0-9-]+" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="chatgpt-plus" /></label><button className="store-button store-button-secondary" disabled={busy}>Tambah kategori</button><div className="wide category-admin-list">{categories.map((category) => <span key={category.id}><b>{category.name}</b><small>/{category.slug}</small><button type="button" onClick={() => void editCategory(category)}>Edit</button><button type="button" onClick={() => void toggleCategory(category)}>{category.hidden ? "Tampilkan" : "Sembunyikan"}</button></span>)}</div></form>
    <form className="admin-product-form" onSubmit={submit}>
      <label>Nama produk<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
      <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} required pattern="[a-z0-9-]+" /></label>
      <label className="wide">Deskripsi singkat<input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} required /></label>
      <label>Kategori<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Tanpa kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Status awal<select value={form.publicationStatus} onChange={(event) => setForm({ ...form, publicationStatus: event.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
      <button className="store-button store-button-primary" disabled={busy}>{busy ? "Menyimpan…" : "Tambah produk"}</button>
    </form>{notice && <p className="form-error">{notice}</p>}
    <div className="admin-product-list">{products.map((product) => <article key={product.id}><div><span className={`availability ${product.publicationStatus === "PUBLISHED" ? "ready" : "upcoming"}`}><i />{product.publicationStatus}</span><h3>{product.name}</h3><p>/{product.slug} · {product.variants?.length || 0} varian</p></div><button className="admin-inline-button" onClick={() => void toggle(product)}>{product.publicationStatus === "PUBLISHED" ? "Jadikan draft" : "Publish"}</button></article>)}{!products.length && <p className="admin-empty">Belum ada produk. Buat produk pertama di atas.</p>}</div>
    <form className="admin-product-form admin-variant-form" onSubmit={submitVariant}><div className="wide"><p className="eyebrow">Fulfilment</p><h3>Tambah varian & metode kirim</h3><p className="admin-hint">Manual WhatsApp membuka chat setelah paid. Single delivery menyimpan satu URL/kode yang sama. Unique pool mengirim satu baris stok untuk satu pembeli dan tidak akan digunakan lagi.</p></div><label>Produk<select required value={variantForm.productId} onChange={(event) => setVariantForm({ ...variantForm, productId: event.target.value })}><option value="">Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>SKU<input required value={variantForm.sku} onChange={(event) => setVariantForm({ ...variantForm, sku: event.target.value })} placeholder="DIG-001" /></label><label>Nama varian<input required value={variantForm.name} onChange={(event) => setVariantForm({ ...variantForm, name: event.target.value })} placeholder="Akses 1 bulan" /></label><label>Harga (Rp)<input required type="number" min="0" value={variantForm.price} onChange={(event) => setVariantForm({ ...variantForm, price: event.target.value })} /></label><label className="wide">Metode fulfilment<select value={variantForm.fulfillmentMode} onChange={(event) => setVariantForm({ ...variantForm, fulfillmentMode: event.target.value })}><option value="MANUAL_WHATSAPP">1. Manual WhatsApp setelah paid</option><option value="SINGLE_SHARED">2. URL/kode tunggal otomatis</option><option value="UNIQUE_POOL">3. Pool URL/kode unik otomatis</option></select></label>{variantForm.fulfillmentMode === "SINGLE_SHARED" && <label className="wide">URL atau kode tunggal<input required value={variantForm.sharedDeliveryValue} onChange={(event) => setVariantForm({ ...variantForm, sharedDeliveryValue: event.target.value })} placeholder="https://… atau KODE-ACCESS" /></label>}{variantForm.fulfillmentMode === "UNIQUE_POOL" && <label className="wide">Pool akses unik (satu baris = satu URL/kode)<textarea required value={variantForm.entries} onChange={(event) => setVariantForm({ ...variantForm, entries: event.target.value })} placeholder={"https://akses-unik-1\nhttps://akses-unik-2"} rows={6} /></label>}<button className="store-button store-button-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan varian"}</button></form>
  </section>;
}
