from rest_framework import serializers
from . import models
from django.contrib.auth.models import User
import address

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')

class ActivistSerializer(serializers.HyperlinkedModelSerializer):
    address = serializers.CharField(source='address.raw')
    class Meta:
        model = models.Activist
        fields = ('name',  'email', 'address', 'id', 'created', 'url')

class FormResponseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormResponse
        fields = ('value', 'id')

class SignupSerializer(serializers.HyperlinkedModelSerializer):
    activist = ActivistSerializer()
    responses = FormResponseSerializer(read_only=True)
    class Meta:
        model = models.Signup
        fields = ('action', 'activist', 'state', 'state_name', 'responses', 'id')

class WriteSignupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Signup
        fields = ('action', 'activist', 'state', 'id')

class FieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormField
        fields = ('id', 'name', 'control_type', 'control_data', 'form', 'url')

class ActionFormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    class Meta:
        model = models.Form
        fields = ('fields', 'title', 'description', 'id', 'url', 'active')

class ActionSerializer(serializers.HyperlinkedModelSerializer):
    signups = SignupSerializer(many=True)
    fields = FieldSerializer(many=True)
    forms = ActionFormSerializer(many=True)
    class Meta:
        model = models.Action
        fields = ('campaign', 'name', 'date', 'id', 'signups', 'forms',
                'fields', 'url')

class WriteFormSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Form
        fields = ('action', 'title', 'description', 'next_state', 'active', 'url')

class FormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    action = ActionSerializer()
    class Meta:
        model = models.Form
        fields = ('fields', 'action', 'title', 'description', 'url', 'id',
        'next_state', 'active')

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

class CitySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'id')

class AddActivistSerializer(serializers.Serializer):
    activists = serializers.HyperlinkedRelatedField(many=True,
            view_name='activist-detail', read_only=False, queryset=models.Activist.objects.all())
