import { useEffect, useState } from "react";
import { api, type AuditRow } from "../api";

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(100);

  async function load() {
    const params = new URLSearchParams();
    if (eventType.trim()) params.set("eventType", eventType.trim());
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    params.set("limit", String(limit));

    const { ok, data } = await api<{ logs?: AuditRow[]; error?: string }>(
      `/api/admin/logs?${params.toString()}`
    );
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to load logs.");
      return;
    }
    setLogs(data.logs ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1>Audit logs</h1>
      <p className="muted">Administrators only. Security-relevant events and validation failures.</p>
      {error && <div className="msg msg-error">{error}</div>}

      <div className="card">
        <div className="row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Event type</label>
            <input
              type="text"
              placeholder="e.g. AUTH_FAILURE"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>From</label>
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>To</label>
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Limit</label>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-end" }} onClick={() => void load()}>
            Apply filters
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Message</th>
              <th>User</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.eventType}</td>
                <td>{l.message}</td>
                <td className="muted">{l.userId ?? "—"}</td>
                <td className="muted">{l.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
