import { Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav.jsx';
import Header from './components/layout/Header.jsx';
import Inicio from './screens/Inicio.jsx';
import NuevoPedido from './screens/NuevoPedido.jsx';
import Resultado from './screens/Resultado.jsx';
import Consolidado from './screens/Consolidado.jsx';
import Historial from './screens/Historial.jsx';

export default function App() {
  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-xl">
      <Header />

      <main className="flex-1 overflow-y-auto pb-safe">
        <Routes>
          <Route path="/"            element={<Inicio />} />
          <Route path="/nuevo"       element={<NuevoPedido />} />
          <Route path="/resultado"   element={<Resultado />} />
          <Route path="/consolidado" element={<Consolidado />} />
          <Route path="/historial"   element={<Historial />} />
          {/* fallback */}
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}
