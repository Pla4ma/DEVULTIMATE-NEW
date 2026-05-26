import { useState, useCallback } from "react";

interface UrlAnalysisResult {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  technologies: string[];
  performance: {
    loadTime: number | null;
    pageSize: number | null;
    requests: number | null;
  };
  seo: {
    title: string | null;
    description: string | null;
    keywords: string[];
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
  };
  security: {
    hasHttps: boolean;
    hasCsp: boolean;
    hasHsts: boolean;
  };
  accessibility: {
    hasAriaLabels: boolean;
    hasAltTexts: boolean;
    colorContrast: string | null;
  };
}

export function useUrlAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze URL");
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, analyzeUrl, reset };
}
