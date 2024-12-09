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

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user_id

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
        my_checklists = URL('my_checklists', signer=url_signer),
        
    )

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)

@action('get_species')
@action.uses(db)
def get_species():
    species = db(db.species).select(db.species.common_name).as_list()
    
    sightings = db(db.sightings).select().as_list()
    return dict(species=species, sightings=sightings)

@action('add_checklist/')
@action.uses('add_checklist.html') 
def checklist():
    return dict()

@action('my_checklists')
@action.uses('my_checklists') 
def checklist():
    checklists = db(db.checklists.observer_id == get_user_id()).select().as_list()
    return dict(checklists)

