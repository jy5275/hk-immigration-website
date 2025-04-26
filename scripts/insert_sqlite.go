package main

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	csvFile := "statistics_on_daily_passenger_traffic.csv"
	dbFile := "immigration_data.db"

	file, err := os.Open(csvFile)
	if err != nil {
		log.Fatalf("无法打开 CSV 文件: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("无法读取 CSV 内容: %v", err)
	}

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatalf("无法创建 SQLite 文件: %v", err)
	}
	defer db.Close()

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS immigration (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT,
		control_point TEXT,
		direction TEXT,
		hk_residents INTEGER,
		mainland_visitors INTEGER,
		other_visitors INTEGER,
		total INTEGER
	);`
	if _, err := db.Exec(createTableSQL); err != nil {
		log.Fatalf("创建表失败: %v", err)
	}

	insertSQL := `
	INSERT INTO immigration (
		date, control_point, direction,
		hk_residents, mainland_visitors, other_visitors, total
	) VALUES (?, ?, ?, ?, ?, ?, ?);
	`
	stmt, err := db.Prepare(insertSQL)
	if err != nil {
		log.Fatalf("准备插入语句失败: %v", err)
	}
	defer stmt.Close()

	for i, row := range records {
		if i == 0 || len(row) < 7 {
			continue
		}

		// 去除可能的空格与尾部多余项
		for j := range row {
			row[j] = strings.TrimSpace(row[j])
		}

		// DD-MM-YYYY → YYYY-MM-DD
		parts := strings.Split(row[0], "-")
		if len(parts) == 3 {
			row[0] = fmt.Sprintf("%s-%s-%s", parts[2], parts[1], parts[0])
		}
		hk, _ := strconv.Atoi(row[3])
		ml, _ := strconv.Atoi(row[4])
		ov, _ := strconv.Atoi(row[5])
		total, _ := strconv.Atoi(row[6])

		_, err := stmt.Exec(row[0], row[1], row[2], hk, ml, ov, total)
		if err != nil {
			log.Printf("第 %d 行插入失败: %v", i+1, err)
		}
		fmt.Print(row[0], ",")
	}

	fmt.Println("数据导入完成！")
}
