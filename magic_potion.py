import pandas as pd
import mysql.connector
import ast
from haversine import haversine, Unit

# TODO: 
# "Pieces" appear a lot because all of "works by" count as "Pieces".
# 1. Parameter Tuning: How to minimize the size of random result to about 10(?) 
# and avoid empty search. One thought: regardless of the input for piece and composer, the result size
# is the same. However, higher number of loc/date will change the size of data to 15% min. However,
# this is also related to the total size of the concert. 

# 2. Possible way to make it faster: When preprocessing the database, if the user input is 0 in some 
# variables, I can drop the column directly. But need more modification on merging. 

def calculate_distance(venue_coordinates, my_coordinates):
    if pd.isna(venue_coordinates):
        return None
    # Convert string representation of list to actual list of floats using ast.literal_eval
    venue_coordinates = ast.literal_eval(venue_coordinates)
    return haversine(venue_coordinates, my_coordinates, unit=Unit.KILOMETERS)

def minmax_scale(series, min_val, max_val):
    min_series = series.min()
    max_series = series.max()
    scaled_series = (series - min_series) / (max_series - min_series) * (max_val - min_val) + min_val
    return scaled_series

def process_dataframe(df, my_coordinates, my_datetime, category_selected, age, adaptive):
    age_dict = {
        (0, 3): "Tot",
        (0, 12): "Children",
        (10, 18): "Teens",
        (18, 35): "Young Adult",
        (18, 65): "Adults",
        (65, 100): "Seniors",
        (0, 100): "General Public"
    }
    tag = []
    if(adaptive):
        df = df[df['tag'] == 'Adaptive']
        
    df['date_time'] = pd.to_datetime(df['date_time'])
    df = df[df['date_time'] >= my_datetime]
    df['diff_in_days'] = minmax_scale((df['date_time'] - my_datetime).dt.total_seconds() / 86400,0,100)
    
    df['distance_km'] = df['coordinates'].apply(calculate_distance, my_coordinates=my_coordinates)
    
    if(len(category_selected) != 0):
        df = df[df['category'].isin(category_selected)]
    for (start, end), value in age_dict.items():
        if start <= age <= end:
            tag.append(value)
    df = df[df['tag'].isin(tag)]
    return df

def calculate_percentile(pref):
    # acc_rate = [0,0.1,0.3,0.7]
    acc_rate = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]
    
    # if(pref >= 0):
    #     # It means the user want closer concerts
    #     up_percentile = 0.75 - acc_rate[abs(pref)]
    #     down_percentile = 0.25 - acc_rate[abs(pref)]
    #     if down_percentile < 0:
    #         down_percentile = 0
    # else:
    #     up_percentile = 0.75 + acc_rate[abs(pref)]
    #     down_percentile = 0.25 + acc_rate[abs(pref)]
    #     if up_percentile > 1:
    #         up_percentile = 1
    down_percentile = 0 + acc_rate[pref]
    up_percentile = 0.1 + acc_rate[pref]

    return up_percentile,down_percentile

def main():
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='12345678',
        database='NewYorkEvents',
    )

    # Define the query
    query = '''
    SELECT e.id, e.name, e.date_time, e.category, v.name AS venue_name, v.borough, v.coordinates, ea.tag
    FROM Event e
    JOIN Venue v ON e.venue_id = v.id
    LEFT JOIN Event_Audience ea ON e.id = ea.event_id
    WHERE YEAR(e.date_time) = 2019 AND (v.coordinates < '0'OR v.coordinates > '0');
    '''
    df = pd.read_sql(query, connection)
    connection.close()
    # print(df.columns)
    #['id', 'name', 'date_time', 'name', 'borough', 'coordinates', 'tag']

    my_coordinates = [40.747552523013795, -73.98654171064388]
    my_datetime = pd.to_datetime('2019-05-31 10:00:00')
    
    
    adaptive = False
    random_loc = False
    random_date = False
    my_date_pref = 0
    my_loc_pref = 0
    category_selected = ["Mobile Unit","Nature","Performance","Fitness"]
    age = 20
    
    data = process_dataframe(df, my_coordinates, my_datetime, category_selected, age, adaptive)
    
    data = data.reset_index(drop=True)
    
    condition = pd.Series([True] * len(data))
    if(not random_date):
        date_upbound, date_lowbound = calculate_percentile(my_date_pref)
        percentile_up_date = data['diff_in_days'].quantile(date_upbound)
        percentile_low_date = data['diff_in_days'].quantile(date_lowbound)
        condition &= (data['diff_in_days'] <= percentile_up_date)
        condition &= (data['diff_in_days'] >= percentile_low_date)
    if(not random_loc):
        loc_upbound, loc_lowbound = calculate_percentile(my_loc_pref)
        percentile_up_loc = data['distance_km'].quantile(loc_upbound)
        percentile_low_loc = data['distance_km'].quantile(loc_lowbound)
        condition &= (data['distance_km'] <= percentile_up_loc)
        condition &= (data['distance_km'] >= percentile_low_loc)

    
    print(condition.sum())
    if(condition.sum() != 0):
        filtered_data = data[condition]
        random_concert_id = filtered_data['id'].sample().values[0]
        result = data[data['id'] == random_concert_id]
        print(result['id'], result['name'])
        print(result['venue_name'])
        print(result['category'])
    
if __name__ == '__main__':
    main()