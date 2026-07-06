import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);

  const load = () => api.getAnalytics().then(setData).catch(console.error);
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <p className="empty">Loading analytics...</p>;

  const cats = Object.entries(data.by_category || {});
  const maxCat = Math.max(1, ...cats.map(([, v]) => v));

  return (
    <section className="panel">
      <h2>Sales Analytics</h2>
      <div className="stats">
        <Stat label="Items Sold" value={data.items_sold} />
        <Stat label="Items Shipped" value={data.items_shipped} />
        <Stat label="Revenue" value={`$${data.revenue.toLocaleString()}`} />
        <Stat label="Deals in Pipeline" value={data.deals} />
        <Stat label="Contracts Signed" value={data.contracts_signed} />
        <Stat
          label="Contract Value"
          value={`$${data.contract_value.toLocaleString()}`}
        />
      </div>

      <h3>Units sold by category</h3>
      <div className="bars">
        {cats.map(([cat, val]) => (
          <div key={cat} className="bar-row">
            <span className="bar-label">{cat}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(val / maxCat) * 100}%` }}>
                {val}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


