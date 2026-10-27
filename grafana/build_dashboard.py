"""Render dashboards/themis.json from queries.py.  Run: python grafana/build_dashboard.py"""
import json
from pathlib import Path
from queries import PANELS

DS = {"type": "frser-sqlite-datasource", "uid": "themis-sqlite"}
panels, x, y = [], 0, 0
sizes = {"stat": (6, 4), "barchart": (12, 9), "piechart": (12, 9), "table": (24, 9)}
for i, (kind, title, sql) in enumerate(PANELS, 1):
    w, h = sizes[kind]
    if x + w > 24:
        x, y = 0, y + prev_h
    p = {
        "id": i, "type": kind, "title": title, "datasource": DS,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "targets": [{"refId": "A", "datasource": DS, "queryType": "table", "queryText": sql, "rawQueryText": sql, "timeColumns": []}],
        "options": {}, "fieldConfig": {"defaults": {}, "overrides": []},
    }
    if kind == "stat":
        p["options"] = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False}, "colorMode": "background", "graphMode": "none"}
    if kind == "barchart":
        p["options"] = {"orientation": "auto", "showValue": "auto", "xTickLabelRotation": -30, "legend": {"showLegend": False}}
    if kind == "piechart":
        p["options"] = {"reduceOptions": {"calcs": [], "fields": "", "values": True}, "pieType": "donut", "legend": {"displayMode": "list", "placement": "right"}}
    panels.append(p)
    x, prev_h = x + w, h

dash = {"uid": "themis-overview", "title": "Themis — Grievance Analytics", "tags": ["themis"], "timezone": "browser",
        "schemaVersion": 39, "refresh": "30s", "time": {"from": "now-30d", "to": "now"}, "panels": panels}
Path(__file__).with_name("dashboards").joinpath("themis.json").write_text(json.dumps(dash, indent=2, ensure_ascii=False))
print(f"wrote {len(panels)} panels")
