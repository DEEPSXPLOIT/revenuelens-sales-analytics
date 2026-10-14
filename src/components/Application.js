"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { salesCSV as salesCSV } from "@/data/demoData";
import {
  parseCSV,
  toCSV,
  auditRows,
  validateSales,
  analyzeSales,
  validateLogs,
  analyzeLogs,
  summarizeTickets,
  SLA_HOURS,
} from "@/lib/projectAnalytics";
import { project } from "@/data/project";
const Shell = styled.main`
  max-width: 1120px;
  margin: auto;
  padding: 48px 24px 80px;
  color: ${({ theme }) => theme.colors.text};
  h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    letter-spacing: -0.05em;
    margin: 20px 0;
  }
  h2 {
    font-size: 1.3rem;
    margin-bottom: 18px;
  }
  h3 {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.7;
  }
  a {
    color: ${({ theme }) => theme.colors.accentDark};
  }
  input,
  select {
    font: inherit;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.inputBg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 11px;
    border-radius: 8px;
    min-width: 0;
    width: 100%;
  }
  button {
    color: ${({ theme }) => theme.colors.text};
    padding: 11px 15px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    min-height: 44px;
  }
  button:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  label {
    font-size: 0.8rem;
    display: grid;
    gap: 8px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  code {
    overflow-wrap: anywhere;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.accentDark};
  }
  form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    align-items: end;
  }
`;
const Badge = styled.span`
  display: inline-block;
  padding: 7px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 100px;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.accentDark};
  margin-top: 24px;
`;
const Panel = styled.section`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  margin: 24px 0;
  min-width: 0;
  @media (max-width: 500px) {
    padding: 18px;
  }
`;
const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
  > div {
    min-width: 0;
  }
  ul {
    list-style: disc;
    padding-inline-start: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.9rem;
    line-height: 1.9;
  }
  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;
