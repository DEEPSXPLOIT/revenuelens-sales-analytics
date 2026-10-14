export const project = {
  id: 4,
  slug: "sales-analytics",
  title: "RevenueLens \u2014 Sales Analysis",
  subtitle: "Revenue and regional performance",
  description:
    "Analyze transaction CSVs, filter by region, calculate revenue and order value, and explore monthly and product performance with exportable summaries.",
  category: "Data Analysis",
  tech: ["JavaScript", "Aggregation", "CSV Import", "Charts"],
  problem:
    "Decision makers need consistent sales metrics and visibility into product and regional performance.",
  approach:
    "Validated line items are grouped by order, month, and product. Region filters recalculate metrics and summaries directly from source rows.",
  features: [
    "Upload transaction data using the supplied schema",
    "Filter regions and compare monthly revenue",
    "Calculate distinct orders and average order value",
    "Export product-level revenue and units",
  ],
  limitations:
    "Synthetic sales data; revenue is quantity \u00d7 unit price in INR before taxes, discounts, and refunds. This is descriptive analysis, not a prediction model.",
  image: "/projects/sales-analytics.svg",
  link: "/projects/sales-analytics",
  year: "Portfolio demo",
  github: null,
};
