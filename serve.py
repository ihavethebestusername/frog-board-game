# Local server for the game that tells browsers never to cache files,
# so every refresh loads the latest code, styles, sprites and sounds.
# Run:  python serve.py        (then open http://localhost:8000)
import http.server
import socketserver

PORT = 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'Serving the game at http://localhost:{PORT} (no caching) - press Ctrl+C to stop')
    httpd.serve_forever()
