import * as fs from 'fs';
import * as path from 'path';

export type AuthBypassSignal = {
  protectedRoutes: string[];
  rawFetchCalls: Array<{ url: string; file: string; line: number }>;
  bypassRisks: Array<{ url: string; file: string; line: number; fix: string }>;
};

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

export function scanAuthBypass(workspaceRoot: string): AuthBypassSignal {
  const serverFiles = getAllFiles(path.join(workspaceRoot, 'server'));
  
  const protectedRoutes: string[] = [];
  
  // Find protected backend routes
  // Simplistic assumption: routes with 'requireAuth' or similar middleware
  for (const file of serverFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // router.get('/api/protected', requireAuth, ...)
    const protectedRegex = /(?:router|app)\.(?:get|post|put|patch|delete)\(['"](\/api\/[^'"]+)['"]\s*,\s*(?:requireAuth|verifyToken|isAuthenticated)/g;
    let match;
    while ((match = protectedRegex.exec(content)) !== null) {
      protectedRoutes.push(match[1]);
    }
  }

  const clientFiles = getAllFiles(path.join(workspaceRoot, 'client', 'src'));
  const rawFetchCalls: Array<{ url: string; file: string; line: number }> = [];
  
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only looking for raw 'fetch', not 'authenticatedFetch'
      // Use negative lookbehind or just string filtering
      const fetchMatch = line.match(/[^a-zA-Z]fetch\(['"](\/api\/[^'"]+)['"]/);
      if (fetchMatch || line.startsWith('fetch(')) {
        const urlMatch = line.match(/fetch\(['"](\/api\/[^'"]+)['"]/);
        if (urlMatch) {
          rawFetchCalls.push({
            url: urlMatch[1],
            file: file.replace(workspaceRoot, ''),
            line: i + 1
          });
        }
      }
    }
  }

  const bypassRisks: Array<{ url: string; file: string; line: number; fix: string }> = [];

  for (const call of rawFetchCalls) {
    for (const route of protectedRoutes) {
      const definedRegexStr = '^' + route.replace(/:[^\/]+/g, '[^/]+') + '$';
      const definedRegex = new RegExp(definedRegexStr);
      
      if (definedRegex.test(call.url)) {
        bypassRisks.push({
          url: call.url,
          file: call.file,
          line: call.line,
          fix: 'Replace `fetch` with `authenticatedFetch` or `apiRequest` to ensure authentication tokens are included.'
        });
        break; // Stop checking other routes once matched
      }
    }
  }

  return {
    protectedRoutes,
    rawFetchCalls,
    bypassRisks
  };
}
