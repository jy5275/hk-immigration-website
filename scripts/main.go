package main

import (
	"compress/gzip"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/mattn/go-sqlite3"
)

const (
	MYSQL_DSN = "admin:jiangyan@tcp(hk-immigration-db.c5geiw2ayux3.ap-east-1.rds.amazonaws.com:3306)/hk_immigration_db?parseTime=true&timeout=3s"
)

var (
	db              *sql.DB
	controlPointMap = map[string]int{
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
)

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

func init() {
	var err error
	db, err = sql.Open("mysql", MYSQL_DSN)
	if err != nil {
		log.Print("Failed to connect to MySQL:", err)
	}
	if err := db.Ping(); err != nil {
		log.Print("Cannot reach MySQL:", err)
		db = nil
	}
}

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
	http.Handle("/api/immigration-data", GzipMiddleware(http.HandlerFunc(GetImmigrationData)))
	http.Handle("/api/updatedb", http.HandlerFunc(UpdateDB))
	http.Handle("/", http.HandlerFunc(CheckHealth))
	log.Println("Server running at http://localhost:8080/")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
