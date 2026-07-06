import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Contracts() {
  const [rows, setRows] = useState([]);
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");

  const load = () => api.getContracts().then(setRows).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!company || !value) return;
    await api.signContract(company, parseFloat(value), "signed");
    setCompany("");
    setValue("");
    load();
  };

  return (
    <section className="panel">
      <h2>Deals & Contracts</h2>

      <form className="contract-form" onSubmit={submit}>
        <input
          placeholder="Company name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          type="number"
          placeholder="Contract value ($)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Sign Contract</button>
      </form>

      <table className="contracts-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Value</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.company}</td>
              <td>${c.value.toLocaleString()}</td>
              <td>
                <span className={"badge " + c.status}>{c.status}</span>
              </td>
              <td>{new Date(c.signed_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
