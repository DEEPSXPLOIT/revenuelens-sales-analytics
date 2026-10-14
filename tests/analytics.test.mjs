import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
const load = async (path) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        await readFile(new URL(path, import.meta.url), "utf8"),
      ).toString("base64")
  );
const a = await load("../src/lib/projectAnalytics.js");
const d = await load("../src/data/demoData.js");
test("CSV handles BOM, CRLF, escaped quotes, commas, and multiline fields", () => {
  const rows = a.parseCSV(
    '\uFEFFid,note\r\n1,"Hello, ""world"""\r\n2,"two\nlines"\r\n',
  );
  assert.deepEqual(rows, [
    { id: "1", note: 'Hello, "world"' },
    { id: "2", note: "two\nlines" },
  ]);
});
test("CSV rejects duplicate headers, ragged rows, unclosed quotes, trailing quoted garbage, and oversized datasets", () => {
  for (const csv of [
    "id,id\n1,2",
    "id,name\n1",
    'id,name\n1,"bad',
    'id,name\n1,"value"garbage',
  ])
    assert.throws(() => a.parseCSV(csv));
  assert.throws(
    () =>
      a.parseCSV("id\n" + Array.from({ length: 2001 }, (_, i) => i).join("\n")),
    /2,000/,
  );
});
test("CSV export escapes quotes and neutralizes formula prefixes", () => {
  const csv = a.toCSV([{ name: "=SUM(A1:A2)", note: 'Hello, "world"' }]);
  assert.equal(a.parseCSV(csv)[0].name, "'=SUM(A1:A2)");
  assert.equal(a.parseCSV(csv)[0].note, 'Hello, "world"');
});
test("Sales uses distinct order IDs, sums order lines, and recalculates regional metrics", () => {
  const rows = a.validateSales(a.parseCSV(d.salesCSV));
  const report = a.analyzeSales(rows);
  assert.equal(report.revenue, 760000);
  assert.equal(report.orders, 11);
  assert.equal(report.units, 46);
  assert.equal(report.monthly.length, 6);
  const south = a.analyzeSales(rows, "South");
  assert.equal(south.revenue, 330000);
  assert.equal(south.orders, 5);
  assert.equal(south.averageOrderValue, 66000);
  const empty = a.analyzeSales(rows, "None");
  assert.equal(empty.averageOrderValue, 0);
});
test("Sales validation rejects invalid dates, blank/negative prices, fractional quantities, and nonfinite revenue", () => {
  const base = {
    order_id: "1",
    date: "2026-01-01",
    region: "South",
    product: "Laptop",
    quantity: "1",
    unit_price: "5",
  };
  for (const change of [
    { date: "2026-02-30" },
    { unit_price: "" },
    { unit_price: "-1" },
    { quantity: "1.5" },
    { quantity: "1e308", unit_price: "1e308" },
  ])
    assert.throws(() => a.validateSales([{ ...base, ...change }]));
});
test("Uploaded product names cannot collide with inherited object keys", () => {
  const rows = a.validateSales([
    {
      order_id: "1",
      date: "2026-01-01",
      region: "South",
      product: "__proto__",
      quantity: "2",
      unit_price: "10",
    },
    {
      order_id: "2",
      date: "2026-01-01",
      region: "South",
      product: "constructor",
      quantity: "1",
      unit_price: "5",
    },
  ]);
  const report = a.analyzeSales(rows);
  assert.equal(report.revenue, 25);
  assert.equal(report.products.length, 2);
  assert.equal(report.products[0].revenue, 20);
});
