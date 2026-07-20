//go:build !embed

package main

import "net/http"

// Dev builds serve no static files; Vite hosts the frontend and proxies /api.
func registerStatic(mux *http.ServeMux) {}
