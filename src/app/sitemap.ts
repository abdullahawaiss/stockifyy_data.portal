import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://stockifyy.com";
  const now = new Date();
  return [
    { url: `${base}/dashboard`,                  lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/dashboard/screener`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/dashboard/announcements`,     lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/dashboard/indices`,           lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/dashboard/sectors`,           lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${base}/dashboard/daily`,             lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${base}/dashboard/weekly`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/dashboard/historical-data`,   lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/dashboard/companies`,         lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/dashboard/portfolio`,         lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${base}/dashboard/research`,          lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
