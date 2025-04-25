import sqlite3
import matplotlib.pyplot as plt
from datetime import datetime
from collections import defaultdict
import pandas as pd

# All check points in Hong Kong (order by passengers count):
# - Lo Wu
# - Lok Ma Chau Spur Line
# - Airport
# - Shenzhen Bay
# - Hong Kong-Zhuhai-Macao Bridge
# - Express Rail Link West Kowloon
# - Heung Yuen Wai
# - Lok Ma Chau
# - Macau Ferry Terminal
# - Man Kam To
# - China Ferry Terminal
# - Kai Tak Cruise Terminal
# - Harbour Control
# No longer in use: Hung Hom, Sha Tau Kok, Tuen Mun Ferry Terminal

db_file = 'immigration_data.db'
start_date = '2025-03-01'
end_date = '2025-05-01'
mode = "1day" # "1day" or "7day" or "pie"
window_size = 7
direction = "Departure" # "Arrival" or "Departure"

data_by_cp_dir = defaultdict(list) # Data structure: {(control_point, direction): [(date, total), ...]}

def read_from_sqlite(): 
    points_list = ["Lo Wu","Lok Ma Chau Spur Line","Airport","Shenzhen Bay","Hong Kong-Zhuhai-Macao Bridge","Express Rail Link West Kowloon"]
    # points_list = ["Heung Yuen Wai","Lok Ma Chau","Macau Ferry Terminal"]
    # points_list = ["Man Kam To","China Ferry Terminal","Kai Tak Cruise Terminal","Harbour Control"]

    for cp in points_list:
        for dir in [direction]:
            cursor.execute('''
                SELECT date, total, hk_residents, mainland_visitors FROM immigration
                WHERE control_point = ? AND direction = ? AND date >= ? AND date <= ?
                ORDER BY date''', (cp, dir, start_date, end_date))
            rows = cursor.fetchall()
            for date_str, total, hk_residents, mainland_visitors in rows:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                data_by_cp_dir[(cp, direction, 'total')].append((date_obj, total))
                # data_by_cp_dir[(cp, dir, 'hk')].append((date_obj, hk_residents))
                # data_by_cp_dir[(cp, direction, 'ml')].append((date_obj, mainland_visitors))
    conn.close()


def draw_basic():
    plt.figure(figsize=(16, 8))
    for (cp, dir, src), data in data_by_cp_dir.items():
        if not data:
            continue
        dates, totals = zip(*data)
        plt.plot(dates, totals, label=f"{cp} - {dir}")

    plt.title(f"Daily Immigration by Control Point and Direction (From {start_date})")
    plt.xlabel("Date")
    plt.ylabel("Total People")
    plt.legend(loc='upper left', fontsize='x-small')
    plt.tight_layout()
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.show()


def draw_seven_days():
    plt.figure(figsize=(16, 8))
    for (cp, dir, src), data in data_by_cp_dir.items():
        if not data:
            continue
        df = pd.DataFrame(data, columns=["date", "total"])
        df.set_index("date", inplace=True)
        df = df.asfreq("D")  # 保证日期连续，即使有缺失也能计算滑动平均
        df["total"] = df["total"].fillna(0)
        df["7day_avg"] = df["total"].rolling(window=window_size, min_periods=window_size).mean()
        plt.plot(df.index, df["7day_avg"], label=f"{cp} - {dir}")

    plt.title(f"7-Day Moving Average of Immigration by Control Point and Direction (From {start_date})")
    plt.xlabel("Date")
    plt.ylabel("People (7-day average)")
    plt.legend(loc='upper left', fontsize='x-small')
    plt.tight_layout()
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.show()


def draw_pie_chart():
    fig, axs = plt.subplots(3, 3, figsize=(16, 10))
    axs = axs.flatten()
    points_list = ["Lo Wu","Lok Ma Chau Spur Line","Airport","Shenzhen Bay","Hong Kong-Zhuhai-Macao Bridge","Express Rail Link West Kowloon", "Heung Yuen Wai","Lok Ma Chau","Macau Ferry Terminal"]

    for idx, cp in enumerate(points_list):
        cursor.execute('''
            SELECT
                SUM(hk_residents),
                SUM(mainland_visitors),
                SUM(other_visitors)
            FROM immigration
            WHERE control_point = ? AND direction = ? AND date >= ? AND date <= ?
        ''', (cp, direction, start_date, end_date))
        
        row = cursor.fetchone()
        if row is None:
            continue
        
        labels = ['HK Residents', 'Mainland Visitors', 'Other Visitors']
        sizes = [x if x is not None else 0 for x in row]

        if sum(sizes) == 0:
            axs[idx].set_title(f"{cp} (No Data)")
            axs[idx].axis('off')
            continue

        axs[idx].pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
        axs[idx].set_title(cp)

    plt.suptitle(f"Hong Kong Immigration - {direction} Passengers Composition Since {start_date} (By Control Point)", fontsize=16)
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.show()
    conn.close()


if __name__ == "__main__":
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    if mode == "pie":
        draw_pie_chart()
    else:
        read_from_sqlite()
        if mode == "1day":
            draw_basic()
        elif mode == "7day":   
            draw_seven_days()