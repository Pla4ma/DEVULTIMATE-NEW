import * as fs from 'fs';
import * as path from 'path';

export type RouteIntegritySignal = {
  definedRoutes: string[];
  referencedRoutes: Array<{ path: string; file: string; line: number }>;
  missingRoutes: Array<{ path: string; references: Array<{ file: string; line: number }> }>;
  staleRoutes: string[];
};

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

export function scanRouteIntegrity(workspaceRoot: string): RouteIntegritySignal {
  const appTsxPath = path.join(workspaceRoot, 'client', 'src', 'App.tsx');
  let definedRoutes: string[] = [];
  
  if (fs.existsSync(appTsxPath)) {
    const appContent = fs.readFileSync(appTsxPath, 'utf8');
    // Extract Wouter Route paths: <Route path="/..." .../>
    const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
    let match;
    while ((match = routeRegex.exec(appContent)) !== null) {
      definedRoutes.push(match[1]);
    }
  }

  const referencedRoutes: Array<{ path: string; file: string; line: number }> = [];
  
  const clientSrcDir = path.join(workspaceRoot, 'client', 'src');
  const files = getAllFiles(clientSrcDir);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match navigate("/...") or href="/..."
      const refRegex = /(?:navigate|href)=?\(?["'](\/[^"']*)["']/g;
      let match;
      while ((match = refRegex.exec(line)) !== null) {
        referencedRoutes.push({
          path: match[1],
          file: file.replace(workspaceRoot, ''),
          line: i + 1
        });
      }
    }
  }

  // Find missing routes
  const missingRoutesMap = new Map<string, Array<{ file: string; line: number }>>();
  
  // Simplified route matching: if the referenced route starts with a defined route (handling params)
  for (const ref of referencedRoutes) {
    // If route doesn't have a parameter, simple check
    // In a real app we'd convert path="/user/:id" to a regex
    let isDefined = false;
    for (const defined of definedRoutes) {
      const definedRegexStr = '^' + defined.replace(/:[^\/]+/g, '[^/]+') + '$';
      const definedRegex = new RegExp(definedRegexStr);
      if (definedRegex.test(ref.path)) {
        isDefined = true;
        break;
      }
    }

    if (!isDefined) {
      if (!missingRoutesMap.has(ref.path)) {
        missingRoutesMap.set(ref.path, []);
      }
      missingRoutesMap.get(ref.path)!.push({ file: ref.file, line: ref.line });
    }
  }

  const missingRoutes = Array.from(missingRoutesMap.entries()).map(([path, references]) => ({
    path,
    references
  }));

  // Simplified stale routes: defined but never referenced
  const staleRoutes = definedRoutes.filter(defined => {
    // Ignore root or catch-all routes
    if (defined === '/' || defined.includes('*')) return false;
    
    for (const ref of referencedRoutes) {
      const definedRegexStr = '^' + defined.replace(/:[^\/]+/g, '[^/]+') + '$';
      const definedRegex = new RegExp(definedRegexStr);
      if (definedRegex.test(ref.path)) {
        return false;
      }
    }
    return true;
  });

  return {
    definedRoutes,
    referencedRoutes,
    missingRoutes,
    staleRoutes
  };
}
