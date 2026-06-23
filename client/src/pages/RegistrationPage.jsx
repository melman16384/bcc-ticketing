import FormWizard from '../components/form/FormWizard';

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-shore-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 50%, #aed5e8 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
              alt="Beachsportclub Cuxhaven e.V."
              className="h-16 hidden sm:block"
            />
            <img
              src="/favicon.png"
              alt="BCC"
              className="h-14 w-14 rounded-full sm:hidden"
            />
            <div>
              <div className="font-bold text-shore-800 text-lg leading-tight">34. Mahrenholz Beach-Cup 2026</div>
              <div className="text-shore-600 text-sm">Beachsportclub Cuxhaven e.V.</div>
            </div>
          </div>
          <div className="text-2xl hidden sm:block">🏐☀️🌊</div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <FormWizard />
      </div>

      <footer className="text-center text-shore-400 text-xs py-8">
        © 2026 Beachsportclub Cuxhaven e.V. — <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}
