from rest_framework import serializers, relations
from . import models
from django.contrib.auth.models import User
from taggit_serializer.serializers import TagListSerializerField, TaggitSerializer
import address
from drf_enum_field.serializers import EnumFieldSerializerMixin

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')


class CitySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'id')

class LocalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'postal_code')

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Address
        fields = ('raw', 'street_number', 'route', 'locality')

class PersonSerializer(TaggitSerializer, serializers.HyperlinkedModelSerializer):
    address = AddressSerializer(required=False)
    tags = TagListSerializerField()

    class Meta:
        model = models.Person
        fields = ('name',  'id', 'email', 'address', 'created', 'url', 'tags')
        lookup_field = 'email'
        extra_kwargs = {
                'url': {'lookup_field': 'email'},
                'id': {'source': 'email'}
        }
