"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicCategory, PublicProduct } from "@/lib/catalog";

type CatalogBrowserProps = {
  categories: PublicCategory[];
  products: PublicProduct[];
};

export function CatalogBrowser({ categories, products }: CatalogBrowserProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.categorySlug) {
        counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
      }
    }
    return counts;
  }, [products]);

  const visibleProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.categorySlug === activeCategory);

  return (
    <>
      <div className="category-row" aria-label="Filter kategori katalog">
        <button
          type="button"
          className={activeCategory === "all" ? "active" : undefined}
          aria-pressed={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        >
          Semua produk <b>{products.length}</b>
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={activeCategory === category.slug ? "active" : undefined}
            aria-pressed={activeCategory === category.slug}
            onClick={() => setActiveCategory(category.slug)}
          >
            {category.name} <b>{productCounts.get(category.slug) ?? 0}</b>
          </button>
        ))}
      </div>

      {visibleProducts.length ? (
        <div className="product-grid catalog-product-grid" aria-live="polite">
          {visibleProducts.map((product) => {
            const available = product.variants.some((variant) => variant.available);
            const isGpt = product.categorySlug === "chatgpt-plus" || product.slug === "chatgpt-plus";
            return (
              <article className="product-card" key={product.id}>
                <div className="product-card-top">
                  <span className="product-icon cyan" aria-hidden="true">✦</span>
                  <span className={`availability ${available ? "ready" : "upcoming"}`}>
                    <i aria-hidden="true" />{available ? "Tersedia" : "Sold out"}
                  </span>
                </div>
                <p className="product-category">{product.category ?? "Produk digital"}</p>
                <h3>{product.name}</h3>
                <p className="product-description">{product.shortDescription}</p>
                <Link className="product-link" href={isGpt ? "/gpt" : `/produk/${product.slug}`}>
                  {isGpt ? "Lihat paket" : "Pilih produk"} <span aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="catalog-empty" aria-live="polite">
          <span aria-hidden="true">◇</span>
          <div>
            <h3>Belum ada produk di kategori ini.</h3>
            <p>Produk akan tampil otomatis setelah dipublikasikan dan memiliki varian aktif.</p>
          </div>
        </div>
      )}
    </>
  );
}
