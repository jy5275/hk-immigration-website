package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

var REMOVED_CONTROL_POINT = map[string]bool{"Hung Hom": true, "Tuen Mun Ferry Terminal": true}

func parseInt(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func UpdateDB(w http.ResponseWriter, r *http.Request) {
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
			log.Printf("第 %d 行读取失败: %v", line+1, err)
			continue
		}
		line++
		if line == 1 {
			continue // 跳过表头
		}
		if len(record) < 7 {
			log.Printf("第 %d 行数据不足，跳过: %v", line, record)
			continue
		}

		// 解析字段
		date, err := time.Parse("02-01-2006", record[0])
		if err != nil {
			log.Printf("第 %d 行日期格式错误: %v", line, err)
			continue
		}
		controlPoint := record[1]
		direction := record[2]
		hkResidents := parseInt(record[3])
		mainlandVisitors := parseInt(record[4])
		otherVisitors := parseInt(record[5])
		total := parseInt(record[6])

		if _, ok := REMOVED_CONTROL_POINT[controlPoint]; ok {
			continue
		}

		// 插入数据
		_, err = db.Exec(`
				INSERT INTO immigration 
					(date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total)
				VALUES (?, ?, ?, ?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE 
					hk_residents = VALUES(hk_residents),
					mainland_visitors = VALUES(mainland_visitors),
					other_visitors = VALUES(other_visitors),
					total = VALUES(total)
			`, date, controlPoint, direction, hkResidents, mainlandVisitors, otherVisitors, total)

		if err != nil {
			log.Printf("第 %d 行插入失败: %v", line, err)
		}
	}

	fmt.Println("Update DB endpoint hit")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Update DB endpoint hit")
}

func ConnectDB(w http.ResponseWriter, r *http.Request) {
	// This function is a placeholder for the database update logic.
	// You can implement the logic to update the database here.
	if err := db.Ping(); err != nil {
		log.Fatal("Cannot reach MySQL:", err)
	}

	fmt.Println("Connected to MySQL successfully")

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Database updated successfully")
}
