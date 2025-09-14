/**
 * Monaco Editor Classic Web Worker 
 * This script handles both classic and module worker scenarios
 */

// This is a proxy worker that loads the appropriate monaco worker bundle
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/'
};

// Set up require paths to ensure compatibility
self.require = {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
  }
};

// Always use fetch + eval approach since it works in both classic and module workers
fetch('https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.status}`);
    }
    return response.text();
  })
  .then(scriptContent => {
    try {
      // Using Function constructor to evaluate the script in the global scope
      new Function(scriptContent)();
    } catch (evalErr) {
      console.error('[Monaco Worker] Failed to evaluate script:', evalErr);
      throw evalErr;
    }
  })
  .catch(error => {
    console.error('[Monaco Worker] Failed to load worker script:', error);
    
    // Try fallback CDN
    return fetch('https://unpkg.com/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js')
      .then(response => response.text())
      .then(scriptContent => {
        new Function(scriptContent)();
      });
  }); 