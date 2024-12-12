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
from apps._default.grid_button import GridActionButton
import json
import math
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

@action('location')
@action.uses('location.html', db, auth, url_signer)
def location():
    # Any data you need to pass to the template
    return dict(some_data='value')  # Update with the actual data you need


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
                checklist_id = checklist_id,
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


@action('my_checklists')
@action('my_checklists/<path:path>', method=['POST', 'GET'])
@action.uses('my_checklists.html', auth.user) 
def my_checklist(path=None):
    # checklists = db(db.checklists.observer_id == get_user_id()).select().as_list()
    def species_for_event(row):
        species = db((db.sightings.sampling_event == row.sampling_event) & (db.sightings.observation_count > 0)).select(db.sightings.common_name, db.sightings.observation_count)
        return ', '.join(s.common_name + ": " + str(s.observation_count) for s in species) if species else 'None'
    post_action_buttons = [
    lambda row: GridActionButton(
        URL("/edit_checklist", row.sampling_event),
        text="Edit Checklist",
        icon="fa-plus",
        additional_classes=["grid-details-button", "button", "is-small"]
    )
    ]
    grid = Grid(path,
                grid_class_style=GridClassStyleBulma,
                formstyle=FormStyleBulma,
                query=db.checklists.observer_id == get_user_email(),
                create=False,
                editable=False,
                post_action_buttons=post_action_buttons,
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
                    ),
                ],
                orderby=[~db.checklists.id],
                )
    return dict(grid=grid)

@action('edit_checklist')
@action('edit_checklist/<sampling_event>')
@action.uses('edit_checklist.html', db, auth.user)
def edit_checklist(sampling_event):

    checklist = db(db.checklists.sampling_event == sampling_event).select().first().as_dict()
    if get_user_email() != checklist['observer_id']:
        redirect('/index')
    checklist['observation_date'] = checklist['observation_date'].strftime('%Y-%m-%d') if checklist['observation_date'] else ""
    checklist['time_started'] = checklist['time_started'].strftime('%I:%M') if checklist['time_started'] else ""
    sightings = db(db.sightings.sampling_event == sampling_event).select().as_list()    
    # print(json.dumps(sightings))
    return dict(get_species_url = URL('get_species', signer=url_signer),
                edit_checklist_sightings_url = URL('edit_checklist_sightings', signer=url_signer),
                checklist = json.dumps(checklist),
                sightings= json.dumps(sightings, ensure_ascii=False))

@action('edit_checklist_sightings', method='POST')
@action.uses(db, auth.user)
def edit_checklist_sightings():
    sampling_id = request.json.get("sampling_event")  # Use existing sampling_event ID
    
    if not sampling_id:
        raise HTTP(400, "sampling_event is required")

    checklist = db(db.checklists.sampling_event == sampling_id).select().first()
    if get_user_email() != checklist['observer_id']:
        raise HTTP(403, "No access")
    if checklist:
        # Update the existing checklist with new values
        checklist.update_record(
            sampling_event = sampling_id,
            latitude=request.json.get("latitude"),
            longitude=request.json.get("longitude"),
            observation_date=request.json.get("observation_date"),
            time_started=request.json.get("time_started"),
            duration_minutes=request.json.get("observation_duration"),
            observer_id=get_user_email()
        )
    else:
        raise HTTP(400, "Checklist with the given sampling_event does not exist")
    
    sightings_from_request = request.json.get("sightings")
    
    sightings_request_set = set(
        (sighting['common_name'], sighting['observation_count']) for sighting in sightings_from_request
    )
    
    existing_sightings = db(db.sightings.sampling_event == sampling_id).select()

    # Delete sightings that exist in the database but are not present in the request
    for sighting in existing_sightings:
        sighting_tuple = (sighting.common_name, sighting.observation_count)
        if sighting_tuple not in sightings_request_set:
            # If sighting is not in the request, delete it
            sighting.delete_record()

    # For each sighting in the request, either update or insert it
    for sighting in sightings_from_request:
        # Ensure species_name and observation_count are valid
        if len(sighting['common_name']) > 0 and sighting['observation_count'] > 0:
            # Check if the sighting exists for the sampling_event and common_name
            existing_sighting = db(
                (db.sightings.sampling_event == sampling_id) &
                (db.sightings.common_name == sighting['common_name'])
            ).select().first()
            
            if existing_sighting:
                # Update the existing sighting
                existing_sighting.update_record(
                    checklist_id = checklist['id'],
                    observation_count=sighting['observation_count']
                )
            else:
                # If sighting doesn't exist, insert a new sighting
                sighting_id = db.sightings.insert(
                    checklist_id = checklist['id'],
                    sampling_event=sampling_id,
                    common_name=sighting['common_name'],
                    observation_count=sighting['observation_count']
                )
                # Check if species is in the species table
                if db(db.species.common_name == sighting['common_name']).count() == 0:
                    raise HTTP(400, f"Species '{sighting['common_name']}' not found in species table")

    return dict(message="Checklist and sightings updated successfully")
    
    

