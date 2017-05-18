# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import ChoiceEnum, Activist

class DistrictType(ChoiceEnum):
    local_council = 0
    local_executive = 1
    state_lower = 2
    state_upper = 3
    state_executive = 4
    national_lower = 5
    national_upper = 6
    national_executive = 7

class District(models.Model):
    ocd_id = models.CharField(max_length=100)
    key = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    type = models.IntegerField(choices=DistrictType.choices())

    def __unicode__(self):
        return "%s - %s - %s"%(self.ocd_id, DistrictType(self.type).name, self.label)

class DistrictMembership(models.Model):
    district = models.ForeignKey(District, related_name='district_memberships')
    activist = models.ForeignKey(Activist, related_name='district_memberships')
    last_update = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return "%s - %s"%(self.district, self.activist)
