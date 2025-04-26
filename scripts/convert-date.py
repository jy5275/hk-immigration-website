import csv
from datetime import datetime

input_file = 'statistics_on_daily_passenger_traffic.csv'
output_file = 'output.csv'

with open(input_file, 'r', newline='', encoding='utf-8') as infile, \
     open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    header = next(reader)
    writer.writerow(header)

    for row in reader:
        try:
            original_date = row[0]
            date_obj = datetime.strptime(original_date, '%d-%m-%Y')
            new_date = date_obj.strftime('%Y-%m-%d')
            row[0] = new_date
        except ValueError as e:
            print(f"跳过行，日期格式错误: {row} ({e})")

        writer.writerow(row)

print(f"已完成日期格式转换，输出文件为：{output_file}")
