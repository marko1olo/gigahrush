from __future__ import annotations

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parent
REPORTS = ROOT / "browser_reports"
REPORTS.mkdir(exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    def _headers(self, code: int, content_type: str = "text/plain; charset=utf-8") -> None:
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def do_OPTIONS(self) -> None:
        self._headers(204)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/beacon":
            qs = parse_qs(parsed.query)
            name = "".join(ch for ch in (qs.get("name", ["beacon"])[0]) if ch.isalnum() or ch in "-_")[:80] or "beacon"
            seq = "".join(ch for ch in (qs.get("seq", ["0"])[0]) if ch.isdigit()) or "0"
            total = "".join(ch for ch in (qs.get("total", ["1"])[0]) if ch.isdigit()) or "1"
            data = qs.get("data", [""])[0]
            (REPORTS / f"{name}_chunk_{int(seq):04d}_of_{int(total):04d}.txt").write_text(data, encoding="utf-8")
            self._headers(204)
            return
        rel = unquote(parsed.path.lstrip("/")) or "index.txt"
        path = (ROOT / rel).resolve()
        if not str(path).startswith(str(ROOT.resolve())) or not path.is_file():
            self._headers(404)
            self.wfile.write(b"not found")
            return
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix in {".html", ".md", ".css", ".json"}:
            ctype = f"text/{path.suffix[1:]}; charset=utf-8" if path.suffix != ".json" else "application/json; charset=utf-8"
        self._headers(200, ctype)
        self.wfile.write(path.read_bytes())

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(length)
        name = "report"
        try:
            data = json.loads(body.decode("utf-8", errors="replace"))
            if isinstance(data, dict) and isinstance(data.get("name"), str):
                name = "".join(ch for ch in data["name"] if ch.isalnum() or ch in "-_")[:80] or "report"
            payload = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        except Exception:
            payload = body
        existing = sorted(REPORTS.glob(f"{name}_*.json"))
        path = REPORTS / f"{name}_{len(existing) + 1:03d}.json"
        path.write_bytes(payload)
        self._headers(200, "application/json; charset=utf-8")
        self.wfile.write(json.dumps({"ok": True, "path": str(path)}, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8790), Handler)
    print("ITCH_APPLY_SERVER http://127.0.0.1:8790")
    server.serve_forever()
