# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from . import models, serializers
from django.views.decorators.clickjacking import xframe_options_exempt
import json


def index(request, *args, **kwargs):
    return render(request, 'index.html')

@xframe_options_exempt
def view_form(request, form_id):
    form = models.Form.objects.get(pk=form_id)
    serializer = serializers.ViewFormSerializer(form, context={'request': request})
    return render(request, 'form.html', {
        'form_obj': form, 
        'form_data': json.dumps(serializer.data),
    })