const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0;
  div {
    padding: 18px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.bgSecondary};
  }
  strong {
    display: block;
    font-size: clamp(1.1rem, 3vw, 1.9rem);
    overflow-wrap: anywhere;
  }
  span {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  @media (max-width: 650px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const Toolbar = styled.div`
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
  label {
    flex: 1;
    min-width: 140px;
  }
  button {
    flex-shrink: 0;
  }
`;
const TableWrap = styled.div`
  overflow-x: auto;
  max-width: 100%;
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  th {
    text-align: start;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  td,
  th {
    padding: 14px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
  }
  td select {
    min-width: 120px;
  }
  caption {
    text-align: start;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    padding: 10px;
  }
  .warn {
    color: #ef9164;
  }
`;
const Notice = styled.p`
  font-size: 0.85rem;
  margin: 12px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;
const Bars = styled.div`
  display: grid;
  gap: 16px;
  div > span {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 6px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  i {
    display: block;
    height: 8px;
    background: linear-gradient(90deg, #818cf8, #38bdf8);
    border-radius: 8px;
  }
`;
const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
function download(name, rows, columns) {
  const blob = new Blob([toCSV(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function MetricRow({ items }) {
  return (
    <Metrics>
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </Metrics>
  );
}
function Table({ rows, columns, caption }) {
  return (
    <TableWrap>
      <table>
        <caption>
          {caption}
          {rows.length > 30
            ? " · Showing first 30 rows; exports include all results."
            : ""}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row, index) => (
            <tr key={index}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Notice>No records match this view.</Notice>}
    </TableWrap>
  );
}
function useLocalRows(key, seed, valid) {
  const [rows, setRows] = useState(() => seed.map((row) => ({ ...row })));
  const [loaded, setLoaded] = useState(false);
  const [storage, setStorage] = useState("Loading browser-local records…");
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(stored) && stored.every(valid)) setRows(stored);
    } catch {}
    setLoaded(true);
  }, [key, valid]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(rows));
      setStorage("Changes saved in this browser only.");
    } catch {
      setStorage(
        "Browser storage is unavailable. Changes will last only for this session.",
      );
    }
  }, [rows, key, loaded]);
  return [
    rows,
    setRows,
    () => setRows(seed.map((row) => ({ ...row }))),
    storage,
    loaded,
  ];
}
const validTicket = (row) =>
  row &&
  typeof row.id === "string" &&
  typeof row.subject === "string" &&
  typeof row.category === "string" &&
  Object.hasOwn(SLA_HOURS, row.priority) &&
  ["Open", "In progress", "Resolved"].includes(row.status) &&
  Number.isFinite(row.ageHours) &&
  row.ageHours >= 0;
const validAsset = (row) =>
  row &&
  ["tag", "owner", "location", "model", "warranty"].every(
    (k) => typeof row[k] === "string",
  ) &&
  ["Deployed", "Available", "Repair", "Retired"].includes(row.status);
function ImportBox({ sample, columns, validate, onRows }) {
  const [message, setMessage] = useState("Sample data loaded.");
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 1000000) throw new Error("Use a CSV smaller than 1 MB.");
      const rows = validate(parseCSV(await file.text()));
      onRows(rows);
      setMessage(`${rows.length} rows loaded from ${file.name}.`);
    } catch (error) {
      setMessage(error.message + " Previous data remains loaded.");
    }
  }
  return (
    <Panel>
      <h2>Choose a dataset</h2>
      <p>
        CSV columns: <code>{columns.join(", ")}</code>
      </p>
      <Toolbar>
        <label>
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={upload} />
        </label>
        <button
          onClick={() => {
            onRows(validate(parseCSV(sample)));
            setMessage("Sample data restored.");
          }}
        >
          Load sample data
        </button>
        <button onClick={() => download("sample-data.csv", parseCSV(sample))}>
          Download sample CSV
        </button>
      </Toolbar>
      <Notice role="status">{message}</Notice>
      <Notice>
        Up to 2,000 rows / 1 MB. Files are read locally and are not uploaded to
        a server. Column names are case-sensitive.
      </Notice>
    </Panel>
  );
}
function SalesDemo() {
  const [rows, setRows] = useState(() => validateSales(parseCSV(salesCSV)));
  const [region, setRegion] = useState("All");
  const report = analyzeSales(rows, region);
  const max = Math.max(1, ...report.monthly.map((row) => row.revenue));
  return (
    <>
      <ImportBox
        sample={salesCSV}
        columns={[
          "order_id",
          "date",
          "region",
          "product",
          "quantity",
          "unit_price",
        ]}
        validate={validateSales}
        onRows={(items) => {
          setRows(items);
          setRegion("All");
        }}
      />
      <Toolbar>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {["All", ...new Set(rows.map((row) => row.region))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() =>
            download("product-performance.csv", report.products, [
              "product",
              "revenue",
              "units",
            ])
          }
        >
          Export product summary
        </button>
        <button
          onClick={() =>
            download("monthly-revenue.csv", report.monthly, [
              "month",
              "revenue",
            ])
          }
        >
          Export monthly summary
        </button>
      </Toolbar>
      <MetricRow
        items={[
          ["Revenue (INR)", currency(report.revenue)],
          ["Distinct orders", report.orders],
          ["Units sold", report.units],
          ["Average order value", currency(report.averageOrderValue)],
        ]}
      />
      <Panel>
        <h2>Monthly revenue</h2>
        <Bars
          role="img"
          aria-label={`Monthly revenue in INR: ${report.monthly.map((row) => row.month + " " + row.revenue).join("; ")}`}
        >
          {report.monthly.map((row) => (
            <div key={row.month}>
              <span>
                <b>{row.month}</b>
                <span>{currency(row.revenue)}</span>
              </span>
              <i style={{ width: `${(row.revenue / max) * 100}%` }} />
            </div>
          ))}
        </Bars>
      </Panel>
      <Panel>
        <h2>Product performance</h2>
        <Table
          caption={`Revenue by product · ${region} regions`}
          rows={report.products}
          columns={[
            { key: "product", label: "Product" },
            {
              key: "revenue",
              label: "Revenue (INR)",
              render: (row) => currency(row.revenue),
            },
            { key: "units", label: "Units" },
          ]}
        />
        <Notice>
          Each CSV row is an order line. Repeated order IDs count once in the
          filtered view. Revenue = quantity × unit price; average order value =
          revenue / distinct order IDs. Dates must use YYYY-MM-DD. Duplicate
          line items are counted as supplied.
        </Notice>
      </Panel>
    </>
  );
}
export default function Application() {
  return (
    <Shell lang="en">
      <header>
        <a
          href="https://github.com/DEEPSXPLOIT/revenuelens-sales-analytics"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub ↗
        </a>
        <p style={{ fontSize: ".8rem", marginTop: 8 }}>
          By Jaideep Mahendra · IT support & data analysis
        </p>
      </header>
      <Badge>Working demo · Synthetic sample data</Badge>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <Columns>
        <div>
          <h3>The problem</h3>
          <p>{project.problem}</p>
          <h3 style={{ marginTop: 20 }}>Approach</h3>
          <p>{project.approach}</p>
        </div>
        <div>
          <h3>Try these features</h3>
          <ul>
            {project.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </Columns>
      <SalesDemo />
      <Panel>
        <h2>Scope and limitations</h2>
        <p>{project.limitations}</p>
        <p style={{ marginTop: 12 }}>
          Independent portfolio project with no employer data.
        </p>
      </Panel>
    </Shell>
  );
}
