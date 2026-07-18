"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Variant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  duration: string | null;
  warranty: string | null;
  channel: string | null;
  estimatedProcess: string | null;
  fulfillmentMode: "MANUAL_WHATSAPP" | "SINGLE_SHARED" | "UNIQUE_POOL";
  status: "ACTIVE" | "DISABLED" | "ARCHIVED";
  sharedDeliveryLabel: string | null;
  sharedDeliveryConfigured: boolean;
  availableInventory: number;
  reservedInventory: number;
  deliveredInventory: number;
};

type Product = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  availabilityMode: "AUTO" | "FORCE_AVAILABLE" | "FORCE_SOLD_OUT";
  featured: boolean;
  variants: Variant[];
};

type Category = { id: string; name: string; slug: string; description: string | null; sortOrder: number; hidden: boolean };

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const initialProduct = { name: "", slug: "", shortDescription: "", description: "", publicationStatus: "DRAFT", categoryId: "" };
const initialCategory = { name: "", slug: "", description: "", sortOrder: 0, hidden: false };
const initialVariant = { productId: "", sku: "", name: "", price: "", compareAtPrice: "", duration: "", warranty: "", channel: "", estimatedProcess: "", fulfillmentMode: "MANUAL_WHATSAPP", sharedDeliveryLabel: "", sharedDeliveryValue: "", entries: "" };

async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Permintaan gagal diproses.");
  return data;
}

