# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.db.models import Count, Subquery, OuterRef
from django.urls import reverse
from address.models import AddressField
from enumfields import EnumIntegerField, Enum
import inspect

class SignupState(Enum):
    prospective = 0
    confirmed = 1
    attended = 2
    noshow = 3
    cancelled = 4
    contacted = 5

    class Labels:
        prospective = 'Prospective'
        confirmed = 'Confirmed'
        attended = 'Attended'
        noshow = 'No-Show'
        cancelled = 'Cancelled'
        contacted = "Contacted"

class ActivistManager(models.Manager):
    def get_queryset(self):
        signups = Signup.objects.filter(activist=OuterRef('pk'),
                state=SignupState.attended).order_by().values('activist')
        count_signups = signups.annotate(c=Count('*')).values('c')
        return super(ActivistManager,
                self).get_queryset().annotate(calc_rank=Subquery(count_signups,
                    output_field=models.IntegerField(null=False)))

class Activist(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    phone = models.CharField(blank=True, max_length=200)
    address = AddressField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    do_not_email = models.BooleanField(default=False)

    objects = ActivistManager()

    @property
    def rank(self):
        if getattr(self, 'calc_rank', None) is not None:
            return self.calc_rank
        else:
            return min(5,
                self.signups.filter(state=SignupState.attended).count())

    def __unicode__(self):
        ret = self.name.strip()
        if len(ret) == 0:
            return self.email
        return ret

class Action(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateTimeField()
    description = models.TextField()

    class Meta:
        ordering = ['-date', 'name']

    def get_absolute_url(self):
        return reverse('action', args=[self.id])

    def __unicode__(self):
        return self.name

class SignupManager(models.Manager):
    def confirmed(self):
        return self.with_state('confirmed')

    def attended(self):
        return self.with_state('attended')

    def with_state(self, state):
        s = SignupState[state]
        return self.filter(state=s.value)

class Signup(models.Model):
    activist = models.ForeignKey(Activist, related_name='signups')
    action = models.ForeignKey(Action, related_name='signups')
    state = EnumIntegerField(SignupState)
    created = models.DateTimeField(auto_now_add=True)

    objects = SignupManager()

    class Meta:
        unique_together = ('activist', 'action')

    def __unicode__(self):
        return "%s: %s (%s)"%(unicode(self.activist), unicode(self.action),
                self.state)
