from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

ThreadingHTTPServer.request_queue_size = 128
handler = partial(Quiet, directory=str(Path(__file__).resolve().parents[2]))
ThreadingHTTPServer(("127.0.0.1", 8977), handler).serve_forever()
