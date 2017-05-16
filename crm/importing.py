import logging
import csv
from . import models
from geopy.geocoders import GoogleV3
from django.conf import settings
import itertools

__addr_cache = {}

def translate_google_result(res):
    ret = {}
    for prop in res['address_components']:
        if 'locality' in prop['types']:
            ret['locality'] = prop['long_name']
        if 'administrative_area_level_1' in prop['types']:
            ret['state'] = prop['long_name']
        if 'country' in prop['types']:
            ret['country'] = prop['long_name']
        if 'postal_code' in prop['types']:
            ret['postal_code'] = prop['long_name']
    ret['raw'] = res['formatted_address']
    return ret

def address_from_row(row):
    geocoder = GoogleV3(settings.GOOGLE_MAPS_API_KEY)
    addr_to_geocode = ""
    if 'full_address' in row and len(row['full_address']) > 0:
        addr_to_geocode = row['address']
    elif 'zipcode' in row and len(row['zipcode']) > 0:
        addr_to_geocode = row['zipcode']
    elif 'city' in row and len(row['city']) > 0:
        addr_to_geocode = row['city']
    if addr_to_geocode is None:
        logging.debug("Could not find suitable geocode field")
        return None
    if addr_to_geocode not in __addr_cache:
        geocoded = None
        try:
            geocoded = geocoder.geocode(addr_to_geocode)
        except:
            pass
        if geocoded:
            ret = translate_google_result(geocoded.raw)
            __addr_cache[addr_to_geocode] = ret
        else:
            __addr_cache[addr_to_geocode] = addr_to_geocode
    logging.debug("%s -> %r", addr_to_geocode, __addr_cache[addr_to_geocode])
    return __addr_cache[addr_to_geocode]

def import_file(f):
    imp = Importer(f)
    imported_count = 0
    for activist in imp:
        print 'Imported ', unicode(activist)
        imported_count += 1
    return imported_count

class Importer(object):
    def __init__(self, src_file):
        self.__reader = csv.DictReader(src_file)
        self.__imported_count = 0

    def __iter__(self):
        return self

    def next(self):
        row = self.__reader.next()
        geocoded_addr = address_from_row(row)
        activist, created = models.Activist.objects.update_or_create(email=row['email'],
                defaults={'name': "%s %s"%(row['first_name'],
                    row['last_name']), 'address': geocoded_addr})
        if created:
            self.__imported_count += 1
        return activist
