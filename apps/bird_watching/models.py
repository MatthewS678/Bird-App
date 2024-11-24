"""
This file defines the database models
"""

import datetime
import csv, os
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


#tables to mimic csv file data
db.define_table(
    'checklists',
    Field('sampling_event', 'string', unique=True),
    Field('latitude', 'double' ),
    Field('longitude', 'double'),
    Field('observation_date', 'date', default=datetime.date.today),
    Field('time_started', 'time'),
    Field('observer_id', 'string'),
    Field('duration_minutes', 'integer')
)

db.define_table(
    'sightings',
    Field('sampling_event', 'string'),
    Field('common_name', 'string' ),
    Field('observation_count', 'integer')
)

db.define_table(
    'species',
    Field('common_name', 'string' ),
)

species_file_path = os.path.join(os.path.dirname(__file__), '..', 'species.csv')
if db(db.species).isempty():
    with open(species_file_path, 'r') as f:
        reader = csv.DictReader(f) 
        for row in reader:
            db.species.insert(common_name=row['COMMON NAME']) 

checklists_file_path = os.path.join(os.path.dirname(__file__), '..', 'checklists.csv')
if db(db.checklists).isempty():
    with open(checklists_file_path, 'r') as f:
        reader = csv.DictReader(f) 
        for row in reader:
            #For some reason the DURATION MINUTES field are represented as floats, 
            #but I'm assuming its supposed to be integers due to none of the numbers using the decimal place
            #Doing it this way will keep the field as an integer type
            #will ask TA on Monday or Wednesday :3
            duration_minutes = int(float(row['DURATION MINUTES'])) if row['DURATION MINUTES'] else None
            db.checklists.insert(
                sampling_event=row['SAMPLING EVENT IDENTIFIER'],
                latitude=row['LATITUDE'], 
                longitude=row['LONGITUDE'], 
                observation_date=row['OBSERVATION DATE'], 
                time_started=row['TIME OBSERVATIONS STARTED'],
                observer_id=row['OBSERVER ID'],
                duration_minutes=duration_minutes
            )

sightings_file_path = os.path.join(os.path.dirname(__file__), '..', 'sightings.csv')
if db(db.sightings).isempty():
    with open(sightings_file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            #Same thing with duration minutes, idk why theres an X in the csv
            #There are also over 100,000 sightings so this one may take some time
            observation_count = row['OBSERVATION COUNT'] if row['OBSERVATION COUNT'] != 'X' else 0
            db.sightings.insert(
                sampling_event=row['SAMPLING EVENT IDENTIFIER'],
                common_name=row['COMMON NAME'],
                observation_count=observation_count
            )


db.commit()
