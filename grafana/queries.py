# Single source of truth for the Grafana panel SQL; build_dashboard.py renders the JSON.
PANELS = [
    ("stat", "Total complaints", "SELECT COUNT(*) AS value FROM complaints"),
    ("stat", "Open (not resolved)", "SELECT COUNT(*) AS value FROM complaints WHERE status != 'resolved'"),
    ("stat", "SLA breached", "SELECT COUNT(*) AS value FROM complaints WHERE sla_breached = 1"),
    ("stat", "Systemic clusters (2+ customers)",
     "SELECT COUNT(*) AS value FROM (SELECT cluster_id FROM complaints WHERE cluster_id IS NOT NULL GROUP BY cluster_id HAVING COUNT(DISTINCT customer_id) >= 2)"),
    ("barchart", "Complaints by category", "SELECT category, COUNT(*) AS complaints FROM complaints GROUP BY category ORDER BY complaints DESC"),
    ("piechart", "By severity", "SELECT severity, COUNT(*) AS complaints FROM complaints GROUP BY severity"),
    ("barchart", "By channel", "SELECT channel, COUNT(*) AS complaints FROM complaints GROUP BY channel ORDER BY complaints DESC"),
    ("barchart", "Daily complaint volume", "SELECT substr(received_at, 1, 10) AS day, COUNT(*) AS complaints FROM complaints GROUP BY day ORDER BY day"),
    ("table", "Systemic patterns: complaints sharing a cluster",
     "SELECT MIN(category) AS category, COUNT(*) AS complaints, COUNT(DISTINCT customer_id) AS customers, COUNT(DISTINCT channel) AS channels, SUM(sla_breached) AS sla_breached, MIN(substr(received_at,1,10)) AS first_seen FROM complaints WHERE cluster_id IS NOT NULL GROUP BY cluster_id HAVING COUNT(*) >= 2 ORDER BY customers DESC, complaints DESC"),
    ("table", "SLA breach rate by category",
     "SELECT category, COUNT(*) AS complaints, SUM(sla_breached) AS breached, ROUND(100.0 * SUM(sla_breached) / COUNT(*), 1) AS breach_pct FROM complaints GROUP BY category ORDER BY breach_pct DESC, complaints DESC"),
]
