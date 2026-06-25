import { useState } from 'react';
import apiClient from '../services/api.js';
import NaturalLanguageInput from '../components/NaturalLanguageInput.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import RecommendedQueryCard from '../components/RecommendedQueryCard.jsx';
import QueryAlternativeCard from '../components/QueryAlternativeCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import FormError from '../components/FormError.jsx';

export default function SQLGeneratorPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // States holding generated SQL outcomes
  const [recommended, setRecommended] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setError('');
    setIsLoading(true);
    setRecommended(null);
    setAlternatives([]);

    try {
      const response = await apiClient.post('/sql/generate', {
        query: inputText,
      });

      if (response.data?.success && response.data?.queries) {
        const { recommendedQuery, alternatives: altList } = response.data.queries;
        setRecommended(recommendedQuery);
        // Exclude the recommended query from alternatives list to prevent duplication if desired,
        // or render all alternatives as returned. We will render all alternatives.
        setAlternatives(altList || []);
      } else {
        throw new Error('Invalid query format received from server.');
      }
    } catch (err) {
      console.error('SQL generation failed:', err);
      setError(err.message || 'An error occurred during query generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI SQL Query Generator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          Submit prompts describing your database request in plain English to receive validation-checked PostgreSQL alternatives.
        </p>
      </div>

      {/* Input Form Section */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <NaturalLanguageInput
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Find all users who verified their email and registered in the last 14 days."
          />

          <FormError message={error} />

          <div className="flex justify-end">
            <GenerateButton isLoading={isLoading} disabled={!inputText.trim()} />
          </div>
        </form>
      </div>

      {/* Loading Skeletal State */}
      {isLoading && <LoadingState />}

      {/* Query Outcomes Rendering Section */}
      {!isLoading && (recommended || alternatives.length > 0) && (
        <div className="space-y-8">
          {/* 1. Recommended Query Card */}
          {recommended && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                Best Suggestion
              </h2>
              <RecommendedQueryCard query={recommended} />
            </div>
          )}

          {/* 2. Alternatives Choices List */}
          {alternatives.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                SQL Query Alternatives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternatives.map((alt, index) => (
                  <QueryAlternativeCard key={index} query={alt} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
