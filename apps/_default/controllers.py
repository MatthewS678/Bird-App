"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from pprint import pprint
import json
from py4web import action, request, abort, redirect, URL, HTTP
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user_id, generate_sampling_event_id
from py4web.utils.form import Form, FormStyleBulma, TextareaWidget, FormStyleDefault
from py4web.utils.grid import Grid, GridClassStyleBulma, Column

GOOGLE_MAPS_API_KEY = 'AIzaSyBaLGcjO6a4vfgZSMXeozjhuFB5zQ1YyZo'

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        add_checklist_url = URL('add_checklist', signer=url_signer),
        get_species_url = URL('get_species', signer=url_signer),
        user_stats_url = URL('user_stats', signer=url_signer),
        my_checklists_url = URL('my_checklists', signer=url_signer),
        get_densities_url = URL('get_densities', signer=url_signer)
    )

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)

@action('get_species')
@action.uses(db)
def get_species():
    species = [row.common_name for row in db(db.species).select(db.species.common_name, orderby=db.species.common_name)]
    return dict(species=species)

@action('add_checklist/')
@action.uses('add_checklist.html', auth.user) 
def checklist():
    latitude = request.params.get('latitude')
    longitude = request.params.get('longitude')
    return dict(get_species_url = URL('get_species', signer=url_signer),
                add_checklist_sightings_url = URL('add_checklist_sightings', signer=url_signer), 
                latitude=json.dumps(latitude),
                longitude=json.dumps(longitude))

@action('add_checklist_sightings', method='POST')
@action.uses(db, auth.user)
def add_checklist_sightings():
    sampling_id = generate_sampling_event_id()
    checklist = {
        "sampling_event" : sampling_id,
        "latitude" : request.json.get("latitude"),
        "longitude" : request.json.get("longitude"),
        "observation_date" : request.json.get("observation_date"),
        "time_started" : request.json.get("time_started"),
        "duration_minutes" : request.json.get("observation_duration"),
        "observer_id" : get_user_email()
    }
    
    checklist_id = db.checklists.insert(
        **checklist
    )
    if not checklist_id:
        raise HTTP(400)
    sightings = request.json.get("sightings")
    for sighting in sightings:
        #Check if species name is empty and if count is 0
        if len(sighting['species_name']) > 0 and sighting['observation_count'] > 0:
            sighting_id = db.sightings.insert(
                sampling_event = sampling_id,
                common_name = sighting['species_name'],
                observation_count = sighting['observation_count']
            )
            #Check if common name is in species table
            if db(db.species.common_name == sighting['species_name']).count() == 0:
                db.species.insert(common_name=sighting['species_name'])
            if not sighting_id:
                raise HTTP(400)
    return dict(id = checklist_id)

def delete_sightings(row_id):
    checklist = db(db.checklist.id == row_id).select(db.checklist.sampling_event).first()
    print(checklist)


@action('my_checklists')
@action('my_checklists/<path:path>', method=['POST', 'GET'])
@action.uses('my_checklists.html', auth.user) 
def my_checklist(path=None):
    # checklists = db(db.checklists.observer_id == get_user_id()).select().as_list()
    def species_for_event(row):
        species = db((db.sightings.sampling_event == row.sampling_event) & (db.sightings.observation_count > 0)).select(db.sightings.common_name)
        return ', '.join(s.common_name for s in species) if species else 'None'
    grid = Grid(path,
                grid_class_style=GridClassStyleBulma,
                formstyle=FormStyleBulma,
                query=db.checklists.observer_id == get_user_email(),
                create=False,
                columns=[
                    db.checklists.sampling_event,
                    db.checklists.latitude,
                    db.checklists.longitude,
                    db.checklists.observation_date,
                    db.checklists.time_started,
                    db.checklists.duration_minutes,
                    Column(
                        "Species",
                        species_for_event,
                    )
                ],
                orderby=[~db.checklists.id],
                )
    return dict(grid=grid)

@action('get_densities')
@action.uses(db)
def get_contacts():
    events = db(db.checklists.sampling_event == db.sightings.sampling_event).select(
        db.checklists.latitude, 
        db.checklists.longitude, 
        db.sightings.observation_count
    )

    event_list = [
        dict(
            lat=row.checklists.latitude,
            lng=row.checklists.longitude,
            count=row.sightings.observation_count
        )
        for row in events
    ]
    return dict(events=event_list)

    





