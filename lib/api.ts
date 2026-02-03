const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://100.72.223.89:8000";
console.log("API_BASE is:", API_BASE);

export interface ProcessingResult {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
  analysis: {
    retailer_name: string;
    url: string;
    country: string | null;
    store_count: number | null;
    instagram_handle: string | null;
    curatorial_direction: string;
    proof_points_count: number;
    best_proof_point: string;
  } | null;
  variations: {
    version: string;
    differentiator_used: string;
    subject: string;
    opening_paragraph: string;
    body: string;
    validation_score: number;
    validation_issues: string[];
  }[];
  followup_sequence: {
    sequence_number: number;
    days_after_previous: number;
    purpose: string;
    subject: string;
    body: string;
  }[];
  sequence_count: number;
  total_cost: number;
  error: string | null;
}

export async function processRetailer(url: string, generateFollowups = true) {
  const res = await fetch(`${API_BASE}/api/process-retailer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, generate_followups: generateFollowups }),
  });
  return res.json();
}

export async function getResults(jobId: string): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/api/results/${jobId}`);
  return res.json();
}

export async function listResults() {
  const res = await fetch(`${API_BASE}/api/results`);
  return res.json();
}

export async function deleteResult(jobId: string) {
  const res = await fetch(`${API_BASE}/api/results/${jobId}`, {
    method: "DELETE",
  });
  return res.json();
}

// =============================================================================
// DISCOVERY PIPELINE API
// =============================================================================

export interface PipelineValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  requirements: {
    min_seed_retailers: number;
    min_competitor_brands: number;
    provided_seeds: number;
    provided_competitors: number;
  };
}

export interface PipelineRun {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed";
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stages: {
    [key: string]: {
      status: string;
      count: number;
    };
  };
  stats: {
    retailers_found: number;
    retailers_enriched: number;
    emails_generated: number;
  };
  retailers: DiscoveredRetailer[];
  total_retailers: number;
  error: string | null;
  config: {
    brand_name: string;
    enrich_contacts: boolean;
    max_enrich: number;
  };
}

export interface DiscoveredRetailer {
  id: string;
  name: string;
  domain: string;
  url: string;
  country: string | null;
  city: string | null;
  source_types: string[];
  confidence_score: number;
  contact_emails: string[] | null;
  enrichment_status: string;
  created_at?: string;
}

export interface RetailerDetail extends DiscoveredRetailer {
  category_tags: string[] | null;
  brands_carried: string[] | null;
  curatorial_direction: string | null;
  proof_points: any[] | null;
  best_proof_point: string | null;
  evidence_urls: string[] | null;
  contact_names: any[] | null;
  contact_pages: string[] | null;
  instagram_handle: string | null;
  campaigns: {
    id: string;
    status: string;
    created_at: string;
  }[];
}

