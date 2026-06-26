import { useState } from 'react';
import apiClient from '../services/api.js';
import NaturalLanguageInput from '../components/NaturalLanguageInput.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import RecommendedQueryCard from '../components/RecommendedQueryCard.jsx';
import QueryAlternativeCard from '../components/QueryAlternativeCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import { useToast } from '../components/Toast.jsx';

export default function SQLGeneratorPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  // States holding error information
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [requestId, setRequestId] = useState('');
  
  // States holding generated SQL outcomes
  const [recommended, setRecommended] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setErrorMsg('');
    setErrorDetails('');
    setRequestId('');
    setIsLoading(true);
    setRecommended(null);
    setAlternatives([]);

    try {
      const response = await apiClient.post('/sql/generate', {
        query: inputText,
      });

      const queries = response.data?.data || response.data?.queries;
      if (response.data?.success && queries) {
        const { recommendedQuery, alternatives: altList } = queries;
        setRecommended(recommendedQuery);
        setAlternatives(altList || []);
        showToast('SQL alternatives generated successfully!', 'success');
      } else {
        throw new Error('Invalid query format received from server.');
      }
    } catch (err) {
      console.error('SQL generation failed:', err);
      // axios interceptor remaps errors to { message, status, data }
      // err.response is undefined — read from err directly
      const msg = err.message || 'An error occurred during query generation.';
      const details = err.data?.error
        ? typeof err.data.error === 'object'
          ? JSON.stringify(err.data.error, null, 2)
          : String(err.data.error)
        : '';
      const reqId = err.data?.requestId || '';
      setErrorMsg(msg);
      setErrorDetails(details);
      setRequestId(reqId);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySuccess = () => {
    showToast('SQL query copied to clipboard.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI SQL Query Generator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
          Submit prompts describing your database request in plain English to receive validation-checked PostgreSQL alternatives.
        </p>
      </div>

      {/* Input Form Section */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <NaturalLanguageInput
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Find all users who verified their email and registered in the last 14 days."
          />

          <div className="flex justify-end">
            <GenerateButton isLoading={isLoading} disabled={!inputText.trim()} />
          </div>
        </form>
      </div>

      {/* Error state */}
      {errorMsg && (
        <ErrorCard
          message={errorMsg}
          errorDetails={errorDetails}
          requestId={requestId}
          onRetry={inputText.trim() ? handleSubmit : null}
        />
      )}

      {/* Loading Skeletal State */}
      {isLoading && <LoadingState />}

      {/* Empty State before generation */}
      {!isLoading && !recommended && alternatives.length === 0 && (
        <EmptyState onSelectPrompt={(prompt) => setInputText(prompt)} />
      )}

      {/* Query Outcomes Rendering Section */}
      {!isLoading && (recommended || alternatives.length > 0) && (
        <div className="space-y-8">
          {/* 1. Recommended Query Card */}
          {recommended && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                Best Suggestion
              </h2>
              <RecommendedQueryCard query={recommended} onCopySuccess={handleCopySuccess} />
            </div>
          )}

          {/* 2. Alternatives Choices List */}
          {alternatives.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                SQL Query Alternatives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternatives.map((alt, index) => (
                  <QueryAlternativeCard 
                    key={index} 
                    query={alt} 
                    onCopySuccess={handleCopySuccess} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

