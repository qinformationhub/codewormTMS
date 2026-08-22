export const TRUCK_REQUIREMENTS = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Tanker (HazMat)",
  "Power Only",
  "Box Truck",
  "Other",
];

export const TEMPERATURE_REQUIREMENTS = [
  { value: "none", label: "None" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "frozen", label: "Frozen" },
  { value: "deep_frozen", label: "Deep Frozen" },
  { value: "crt", label: "CRT" },
  { value: "custom", label: "Custom" },
];

export const SHIPPER_TEMPERATURE_BANDS = [
  { value: "none", label: "None" },
  { value: "refrigerated", label: "Refrigerated (2-8 C)" },
  { value: "crt", label: "Controlled Room Temp (15-25 C)" },
  { value: "frozen", label: "Frozen (-20 C)" },
  { value: "deep_frozen", label: "Deep Frozen / Ultra Low (-70 C)" },
  { value: "custom", label: "Custom Range" },
];

export const COMPLIANCE_FLAGS = [
  { value: "hazmat", label: "HazMat (DOT 49 CFR)" },
  { value: "gdp", label: "GDP (Good Distribution Practice)" },
  { value: "dea", label: "DEA (Controlled Substances)" },
  { value: "cold_chain", label: "Cold Chain" },
  { value: "biohazard", label: "Biohazard" },
  { value: "clinical_trial", label: "Clinical Trial Material" },
];

export const INDUSTRIES = [
  "Pharmaceutical",
  "Chemical",
  "Medical Device",
  "Food & Beverage",
  "Biotech",
  "Other",
];

export const SECURITY_LEVELS = [
  { value: "standard", label: "Standard" },
  { value: "enhanced", label: "Enhanced" },
  { value: "dea_grade", label: "DEA-Grade" },
];

export const PACKING_GROUPS = ["I", "II", "III"];

export const THEFT_RISK_RATINGS = ["low", "medium", "high"];

export const HAZMAT_SAFETY_RATINGS = [
  { value: "none", label: "None" },
  { value: "satisfactory", label: "Satisfactory" },
  { value: "unsatisfactory", label: "Unsatisfactory" },
  { value: "conditional", label: "Conditional" },
];

export const SECURITY_PROTOCOLS = [
  { value: "none", label: "None" },
  { value: "standard", label: "Standard" },
  { value: "enhanced", label: "Enhanced" },
  { value: "dea_grade", label: "DEA-Grade" },
];

export const TEMPERATURE_CAPABILITIES = [
  { value: "refrigerated", label: "Refrigerated" },
  { value: "crt", label: "CRT" },
  { value: "frozen", label: "Frozen" },
  { value: "deep_frozen", label: "Deep Frozen" },
];

export const WEIGHT_UNITS = ["lbs", "kg"];

export const FIELD_CLASS =
  "h-11 w-full rounded-xs bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground";

export const DOCUMENT_CATEGORIES = [
  "Operational",
  "Regulatory",
  "Safety",
  "Insurance",
  "Financial",
  "Legal",
  "Quality",
  "Other",
];

export const DOCUMENT_TYPES = [
  "BOL",
  "POD",
  "RateConfirmation",
  "ScaleTicket",
  "InsuranceInfo",
  "ProofOfInsurance",
  "CarrierAuthority",
  "W9",
  "HazMatRegistration",
  "HazMatSafetyCert",
  "HazMatTraining",
  "SDS",
  "GDPCert",
  "ReeferCert",
  "TemperatureLog",
  "ChainOfCustody",
  "DEARegistration",
  "Invoice",
  "Other",
];