@action('get_densities')
@action.uses(db)
def get_contacts():
    bird_name = request.query.get('bird_name', '')
    if bird_name == '':
        events = db(db.checklists.sampling_event == db.sightings.sampling_event).select(
            db.checklists.latitude, 
            db.checklists.longitude, 
            db.sightings.observation_count
        )
    else:
        events = db(
            (db.checklists.sampling_event == db.sightings.sampling_event) &
            (db.sightings.common_name == bird_name)
        ).select(
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

@action('get_region_stats', method='POST')
@action.uses(db)
def get_region_stats():
    # Extract coordinates and radius from request
    lat = request.json.get('latitude')
    lng = request.json.get('longitude')
    radius = request.json.get('radius', 1.0)  # Optional, default to 1 km radius

    # Define the bounding box (approximation) for region search
    lat_min = lat - radius / 111  # Convert km to degree approx.
    lat_max = lat + radius / 111
    lng_min = lng - radius / (111 * abs(math.cos(math.radians(lat))))
    lng_max = lng + radius / (111 * abs(math.cos(math.radians(lat))))

    # Query species and sightings in the region
    species_query = db(
        (db.checklists.latitude > lat_min) & (db.checklists.latitude < lat_max) &
        (db.checklists.longitude > lng_min) & (db.checklists.longitude < lng_max) &
        (db.sightings.sampling_event == db.checklists.sampling_event)
    ).select(db.sightings.common_name, db.sightings.observation_count, db.checklists.observer_id)

    # Aggregate species data
    species_data = {}
    for sighting in species_query:
        species_name = sighting.sightings.common_name
        count = sighting.sightings.observation_count
        if species_name not in species_data:
            species_data[species_name] = {'count': 0, 'checklists': 0}
        species_data[species_name]['count'] += count
        species_data[species_name]['checklists'] += 1

    # Aggregate top contributors
    contributors_query = db(
        (db.checklists.latitude > lat_min) & (db.checklists.latitude < lat_max) &
        (db.checklists.longitude > lng_min) & (db.checklists.longitude < lng_max)
    ).select(db.checklists.observer_id)

    contributors_data = {}
    for checklist in contributors_query:
        observer_id = checklist.checklists.observer_id
        if observer_id not in contributors_data:
            contributors_data[observer_id] = 0
        contributors_data[observer_id] += 1

    # Sort contributors by the number of checklists
    top_contributors = sorted(contributors_data.items(), key=lambda x: x[1], reverse=True)

    # Return the region data
    return dict(
        species_data=species_data,
        top_contributors=top_contributors
    )

@action('get_species_data')
@action.uses(db)
def get_species_data():
    species_name = request.query.get('species_name')

    sightings = db(
        (db.sightings.common_name == species_name)
    ).select(db.checklists.observation_date, db.sightings.observation_count)
    
    data = {
        'dates': [s.observation_date for s in sightings],
        'sightings': [s.observation_count for s in sightings]
    }
    
    return json(data)

@action('user_stats/<path:path>', method=['POST', 'GET'])
@action('user_stats', method=['POST', 'GET'])
@action.uses('user_stats.html', db, auth)
def user_stats(path=None):
    user_email = get_user_email()
    # joins the tables and gets the sightings from this user specifically
    #query = (db.checklists.observer_id == user_email) & (db.sightings.checklist_id == db.checklists.id)

    query = (db.sightings.common_name == "American Crow") # test query


    print("query: ", query)
    rows = db(query).select()
    print(f"Rows count: {len(rows)} \n {rows}")

    # grid for displaying user stats
    grid = Grid(path,
        formstyle=FormStyleBulma,
        grid_class_style=GridClassStyleBulma,
        query=query,
        search_queries=[ # allows for better searching with specific filters 
            ['Search by Species', lambda val: db.sightings.common_name.contains(val)],
            ['Search by Observation Count', lambda val: db.sightings.observation_count == int(val)],
            ['Search by Date', lambda val: db.checklists.observation_date == val],
            ['Search by Latitude', lambda val: (db.checklists.latitude >= float(val) - 1) & (db.checklists.latitude <= float(val) + 1)], # allows a +-1 buffer when filtering
            ['Search by Longitude', lambda val: (db.checklists.longitude >= float(val) - 1) &(db.checklists.longitude <= float(val) + 1)],
        ],
        fields=[
            db.sightings.common_name,
            db.sightings.observation_count,
            db.checklists.observation_date,
            db.checklists.latitude,
            db.checklists.longitude,
        ],
        orderby=[db.sightings.common_name],
    )

    return dict(grid=grid)