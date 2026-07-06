import React from "react";

export default function Cart({ open, onClose, cart, updateQty, removeItem, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  return (
    <>
      <div className={"overlay" + (open ? " show" : "")} onClick={onClose} />
      <aside className={"cart-panel" + (open ? " open" : "")}>
        <div className="cart-head">
          <h2>Your Bag</h2>
          <button className="close" onClick={onClose}>&times;</button>
        </div>

        {cart.length === 0 ? (
          <p className="empty">Your bag is empty.</p>
        ) : (
          <div className="cart-items">
            {cart.map((i) => (
              <div key={i.product.id} className="cart-item">
                <div
                  className="cart-thumb"
                  style={{ backgroundImage: `url(${i.product.image})` }}
                />
                <div className="cart-info">
                  <strong>{i.product.name}</strong>
                  <span className="muted">${i.product.price.toLocaleString()}</span>
                  <div className="qty">
                    <button onClick={() => updateQty(i.product.id, -1)}>-</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => updateQty(i.product.id, 1)}>+</button>
                    <button className="remove" onClick={() => removeItem(i.product.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-foot">
          <div className="total-row">
            <span>Total</span>
            <strong>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <button className="checkout-btn" disabled={!cart.length} onClick={onCheckout}>
            Check Out
          </button>
        </div>
      </aside>
    </>
  );
}
