'use client';

import { useState } from 'react';
import { BeneficiaryInfo, BriefType, VisaType } from '@/app/types';

type Step = 'basic' | 'lookup' | 'autofill' | 'upload' | 'generating' | 'complete';

interface LookupResult {
  sources: any[];
  searchStrategy: string;
  totalFound: number;
  confidenceDistribution: any;
  verificationData: any;
}

export default function PetitionGeneratorForm() {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<Partial<BeneficiaryInfo>>({
    briefType: 'comprehensive', // Default to comprehensive
  });
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [autoFillData, setAutoFillData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [caseId, setCaseId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [generatedDocuments, setGeneratedDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  // Step 1: Basic Info
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 1: Basic Information</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Full Name *</label>
        <input
          type="text"
          value={beneficiaryInfo.fullName || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, fullName: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Alex Hale"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Profession *</label>
        <input
          type="text"
          value={beneficiaryInfo.profession || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, profession: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Professional MMA Fighter"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Visa Type *</label>
        <select
          value={beneficiaryInfo.visaType || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, visaType: e.target.value as VisaType })}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="">Select Visa Type</option>
          <option value="O-1A">O-1A (Extraordinary Ability - Sciences, Business, Education, Athletics)</option>
          <option value="O-1B">O-1B (Extraordinary Ability - Arts, Motion Picture/TV)</option>
          <option value="EB-1A">EB-1A (Extraordinary Ability - Green Card)</option>
          <option value="EB-2 NIW">EB-2 NIW (National Interest Waiver)</option>
          <option value="P-1A">P-1A (Internationally Recognized Athlete)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Brief Type *</label>
        <div className="space-y-2">
          <label className="flex items-start space-x-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="briefType"
              value="standard"
              checked={beneficiaryInfo.briefType === 'standard'}
              onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, briefType: e.target.value as BriefType })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Standard Brief (15-20 pages)</div>
              <div className="text-sm text-gray-600">
                Focused analysis of 3-5 strongest criteria. Best for straightforward cases. Faster generation (~10-15 min).
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="briefType"
              value="comprehensive"
              checked={beneficiaryInfo.briefType === 'comprehensive'}
              onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, briefType: e.target.value as BriefType })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Comprehensive Brief (30-50 pages)</div>
              <div className="text-sm text-gray-600">
                Extensive analysis of ALL applicable criteria. Best for complex cases requiring maximum documentation. (~20-30 min).
              </div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Nationality</label>
        <input
          type="text"
          value={beneficiaryInfo.nationality || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, nationality: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Brazilian"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Current Immigration Status</label>
        <input
          type="text"
          value={beneficiaryInfo.currentStatus || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, currentStatus: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., B-2 Tourist Visa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Field of Expertise</label>
        <input
          type="text"
          value={beneficiaryInfo.fieldOfExpertise || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, fieldOfExpertise: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Mixed Martial Arts"
        />
      </div>

      <button
        onClick={() => {
          if (!beneficiaryInfo.fullName || !beneficiaryInfo.profession || !beneficiaryInfo.visaType) {
            setError('Please fill in all required fields (Name, Profession, Visa Type)');
            return;
          }
          setError('');
          setCurrentStep('lookup');
        }}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
      >
        Next: AI Beneficiary Lookup
      </button>
    </div>
  );

  // Step 2: AI Lookup with Confirmation
  const handleAILookup = async () => {
    setLookupLoading(true);
    setError('');
    try {
      const response = await fetch('/api/lookup-beneficiary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: beneficiaryInfo.fullName,
          profession: beneficiaryInfo.profession,
          additionalInfo: beneficiaryInfo.fieldOfExpertise,
        }),
      });

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      const data = await response.json();
      setLookupResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup beneficiary');
    } finally {
      setLookupLoading(false);
    }
  };

  const renderLookupStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 2: AI Beneficiary Lookup</h2>

      {!lookupResult ? (
        <div>
          <p className="mb-4">
            Our AI will search for <strong>{beneficiaryInfo.fullName}</strong> ({beneficiaryInfo.profession})
            across major publications, databases, and media sources.
          </p>

          <button
            onClick={handleAILookup}
            disabled={lookupLoading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {lookupLoading ? 'Searching...' : 'Start AI Lookup'}
          </button>

          <button
            onClick={() => setCurrentStep('autofill')}
            className="w-full mt-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
          >
            Skip Lookup
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <h3 className="font-medium mb-2">✅ Found {lookupResult.totalFound} sources</h3>
            <p className="text-sm text-gray-700">
              Search Strategy: {lookupResult.searchStrategy}
            </p>
          </div>

          <div className="bg-white border rounded-md p-4 mb-4 max-h-96 overflow-y-auto">
            <h4 className="font-medium mb-2">Top Sources:</h4>
            <ul className="space-y-2">
              {lookupResult.sources.slice(0, 10).map((source: any, idx: number) => (
                <li key={idx} className="text-sm">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {source.title}
                  </a>
                  <div className="text-gray-500 text-xs">{source.sourceName} - Tier {source.tier}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Does this information look correct?</p>

            <button
              onClick={() => {
                // Add sources to beneficiaryInfo
                setBeneficiaryInfo({
                  ...beneficiaryInfo,
                  primaryUrls: lookupResult.sources.map(s => s.url),
                });
                setCurrentStep('autofill');
              }}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
            >
              ✓ Yes, Use These Sources
            </button>

            <button
              onClick={() => setLookupResult(null)}
              className="w-full bg-yellow-600 text-white px-6 py-3 rounded-md font-medium hover:bg-yellow-700"
            >
              ↻ Try Again
            </button>

            <button
              onClick={() => setCurrentStep('autofill')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
            >
              Skip & Enter Manually
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setCurrentStep('basic')}
        className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
      >
        ← Back
      </button>
    </div>
  );

  // Step 3: Smart Auto-Fill Review
  const renderAutoFillStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 3: Review & Edit Information</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Background Information</label>
        <textarea
          value={beneficiaryInfo.backgroundInfo || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, backgroundInfo: e.target.value })}
          className="w-full px-4 py-2 border rounded-md h-32"
          placeholder="Brief background about the beneficiary's career, achievements, awards, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Petitioner Name</label>
        <input
          type="text"
          value={beneficiaryInfo.petitionerName || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, petitionerName: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Jackson Wink MMA Academy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Petitioner Organization</label>
        <input
          type="text"
          value={beneficiaryInfo.petitionerOrganization || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, petitionerOrganization: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="e.g., Jackson Wink MMA Academy LLC"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Additional Information</label>
        <textarea
          value={beneficiaryInfo.additionalInfo || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, additionalInfo: e.target.value })}
          className="w-full px-4 py-2 border rounded-md h-32"
          placeholder="Any additional details, special circumstances, or context"
        />
      </div>

      <button
        onClick={() => setCurrentStep('upload')}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
      >
        Next: Upload Files
      </button>

      <button
        onClick={() => setCurrentStep('lookup')}
        className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
      >
        ← Back
      </button>
    </div>
  );

  // Step 4: Upload Files
  const handleFileUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedFiles([...uploadedFiles, ...data.files]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 4: Upload Supporting Documents (Optional)</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <div className="font-medium">Click to upload files</div>
          <div className="text-sm text-gray-500">PDF, DOCX, Images, Text (max 50MB each)</div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-gray-50 border rounded-md p-4">
          <h4 className="font-medium mb-2">Uploaded Files ({uploadedFiles.length}):</h4>
          <ul className="space-y-1">
            {uploadedFiles.map((file, idx) => (
              <li key={idx} className="text-sm">
                ✓ {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => startGeneration()}
        className="w-full bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
      >
        🚀 Start Generation
      </button>

      <button
        onClick={() => setCurrentStep('autofill')}
        className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
      >
        ← Back
      </button>
    </div>
  );

  // Start Generation
  const startGeneration = async () => {
    setCurrentStep('generating');
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryInfo,
          urls: lookupResult?.sources || [],
          files: uploadedFiles,
        }),
      });

      if (!response.ok) throw new Error('Generation failed to start');

      const data = await response.json();
      setCaseId(data.caseId);

      // Start polling for progress
      pollProgress(data.caseId);
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
      setCurrentStep('upload');
    }
  };

  // Poll Progress
  const pollProgress = async (caseId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/progress/${caseId}`);
        if (!response.ok) throw new Error('Failed to get progress');

        const data = await response.json();
        setProgress(data.progress);
        setCurrentStage(data.currentStage);
        setCurrentMessage(data.currentMessage);

        if (data.status === 'completed' && data.documents) {
          setGeneratedDocuments(data.documents);
          setCurrentStep('complete');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setError(data.errorMessage || 'Generation failed');
          clearInterval(interval);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Step 5: Generating Progress
  const renderGeneratingStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Generating Your Petition Documents</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{currentStage}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-700">{currentMessage}</p>
      </div>

      <div className="text-center text-gray-600">
        <div className="text-4xl mb-2">⚙️</div>
        <p>This may take 20-30 minutes. Please don't close this window.</p>
      </div>
    </div>
  );

  // Step 6: Complete with Optional Exhibits
  const [exhibitGenerating, setExhibitGenerating] = useState(false);

  const generateExhibits = async () => {
    setExhibitGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-exhibits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          exhibitSources: lookupResult?.sources || [],
        }),
      });

      if (!response.ok) throw new Error('Exhibit generation failed to start');

      // Poll for exhibit completion
      const interval = setInterval(async () => {
        const progressResponse = await fetch(`/api/progress/${caseId}`);
        const data = await progressResponse.json();

        if (data.status === 'completed' && data.exhibit_package_url) {
          setExhibitGenerating(false);
          clearInterval(interval);
          alert('Exhibits generated successfully!');
        }
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate exhibits');
      setExhibitGenerating(false);
    }
  };

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">✅ Documents Generated Successfully!</h2>

      <div className="bg-green-50 border border-green-200 rounded-md p-6">
        <h3 className="font-medium mb-2">Case ID: {caseId}</h3>
        <p className="text-sm text-gray-700">
          All 8 documents have been generated for <strong>{beneficiaryInfo.fullName}</strong>.
        </p>
      </div>

      <div className="bg-white border rounded-md p-4">
        <h4 className="font-medium mb-3">Generated Documents:</h4>
        <ul className="space-y-2">
          {generatedDocuments.map((doc, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span className="text-sm">
                {doc.document_number}. {doc.document_name} ({doc.word_count} words)
              </span>
              <a
                href={`/api/download/${caseId}?documentNumber=${doc.document_number}`}
                className="text-blue-600 hover:underline text-sm"
                download
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`/api/download/${caseId}`}
        className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 text-center"
        download
      >
        📥 Download All Documents
      </a>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-3">Optional: Generate Exhibit PDFs</h4>
        <p className="text-sm text-gray-600 mb-4">
          Generate professionally numbered exhibit PDFs from all {lookupResult?.sources.length || 0} sources found.
          This will archive URLs to archive.org and create a table of contents. (Estimated time: 30-60 minutes)
        </p>

        <button
          onClick={generateExhibits}
          disabled={exhibitGenerating}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400"
        >
          {exhibitGenerating ? '⚙️ Generating Exhibits...' : '📎 Generate Exhibit PDFs'}
        </button>
      </div>

      <button
        onClick={() => {
          // Reset form
          setCurrentStep('basic');
          setBeneficiaryInfo({ briefType: 'comprehensive' });
          setLookupResult(null);
          setUploadedFiles([]);
          setCaseId('');
          setGeneratedDocuments([]);
        }}
        className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
      >
        🆕 Start New Petition
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {currentStep === 'basic' && renderBasicInfoStep()}
      {currentStep === 'lookup' && renderLookupStep()}
      {currentStep === 'autofill' && renderAutoFillStep()}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'generating' && renderGeneratingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
}
