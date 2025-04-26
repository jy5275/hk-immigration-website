package main

import (
	"log"
	"net/http"

	"example.com/handlers"
)

func main() {
	http.HandleFunc("/api/immigration-data", handlers.GetImmigrationData)
	http.HandleFunc("/api/updatedb", handlers.UpdateDB)
	http.HandleFunc("/", handlers.CheckHealth)

	log.Println("Server running at http://localhost:8080/")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