export function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productForm, setProductForm] = useState(initialProduct);
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [variantForm, setVariantForm] = useState(initialVariant);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [sharedDeliveryReplacement, setSharedDeliveryReplacement] = useState("");
  const [inventoryEntries, setInventoryEntries] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        jsonRequest("/api/admin/products"),
        jsonRequest("/api/admin/categories"),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Data katalog gagal dimuat.");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const gptProduct = products.find((product) => product.slug === "chatgpt-plus" || product.categorySlug === "chatgpt-plus");
  const visibleProducts = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase();
    return !query || `${product.name} ${product.slug} ${product.categoryName || ""}`.toLowerCase().includes(query);
  }), [products, search]);

  function start(message = "") { setBusy(true); setError(""); setNotice(message); }
  function fail(requestError: unknown) { setError(requestError instanceof Error ? requestError.message : "Terjadi kesalahan."); setBusy(false); }
  function done(message: string) { setNotice(message); setError(""); setBusy(false); void refresh(); }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); start();
    try {
      await jsonRequest("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...productForm, categoryId: productForm.categoryId || null }) });
      setProductForm(initialProduct); done("Produk baru berhasil dibuat.");
    } catch (requestError) { fail(requestError); }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingProduct) return; start();
    try {
      await jsonRequest(`/api/admin/products/${editingProduct.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        name: editingProduct.name,
        slug: editingProduct.slug,
        shortDescription: editingProduct.shortDescription,
        description: editingProduct.description,
        categoryId: editingProduct.categoryId,
        publicationStatus: editingProduct.publicationStatus,
        availabilityMode: editingProduct.availabilityMode,
        featured: editingProduct.featured,
      }) });
      setEditingProduct(null); done("Perubahan produk disimpan.");
    } catch (requestError) { fail(requestError); }
  }

  async function patchProduct(product: Product, payload: Partial<Product>, message: string) {
    start();
    try { await jsonRequest(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); done(message); }
    catch (requestError) { fail(requestError); }
  }

  async function archiveProduct(product: Product) {
    if (!window.confirm(`Arsipkan ${product.name}? Produk dan seluruh variannya tidak akan tampil di toko.`)) return;
    start();
    try { await jsonRequest(`/api/admin/products/${product.id}`, { method: "DELETE" }); done("Produk berhasil diarsipkan tanpa menghapus histori order."); }
    catch (requestError) { fail(requestError); }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); start();
    try {
      await jsonRequest("/api/admin/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(categoryForm) });
      setCategoryForm(initialCategory); done("Kategori berhasil dibuat.");
    } catch (requestError) { fail(requestError); }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingCategory) return; start();
    try {
      await jsonRequest(`/api/admin/categories/${editingCategory.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || null,
        sortOrder: Number(editingCategory.sortOrder),
        hidden: editingCategory.hidden,
      }) });
      setEditingCategory(null); done("Kategori diperbarui.");
    }
    catch (requestError) { fail(requestError); }
  }

  async function toggleCategory(category: Category) {
    start();
    try { await jsonRequest(`/api/admin/categories/${category.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ hidden: !category.hidden }) }); done(category.hidden ? "Kategori ditampilkan." : "Kategori disembunyikan dari toko."); }
    catch (requestError) { fail(requestError); }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Hapus kategori ${category.name}?`)) return;
    start();
    try { await jsonRequest(`/api/admin/categories/${category.id}`, { method: "DELETE" }); done("Kategori kosong berhasil dihapus."); }
    catch (requestError) { fail(requestError); }
  }

  async function createVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); start();
    try {
      const payload = {
        ...variantForm,
        price: Number(variantForm.price),
        compareAtPrice: variantForm.compareAtPrice ? Number(variantForm.compareAtPrice) : null,
        sharedDeliveryValue: variantForm.sharedDeliveryValue || undefined,
      };
      const variant = await jsonRequest("/api/admin/variants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (variantForm.fulfillmentMode === "UNIQUE_POOL" && variantForm.entries.trim()) {
        const imported = await jsonRequest(`/api/admin/variants/${variant.id}/inventory`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entries: variantForm.entries }) });
        setVariantForm(initialVariant); done(`Varian dibuat dan ${imported.imported} kode unik diimpor.`); return;
      }
      setVariantForm(initialVariant); done("Varian baru berhasil dibuat.");
    } catch (requestError) { fail(requestError); }
  }

  async function saveVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingVariant) return; start();
    try {
      const payload: Record<string, unknown> = {
        sku: editingVariant.sku,
        name: editingVariant.name,
        price: Number(editingVariant.price),
        compareAtPrice: editingVariant.compareAtPrice ? Number(editingVariant.compareAtPrice) : null,
        duration: editingVariant.duration || null,
        warranty: editingVariant.warranty || null,
        channel: editingVariant.channel || null,
        estimatedProcess: editingVariant.estimatedProcess || null,
        fulfillmentMode: editingVariant.fulfillmentMode,
        status: editingVariant.status,
        sharedDeliveryLabel: editingVariant.sharedDeliveryLabel || null,
      };
      if (sharedDeliveryReplacement.trim()) payload.sharedDeliveryValue = sharedDeliveryReplacement.trim();
      await jsonRequest(`/api/admin/variants/${editingVariant.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (editingVariant.fulfillmentMode === "UNIQUE_POOL" && inventoryEntries.trim()) {
        const imported = await jsonRequest(`/api/admin/variants/${editingVariant.id}/inventory`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entries: inventoryEntries }) });
        setEditingVariant(null); setSharedDeliveryReplacement(""); setInventoryEntries(""); done(`Paket diperbarui dan ${imported.imported} akses unik ditambahkan.`); return;
      }
      setEditingVariant(null); setSharedDeliveryReplacement(""); setInventoryEntries(""); done("Paket berhasil diperbarui.");
    } catch (requestError) { fail(requestError); }
  }

  function openVariantEditor(variant: Variant) {
    setEditingVariant({ ...variant });
    setSharedDeliveryReplacement("");
    setInventoryEntries("");
  }

  async function toggleVariant(variant: Variant) {
    const next = variant.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    start();
    try { await jsonRequest(`/api/admin/variants/${variant.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) }); done(next === "ACTIVE" ? "Paket sekarang tersedia." : "Paket ditandai tidak tersedia."); }
    catch (requestError) { fail(requestError); }
  }

  async function archiveVariant(variant: Variant) {
    if (!window.confirm(`Arsipkan paket ${variant.sku}? Histori order tetap disimpan.`)) return;
    start();
    try { await jsonRequest(`/api/admin/variants/${variant.id}`, { method: "DELETE" }); done("Paket berhasil diarsipkan."); }
    catch (requestError) { fail(requestError); }
  }

  return <>
    {(notice || error) && <div className={`admin-toast ${error ? "error" : "success"}`} role="status"><span>{error || notice}</span><button onClick={() => { setError(""); setNotice(""); }}>×</button></div>}

    <section className="admin-section admin-category-section" id="categories">
      <div className="admin-section-title compact"><div><p className="eyebrow">CATEGORY CRUD</p><h2>Kategori katalog</h2></div><p>Kategori mengatur filter di beranda. Urutan lebih kecil tampil lebih dahulu; kategori tersembunyi tidak muncul di storefront.</p></div>
      <div className="admin-category-grid">{categories.map((category) => <article key={category.id}><header><span className={`status-dot ${category.hidden ? "danger" : "success"}`} /><b>{category.name}</b></header><code>/{category.slug}</code><p>{category.description || "Belum ada deskripsi."}</p><small>Urutan {category.sortOrder} · {products.filter((product) => product.categoryId === category.id).length} produk · {category.hidden ? "Disembunyikan" : "Tampil di toko"}</small><footer><button onClick={() => setEditingCategory({ ...category })}>Edit lengkap</button><button onClick={() => void toggleCategory(category)}>{category.hidden ? "Tampilkan" : "Sembunyikan"}</button><button className="danger" onClick={() => void deleteCategory(category)}>Hapus</button></footer></article>)}</div>
      <details className="admin-create-drawer admin-category-create"><summary><span>Tambah kategori baru</span><small>Menjadi filter katalog di halaman utama</small></summary><form className="admin-product-form" onSubmit={createCategory}><label>Nama kategori<input required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Template & Produktivitas" /></label><label>Slug<input required pattern="[a-z0-9-]+" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="template-produktivitas" /></label><label className="wide">Deskripsi<textarea rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label><label>Urutan tampil<input type="number" min="-999" max="999" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })} /></label><label className="admin-checkbox"><input type="checkbox" checked={categoryForm.hidden} onChange={(event) => setCategoryForm({ ...categoryForm, hidden: event.target.checked })} />Sembunyikan dari storefront</label><button className="admin-primary-button" disabled={busy}>{busy ? "Menyimpan…" : "Tambah kategori"}</button></form></details>
    </section>

    <section className="admin-section" id="gpt-products">
      <div className="admin-section-title compact"><div><p className="eyebrow">DEDICATED CATALOG</p><h2>Paket ChatGPT Plus</h2></div><p>Ketiga paket di bawah adalah varian yang tampil langsung di <code>/gpt</code>. Status dapat diubah tanpa menyentuh halaman panduan.</p></div>
      {gptProduct ? <>
        <div className="gpt-admin-toolbar"><div><span>Status halaman</span><strong>{gptProduct.publicationStatus}</strong></div><div><span>Ketersediaan global</span><strong>{gptProduct.availabilityMode === "FORCE_SOLD_OUT" ? "SOLD OUT" : "AKTIF"}</strong></div><button onClick={() => void patchProduct(gptProduct, { availabilityMode: gptProduct.availabilityMode === "FORCE_SOLD_OUT" ? "AUTO" : "FORCE_SOLD_OUT" }, gptProduct.availabilityMode === "FORCE_SOLD_OUT" ? "Semua paket GPT kembali mengikuti status per paket." : "Seluruh paket GPT ditandai sold out.")}>{gptProduct.availabilityMode === "FORCE_SOLD_OUT" ? "Aktifkan semua" : "Sold out semua"}</button></div>
        <div className="admin-gpt-grid">{gptProduct.variants.filter((variant) => variant.status !== "ARCHIVED").map((variant) => <article key={variant.id} className={variant.status === "ACTIVE" ? "is-active" : "is-disabled"}>
          <header><b>{variant.sku}</b><span className={`status-pill ${variant.status === "ACTIVE" ? "success" : "danger"}`}>{variant.status === "ACTIVE" ? "Tersedia" : "Tidak tersedia"}</span></header>
          <h3>{variant.name}</h3><p>{variant.channel || "Channel belum diisi"}</p>
          <strong className="admin-package-price">{rupiah.format(variant.price)}</strong>
          <dl><div><dt>Durasi</dt><dd>{variant.duration || "-"}</dd></div><div><dt>Garansi</dt><dd>{variant.warranty || "-"}</dd></div><div><dt>Fulfilment</dt><dd>{variant.fulfillmentMode.replaceAll("_", " ")}</dd></div>{variant.fulfillmentMode === "UNIQUE_POOL" && <div><dt>Stok unik</dt><dd>{variant.availableInventory} tersedia · {variant.reservedInventory} dipesan · {variant.deliveredInventory} terkirim</dd></div>}</dl>
          <footer><button onClick={() => openVariantEditor(variant)}>Edit</button><button onClick={() => void toggleVariant(variant)}>{variant.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</button><button className="danger" onClick={() => void archiveVariant(variant)}>Hapus</button></footer>
        </article>)}</div>
      </> : <div className="admin-empty-state"><strong>Produk ChatGPT belum ditemukan.</strong><p>Starter catalog akan dibuat otomatis saat Docker lokal menggunakan AUTO_SEED_CATALOG=true.</p></div>}
    </section>

    <section className="admin-section" id="products">
      <div className="admin-section-title compact"><div><p className="eyebrow">CATALOG CRUD</p><h2>Semua produk</h2></div><p>{products.length} produk tercatat, termasuk draft dan arsip.</p></div>
      <div className="admin-list-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, slug, atau kategori…" /><a href="#create-product">+ Produk baru</a></div>
      <div className="admin-product-table-wrap"><table className="admin-table product-admin-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Varian</th><th>Publikasi</th><th>Ketersediaan</th><th>Aksi</th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>/{product.slug}</small></td><td>{product.categoryName || "Tanpa kategori"}</td><td>{product.variants.filter((variant) => variant.status !== "ARCHIVED").length}</td><td><span className={`status-pill ${product.publicationStatus === "PUBLISHED" ? "success" : product.publicationStatus === "DRAFT" ? "warning" : "danger"}`}>{product.publicationStatus}</span></td><td><select aria-label={`Ketersediaan ${product.name}`} value={product.availabilityMode} onChange={(event) => void patchProduct(product, { availabilityMode: event.target.value as Product["availabilityMode"] }, "Ketersediaan produk diperbarui.")}><option value="AUTO">Otomatis</option><option value="FORCE_AVAILABLE">Tersedia</option><option value="FORCE_SOLD_OUT">Sold out</option></select></td><td><div className="table-actions"><button onClick={() => setEditingProduct({ ...product })}>Edit</button><button onClick={() => void patchProduct(product, { publicationStatus: product.publicationStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }, "Status publikasi diperbarui.")}>{product.publicationStatus === "PUBLISHED" ? "Draft" : "Publish"}</button><button className="danger" onClick={() => void archiveProduct(product)}>Hapus</button></div></td></tr>)}</tbody></table></div>

      <details className="admin-create-drawer" id="create-product"><summary><span>Tambah produk baru</span><small>Nama, kategori, dan status publikasi</small></summary><form className="admin-product-form" onSubmit={createProduct}><label>Nama produk<input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label><label>Slug<input required pattern="[a-z0-9-]+" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label><label className="wide">Deskripsi singkat<input required value={productForm.shortDescription} onChange={(event) => setProductForm({ ...productForm, shortDescription: event.target.value })} /></label><label className="wide">Deskripsi lengkap<textarea rows={4} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label><label>Kategori<select value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}><option value="">Tanpa kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Status awal<select value={productForm.publicationStatus} onChange={(event) => setProductForm({ ...productForm, publicationStatus: event.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label><button className="admin-primary-button" disabled={busy}>{busy ? "Menyimpan…" : "Simpan produk"}</button></form></details>
    </section>

    <section className="admin-section" id="new-variant">
      <div className="admin-section-title compact"><div><p className="eyebrow">INVENTORY & FULFILMENT</p><h2>Tambah varian atau stok digital</h2></div><p>Manual WhatsApp, satu akses bersama, atau pool kode unik sekali pakai.</p></div>
      <div className="admin-product-table-wrap admin-variant-list"><table className="admin-table product-admin-table"><thead><tr><th>Produk / varian</th><th>Metode kirim</th><th>Konfigurasi / stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{products.flatMap((product) => product.variants.filter((variant) => variant.status !== "ARCHIVED").map((variant) => <tr key={variant.id}><td><strong>{product.name}</strong><small>{variant.sku} · {variant.name}</small></td><td>{variant.fulfillmentMode === "MANUAL_WHATSAPP" ? "WhatsApp manual" : variant.fulfillmentMode === "SINGLE_SHARED" ? "Satu akses bersama" : "Pool akses unik"}</td><td>{variant.fulfillmentMode === "SINGLE_SHARED" ? <><strong>{variant.sharedDeliveryConfigured ? "Secret tersimpan" : "Belum dikonfigurasi"}</strong><small>{variant.sharedDeliveryLabel || "Label akses belum diisi"}</small></> : variant.fulfillmentMode === "UNIQUE_POOL" ? <><strong>{variant.availableInventory} tersedia</strong><small>{variant.reservedInventory} dipesan · {variant.deliveredInventory} terkirim</small></> : <small>Dikirim admin setelah pembeli membuka WhatsApp</small>}</td><td><span className={`status-pill ${variant.status === "ACTIVE" ? "success" : "danger"}`}>{variant.status === "ACTIVE" ? "Tersedia" : "Nonaktif"}</span></td><td><div className="table-actions"><button onClick={() => openVariantEditor(variant)}>Edit & stok</button><button onClick={() => void toggleVariant(variant)}>{variant.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</button><button className="danger" onClick={() => void archiveVariant(variant)}>Arsipkan</button></div></td></tr>))}</tbody></table></div>
      <form className="admin-product-form admin-variant-form" onSubmit={createVariant}>
        <label>Produk<select required value={variantForm.productId} onChange={(event) => setVariantForm({ ...variantForm, productId: event.target.value })}><option value="">Pilih produk</option>{products.filter((product) => product.publicationStatus !== "ARCHIVED").map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <label>SKU<input required value={variantForm.sku} onChange={(event) => setVariantForm({ ...variantForm, sku: event.target.value.toUpperCase() })} placeholder="DIG-001" /></label>
        <label>Nama varian<input required value={variantForm.name} onChange={(event) => setVariantForm({ ...variantForm, name: event.target.value })} /></label>
        <label>Harga<input required type="number" min="0" value={variantForm.price} onChange={(event) => setVariantForm({ ...variantForm, price: event.target.value })} /></label>
        <label>Harga coret<input type="number" min="0" value={variantForm.compareAtPrice} onChange={(event) => setVariantForm({ ...variantForm, compareAtPrice: event.target.value })} /></label>
        <label>Durasi<input value={variantForm.duration} onChange={(event) => setVariantForm({ ...variantForm, duration: event.target.value })} /></label>
        <label>Channel<input value={variantForm.channel} onChange={(event) => setVariantForm({ ...variantForm, channel: event.target.value })} /></label>
        <label>Garansi<input value={variantForm.warranty} onChange={(event) => setVariantForm({ ...variantForm, warranty: event.target.value })} /></label>
        <label className="wide">Estimasi proses<input value={variantForm.estimatedProcess} onChange={(event) => setVariantForm({ ...variantForm, estimatedProcess: event.target.value })} /></label>
        <label className="wide">Metode pengiriman setelah pembayaran<select value={variantForm.fulfillmentMode} onChange={(event) => setVariantForm({ ...variantForm, fulfillmentMode: event.target.value })}><option value="MANUAL_WHATSAPP">1. Hubungi admin melalui WhatsApp</option><option value="SINGLE_SHARED">2. Kirim satu URL/kode yang sama secara otomatis</option><option value="UNIQUE_POOL">3. Ambil satu URL/kode unik dari pool</option></select></label>
        <div className="wide admin-fulfillment-help">
          {variantForm.fulfillmentMode === "MANUAL_WHATSAPP" && <p><strong>Manual WhatsApp:</strong> tombol WhatsApp baru aktif setelah pembayaran sukses. Pembeli menghubungi admin agar kode atau URL dapat dikirim secara manual.</p>}
          {variantForm.fulfillmentMode === "SINGLE_SHARED" && <p><strong>Satu akses bersama:</strong> URL atau kode yang sama langsung ditampilkan kepada setiap pembeli dan dapat dikirim melalui email setelah pembayaran sukses.</p>}
          {variantForm.fulfillmentMode === "UNIQUE_POOL" && <p><strong>Pool akses unik:</strong> sistem mengambil tepat satu baris yang belum terpakai. Akses yang sudah dikirim tidak diberikan ke pembeli berikutnya.</p>}
        </div>
        {variantForm.fulfillmentMode === "SINGLE_SHARED" && <><label>Label tombol/akses<input required value={variantForm.sharedDeliveryLabel} onChange={(event) => setVariantForm({ ...variantForm, sharedDeliveryLabel: event.target.value })} placeholder="Buka template Notion" /></label><label>URL atau kode bersama<input required value={variantForm.sharedDeliveryValue} onChange={(event) => setVariantForm({ ...variantForm, sharedDeliveryValue: event.target.value })} placeholder="https://... atau kode akses" /></label></>}
        {variantForm.fulfillmentMode === "UNIQUE_POOL" && <label className="wide">Stok awal—satu URL/kode per baris<textarea required rows={7} value={variantForm.entries} onChange={(event) => setVariantForm({ ...variantForm, entries: event.target.value })} placeholder={"ACCESS-001\nACCESS-002\nhttps://download.example/item-003"} /></label>}
        <button className="admin-primary-button" disabled={busy}>{busy ? "Menyimpan…" : "Simpan varian"}</button>
      </form>
    </section>

    {editingCategory && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditingCategory(null); }}><form className="admin-edit-modal admin-product-form admin-category-edit" onSubmit={saveCategory}><header className="wide"><div><p className="eyebrow">EDIT CATEGORY</p><h2>{editingCategory.name}</h2></div><button type="button" onClick={() => setEditingCategory(null)}>×</button></header><label>Nama kategori<input required value={editingCategory.name} onChange={(event) => setEditingCategory({ ...editingCategory, name: event.target.value })} /></label><label>Slug<input required pattern="[a-z0-9-]+" value={editingCategory.slug} onChange={(event) => setEditingCategory({ ...editingCategory, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label><label className="wide">Deskripsi<textarea rows={4} maxLength={240} value={editingCategory.description || ""} onChange={(event) => setEditingCategory({ ...editingCategory, description: event.target.value })} /></label><label>Urutan tampil<input type="number" min="-999" max="999" value={editingCategory.sortOrder} onChange={(event) => setEditingCategory({ ...editingCategory, sortOrder: Number(event.target.value) })} /></label><label className="admin-checkbox"><input type="checkbox" checked={editingCategory.hidden} onChange={(event) => setEditingCategory({ ...editingCategory, hidden: event.target.checked })} />Sembunyikan dari storefront</label><button className="admin-primary-button" disabled={busy}>{busy ? "Menyimpan…" : "Simpan kategori"}</button></form></div>}

    {editingProduct && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditingProduct(null); }}><form className="admin-edit-modal admin-product-form" onSubmit={saveProduct}><header className="wide"><div><p className="eyebrow">EDIT PRODUCT</p><h2>{editingProduct.name}</h2></div><button type="button" onClick={() => setEditingProduct(null)}>×</button></header><label>Nama<input required value={editingProduct.name} onChange={(event) => setEditingProduct({ ...editingProduct, name: event.target.value })} /></label><label>Slug<input required value={editingProduct.slug} onChange={(event) => setEditingProduct({ ...editingProduct, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label><label className="wide">Deskripsi singkat<input required value={editingProduct.shortDescription} onChange={(event) => setEditingProduct({ ...editingProduct, shortDescription: event.target.value })} /></label><label className="wide">Deskripsi<textarea rows={4} value={editingProduct.description} onChange={(event) => setEditingProduct({ ...editingProduct, description: event.target.value })} /></label><label>Kategori<select value={editingProduct.categoryId || ""} onChange={(event) => setEditingProduct({ ...editingProduct, categoryId: event.target.value || null })}><option value="">Tanpa kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Publikasi<select value={editingProduct.publicationStatus} onChange={(event) => setEditingProduct({ ...editingProduct, publicationStatus: event.target.value as Product["publicationStatus"] })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label><label>Ketersediaan<select value={editingProduct.availabilityMode} onChange={(event) => setEditingProduct({ ...editingProduct, availabilityMode: event.target.value as Product["availabilityMode"] })}><option value="AUTO">Otomatis</option><option value="FORCE_AVAILABLE">Tersedia</option><option value="FORCE_SOLD_OUT">Sold out</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={editingProduct.featured} onChange={(event) => setEditingProduct({ ...editingProduct, featured: event.target.checked })} />Produk unggulan</label><button className="admin-primary-button" disabled={busy}>Simpan perubahan</button></form></div>}

    {editingVariant && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) { setEditingVariant(null); setSharedDeliveryReplacement(""); setInventoryEntries(""); } }}><form className="admin-edit-modal admin-product-form admin-variant-edit" onSubmit={saveVariant}>
      <header className="wide"><div><p className="eyebrow">EDIT PACKAGE</p><h2>{editingVariant.sku}</h2></div><button type="button" onClick={() => { setEditingVariant(null); setSharedDeliveryReplacement(""); setInventoryEntries(""); }}>×</button></header>
      <label>SKU<input required value={editingVariant.sku} onChange={(event) => setEditingVariant({ ...editingVariant, sku: event.target.value.toUpperCase() })} /></label>
      <label>Status<select value={editingVariant.status} onChange={(event) => setEditingVariant({ ...editingVariant, status: event.target.value as Variant["status"] })}><option value="ACTIVE">Tersedia</option><option value="DISABLED">Tidak tersedia</option><option value="ARCHIVED">Arsip</option></select></label>
      <label className="wide">Nama paket<input required value={editingVariant.name} onChange={(event) => setEditingVariant({ ...editingVariant, name: event.target.value })} /></label>
      <label>Harga<input type="number" min="0" required value={editingVariant.price} onChange={(event) => setEditingVariant({ ...editingVariant, price: Number(event.target.value) })} /></label>
      <label>Harga coret<input type="number" min="0" value={editingVariant.compareAtPrice || ""} onChange={(event) => setEditingVariant({ ...editingVariant, compareAtPrice: event.target.value ? Number(event.target.value) : null })} /></label>
      <label>Channel<input value={editingVariant.channel || ""} onChange={(event) => setEditingVariant({ ...editingVariant, channel: event.target.value })} /></label>
      <label>Durasi<input value={editingVariant.duration || ""} onChange={(event) => setEditingVariant({ ...editingVariant, duration: event.target.value })} /></label>
      <label>Garansi<input value={editingVariant.warranty || ""} onChange={(event) => setEditingVariant({ ...editingVariant, warranty: event.target.value })} /></label>
      <label className="wide">Estimasi proses<input value={editingVariant.estimatedProcess || ""} onChange={(event) => setEditingVariant({ ...editingVariant, estimatedProcess: event.target.value })} /></label>
      <label className="wide">Metode pengiriman setelah pembayaran<select value={editingVariant.fulfillmentMode} onChange={(event) => setEditingVariant({ ...editingVariant, fulfillmentMode: event.target.value as Variant["fulfillmentMode"] })}><option value="MANUAL_WHATSAPP">1. Hubungi admin melalui WhatsApp</option><option value="SINGLE_SHARED">2. Kirim satu URL/kode yang sama secara otomatis</option><option value="UNIQUE_POOL">3. Ambil satu URL/kode unik dari pool</option></select></label>
      {editingVariant.fulfillmentMode === "MANUAL_WHATSAPP" && <div className="wide admin-fulfillment-help"><p><strong>Manual WhatsApp:</strong> setelah pembayaran sukses, pembeli mendapat tombol untuk menghubungi admin. Tidak ada secret yang dikirim otomatis.</p></div>}
      {editingVariant.fulfillmentMode === "SINGLE_SHARED" && <div className="wide admin-fulfillment-config"><div className="admin-fulfillment-help"><p><strong>Satu akses bersama:</strong> akses yang sama ditampilkan di website dan dapat dikirim ke email pembeli. Nilai lama tidak pernah ditampilkan kembali oleh server.</p><p>Status secret: <strong>{editingVariant.sharedDeliveryConfigured ? "Sudah tersimpan" : "Belum diatur"}</strong>.</p></div><label>Label tombol/akses<input required value={editingVariant.sharedDeliveryLabel || ""} onChange={(event) => setEditingVariant({ ...editingVariant, sharedDeliveryLabel: event.target.value })} placeholder="Buka template Notion" /></label><label>Ganti URL atau kode<input required={!editingVariant.sharedDeliveryConfigured} value={sharedDeliveryReplacement} onChange={(event) => setSharedDeliveryReplacement(event.target.value)} placeholder={editingVariant.sharedDeliveryConfigured ? "Kosongkan untuk mempertahankan nilai lama" : "Masukkan URL atau kode"} autoComplete="off" /></label></div>}
      {editingVariant.fulfillmentMode === "UNIQUE_POOL" && <div className="wide admin-fulfillment-config"><div className="admin-fulfillment-help"><p><strong>Pool akses unik:</strong> satu baris diberikan hanya ke satu pembeli. Tambahkan stok baru di bawah; kode lama tidak ditampilkan kembali.</p><p><strong>{editingVariant.availableInventory}</strong> tersedia · <strong>{editingVariant.reservedInventory}</strong> dipesan · <strong>{editingVariant.deliveredInventory}</strong> terkirim</p></div><label>Tambah URL/kode unik—satu per baris<textarea rows={7} value={inventoryEntries} onChange={(event) => setInventoryEntries(event.target.value)} placeholder={"ACCESS-101\nACCESS-102\nhttps://download.example/item-103"} /></label></div>}
      <button className="admin-primary-button" disabled={busy}>{busy ? "Menyimpan…" : "Simpan paket"}</button>
    </form></div>}
  </>;
}
