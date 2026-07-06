import React, { useRef } from "react";

function ProductCard({ p, index, onAdd }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 18;
    const ry = (px - 0.5) * 22;
    el.style.setProperty("--rx", rx.toFixed(2) + "deg");
    el.style.setProperty("--ry", ry.toFixed(2) + "deg");
    el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
    el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
    el.style.setProperty("--mx", ((px - 0.5) * 22).toFixed(1) + "px");
    el.style.setProperty("--my", ((py - 0.5) * 22).toFixed(1) + "px");
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  };

  return (
    <div
      className="card3d"
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ animationDelay: (index % 8) * 70 + "ms" }}
    >
      <div className="card3d-inner">
        <div className="c-glow" />
        <div className="c-stage">
          <div
            className="c-img"
            style={{ backgroundImage: `url(${p.image})` }}
          />
          <div
            className="c-reflection"
            style={{ backgroundImage: `url(${p.image})` }}
          />
        </div>
        <span className="c-tag">{p.category}</span>
        <h3 className="c-title">{p.name}</h3>
        <p className="c-desc">{p.description}</p>
        <div className="c-footer">
          <span className="c-price">${p.price.toLocaleString()}</span>
          <button className="add-btn" onClick={() => onAdd(p)}>
            Add to Cart
          </button>
        </div>
        <div className="c-glare" />
        <div className="c-edge" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, onAdd }) {
  if (!products.length) return <p className="empty">Loading products...</p>;
  return (
    <div className="grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} index={i} onAdd={onAdd} />
      ))}
    </div>
  );
}
