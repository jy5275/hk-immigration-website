package handlers

import (
	"database/sql"
	"log"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/mattn/go-sqlite3"
)

const (
	MYSQL_DSN = "admin:jiangyan@tcp(hk-immigration-db.c5geiw2ayux3.ap-east-1.rds.amazonaws.com:3306)/hk_immigration_db?parseTime=true&timeout=3s"
)

var db *sql.DB

func init() {
	// Initialize the database connection
	var err error

	db, err = sql.Open("mysql", MYSQL_DSN)
	if err != nil {
		log.Print("Failed to connect to MySQL:", err)
	}
	if err := db.Ping(); err != nil {
		log.Print("Cannot reach MySQL:", err)
		db = nil
	}

	// defer db.Close()
}
