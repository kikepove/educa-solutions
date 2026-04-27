export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Recuperar Contraseña</h1>
        <p className="text-slate-600 text-center mb-8">
          Contacta con el administrador de tu centro para restablecer tu contraseña.
        </p>
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-slate-600">
            O{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700">
              Volver al login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
