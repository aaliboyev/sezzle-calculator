package main

import (
	"log"
	"net/http"
	"os"
	"time"
)

func newMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/api/v1/calculate", handleCalculate)
	registerStatic(mux)
	return mux
}

// 'unsafe-inline' styles are required by MathLive's rendered markup.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Content-Security-Policy",
			"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
		h.Set("Referrer-Policy", "no-referrer")
		next.ServeHTTP(w, r)
	})
}

func handler() http.Handler {
	return securityHeaders(newMux())
}

func main() {
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		log.Fatal("BACKEND_PORT is not set (see .env.example)")
	}
	if host := os.Getenv("BACKEND_HOST"); host != "" {
		log.Printf("listening on http://%s:%s (api: http://%s:%s/api/v1/calculate)", host, port, host, port)
	} else {
		log.Printf("listening on :%s", port)
	}
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handler(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
