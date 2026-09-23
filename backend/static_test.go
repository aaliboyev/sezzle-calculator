package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

var testDist = fstest.MapFS{
	"index.html":             {Data: []byte("<html></html>")},
	"assets/app-1a2b.js":     {Data: []byte("plain")},
	"assets/app-1a2b.js.br":  {Data: []byte("brotli")},
	"assets/app-1a2b.js.gz":  {Data: []byte("gzip")},
	"assets/font-3c4d.woff2": {Data: []byte("font")},
}

func getStatic(t *testing.T, target, acceptEncoding string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	if acceptEncoding != "" {
		req.Header.Set("Accept-Encoding", acceptEncoding)
	}
	rec := httptest.NewRecorder()
	serveStatic(testDist).ServeHTTP(rec, req)
	return rec
}

func TestStaticEncodingNegotiation(t *testing.T) {
	tests := []struct {
		accept, wantEncoding, wantBody string
	}{
		{"gzip, deflate, br, zstd", "br", "brotli"},
		{"gzip", "gzip", "gzip"},
		{"br;q=0, gzip;q=0.8", "gzip", "gzip"},
		{"br;q=0.0, gzip;q=0", "", "plain"},
		{"identity", "", "plain"},
		{"", "", "plain"},
	}
	for _, tt := range tests {
		rec := getStatic(t, "/assets/app-1a2b.js", tt.accept)
		if rec.Code != http.StatusOK {
			t.Fatalf("%q: status = %d", tt.accept, rec.Code)
		}
		if got := rec.Header().Get("Content-Encoding"); got != tt.wantEncoding {
			t.Errorf("%q: Content-Encoding = %q, want %q", tt.accept, got, tt.wantEncoding)
		}
		if got := rec.Body.String(); got != tt.wantBody {
			t.Errorf("%q: body = %q, want %q", tt.accept, got, tt.wantBody)
		}
		if got := rec.Header().Get("Content-Type"); got != "text/javascript; charset=utf-8" {
			t.Errorf("%q: Content-Type = %q", tt.accept, got)
		}
		if got := rec.Header().Get("Vary"); got != "Accept-Encoding" {
			t.Errorf("%q: Vary = %q", tt.accept, got)
		}
	}
}

func TestStaticCacheControl(t *testing.T) {
	tests := []struct {
		target string
		status int
		want   string
	}{
		{"/assets/app-1a2b.js", http.StatusOK, immutableCache},
		{"/assets/font-3c4d.woff2", http.StatusOK, immutableCache},
		{"/", http.StatusOK, "no-cache"},
		// A missing asset must not be cached as a year-long 404.
		{"/assets/missing.js", http.StatusNotFound, ""},
		{"/assets/", http.StatusNotFound, ""},
	}
	for _, tt := range tests {
		rec := getStatic(t, tt.target, "br")
		if rec.Code != tt.status {
			t.Errorf("%s: status = %d, want %d", tt.target, rec.Code, tt.status)
		}
		if got := rec.Header().Get("Cache-Control"); got != tt.want {
			t.Errorf("%s: Cache-Control = %q, want %q", tt.target, got, tt.want)
		}
	}
}
