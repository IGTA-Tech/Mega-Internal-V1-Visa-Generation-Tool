import PetitionGeneratorForm from './components/PetitionGeneratorForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Mega Internal V1 - Visa Petition Generator
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered visa petition document generation for O-1, EB-1A, EB-2 NIW, and P-1 cases
          </p>
        </div>
      </header>

      <main className="py-8">
        <PetitionGeneratorForm />
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Internal Tool - Mega Internal V1 Visa Petition Generator
          </p>
        </div>
      </footer>
    </div>
  );
}
