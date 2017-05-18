from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import requests
from districting.models import District, DistrictMembership, DistrictType
from crm.models import Activist
from datetime import datetime, timedelta 
import pprint

def type_for_ocd_type(t):
    if t == 'LOCAL':
        return DistrictType.local_council
    if t == 'LOCAL_EXEC':
        return DistrictType.local_executive
    if t == 'STATE_LOWER':
        return DistrictType.state_lower
    if t == 'STATE_UPPER':
        return DistrictType.state_upper
    if t == 'STATE_EXEC':
        return DistrictType.state_executive
    if t == 'NATIONAL_LOWER':
        return DistrictType.national_lower
    if t == 'NATIONAL_UPPER':
        return DistrictType.national_upper
    if t == 'NATIONAL_EXEC':
        return DistrictType.national_executive
    print "Unknown type", t

class Command(BaseCommand):
    def handle(self, *args, **options):
        for a in Activist.objects.all():
            if a.address and len(str(a.address)) > 0:
                last_update = None
                for dm  in a.district_memberships.all():
                    if last_update is None or last_update <= dm.last_update:
                        last_update = dm.last_update
                if last_update is None or datetime.now() - last_update > timedelta(years=1):
                    print "Refreshing stale district data for: %s"%(a.address)
                    r = requests.get("https://cicero.azavea.com/v3.1/legislative_district",
                            params={'search_loc': a.address, 'key':
                            settings.CICERO_API_KEY}).json()
                    pprint.pprint(r)
                    if len(r['response']['results']['candidates']) == 0:
                        continue
                    if len(r['response']['errors']) > 0:
                        continue
                    for ocd_district in r['response']['results']['candidates'][0]['districts']:
                        pprint.pprint(ocd_district)
                        d, created = District.objects.get_or_create(ocd_id=ocd_district['ocd_id'],
                                type=type_for_ocd_type(ocd_district['district_type']).value,
                                defaults={'label': ocd_district['label']})
                        if created:
                            print "Created new district: ", d
                        membership, created = DistrictMembership.objects.get_or_create(district=d,
                                activist=a)
                        if created:
                            print "Added %s to %s"%(a, d)
