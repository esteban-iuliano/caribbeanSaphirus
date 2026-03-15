/**
 * Login.jsx — Sprint C
 *
 * Pantalla de autenticación. Muestra el botón de Google Sign-In.
 * Llama a signIn(credential) del AuthContext y redirige a "/" si ok.
 * Si el email no está en CS_Vendedores, muestra error sin crashear.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn }     = useAuth();
  const navigate       = useNavigate();
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSuccess(credentialResponse) {
    setError(null);
    setLoading(true);
    try {
      await signIn(credentialResponse.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  function handleError() {
    setError('No se pudo conectar con Google. Intentá de nuevo.');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-white">

      {/* Logo / marca */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🌴</div>
        <h1 className="text-2xl font-bold text-brand-700 tracking-tight">
          CaribbeanSaphirus
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistema de pedidos
        </p>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-sm">

        <p className="text-sm text-slate-600 text-center">
          Iniciá sesión con tu cuenta de Google autorizada
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-block w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            Verificando acceso…
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            locale="es"
            shape="rectangular"
            theme="outline"
            size="large"
            text="signin_with"
            prompt="select_account"
          />
        )}

        {/* Error de autorización */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-8 text-center">
        Solo usuarios autorizados pueden acceder.
      </p>
    </div>
  );
}
