"use client";

import React, { useState, useCallback } from 'react';
import useTranslation from '@/app/hooks/useTranslation';
import { translateText } from '@/lib/services/translation';

interface TranslateButtonProps {
    /** The original text content to translate */
    content: string;
    /** The source language code (if known), defaults to 'en' */
    sourceLang?: string;
    /** Tenant ID for rate limiting and caching */
    tenantId?: string;
    /** Callback when translation is complete */
    onTranslate?: (translatedText: string) => void;
    /** Custom className for the button */
    className?: string;
    /** Show as inline text link instead of button */
    inline?: boolean;
}

/**
 * A button component that allows users to translate user-generated content
 * to their preferred language.
 */
const TranslateButton: React.FC<TranslateButtonProps> = ({
    content,
    sourceLang = 'en',
    tenantId = 'global',
    onTranslate,
    className = '',
    inline = false,
}) => {
    const { lang, t } = useTranslation();
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Don't show if source and target are the same
    if (sourceLang === lang && !translatedContent) {
        return null;
    }

    const handleTranslate = useCallback(async () => {
        if (isTranslating) return;

        setIsTranslating(true);
        setError(null);

        try {
            const result = await translateText(
                content,
                sourceLang,
                lang,
                tenantId
            );

            if (result.error) {
                setError(result.error);
            } else {
                setTranslatedContent(result.translation);
                onTranslate?.(result.translation);
            }
        } catch (err) {
            setError('Translation failed. Please try again.');
            console.error('Translation error:', err);
        } finally {
            setIsTranslating(false);
        }
    }, [content, sourceLang, lang, tenantId, onTranslate, isTranslating]);

    const toggleOriginal = useCallback(() => {
        setShowOriginal(!showOriginal);
    }, [showOriginal]);

    // Already translated - show toggle
    if (translatedContent) {
        return (
            <div className={`text-xs ${className}`}>
                <button
                    onClick={toggleOriginal}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                    {showOriginal ? t('common.viewMore') : 'See original'}
                </button>
                {showOriginal && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-300 border-l-2 border-gray-300">
                        {content}
                    </div>
                )}
            </div>
        );
    }

    // Show translate button
    if (inline) {
        return (
            <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className={`text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline disabled:opacity-50 ${className}`}
            >
                {isTranslating ? (
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        Translating...
                    </span>
                ) : (
                    <>🌐 Translate</>
                )}
            </button>
        );
    }

    return (
        <div className={className}>
            <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
                {isTranslating ? (
                    <>
                        <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        <span>Translating...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>Translate</span>
                    </>
                )}
            </button>
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default TranslateButton;
