/**
 * INR formatting and date helpers for the frontend
 */

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${num.toLocaleString('en-IN')}`;
  return `₹${num}`;
}

export function formatINRExact(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatWeeklyPremium(amount) {
  return `₹${amount}/week`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatWeekRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: 'numeric', month: 'short' };
  return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', opts)}, ${e.getFullYear()}`;
}

export const ZONE_MAP = {
  'Mumbai': ['Bandra', 'Andheri', 'Powai', 'Dadar', 'Lower Parel'],
  'Delhi': ['Connaught Place', 'Lajpat Nagar', 'Dwarka', 'Saket', 'Noida'],
  'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout'],
  'Chennai': ['T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Mylapore'],
  'Hyderabad': ['Kondapur', 'Gachibowli', 'Banjara Hills', 'Hitech City', 'Kukatpally'],
};
