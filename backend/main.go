package main

import (
	"log"
	"net/http"
	"os"
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
	if err := http.ListenAndServe(":"+port, newMux()); err != nil {
		log.Fatal(err)
	}
}
