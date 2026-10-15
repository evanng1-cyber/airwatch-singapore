import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT) || 4173;
const psiEndpoint = "https://api-open.data.gov.sg/v2/real-time/api/psi";
const pm25Endpoint = "https://api-open.data.gov.sg/v2/real-time/api/pm25";
const hazeTimestampEndpoint = "https://www.haze.gov.sg/api/UnixTime/GetTime";
const neaLatestUpdateEndpoint = "https://www.nea.gov.sg/api/latestupdate/getlatestupdate";
const neaHazeAdvisoryEndpoint = "https://www.nea.gov.sg/api/advisory/latesthazesituationupdate";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function getApiKey() {
  if (process.env.DATA_GOV_SG_API_KEY) {
    return process.env.DATA_GOV_SG_API_KEY;
  }

  const envPath = join(projectDirectory, ".env.local");
  if (!existsSync(envPath)) return "";

  const entry = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((line) => /^\s*DATA_GOV_SG_API_KEY\s*=/.test(line));

  if (!entry) return "";

  const value = entry.replace(/^\s*DATA_GOV_SG_API_KEY\s*=\s*/, "").trim();
  return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, (_, double, single) => double ?? single);
}

function singaporeToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts();
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function plainText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([\da-f]+);/gi, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 16)),
    )
    .replace(/&#(\d+);/g, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 10)),
    )
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&rsquo;|&lsquo;|&#8216;|&#8217;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, "\"")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[\t ]*\n[\t ]*/g, "\n")
    .replace(/[\t ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLatestAnnouncement(notice) {
  if (!notice || typeof notice !== "object") return null;

  const body = plainText(notice.LessContent || notice.Content);
  if (!body) return null;

  return {
    title: plainText(notice.Title) || "Latest NEA update",
    publishedAt: plainText(notice.PublicationDateStr),
    summary: body.slice(0, 1800),
    source: "National Environment Agency",
    url: "https://www.nea.gov.sg/media/news",
  };
}

function normalizeHazeAdvisory(notice) {
  if (!notice || typeof notice !== "object") return null;

  const expiry = plainText(notice.ExpiryDateHazeDisplay);
  const expiryTime = Date.parse(expiry);
  if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) return null;

  const body = plainText(notice.BodyText);
  const healthAdvice = plainText(notice.HealthAdvisoryBlurb);
  const airQuality = plainText(notice.AirQualityBlurb);
  if (!body && !healthAdvice && !airQuality) return null;

  return {
    title: "Haze situation update",
    publishedAt: plainText(notice.DateOfArticle),
    forecast: airQuality,
    measures: healthAdvice,
    summary: body.slice(0, 1800),
    source: "haze.gov.sg · National Environment Agency",
    url: "https://www.haze.gov.sg/",
    expiresAt: expiry,
  };
}

async function fetchNeaJson(url) {
  const result = await fetch(url, {
    headers: { accept: "application/json", "x-requested-with": "XMLHttpRequest" },
    signal: AbortSignal.timeout(12000),
  });
  if (!result.ok) throw new Error(`The official update service returned ${result.status}.`);
  return result.json();
}

async function handleOfficialUpdates(response) {
  try {
    const timestampResponse = await fetch(`${hazeTimestampEndpoint}/${randomUUID()}`, {
      headers: { "x-requested-with": "XMLHttpRequest" },
      signal: AbortSignal.timeout(12000),
    });
    if (!timestampResponse.ok) throw new Error("The official update time is unavailable.");

    const timestamp = (await timestampResponse.text()).trim();
    if (!/^\d{9,12}$/.test(timestamp)) throw new Error("The official update time is invalid.");

    const [announcementResult, advisoryResult] = await Promise.allSettled([
      fetchNeaJson(`${neaLatestUpdateEndpoint}/${timestamp}`),
      fetchNeaJson(`${neaHazeAdvisoryEndpoint}/${timestamp}`),
    ]);
    if (announcementResult.status === "rejected" && advisoryResult.status === "rejected") {
      throw new Error("The official haze updates are temporarily unavailable.");
    }

    const announcement = announcementResult.status === "fulfilled"
      ? normalizeLatestAnnouncement(announcementResult.value)
      : null;
    const hazeAdvisory = advisoryResult.status === "fulfilled"
      ? normalizeHazeAdvisory(advisoryResult.value)
      : null;

    respondJson(response, 200, {
      updatedAt: new Date().toISOString(),
      announcement,
      hazeAdvisory,
      links: {
        nea: "https://www.nea.gov.sg/media/news",
        haze: "https://www.haze.gov.sg/",
      },
    });
  } catch {
    respondJson(response, 502, {
      error: "Official haze updates are temporarily unavailable. Please try again shortly.",
    });
  }
}

async function handleRealtime(endpoint, requestUrl, response) {
  const apiKey = getApiKey();
  const requestedDate = requestUrl.searchParams.get("date");
  const date = requestedDate || singaporeToday();
  if (!isValidDate(date)) {
    respondJson(response, 400, { error: "Use a valid date in YYYY-MM-DD format." });
    return;
  }

  const query = new URLSearchParams({ date });
  const paginationToken = requestUrl.searchParams.get("paginationToken");
  if (paginationToken) query.set("paginationToken", paginationToken);

  try {
    const upstream = await fetch(`${endpoint}?${query}`, {
      headers: {
        accept: "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    response.writeHead(upstream.status, {
      "cache-control": "no-store",
      "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    });
    response.end(await upstream.text());
  } catch {
    respondJson(response, 502, { error: "Could not reach the data.gov.sg air-quality service. Try again shortly." });
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  if (requestUrl.pathname === "/api/updates") {
    if (request.method !== "GET") {
      respondJson(response, 405, { error: "Use a GET request to load official updates." });
      return;
    }

    await handleOfficialUpdates(response);
    return;
  }

  const realtimeEndpoints = {
    "/api/psi": psiEndpoint,
    "/api/pm25": pm25Endpoint,
  };

  if (realtimeEndpoints[requestUrl.pathname]) {
    if (request.method !== "GET") {
      respondJson(response, 405, { error: "Use a GET request to fetch air-quality readings." });
      return;
    }

    await handleRealtime(realtimeEndpoints[requestUrl.pathname], requestUrl, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end();
    return;
  }

  const requestedFile = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
  if (!["index.html", "styles.css", "app.js"].includes(requestedFile)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const contents = await readFile(join(projectDirectory, requestedFile));
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      "content-type": contentTypes[extname(requestedFile)],
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch {
    response.writeHead(500);
    response.end("Unable to load the website.");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Airwatch is running at http://localhost:${port}`);
});