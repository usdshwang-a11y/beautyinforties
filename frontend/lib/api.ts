import type {
  AnalyzeRequest,
  BenchmarkStatus,
  DashboardPayload,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export async function analyze(req: AnalyzeRequest): Promise<DashboardPayload> {
  const resp = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`분석 실패 (${resp.status}): ${text}`);
  }
  return resp.json();
}

export async function saveBenchmark(
  clinicId: string,
  reviews: string
): Promise<BenchmarkStatus> {
  const resp = await fetch(`${API_BASE}/api/benchmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinic_id: clinicId, reviews }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`벤치마크 저장 실패 (${resp.status}): ${text}`);
  }
  return resp.json();
}

export async function getBenchmarkStatus(
  clinicId: string
): Promise<BenchmarkStatus> {
  const resp = await fetch(`${API_BASE}/api/benchmark/${clinicId}`);
  if (!resp.ok) {
    return { clinic_id: clinicId, exists: false, char_count: 0 };
  }
  return resp.json();
}
