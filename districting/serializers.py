from rest_framework import serializers
from . import models
from drf_enum_field.serializers import EnumFieldSerializerMixin

class DistrictSerializer(EnumFieldSerializerMixin, serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.District
        fields = ('label', 'id', 'key', 'ocd_id', 'type')
