/**
 * NuevoPedido.jsx
 * Paso 1: seleccionar cliente.
 * Paso 2: ingresar texto libre o imagen.
 * Al parsear → navega a /resultado.
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { parsearPedido, parsearImagen, compressImage } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

export default function NuevoPedido() {
  const { state, actions } = useApp();
  const { loading, error, call } = useApi();
  const navigate = useNavigate();

  const [paso, setPaso]           = useState(1);
  const [textoPedido, setTexto]   = useState('');
  const [busqueda, setBusqueda]   = useState('');
  const [preview, setPreview]     = useState(null);
  const [imagenB64, setImagenB64] = useState(null);
  const fileRef = useRef();

  // ── Paso 1: selección de cliente ─────────────────────────────────────────
  const clientesFiltrados = (state.clientes ?? []).filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarCliente = (cliente) => {
    actions.setCliente(cliente);
    setPaso(2);
  };

  // ── Paso 2: imagen ────────────────────────────────────────────────────────
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const b64 = await compressImage(file);
    setImagenB64(b64);
    setTexto('');
  };

  // ── Parsear ───────────────────────────────────────────────────────────────
  const handleParsear = async () => {
    const clienteId = state.clienteSeleccionado?.id;
    if (!clienteId) return;

    let res;
    if (imagenB64) {
      res = await call(() => parsearImagen(clienteId, imagenB64));
    } else {
      if (!textoPedido.trim()) return;
      res = await call(() => parsearPedido(clienteId, textoPedido));
    }

    if (res?.items) {
      actions.setPedidoParsado({ items: res.items, rawText: textoPedido, clienteId });
      navigate('/resultado');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <Loader message="Parseando pedido…" />;

  return (
    <div className="p-4 space-y-4">

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 text-sm">
        <StepDot n={1} active={paso === 1} done={paso > 1} label="Cliente" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot n={2} active={paso === 2} done={false} label="Pedido" />
      </div>

      {/* ── PASO 1 ── */}
      {paso === 1 && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Buscar cliente…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {state.loading ? (
            <Loader message="Cargando clientes…" />
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {clientesFiltrados.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => seleccionarCliente(c)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 transition-colors"
                  >
                    <div className="font-medium text-slate-800 text-sm">{c.nombre}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.id} · {c.canal} · {c.segmento}</div>
                  </button>
                </li>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">Sin resultados</p>
              )}
            </ul>
          )}
        </div>
      )}

      {/* ── PASO 2 ── */}
      {paso === 2 && (
        <div className="space-y-4">
          {/* Cambiar cliente */}
          <button
            onClick={() => { setPaso(1); setTexto(''); setPreview(null); setImagenB64(null); }}
            className="text-sm text-brand-700 underline"
          >
            ← Cambiar cliente
          </button>

          {/* Área de texto */}
          <textarea
            rows={6}
            placeholder={"Pegá el texto del pedido de WhatsApp...\nEj: 3 vainilla, 2 lavanda aerosol"}
            value={textoPedido}
            onChange={e => { setTexto(e.target.value); setPreview(null); setImagenB64(null); }}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-slate-200" />
            <span>ó</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Botón imagen */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl py-4 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            📷 Seleccionar foto del pedido
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          {/* Preview imagen */}
          {preview && (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full rounded-xl object-cover max-h-48" />
              <button
                onClick={() => { setPreview(null); setImagenB64(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
              >✕</button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Botón parsear */}
          <button
            onClick={handleParsear}
            disabled={!textoPedido.trim() && !imagenB64}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-colors"
          >
            🔍 Parsear Pedido
          </button>
        </div>
      )}
    </div>
  );
}

function StepDot({ n, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        done   ? 'bg-brand-600 text-white' :
        active ? 'bg-brand-700 text-white' :
                 'bg-slate-200 text-slate-400'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-xs ${active ? 'text-brand-700 font-medium' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
