// Vercel Cron endpoint: exports every table to a single dated JSON snapshot in
// Supabase Storage (private "db-backups" bucket). Free-tier stand-in for managed
// backups — Supabase's own automatic backups require a paid plan. This protects
// against app/data bugs (silently failed writes, accidental bad edits) by giving a
// point to restore individual rows from; it does NOT protect against a Supabase
// platform outage or the project itself being deleted, since the backup lives in
// the same project.
//
// Restore is manual: download the JSON for the date you need, find the row(s),
// and re-insert/update via the Supabase SQL editor or REST API. There's no
// one-click restore script — the data is preserved, not automated recovery.
//
// Supports ?dryRun=true, which reports what would be backed up (row counts, size)
// without uploading or pruning anything.

const TABLES = [
  "members", "registrations", "families", "assistance_groups", "churches",
  "events", "approvals", "rosters", "teams", "app_users", "categories",
  "functions", "app_settings", "audit_log",
];

const BUCKET = "db-backups";
const RETENTION_DAYS = 30;

export default async function handler(req, res) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = req.query?.dryRun === "true";

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(500).json({ error: "server_not_configured" });
    return;
  }

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  try {
    const snapshot = { takenAt: new Date().toISOString(), tables: {} };
    const counts = {};
    const failures = [];

    for (const table of TABLES) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
      if (!r.ok) {
        failures.push({ table, status: r.status });
        continue;
      }
      const rows = await r.json();
      snapshot.tables[table] = rows;
      counts[table] = rows.length;
    }

    const body = JSON.stringify(snapshot);
    const sizeBytes = Buffer.byteLength(body);
    const dateStr = new Date().toISOString().slice(0, 10);
    const path = `backups/${dateStr}.json`;

    let uploaded = false;
    let pruned = [];

    if (!dryRun) {
      const upload = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", "x-upsert": "true" },
          body,
        }
      );
      if (!upload.ok) {
        res.status(502).json({ error: "upload_failed", status: upload.status, detail: await upload.text().catch(() => null) });
        return;
      }
      uploaded = true;

      // Retention: list existing backups, delete anything past RETENTION_DAYS so
      // storage usage stays bounded (free tier is 1GB) without manual upkeep.
      const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: "backups/", limit: 1000 }),
      });
      if (listRes.ok) {
        const objects = await listRes.json();
        const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const toDelete = (objects || [])
          .filter((o) => {
            const m = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(o.name);
            if (!m) return false;
            return new Date(m[1] + "T00:00:00Z").getTime() < cutoff;
          })
          .map((o) => `backups/${o.name}`);
        if (toDelete.length > 0) {
          const delRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
            method: "DELETE",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: toDelete }),
          });
          if (delRes.ok) pruned = toDelete;
        }
      }
    }

    res.status(200).json({ dryRun, path, uploaded, sizeBytes, counts, failures, pruned, retentionDays: RETENTION_DAYS });
  } catch (err) {
    res.status(500).json({ error: "unexpected_error", detail: err?.message || String(err) });
  }
}
