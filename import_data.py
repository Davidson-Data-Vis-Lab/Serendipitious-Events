import pandas as pd
import mysql.connector
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

def convert_to_sql_datetime(date_string):
    try:
        # Define the format of the input date string
        input_format = "%m/%d/%Y %I:%M:%S %p"
        
        # Parse the date string into a datetime object
        datetime_obj = datetime.strptime(date_string, input_format)
        
        # Define the output format for SQL
        sql_format = "%Y-%m-%d %H:%M:%S"
        
        # Convert the datetime object to the desired SQL format
        sql_datetime_string = datetime_obj.strftime(sql_format)
        
        return sql_datetime_string
    except ValueError as e:
        print(f"Error converting date string to SQL datetime: {e}")
        return None


def get_coordinates(location_name, retries=3):
    geolocator = Nominatim(user_agent="geoapiExercises")
    for attempt in range(retries):
        try:
            location = geolocator.geocode(location_name, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            else:
                print(f"Location '{location_name}' not found.")
                return None
        except GeocoderTimedOut as e:
            print(f"Attempt {attempt + 1} - Timeout error: {e}")
            time.sleep(2)  # Wait for 2 seconds before retrying
        except Exception as e:
            print(f"Error getting coordinates for '{location_name}': {e}")
            return None
    print(f"Failed to get coordinates for '{location_name}' after {retries} retries.")
    return None
# def get_coordinates(location_name):
    try:
        geolocator = Nominatim(user_agent="geoapiExercises")
        location = geolocator.geocode(location_name)
        if location:
            return (location.latitude, location.longitude)
        else:
            print(f"Location '{location_name}' not found.")
            return None
    except Exception as e:
        print(f"Error getting coordinates for '{location_name}': {e}")
        return None

def insertVenue(cursor,name,borough,loc_type,coordinates):
    try:
        query = """INSERT INTO Venue (name,borough,loc_type,coordinates)
                   VALUES (%s, %s, %s, %s)"""
        values = (
            name if pd.notna(name) else None,
            borough if pd.notna(borough) else None,
            loc_type if pd.notna(loc_type) else None,
            coordinates if pd.notna(coordinates) else None
        )
        cursor.execute(query, values)
        last_id = cursor.lastrowid
        return last_id
    except mysql.connector.Error as error_descriptor:
        print(f"Failed inserting venue: {error_descriptor}")
        return -1
        
def insertAudience(cursor,category):
    try: 
        query = """INSERT INTO Audience (category)
                   VALUES (%s)"""
        value = (category if pd.notna(category) else None,)
        cursor.execute(query, value)
    except mysql.connector.Error as error_descriptor:
        print(f"Failed inserting audience: {error_descriptor}")
        
def insertEvent(cursor, name, type, category, classification, attendance, date_time, group_name, venue_id):
    try:
        query = """INSERT INTO Event (name, type, category, classification, attendance, date_time, groupname, venue_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        values = (
            name if pd.notna(name) else None,
            type if pd.notna(type) else None,
            category if pd.notna(category) else None,
            classification if pd.notna(classification) else None,
            attendance if pd.notna(attendance) else None,
            date_time if pd.notna(date_time) else None,
            group_name if pd.notna(group_name) else None,
            venue_id if pd.notna(venue_id) else None,
        )
        cursor.execute(query, values)
        last_id = cursor.lastrowid
        return last_id
    except mysql.connector.Error as error_descriptor:
        print(f"Failed inserting event: {error_descriptor}")
        return -1

def insertEventAudience(cursor, event_id, tag):
    try:
        query = """INSERT INTO Event_Audience (event_id, tag)
                   VALUES (%s, %s)"""
        values = (
            event_id if pd.notna(event_id) else None,
            tag if pd.notna(tag) else None,
        )
        cursor.execute(query, values)
    except mysql.connector.Error as error_descriptor:
        print(f"Failed inserting event audience: {error_descriptor}")
        
def main():
    # Connect to MySQL
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='12345678',
        database='NewYorkEvents',
    )

    # Create a cursor for data manipulation
    cursor = connection.cursor()
    
    data = pd.read_csv("Parks_Special_Events.csv")
    venue_data = pd.read_csv("venue_with_coordinates.csv")
    
    venue_dict = {}
    tags = set()
    
    for index,row in data.iterrows():
        venue_name = row['Location']
        coordinates = '0'
        for v_index,v_row in venue_data.iterrows():
            if venue_name == v_row['name']:
                coordinates = str(v_row['latitude']) + ',' + str(v_row['longitude'])
                break
        # if pd.notna(row['Location']):
        #     print(get_coordinates(row['Location'] + ", New York"))
        if venue_name not in venue_dict:
            venue_id = insertVenue(cursor,venue_name,row['Borough'],row['LocationType'],coordinates)
            venue_dict[venue_name] = venue_id
        
        if venue_id != -1:
            event_id = insertEvent(cursor,row['Event Name'],row['Event Type'],row['Category'],row['Classification'],row['Attendance'],convert_to_sql_datetime(row['Date and Time']),row['Group Name/Partner'],venue_dict[venue_name])
        else:
            event_id = insertEvent(cursor,row['Event Name'],row['Event Type'],row['Category'],row['Classification'],row['Attendance'],convert_to_sql_datetime(row['Date and Time']),row['Group Name/Partner'],None)
            
        if pd.notna(row['Audience']):
            audience_tags = row['Audience'].split(';#')
            for tag in audience_tags:
                if tag not in tags:
                    insertAudience(cursor,tag)
                    tags.add(tag)
                if event_id != -1:
                    insertEventAudience(cursor,event_id,tag)
    connection.commit()
    cursor.close()
    connection.close()        
        
    
if __name__ == '__main__':
    main()