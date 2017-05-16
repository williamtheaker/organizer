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
from . import models, forms, importing
from django.core.mail import send_mail
from django.conf import settings
import StringIO


class SignupInline(admin.TabularInline):
    model = models.Signup

class FormInline(admin.TabularInline):
    model = models.Form

class ActivistAdmin(admin.ModelAdmin):
    inlines = [
        SignupInline
    ]

    def get_urls(self):
        urls = super(ActivistAdmin, self).get_urls()
        my_urls = [
            url(r'^import$', self.admin_site.admin_view(self.import_view),
            name='import')
        ]
        return my_urls + urls

    def import_view(self, request):
        if request.method == 'POST':
            form = forms.ImportForm(request.POST)
            if form.is_valid():
                f = StringIO.StringIO(form.cleaned_data['csv_data'])
                imported_count = importing.import_file(f)
                messages.success(request, "%s activists imported."%(imported_count))
        else:
            form = forms.ImportForm()
        context = dict(
            self.admin_site.each_context(request),
            form=form
        )
        return render(request, 'admin_import.html', context)

class ActionAdmin(admin.ModelAdmin):
    inlines = [
        SignupInline,
        FormInline
    ]

    list_display = (
        'name',
        'date',
        'action_actions'
    )
    readonly_fields = (
        'action_actions',
    )

    def action_actions(self, obj):
        if obj.id is None:
            id = 0
        else:
            id = obj.id
        return format_html(
            '<a class="button" href="{}">Email</a>'+
            '<a class="button" href="{}">Add Activists</a>'+
            '<a class="button" href="{}">Organizer Report</a>',
            reverse('admin:action-email', args=[id]),
            reverse('admin:action-add-activists', args=[id]),
            reverse('admin:action-organizer-report', args=[id])
        )

    def get_urls(self):
        urls = super(ActionAdmin, self).get_urls()
        my_urls = [
            url(r'^email/(?P<action_id>[0-9]+)/$', self.admin_site.admin_view(self.email_view),
                name='action-email'),
            url(r'^add/(?P<action_id>[0-9]+)/$',
                self.admin_site.admin_view(self.add_activists),
                name='action-add-activists'),
            url(r'^report/(?P<action_id>[0-9]+)/$',
                self.admin_site.admin_view(self.report),
                name='action-organizer-report')
        ]
        return my_urls + urls

    def report(self, request, action_id):
        action = models.Action.objects.get(pk=action_id)
        context = dict(
            self.admin_site.each_context(request),
            action=action,
        )
        return render(request, 'admin_report.html', context)

    def add_activists(self, request, action_id):
        action = models.Action.objects.get(pk=action_id)
        results = []
        if request.method == 'POST':
            form = forms.ActivistSearchForm(request.POST)
            activists_to_add = request.POST.getlist('selected')
            added_count = 0
            if len(activists_to_add) > 0:
                for activist_id in activists_to_add:
                    added_activist = models.Activist.objects.get(pk=activist_id)
                    _, created = models.Signup.objects.get_or_create(activist=added_activist,
                            action=action, defaults={'state':
                                models.SignupState.prospective.value})
                    if created:
                        added_count += 1
                messages.success(request, "%s activists added to %s"%(added_count, action))
            if form.is_valid():
                filter_city = form.cleaned_data['city_filter'].locality.name
                for activist in models.Activist.objects.filter(address__locality__name=filter_city):
                    results.append(activist)
        else:
            form = forms.ActivistSearchForm()
        context = dict(
            self.admin_site.each_context(request),
            action=action,
            form=form,
            results=results
        )
        return render(request, 'admin_add.html', context)

    def email_view(self, request, action_id):
        action = models.Action.objects.get(pk=action_id)
        if request.method == 'POST':
            email_form = forms.EmailForm(request.POST)
            if email_form.is_valid():
                email_template = loader.get_template('email.eml')
                signups = action.signups.filter(state=email_form.cleaned_data['to'])
                for s in signups:
                    generated_email = email_template.render({'signup': s,
                        'body': email_form.cleaned_data['body']})
                    send_mail(email_form.cleaned_data['subject'],
                            generated_email,
                    settings.DEFAULT_FROM_EMAIL,
                    [s.activist.email])
            messages.success(request, '%s emails sent!' % (len(signups)))
        else:
            email_form = forms.EmailForm()

        context = dict(
            self.admin_site.each_context(request),
            action=action,
            form=email_form
        )
        return render(request, 'admin_email.html', context)

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
