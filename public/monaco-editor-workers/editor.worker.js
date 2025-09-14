/**
 * Monaco Editor Web Worker (Module Version)
 *
 * This version of the worker avoids using importScripts and instead uses fetch+eval
 * to load the Monaco worker code in module worker contexts.
 */

// Debug information
console.log(`[Monaco Module Worker] Starting at ${new Date().toISOString()}`);

// Set up base URL for Monaco - match the version in your package.json
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/'
};

// Load the worker script using fetch + eval
async function loadScript() {
  try {
    console.log('[Monaco Module Worker] Fetching worker script...');
    const response = await fetch('https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.status}`);
    }
    
    const scriptContent = await response.text();
    console.log(`[Monaco Module Worker] Successfully fetched script (${scriptContent.length} bytes)`);
    
    // Evaluate the script
    new Function(scriptContent)();
    console.log('[Monaco Module Worker] Successfully evaluated worker script');
  } catch (error) {
    console.error('[Monaco Module Worker] Error:', error);
  }
}

// Start loading
loadScript(); 