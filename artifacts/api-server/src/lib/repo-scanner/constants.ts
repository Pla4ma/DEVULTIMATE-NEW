export const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out",
  "coverage", "vendor", "target", ".cache", ".turbo",
]);

export const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp", ".tiff",
  ".mp4", ".mp3", ".wav", ".ogg", ".mov", ".avi", ".webm",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".exe", ".bin", ".dll", ".so", ".dylib",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);

export const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[0-9A-Za-z\-_]{35}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{36}/,
  /ghs_[A-Za-z0-9]{36}/,
  /gho_[A-Za-z0-9]{36}/,
  /ghu_[A-Za-z0-9]{36}/,
  /ghr_[A-Za-z0-9]{36}/,
  /glpat-[A-Za-z0-9\-_]{20,}/,
  /sk_live_[A-Za-z0-9]{20,}/,
  /pk_live_[A-Za-z0-9]{20,}/,
  /rk_live_[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9+/]{20,}\.[A-Za-z0-9+/]{20,}\.[A-Za-z0-9+/_\-]{20,}/,
  /eyJ[A-Za-z0-9+/]{20,}/,
  /(?:api[_-]?key|secret|password|token|apikey|api_key)\s*[:=]\s*['"][^'"]{10,}['"]/i,
  /(?:postgres|mysql|mongodb|redis|rediss):\/\/[^\s]{10,}/i,
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  /xox[abpors]-[A-Za-z0-9]{10,}/,
  /[A-Za-z0-9]{24}\.[A-Za-z0-9]{6}\.[A-Za-z0-9_\-]{27}/,
  /[A-Za-z0-9]{24}_[A-Za-z0-9]{16}/,
  /[hH][eE][rR][oO][kK][uU].*[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
  /[a-fA-F0-9]{64,}/,
];

export const MAX_UNCOMPRESSED_TOTAL = 200 * 1024 * 1024;
export const MAX_PER_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILE_COUNT = 3000;
export const MAX_DIR_DEPTH = 20;
export const MAX_SCAN_TIME_MS = 30_000;
export const MAX_TEXT_BYTES_PER_FILE = 500_000;
export const MAX_TOTAL_TEXT_BYTES = 50 * 1024 * 1024;
export const MAX_CONCURRENT_SCANS = 3;
