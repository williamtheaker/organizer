from rest_framework import serializers
from . import models

class ActionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Action
        fields = ('campaign', 'name', 'date', 'id')
        depth = 1


class FieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormField
        fields = ('id', 'name', 'control_type', 'control_data')

class FormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    class Meta:
        model = models.Form
        fields = ('fields', 'action', 'title', 'description')

class CampaignSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Campaign
        fields = ('name', 'id')
