export type RiskItem = { assumption: string; severity: string; blind_spot?: string; mitigation?: string };

export type CompilerError = {
  code: string;
  severity: string;
  message: string;
  why_it_matters?: string;
  fix?: string;
  blocks_build?: boolean;
};

export type RealityData = {
  verdict?: string;
  summary?: string;
  reality_score?: number;
  score?: number;
  compile_status?: string;
  errors?: CompilerError[];
  warnings?: string[];
  product_patch?: string;
  patched_idea?: string;
  decisive_move?: string;
  red_flags?: string[];
  blind_spots?: string[];
  market_risks?: string[];
  technical_risks?: string[];
  risk_items?: RiskItem[];
  assumptions?: RiskItem[];
  next_actions?: string[];
  go_signal?: string;
};
