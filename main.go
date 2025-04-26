package main

import (
	"compress/gzip"
	"log"
	"net/http"
	"strings"

	"example.com/handlers"
)

// GzipResponseWriter wraps the standard http.ResponseWriter
type GzipResponseWriter struct {
	http.ResponseWriter
	Writer *gzip.Writer
}

func (w GzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

// GzipMiddleware checks Accept-Encoding and applies gzip
func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		grw := GzipResponseWriter{ResponseWriter: w, Writer: gz}
		next.ServeHTTP(grw, r)
	})
}

func main() {
	http.Handle("/api/immigration-data", GzipMiddleware(http.HandlerFunc(handlers.GetImmigrationData)))
	http.Handle("/api/updatedb", http.HandlerFunc(handlers.UpdateDB))
	http.Handle("/", http.HandlerFunc(handlers.CheckHealth))

	log.Println("Server running at http://localhost:8080/")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
