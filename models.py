"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


#tables to mimic csv file data
db.define_table(
    'checklists',
    Field('latitude', 'double' ),
    Field('longitude', 'double'),
    Field('observation_day', 'date', default=datetime.date.today),
    Field('observation_time', 'time'),
    Field('observer_id', 'string'),
    Field('duration_minutes', 'integer')
)

db.define_table(
    'sightings',
    Field('common_name', 'string' ),
    Field('observation_count', 'integer')
)

db.define_table(
    'species',
    Field('common_name', 'string' ),
)

db.define_table(
    'checklists_sightings',
    Field('sightings_id', 'reference sightings' ),
    Field('sampling_event', 'string') #should link checklists and sightings
)

db.commit()
