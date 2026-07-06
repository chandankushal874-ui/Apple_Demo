import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import CinematicBackground from "./webgl/CinematicBackground.jsx";
import Navbar from "./components/Navbar.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import Cart from "./components/Cart.jsx";
import Analytics from "./components/Analytics.jsx";
import Contracts from "./components/Contracts.jsx";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {product, quantity}
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("store"); // store | analytics
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [intro, setIntro] = useState(true);

  const loadProducts = () => api.getProducts().then(setProducts).catch(console.error);

  useEffect(() => {
    loadProducts();
    const t = setTimeout(() => setIntro(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to bag`);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === id ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id) =>
    setCart((prev) => prev.filter((i) => i.product.id !== id));

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const checkout = async () => {
    if (!cart.length) return;
    const items = cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
    try {
      const res = await api.checkout(items);
      showToast(`Order #${res.order_id} placed - $${res.total.toFixed(2)}`);
      setCart([]);
      setCartOpen(false);
      loadProducts();
    } catch (e) {
      showToast("Checkout failed");
    }
  };

  const categories = ["All", "iPhone", "iPad", "Mac"];
  const filtered = useMemo(
    () => (category === "All" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const featured = useMemo(() => {
    if (!products.length) return null;
    return products.reduce((a, b) => (b.price > a.price ? b : a), products[0]);
  }, [products]);

  return (
    <div className="app">
      <CinematicBackground />
      <div className="grade" />
      <div className="grain" />
      <div className="vignette" />
      <div className={"letterbox top" + (intro ? " show" : "")} />
      <div className={"letterbox bottom" + (intro ? " show" : "")} />

      <Navbar
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        view={view}
        setView={setView}
      />

      {view === "store" && (
        <>
          <header className="hero">
            <div className="hero-copy">
              <span className="eyebrow">Apple Store</span>
              <h1 className="hero-title">The future,<br />in your hands.</h1>
              <p className="hero-sub">
                A cinematic way to explore the products you love.
              </p>
              <button
                className="hero-cta"
                onClick={() =>
                  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore the lineup
              </button>
            </div>

            {featured && (
              <div className="hero-stage">
                <div className="hero-ring" />
                <div className="hero-ring ring2" />
                <div className="hero-device">
                  <div
                    className="hero-device-face"
                    style={{ backgroundImage: `url(${featured.image})` }}
                  />
                </div>
                <div
                  className="hero-device-reflect"
                  style={{ backgroundImage: `url(${featured.image})` }}
                />
                <div className="hero-featured-tag">
                  {featured.name} - ${featured.price.toLocaleString()}
                </div>
              </div>
            )}
          </header>

          <div id="catalog" className="filters">
            {categories.map((c) => (
              <button
                key={c}
                className={"chip" + (category === c ? " active" : "")}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <ProductGrid products={filtered} onAdd={addToCart} />
        </>
      )}

      {view === "analytics" && (
        <div className="dashboard">
          <Analytics />
          <Contracts />
        </div>
      )}

      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        updateQty={updateQty}
        removeItem={removeItem}
        onCheckout={checkout}
      />

      {toast && <div className="toast">{toast}</div>}

      <footer className="footer">
        Apple Demo Store - cinematic build for testing the Ollabear widget only.
        Not affiliated with Apple Inc.
      </footer>
    </div>
  );
}
