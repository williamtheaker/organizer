from rest_framework import serializers
from . import models

class DistrictSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.District
        fields = ('label', 'id', 'key', 'ocd_id', 'type')
