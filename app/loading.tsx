import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we load your content</p>
      </div>
    </div>
  );
}
