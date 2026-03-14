/**
 * Badge.jsx
 * Componente de badge reutilizable.
 * @param {string} className  clases Tailwind de color (ej: "bg-blue-100 text-blue-800")
 * @param {string} children
 */
export default function Badge({ className = '', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
