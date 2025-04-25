package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ImmigrationData struct {
	ID               int    `json:"id"`
	Date             string `json:"date"`
	ControlPoint     string `json:"control_point"`
	Direction        string `json:"direction"`
	HKResidents      int    `json:"hk_residents"`
	MainlandVisitors int    `json:"mainland_visitors"`
	OtherVisitors    int    `json:"other_visitors"`
	Total            int    `json:"total"`
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
	}
	origin := r.Header.Get("Origin")
	if allowedOrigins[origin] {
		w.Header().Set("Access-Control-Allow-Origin", "*")
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

	rows, err := db.Query(`SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total FROM immigration`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var data []ImmigrationData
	for rows.Next() {
		var d ImmigrationData
		err = rows.Scan(&d.ID, &d.Date, &d.ControlPoint, &d.Direction, &d.HKResidents, &d.MainlandVisitors, &d.OtherVisitors, &d.Total)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data = append(data, d)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
	fmt.Println("Data sent to client:", data[:10])
}
