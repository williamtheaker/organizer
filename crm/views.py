# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging
from django.shortcuts import render, redirect
from django.conf import settings
from . import models, forms
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import detail_route
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from . import serializers

class ActionViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Action.objects.all()
    serializer_class = serializers.ActionSerializer

class FormViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Form.objects.all()
    serializer_class = serializers.FormSerializer

    @detail_route(methods=['post'], permission_classes=(AllowAny,))
    def submit_response(self, request, pk=None):
        form_obj = self.get_object()
        fields = models.FormField.objects.filter(form=form_obj).all()
        signup_activist, _ = models.Activist.objects.get_or_create(
                email = request.data['email'],
                defaults = {
                    'name': request.data['name'],
                    'address': request.data['address']
                })
        signup, _ = models.Signup.objects.update_or_create(
                activist=signup_activist,
                action=form_obj.action,
                defaults={'state': form_obj.next_state})
        logging.debug("Updating signup: %s", signup )
        values = []
        for field in fields:
            field_input_name = "input_%s"%(field.id)
            field_value = request.data.get(field_input_name, '')
            logging.debug("%s = %s", field.name, field_value)
            models.FormResponse.objects.update_or_create(
                    field = field,
                    activist = signup_activist,
                    defaults = {'value': field_value})
        return Response()

class FieldViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.FormField.objects.all()
    serializer_class = serializers.FieldSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Campaign.objects.all()
    serializer_class = serializers.CampaignSerializer

def index(request):
    forms = models.Form.objects.all()
    return render(request, 'index.html', {'forms':forms, 'settings':settings})

def action(request, action_id):
    action = models.Action.objects.all()
    return render(request, 'action.html', {'action': action})
