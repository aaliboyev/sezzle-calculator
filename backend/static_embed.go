//go:build embed

package main

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed all:dist
var distFS embed.FS

func registerStatic(mux *http.ServeMux) {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		panic(err)
	}
	mux.Handle("/", http.FileServerFS(sub))
}
