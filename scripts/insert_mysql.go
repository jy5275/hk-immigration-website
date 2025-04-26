package main

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const (
	MYSQL_DSN = "admin:jiangyan@tcp(hk-immigration-db.c5geiw2ayux3.ap-east-1.rds.amazonaws.com:3306)/hk_immigration_db?parseTime=true&timeout=5s"
)

func parseInt(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func main() {
	db, err := sql.Open("mysql", MYSQL_DSN)
	if err != nil {
		log.Fatal("Failed to connect to MySQL:", err)
	}
	defer db.Close()

	csvFile := "statistics_on_daily_passenger_traffic.csv"
	file, err := os.Open(csvFile)
	if err != nil {
		log.Fatalf("无法打开 CSV 文件: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1
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
}
