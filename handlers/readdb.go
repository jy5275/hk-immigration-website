package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

var controlPointMap = map[string]int{
	"Lo Wu":                          0,
	"Lok Ma Chau Spur Line":          1,
	"Airport":                        2,
	"Shenzhen Bay":                   3,
	"Hong Kong-Zhuhai-Macao Bridge":  4,
	"Express Rail Link West Kowloon": 5,
	"Heung Yuen Wai":                 6,
	"Lok Ma Chau":                    7,
	"Macau Ferry Terminal":           8,
	"Man Kam To":                     9,
	"China Ferry Terminal":           10,
	"Kai Tak Cruise Terminal":        11,
	"Harbour Control":                12,
	"Sha Tau Kok":                    13,
	"Hung Hom":                       14,
	"Tuen Mun Ferry Terminal":        15,
}

type ImmigrationDataCompressed struct {
	ID               int    `json:"id"`
	Date             string `json:"date"`
	ControlPointID   int    `json:"control_point_id"` // encoded
	DirectionID      int    `json:"direction_id"`     // encoded
	HKResidents      int    `json:"hk_residents"`
	MainlandVisitors int    `json:"mainland_visitors"`
	OtherVisitors    int    `json:"other_visitors"`
	Total            int    `json:"total"`
}

func encodeControlPoint(name string) int {
	if id, ok := controlPointMap[name]; ok {
		return id
	}
	return -1 // fallback for unknown
}

func encodeDirection(dir string) int {
	if dir == "Arrival" {
		return 0
	}
	return 1 // assume "Departure"
}

func GetImmigrationData(w http.ResponseWriter, r *http.Request) {
	allowedOrigins := map[string]bool{
		"http://localhost:5173": true,
		"http://ec2-16-162-34-49.ap-east-1.compute.amazonaws.com:5173": true,
		"https://ec2-16-162-34-49.ap-east-1.compute.amazonaws.com":     true,
		"http://jysalb-1772187126.ap-east-1.elb.amazonaws.com":         true,
		"https://jysalb-1772187126.ap-east-1.elb.amazonaws.com":        true,
		"http://hk-immigration.jiangyan.click":                         true,
		"https://hk-immigration.jiangyan.click":                        true,
		"https://hk-immigration-website.pages.dev":                     true,
	}
	origin := r.Header.Get("Origin")
	if allowedOrigins[origin] {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	} else if r.Method == http.MethodOptions {
		http.Error(w, "CORS origin not allowed", http.StatusForbidden)
		return
	}

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if db == nil {
		var err error
		log.Print("Cannot connect to MySQL, change to local mode...")

		// For local testing, reopen SQLite for every request
		db, err = sql.Open("sqlite3", "./scripts/immigration_data.db")
		if err != nil {
			log.Fatalf("Cannot connect to SQLite: %v", err)
			http.Error(w, "Database not initialized", http.StatusInternalServerError)
			return
		}
		defer func() {
			db.Close()
			db = nil
		}()
	}

	rows, err := db.Query(`SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total FROM immigration`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var data []ImmigrationDataCompressed
	for rows.Next() {
		var id, hk, mainland, other, total int
		var date, cp, dir string
		err = rows.Scan(&id, &date, &cp, &dir, &hk, &mainland, &other, &total)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		compressed := ImmigrationDataCompressed{
			ID:               id,
			Date:             date,
			ControlPointID:   encodeControlPoint(cp),
			DirectionID:      encodeDirection(dir),
			HKResidents:      hk,
			MainlandVisitors: mainland,
			OtherVisitors:    other,
			Total:            total,
		}
		data = append(data, compressed)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
	log.Printf("%d records sent to client.", len(data))
}
