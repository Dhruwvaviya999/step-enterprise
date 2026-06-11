const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const num = new Intl.NumberFormat("en-IN");

export const formatMoney = (n: number) => inr.format(n);
export const formatMoneyCompact = (n: number) => inrCompact.format(n);
export const formatNumber = (n: number) => num.format(n);
