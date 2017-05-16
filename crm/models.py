# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.urls import reverse
from address.models import AddressField
import inspect
from enum import Enum

class ChoiceEnum(Enum):
    @classmethod
    def choices(cls):
        members = inspect.getmembers(cls, lambda m: not(inspect.isroutine(m)))
        props = [m for m in members if not(m[0][:2] == '__')]
        choices = tuple([(str(p[1].value), p[0]) for p in props])
        return choices

class SignupState(ChoiceEnum):
    prospective = 0
    confirmed = 1
    attended = 2
    noshow = 3
    cancelled = 4

class FormControlType(ChoiceEnum):
    text = 0
    boolean = 1
    multiple_choice = 2
    options = 3

class Activist(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    phone = models.CharField(blank=True, max_length=200)
    address = AddressField(blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return self.name

class Action(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateTimeField()

    @property
    def fields(self):
        return FormField.objects.filter(form__action=self)

    def get_absolute_url(self):
        return reverse('action', args=[self.id])

    def __unicode__(self):
        return self.name

class Form(models.Model):
    action = models.ForeignKey(Action, related_name='forms')
    title = models.CharField(max_length=200)
    description = models.TextField()
    active = models.BooleanField()
    next_state = models.CharField(max_length=1, choices=SignupState.choices())

    def get_absolute_url(self):
        return reverse('form', args=[self.id])

    def __unicode__(self):
        return "%s: %s"%(self.action.name, self.title)

class FormField(models.Model):
    form = models.ForeignKey(Form, related_name='fields')
    name = models.CharField(max_length=200)
    control_type = models.CharField(max_length=1, choices=FormControlType.choices())
    control_data = models.TextField(blank=True)

    @property
    def control_type_name(self):
        return FormControlType(int(self.control_type)).name

    def __unicode__(self):
        return "%s: %s"%(unicode(self.form), self.name)

class FormResponse(models.Model):
    field = models.ForeignKey(FormField, related_name='responses')
    activist = models.ForeignKey(Activist, related_name='responses')
    value = models.TextField(blank=True)

    def __unicode__(self):
        return "%s: %s: %s: %s: %s"%(self.activist.name, self.field.form.action.name,
                self.field.form.title, self.field.name, self.value)

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
    state = models.CharField(max_length=1, choices=SignupState.choices())

    objects = SignupManager()

    @property
    def state_name(self):
        return SignupState(int(self.state)).name

    @property
    def responses(self):
        return FormResponse.objects.filter(field__form__action=self.action.id,
                activist=self.activist)

    def __unicode__(self):
        return "%s: %s (%s)"%(unicode(self.activist), unicode(self.action),
                self.state)
