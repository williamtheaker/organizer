# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging
from django.shortcuts import render, redirect
from . import models, forms

def index(request):
    forms = models.Form.objects.all()
    return render(request, 'index.html', {'forms':forms})

def action(request, action_id):
    action = models.Action.objects.all()
    return render(request, 'action.html', {'action': action})

def thanks(request):
    return render(request, 'thanks.html')

def form(request, form_id):
    form_obj = models.Form.objects.get(pk=form_id)
    if request.method == 'POST':
        form = forms.FormForm(form_obj, request.POST)
        if form.is_valid():
            signup_activist, _ = models.Activist.objects.get_or_create(email=form.cleaned_data['email'],
                    defaults={'name': form.cleaned_data['name'], 'address':
                        form.cleaned_data['address']})
            signup = models.Signup.objects.update_or_create(activist=signup_activist,
                    action=form_obj.action, defaults={'state':
                        form_obj.next_state})
            logging.debug("Updating signup: %s", signup )

            values = []
            for k,v in form.custom_fields.iteritems():
                field = models.FormField.objects.get(pk=k)
                logging.debug("%s = %s", field.name, form.cleaned_data[v])
                models.FormResponse.objects.update_or_create(field=field,
                        activist=signup_activist,
                        defaults={'value':form.cleaned_data[v]})
            return redirect('thanks')
    else:
        form = forms.FormForm(form_obj)
    return render(request, 'form.html', {'form': form, 'form_obj': form_obj})
