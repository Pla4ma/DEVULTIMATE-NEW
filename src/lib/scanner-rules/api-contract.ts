import * as fs from 'fs';
import * as path from 'path';

export type ApiContractSignal = {
  backendRoutes: Array<{ method: string; path: string; file: string }>;
  frontendCalls: Array<{ method: string; url: string; file: string; line: number }>;
  missingEndpoints: Array<{ url: string; references: Array<{ file: string; line: number }> }>;
  wrongMethods: Array<{ url: string; expected: string; actual: string }>;
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

export function scanApiContract(workspaceRoot: string): ApiContractSignal {
  const serverRoutesDir = path.join(workspaceRoot, 'server', 'routes');
  const serverIndexFile = path.join(workspaceRoot, 'server', 'index.ts');
  const serverAppFile = path.join(workspaceRoot, 'server', 'app.ts');
  const serverRoutesFile = path.join(workspaceRoot, 'server', 'routes.ts');
  
  const serverFiles = getAllFiles(path.join(workspaceRoot, 'server'));
  
  const backendRoutes: Array<{ method: string; path: string; file: string }> = [];
  
  // Very simplistic scan for router.get('/path') or app.post('/path')
  for (const file of serverFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\(['"](\/api\/[^'"]+)['"]/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      backendRoutes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file: file.replace(workspaceRoot, '')
      });
    }
  }

  const frontendCalls: Array<{ method: string; url: string; file: string; line: number }> = [];
  
  const clientFiles = getAllFiles(path.join(workspaceRoot, 'client', 'src'));
  
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // simplistic fetch(/api/...) or apiRequest("GET", "/api/...")
      const fetchRegex = /fetch\(['"](\/api\/[^'"]+)['"]/g;
      let match;
      while ((match = fetchRegex.exec(line)) !== null) {
        // Default to GET for basic fetch
        let method = "GET";
        if (line.includes('method: "POST"') || line.includes("method: 'POST'")) method = "POST";
        if (line.includes('method: "PUT"') || line.includes("method: 'PUT'")) method = "PUT";
        if (line.includes('method: "PATCH"') || line.includes("method: 'PATCH'")) method = "PATCH";
        if (line.includes('method: "DELETE"') || line.includes("method: 'DELETE'")) method = "DELETE";

        frontendCalls.push({
          method,
          url: match[1],
          file: file.replace(workspaceRoot, ''),
          line: i + 1
        });
      }
      
      const apiReqRegex = /apiRequest\(['"](GET|POST|PUT|PATCH|DELETE)['"],\s*['"](\/api\/[^'"]+)['"]/g;
      while ((match = apiReqRegex.exec(line)) !== null) {
        frontendCalls.push({
          method: match[1],
          url: match[2],
          file: file.replace(workspaceRoot, ''),
          line: i + 1
        });
      }
    }
  }

  const missingEndpointsMap = new Map<string, Array<{ file: string; line: number }>>();
  const wrongMethods: Array<{ url: string; expected: string; actual: string }> = [];

  for (const call of frontendCalls) {
    let endpointFound = false;
    let methodMismatch = false;
    let expectedMethod = "";

    for (const route of backendRoutes) {
      // Very basic param replacement
      const definedRegexStr = '^' + route.path.replace(/:[^\/]+/g, '[^/]+') + '$';
      const definedRegex = new RegExp(definedRegexStr);
      
      if (definedRegex.test(call.url)) {
        endpointFound = true;
        if (route.method !== call.method) {
          methodMismatch = true;
          expectedMethod = route.method;
        } else {
          methodMismatch = false;
          break; // Perfect match
        }
      }
    }

    if (!endpointFound) {
      if (!missingEndpointsMap.has(call.url)) {
        missingEndpointsMap.set(call.url, []);
      }
      missingEndpointsMap.get(call.url)!.push({ file: call.file, line: call.line });
    } else if (methodMismatch) {
      wrongMethods.push({
        url: call.url,
        expected: expectedMethod,
        actual: call.method
      });
    }
  }

  const missingEndpoints = Array.from(missingEndpointsMap.entries()).map(([url, references]) => ({
    url,
    references
  }));

  return {
    backendRoutes,
    frontendCalls,
    missingEndpoints,
    wrongMethods
  };
}
