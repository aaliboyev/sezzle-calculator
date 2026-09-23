package main

import (
	"bytes"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"
)

// Build output under /assets is content-hashed, so a changed file always has
// a new URL; everything else must be revalidated to pick up new hashes.
const immutableCache = "public, max-age=31536000, immutable"

var encodings = []struct{ name, ext string }{{"br", ".br"}, {"gzip", ".gz"}}

func acceptsEncoding(header, name string) bool {
	for part := range strings.SplitSeq(header, ",") {
		coding, params, _ := strings.Cut(part, ";")
		if strings.TrimSpace(coding) != name {
			continue
		}
		q, found := strings.CutPrefix(strings.TrimSpace(params), "q=")
		if !found {
			return true
		}
		weight, err := strconv.ParseFloat(q, 64)
		return err == nil && weight > 0
	}
	return false
}

func serveStatic(fsys fs.FS) http.Handler {
	fileServer := http.FileServerFS(fsys)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		// FileServer renders directory listings; only "/" has an index.
		if strings.HasSuffix(r.URL.Path, "/") && name != "" {
			http.NotFound(w, r)
			return
		}
		if name == "" {
			name = "index.html"
		}
		h := w.Header()
		if strings.HasPrefix(name, "assets/") {
			h.Set("Cache-Control", immutableCache)
		} else {
			h.Set("Cache-Control", "no-cache")
		}
		h.Set("Vary", "Accept-Encoding")
		for _, enc := range encodings {
			if !acceptsEncoding(r.Header.Get("Accept-Encoding"), enc.name) {
				continue
			}
			data, err := fs.ReadFile(fsys, name+enc.ext)
			if err != nil {
				continue
			}
			h.Set("Content-Encoding", enc.name)
			if ctype := mime.TypeByExtension(path.Ext(name)); ctype != "" {
				h.Set("Content-Type", ctype)
			}
			http.ServeContent(w, r, name, time.Time{}, bytes.NewReader(data))
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}
