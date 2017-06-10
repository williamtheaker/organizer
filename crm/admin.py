# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import csv
import logging
from django.utils.html import format_html
from django.core.urlresolvers import reverse
from django.template import loader
from django.conf.urls import url
from django.shortcuts import render
from django.contrib import admin
from django.contrib import messages
from . import models
from django.core.mail import send_mail
from django.conf import settings
from address.models import Locality
from districting import models as districting_models
import StringIO


class SignupInline(admin.TabularInline):
    model = models.Signup

class FormInline(admin.TabularInline):
    model = models.Form

class ActionFilter(admin.SimpleListFilter):
    title = 'Action'
    parameter_name = 'action'

    def lookups(self, request, model_admin):
        ret = []
        for a in models.Action.objects.all():
            ret.append((a.id, a.name))
        return ret

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(signups__action_id=self.value())
        return queryset

class CityFilter(admin.SimpleListFilter):
    title = 'City'
    parameter_name = 'city'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                Locality.objects.all().order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(address__locality_id=self.value())
        return queryset

class DistrictFilter(admin.SimpleListFilter):
    title = 'District'
    parameter_name = 'district'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.label+", "+districting_models.DistrictType(x.type).name),
                districting_models.District.objects.all().order_by('label'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(district_memberships__district_id=self.value())
        return queryset

class ActivistAdmin(admin.ModelAdmin):
    inlines = [
        SignupInline
    ]

    search_fields = [
        'name', 'email', 'address__raw', 'address__locality__name'
    ]

    list_filter = [
        ActionFilter,
        CityFilter,
        DistrictFilter
    ]

    list_display = [
        'name', 'email', 'address', 'action_count'
    ]

    def get_actions(self, request):
        actions = super(ActivistAdmin, self).get_actions(request)
        for a in models.Action.objects.all():
            def action_processor(modeladmin, request, queryset):
                for f in queryset.all():
                    models.Signup.objects.get_or_create(activist=f, action=a,
                            defaults={'state':
                                models.SignupState.prospective.value})
            action_processor.short_description = "Add to action: %s"%(a.name)
            actions['add_action_%s'%a.id] = (action_processor,
                    'add_action_%s'%a.id, action_processor.short_description)
        return actions

    def action_count(self, obj):
        return len(obj.signups.attended())

class ActionAdmin(admin.ModelAdmin):
    inlines = [
        SignupInline,
        FormInline
    ]

    list_display = (
        'name',
        'date',
    )

class FieldInline(admin.TabularInline):
    model = models.FormField

class FormAdmin(admin.ModelAdmin):
    inlines = [
        FieldInline
    ]

admin.site.register(models.Action, ActionAdmin)
admin.site.register(models.Form, FormAdmin)
admin.site.register(models.FormField)
admin.site.register(models.Signup)
admin.site.register(models.FormResponse)
admin.site.register(models.Activist, ActivistAdmin)