export async function validatePipelineInputs(
  seedRetailerUrls: string[],
  competitorBrandUrls: string[]
): Promise<PipelineValidation> {
  const res = await fetch(`${API_BASE}/api/pipeline/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seed_retailer_urls: seedRetailerUrls,
      competitor_brand_urls: competitorBrandUrls,
    }),
  });
  return res.json();
}

export async function startPipeline(
  seedRetailerUrls: string[],
  competitorBrandUrls: string[],
  options: {
    brandName?: string;
    enrichContacts?: boolean;
    maxEnrich?: number;
  } = {}
) {
  const url = `${API_BASE}/api/pipeline/start`;
  const body = {
    seed_retailer_urls: seedRetailerUrls,
    competitor_brand_urls: competitorBrandUrls,
    brand_name: options.brandName || "ALEXMONHART",
    enrich_contacts: options.enrichContacts ?? true,
    max_enrich: options.maxEnrich || 50,
  };
  console.log("Fetching:", url);
  console.log("Body:", JSON.stringify(body, null, 2));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("Response status:", res.status);
    if (!res.ok) {
      const error = await res.json();
      console.log("Error response:", error);
      throw new Error(error.detail?.message || "Failed to start pipeline");
    }
    const data = await res.json();
    console.log("Success response:", data);
    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
}

export async function getPipelineStatus(runId: string): Promise<PipelineRun> {
  const res = await fetch(`${API_BASE}/api/pipeline/${runId}`);
  return res.json();
}

export async function listPipelineRuns() {
  const res = await fetch(`${API_BASE}/api/pipeline`);
  return res.json();
}

export async function listRetailers(params: {
  skip?: number;
  limit?: number;
  country?: string;
  status?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.set("skip", params.skip.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.country) searchParams.set("country", params.country);
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`${API_BASE}/api/retailers?${searchParams}`);
  return res.json();
}

export async function getRetailer(retailerId: string): Promise<RetailerDetail> {
  const res = await fetch(`${API_BASE}/api/retailers/${retailerId}`);
  return res.json();
}

export async function enrichRetailer(retailerId: string) {
  const res = await fetch(`${API_BASE}/api/retailers/${retailerId}/enrich`, {
    method: "POST",
  });
  return res.json();
}

export function getExportCsvUrl() {
  return `${API_BASE}/api/retailers/export/csv`;
}

// =============================================================================
// STATS API
// =============================================================================

export interface DashboardStats {
  campaigns: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    total_cost: number;
  };
  retailers: {
    total: number;
    with_emails: number;
    by_status: { [key: string]: number };
  };
  recent_activity: {
    campaigns: any[];
    retailers: any[];
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [campaignsData, retailersData, enrichmentData] = await Promise.all([
    listResults(),
    listRetailers({ limit: 10 }),
    fetch(`${API_BASE}/api/retailers/enrichment-stats`).then((r) => r.json()),
  ]);

  const campaigns = campaignsData.results || [];

  return {
    campaigns: {
      total: campaigns.length,
      completed: campaigns.filter((c: any) => c.status === "completed").length,
      failed: campaigns.filter((c: any) => c.status === "failed").length,
      processing: campaigns.filter(
        (c: any) => c.status === "processing" || c.status === "queued"
      ).length,
      total_cost: campaigns.reduce((sum: number, c: any) => sum + (c.total_cost || 0), 0),
    },
    retailers: {
      total: enrichmentData.total_retailers || 0,
      with_emails: enrichmentData.with_emails || 0,
      by_status: enrichmentData.by_status || {},
    },
    recent_activity: {
      campaigns: campaigns.slice(0, 5),
      retailers: retailersData.retailers?.slice(0, 5) || [],
    },
  };
}

// =============================================================================
// AIRTABLE DIRECT API
// =============================================================================

export interface AirtableCampaign {
  id: string;
  retailer_name: string;
  retailer_country: string | null;
  retailer_email: string | null;
  retailer_notes: string | null;
  brand_name: string;
  status: string;
  ready_to_send: boolean;
  chosen_variant: string | null;
  email_sent: boolean;
  email_id: string | null;
  sent_timestamp: string | null;
  followup1_sent_date: string | null;
  followup2_sent_date: string | null;
  followup3_sent_date: string | null;
  retailer_responded: boolean;
  response_date: string | null;
  created_at: string;
  intro_email_a: string;
  intro_email_b: string;
  intro_email_c: string;
  followup_1: string;
  followup_2: string;
  followup_3: string;
  personalization_notes: string;
}

export interface AirtableRetailer {
  id: string;
  name: string;
  url: string | null;
  country: string | null;
  city: string | null;
  contact_emails: string[];
  contact_names: string[];
  instagram_handle: string | null;
  confidence_score: number | null;
  relationship_status: string | null;
  enrichment_status: string | null;
  created_at: string | null;
  source: string | null;
  source_brands: string[];  // Multi-select brand names
}

export interface AirtableStats {
  campaigns: {
    total: number;
    sent: number;
    responded: number;
    pending: number;
  };
  retailers: {
    total: number;
    with_emails: number;
    enrichment_rate: string;
  };
  performance: {
    response_rate: string;
    conversion_rate: string;
  };
}

export async function getAirtableCampaigns(): Promise<{ campaigns: AirtableCampaign[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/airtable/campaigns`);
  if (!res.ok) throw new Error("Failed to fetch campaigns from Airtable");
  return res.json();
}

export async function getAirtableRetailers(
  skip = 0,
  limit = 50
): Promise<{ retailers: AirtableRetailer[]; total: number; skip: number; limit: number }> {
  const res = await fetch(`${API_BASE}/api/airtable/retailers?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch retailers from Airtable");
  return res.json();
}

export async function getAirtableStats(): Promise<AirtableStats> {
  const res = await fetch(`${API_BASE}/api/airtable/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats from Airtable");
  return res.json();
}

export async function generateCampaignsBulk(retailerIds: string[], brandName: string = "ALEXMONHART") {
  const res = await fetch(`${API_BASE}/api/campaigns/generate-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retailer_ids: retailerIds, brand_name: brandName })
  });
  if (!res.ok) throw new Error("Failed to generate campaigns");
  return res.json();
}

export async function enrichRetailersBulk(retailerIds: string[]) {
  const res = await fetch(`${API_BASE}/api/retailers/enrich-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retailer_ids: retailerIds })
  });
  if (!res.ok) throw new Error("Failed to enrich retailers");
  return res.json();
}

export async function updateCampaignDate(
  campaignId: string,
  field: string,
  value: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/airtable/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) throw new Error("Failed to update campaign in Airtable");
  return res.json();
}

// =============================================================================
// NEW CAMPAIGN ACTIONS (Feature 8-14)
// =============================================================================

export interface SendEmailRequest {
  campaign_id: string;
  variation: "A" | "B" | "C";
  from_email?: string;
  from_name?: string;
}

export interface SendEmailResponse {
  success: boolean;
  email_id: string;
  sent_to: string;
  subject: string;
  retailer: string;
}

export async function sendCampaignEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  const res = await fetch(`${API_BASE}/api/campaigns/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to send email");
  }
  return res.json();
}

export async function markCampaignResponded(campaignId: string, responseDate?: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/campaigns/mark-responded`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id: campaignId,
      response_date: responseDate || new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to mark campaign as responded");
  }
  return res.json();
}

export function getCampaignsCsvExportUrl(): string {
  return `${API_BASE}/api/campaigns/export-csv`;
}

export async function enrichRetailerFromFacebook(retailerId: string, facebookUrl: string) {
  const res = await fetch(`${API_BASE}/api/retailers/enrich-from-facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      retailer_id: retailerId,
      facebook_url: facebookUrl,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to enrich from Facebook");
  }
  return res.json();
}
