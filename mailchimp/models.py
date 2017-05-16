# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

class List(models.Model):
    mailchimp_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200, blank=True)
    is_activist_source = models.BooleanField(default=False)

    def __unicode__(self):
        return self.name
