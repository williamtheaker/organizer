from rest_framework import serializers
from . import models
from django.contrib.auth.models import User

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')

class ActivistSerializer(serializers.HyperlinkedModelSerializer):
    address = serializers.CharField(source='address.raw')
    class Meta:
        model = models.Activist
        fields = ('name',  'email', 'address', 'id')

class FormResponseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormResponse
        fields = ('value', 'id')

class SignupSerializer(serializers.HyperlinkedModelSerializer):
    activist = ActivistSerializer()
    responses = FormResponseSerializer()
    class Meta:
        model = models.Signup
        fields = ('activist', 'state', 'state_name', 'responses', 'id')

class FieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormField
        fields = ('id', 'name', 'control_type', 'control_data')

class ActionSerializer(serializers.HyperlinkedModelSerializer):
    signups = SignupSerializer(many=True)
    fields = FieldSerializer(many=True)
    class Meta:
        model = models.Action
        fields = ('campaign', 'name', 'date', 'id', 'signups', 'forms', 'fields')

class FormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    action = ActionSerializer()
    class Meta:
        model = models.Form
        fields = ('fields', 'action', 'title', 'description')

class CampaignSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Campaign
        fields = ('name', 'id')

class ResponseSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(allow_blank=True)
    address = serializers.CharField(allow_blank=True)

class EmailSerializer(serializers.Serializer):
    subject = serializers.CharField()
    body = serializers.CharField()
    signups = serializers.ListSerializer(child=serializers.IntegerField())
