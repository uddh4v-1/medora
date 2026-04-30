export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Medora/1.0 (clinic management platform)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = data[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
