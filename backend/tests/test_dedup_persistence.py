"""Regression test: duplicates must still be detected after a backend restart.

Runs two separate Python processes with different PYTHONHASHSEED values (what a
restart does) against the same persisted dedup index, using the offline fallback
encoder. Before the fix, the second process saw cosine ~0.06 for identical text.
"""

import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

SCRIPT = r"""
import sys, json
sys.path.insert(0, {backend!r})
import app.services.clustering as cl
from app.services.store import get_store
from app.models.complaint import Complaint, Channel
svc = cl.ClusteringService.__new__(cl.ClusteringService)
import threading, numpy as np
svc.lock = threading.Lock(); svc.encoder = None; svc.index = None; svc.id_map = []
svc.cluster_map = {{}}; svc.cluster_counts = {{}}; svc.numpy_embeddings = None; svc.healthy = True
svc.use_qdrant = False; svc.qdrant_ready = False
# Force the offline encoder path (no model download) for a deterministic test.
real_load = cl.ClusteringService._load
def load_no_model(self):
    import builtins
    orig_import = builtins.__import__
    def fake_import(name, *a, **k):
        if name == "sentence_transformers":
            raise ImportError("disabled for test")
        return orig_import(name, *a, **k)
    builtins.__import__ = fake_import
    try:
        real_load(self)
    finally:
        builtins.__import__ = orig_import
load_no_model(svc)
store = get_store()
text = "My UPI payment of Rs 2500 failed but the amount was debited from my account."
step = sys.argv[1]
if step == "first":
    store.clear(); svc.clear()
    c = Complaint(id="dup-a", ticket_id="TKT-DUPA", channel=Channel.APP, raw_text=text, masked_text=text, customer_id="CUST-1")
    c.cluster = svc.check_and_register("dup-a", text, customer_id="CUST-1")
    store.save(c)
    print(json.dumps({{"is_duplicate": c.cluster.is_duplicate}}))
else:
    res = svc.check_and_register("dup-b", text, customer_id="CUST-1")
    print(json.dumps({{"is_duplicate": res.is_duplicate, "duplicate_of": res.duplicate_of}}))
    store.clear(); svc.clear()
"""


def _run(step: str, seed: str) -> dict:
    import json
    env = {**os.environ, "PYTHONHASHSEED": seed, "DATABASE_URL": ""}
    out = subprocess.run(
        [sys.executable, "-c", SCRIPT.format(backend=str(BACKEND)), step],
        cwd=BACKEND, env=env, capture_output=True, text=True, timeout=120,
    )
    assert out.returncode == 0, out.stderr[-2000:]
    return json.loads(out.stdout.strip().splitlines()[-1])


def test_duplicate_detected_across_restart():
    first = _run("first", "1")
    assert first["is_duplicate"] is False
    second = _run("second", "2")  # different hash seed = a restarted backend
    assert second["is_duplicate"] is True
    assert second["duplicate_of"] == "dup-a"
