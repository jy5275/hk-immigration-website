package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

func parseInt(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func UpdateDB(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	resp, err := http.Get("https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fwww.immd.gov.hk%2Fopendata%2Feng%2Ftransport%2Fimmigration_clearance%2Fstatistics_on_daily_passenger_traffic.csv")
	if err != nil {
		log.Fatalf("下载 CSV 文件失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Fatalf("下载失败，状态码: %d", resp.StatusCode)
	}

	reader := csv.NewReader(resp.Body)
	line := 0
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatalf("第 %d 行读取失败: %v", line+1, err)
		}
		line++
		if line == 1 {
			continue
		}
		if len(record) < 7 {
			log.Fatalf("第 %d 行数据不足: %v", line, record)
		}

		date, err := time.Parse("02-01-2006", record[0])
		if err != nil {
			log.Fatalf("第 %d 行日期格式错误: %v", line, err)
		}
		controlPoint, direction := record[1], record[2]
		hkResidents, mainlandVisitors, otherVisitors, total :=
			parseInt(record[3]), parseInt(record[4]), parseInt(record[5]), parseInt(record[6])

		result, err := db.Exec(`
			INSERT IGNORE INTO immigration 
				(date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, date, controlPoint, direction, hkResidents, mainlandVisitors, otherVisitors, total)
		if err != nil {
			log.Fatalf("第 %d 行插入失败: %v", line, err)
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Fatalf("第 %d 行无法获取插入结果: %v", line, err)
		}

		if rowsAffected != 0 {
			log.Printf("New record inserted: line=%d, date=%s, control_point=%s, dir=%s, ", line, record[0], controlPoint, direction)
		}
	}

	log.Println("Update DB successfully")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Update DB successfully")
}

func CheckHealth(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		// local testing
		log.Println("Database is not initialized")
	} else {
		if err := db.Ping(); err != nil {
			log.Fatal("Cannot reach MySQL:", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{"status": "healthy"}
	json.NewEncoder(w).Encode(response)
}
