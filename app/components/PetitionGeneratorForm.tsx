'use client';

import { useState, useRef, useEffect } from 'react';
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
  const errorRef = useRef<HTMLDivElement>(null);

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Step 1: Basic Info
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Step 1: Basic Information
      </h2>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Full Name *</label>
        <input
          type="text"
          value={beneficiaryInfo.fullName || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, fullName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="e.g., Alex Hale"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Profession *</label>
        <input
          type="text"
          value={beneficiaryInfo.profession || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, profession: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="e.g., Professional MMA Fighter"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Visa Type *</label>
        <select
          value={beneficiaryInfo.visaType || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, visaType: e.target.value as VisaType })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
        <label className="block text-sm font-medium mb-2 text-gray-700">Brief Type *</label>
        <div className="space-y-3">
          <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all">
            <input
              type="radio"
              name="briefType"
              value="standard"
              checked={beneficiaryInfo.briefType === 'standard'}
              onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, briefType: e.target.value as BriefType })}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-semibold text-gray-900">Standard Brief (15-20 pages)</div>
              <div className="text-sm text-gray-600">
                Focused analysis of 3-5 strongest criteria. Best for straightforward cases. Faster generation (~10-15 min).
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-4 border-2 border-blue-300 rounded-lg cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all">
            <input
              type="radio"
              name="briefType"
              value="comprehensive"
              checked={beneficiaryInfo.briefType === 'comprehensive'}
              onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, briefType: e.target.value as BriefType })}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-semibold text-gray-900">Comprehensive Brief (30-50 pages) ⭐</div>
              <div className="text-sm text-gray-600">
                Extensive analysis of ALL applicable criteria. Best for complex cases requiring maximum documentation. (~20-30 min).
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Nationality</label>
          <input
            type="text"
            value={beneficiaryInfo.nationality || ''}
            onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, nationality: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., Brazilian"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Current Immigration Status</label>
          <input
            type="text"
            value={beneficiaryInfo.currentStatus || ''}
            onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, currentStatus: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., B-2 Tourist Visa"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Field of Expertise</label>
        <input
          type="text"
          value={beneficiaryInfo.fieldOfExpertise || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, fieldOfExpertise: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Next: AI Beneficiary Lookup →
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
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Step 2: AI Beneficiary Lookup
      </h2>

      {!lookupResult ? (
        <div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
            <p className="text-lg">
              Our AI will search for <strong className="text-blue-600">{beneficiaryInfo.fullName}</strong> ({beneficiaryInfo.profession})
              across major publications, databases, and media sources.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This optimized search takes 10-15 seconds and finds 8-12 high-quality sources.
            </p>
          </div>

          <button
            onClick={handleAILookup}
            disabled={lookupLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {lookupLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-xl">⚙</span> Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🔍 Start AI Lookup
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentStep('autofill')}
            className="w-full mt-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            Skip Lookup
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-4 shadow-md">
            <h3 className="font-bold text-xl text-green-700 mb-2 flex items-center gap-2">
              <span className="text-2xl">✅</span> Found {lookupResult.totalFound} sources
            </h3>
            <p className="text-sm text-gray-700">
              Search Strategy: {lookupResult.searchStrategy}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 mb-4 max-h-96 overflow-y-auto shadow-lg">
            <h4 className="font-bold text-xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📚 Found Sources ({lookupResult.sources.length})
            </h4>
            <ul className="space-y-4">
              {lookupResult.sources.map((source: any, idx: number) => (
                <li key={idx} className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{idx + 1}</span>
                    <div className="flex-1">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-bold text-base hover:underline block"
                      >
                        {source.title || 'Untitled'}
                        <span className="ml-2 text-xs">🔗</span>
                      </a>
                      {source.description && (
                        <p className="text-gray-600 text-sm mt-1">{source.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {source.source || source.sourceName || new URL(source.url).hostname}
                        </span>
                        {source.confidence && (
                          <span className={`px-2 py-1 rounded font-medium ${
                            source.confidence === 'high'
                              ? 'bg-green-100 text-green-700'
                              : source.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {source.confidence} quality
                          </span>
                        )}
                        {source.category && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                            {source.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Does this information look correct?</p>

            <button
              onClick={() => {
                // Add sources to beneficiaryInfo
                setBeneficiaryInfo({
                  ...beneficiaryInfo,
                  primaryUrls: lookupResult.sources.map(s => s.url),
                });
                setCurrentStep('autofill');
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              ✓ Yes, Use These Sources
            </button>

            <button
              onClick={() => setLookupResult(null)}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              ↻ Try Again
            </button>

            <button
              onClick={() => setCurrentStep('autofill')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Skip & Enter Manually
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setCurrentStep('basic')}
        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
      >
        ← Back
      </button>
    </div>
  );

  // Step 3: Smart Auto-Fill Review
  const [generatingBackground, setGeneratingBackground] = useState(false);

  const handleGenerateBackground = async () => {
    setGeneratingBackground(true);
    setError('');

    try {
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: beneficiaryInfo.fullName,
          profession: beneficiaryInfo.profession,
          visaType: beneficiaryInfo.visaType,
          urls: lookupResult?.sources || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate background');
      }

      const data = await response.json();
      setBeneficiaryInfo({
        ...beneficiaryInfo,
        backgroundInfo: data.background
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate background with AI');
    } finally {
      setGeneratingBackground(false);
    }
  };

  const renderAutoFillStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Step 3: Review & Edit Information
      </h2>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Background Information</label>
          <button
            onClick={handleGenerateBackground}
            disabled={generatingBackground}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {generatingBackground ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙</span> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ✨ Generate with AI
              </span>
            )}
          </button>
        </div>
        <textarea
          value={beneficiaryInfo.backgroundInfo || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, backgroundInfo: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Brief background about the beneficiary's career, achievements, awards, etc."
        />
        <p className="text-xs text-gray-500 mt-1">
          Click "Generate with AI" to automatically create a professional background based on the sources found.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Additional Information (Optional)</label>
        <textarea
          value={beneficiaryInfo.additionalInfo || ''}
          onChange={(e) => setBeneficiaryInfo({ ...beneficiaryInfo, additionalInfo: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Any additional details, special circumstances, or context"
        />
      </div>

      <button
        onClick={() => setCurrentStep('upload')}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
      >
        Next: Add URLs & Upload Files →
      </button>

      <button
        onClick={() => setCurrentStep('lookup')}
        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
      >
        ← Back
      </button>
    </div>
  );

  // Step 4: Upload Files & Add URLs
  const [additionalUrls, setAdditionalUrls] = useState<string>('');
  const [parsedUrls, setParsedUrls] = useState<string[]>([]);

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

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = text.match(urlRegex) || [];

    return matches.map(url => {
      // Ensure URL has protocol
      if (!url.startsWith('http')) {
        return url.startsWith('www.') ? `https://${url}` : `https://${url}`;
      }
      return url;
    }).filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
  };

  const handleUrlPaste = (text: string) => {
    setAdditionalUrls(text);
    const urls = extractUrls(text);
    setParsedUrls(urls);
  };

  const handleAddUrls = () => {
    if (parsedUrls.length > 0) {
      const existingUrls = beneficiaryInfo.primaryUrls || [];
      setBeneficiaryInfo({
        ...beneficiaryInfo,
        primaryUrls: [...existingUrls, ...parsedUrls],
      });
      setAdditionalUrls('');
      setParsedUrls([]);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Step 4: Add URLs & Upload Documents
      </h2>

      {/* URL Addition Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-2xl">🔗</span> Add Additional URLs
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Paste URLs or text containing URLs below. We'll automatically detect and extract all URLs.
        </p>

        <textarea
          value={additionalUrls}
          onChange={(e) => handleUrlPaste(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder={'Paste URLs here... (one per line or in any format)\n\nExamples:\nhttps://example.com/article\nwww.linkedin.com/profile\nCheck out this article: https://news.com/story'}
        />

        {parsedUrls.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded-md border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-2">
              ✓ Detected {parsedUrls.length} URL{parsedUrls.length !== 1 ? 's' : ''}:
            </p>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {parsedUrls.map((url, idx) => (
                <li key={idx} className="text-xs text-gray-600 truncate">
                  • {url}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleAddUrls}
          disabled={parsedUrls.length === 0}
          className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          Add {parsedUrls.length > 0 ? parsedUrls.length : ''} URL{parsedUrls.length !== 1 ? 's' : ''} to Petition
        </button>
      </div>

      {/* Show all URLs that will be used */}
      {beneficiaryInfo.primaryUrls && beneficiaryInfo.primaryUrls.length > 0 && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-green-700">
            📋 Total URLs for Generation: {beneficiaryInfo.primaryUrls.length}
          </h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {beneficiaryInfo.primaryUrls.map((url, idx) => (
              <li key={idx} className="text-xs text-gray-600 truncate flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span className="flex-1">{url}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Upload Section */}
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 transition-all">
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-5xl mb-3">📄</div>
          <div className="font-medium text-lg">Upload Supporting Documents (Optional)</div>
          <div className="text-sm text-gray-500 mt-2">Click to upload files</div>
          <div className="text-xs text-gray-400 mt-1">PDF, DOCX, Images, Text (max 50MB each)</div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-green-700">✓ Uploaded Files ({uploadedFiles.length}):</h4>
          <ul className="space-y-1">
            {uploadedFiles.map((file, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => startGeneration()}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <span className="flex items-center justify-center gap-2">
          🚀 Generate Petition Documents
        </span>
      </button>

      <button
        onClick={() => setCurrentStep('autofill')}
        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
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
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
        Generating Your Petition Documents
      </h2>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-8 shadow-lg">
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium mb-3">
            <span className="text-gray-700">{currentStage}</span>
            <span className="text-blue-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end px-2"
              style={{ width: `${progress}%` }}
            >
              {progress > 10 && (
                <span className="text-white text-xs font-bold">{progress}%</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 bg-white rounded-md p-3 border border-gray-200">
          {currentMessage}
        </p>
      </div>

      <div className="text-center text-gray-600 bg-white rounded-lg p-6 border-2 border-gray-200">
        <div className="text-6xl mb-4 animate-spin">⚙</div>
        <p className="text-lg font-medium mb-2">AI is working hard on your petition...</p>
        <p className="text-sm">This may take 20-30 minutes. Please do not close this window.</p>
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
      <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
        ✅ Documents Generated Successfully!
      </h2>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 shadow-lg">
        <h3 className="font-bold text-xl text-green-700 mb-2">Case ID: {caseId}</h3>
        <p className="text-gray-700">
          All 8 documents have been generated for <strong className="text-green-600">{beneficiaryInfo.fullName}</strong>.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm">
        <h4 className="font-semibold text-lg mb-4 text-gray-800">Generated Documents:</h4>
        <ul className="space-y-3">
          {generatedDocuments.map((doc, idx) => (
            <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-all">
              <span className="text-sm font-medium text-gray-700">
                {doc.document_number}. {doc.document_name} <span className="text-gray-500">({doc.word_count} words)</span>
              </span>
              <a
                href={`/api/download/${caseId}?documentNumber=${doc.document_number}`}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-all"
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
        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        download
      >
        📥 Download All Documents
      </a>

      <div className="border-t-2 border-gray-200 pt-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5">
          <h4 className="font-bold text-lg mb-3 text-purple-700">Optional: Generate Exhibit PDFs</h4>
          <p className="text-sm text-gray-700 mb-4">
            Generate professionally numbered exhibit PDFs from all {lookupResult?.sources.length || 0} sources found.
            This will archive URLs to archive.org and create a table of contents. (Estimated time: 30-60 minutes)
          </p>

          <button
            onClick={generateExhibits}
            disabled={exhibitGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {exhibitGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙</span> Generating Exhibits...
              </span>
            ) : (
              '📎 Generate Exhibit PDFs'
            )}
          </button>
        </div>
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
        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg"
      >
        🆕 Start New Petition
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {['basic', 'lookup', 'autofill', 'upload', 'generating', 'complete'].map((step, idx) => {
            const stepLabels = ['Basic Info', 'AI Lookup', 'Review', 'URLs & Files', 'Generating', 'Complete'];
            const currentIndex = ['basic', 'lookup', 'autofill', 'upload', 'generating', 'complete'].indexOf(currentStep);
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                    {stepLabels[idx]}
                  </span>
                </div>
                {idx < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          ref={errorRef}
          className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-lg shadow-md flex items-start gap-3 animate-pulse"
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1 font-semibold">{error}</div>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        {currentStep === 'basic' && renderBasicInfoStep()}
        {currentStep === 'lookup' && renderLookupStep()}
        {currentStep === 'autofill' && renderAutoFillStep()}
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'generating' && renderGeneratingStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
}
