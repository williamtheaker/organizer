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

class ActivistViewSet(viewsets.ModelViewSet):
    queryset = models.Activist.objects.all()
    serializer_class = serializers.ActivistSerializer

class SignupViewSet(viewsets.ModelViewSet):
    queryset = models.Signup.objects.all()
    serializer_class = serializers.SignupSerializer

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
        serializer = serializers.ResponseSerializer(data={
            'email': request.data['email'],
            'name': request.data.get('name', None),
            'address': request.data.get('address', None)
        })
        if serializer.is_valid():
            signup_activist, _ = models.Activist.objects.get_or_create(
                    email = request.data['email'],
                    defaults = {
                        'name': request.data.get('name', None),
                        'address': request.data.get('address', '')
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
        else:
            return Response({'errors': serializer.errors}, 400)

class FieldViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.FormField.objects.all()
    serializer_class = serializers.FieldSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Campaign.objects.all()
    serializer_class = serializers.CampaignSerializer

def index(request):
    return render(request, 'index.html', {'settings':settings})

def view_form(request, form_id):
    form = models.Form.objects.get(pk=form_id)
    return render(request, 'form.html', {'form_obj': form})
