from rest_framework import serializers, relations
from . import models
from django.contrib.auth.models import User
import address
from drf_enum_field.serializers import EnumFieldSerializerMixin

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')

class ActivistSerializer(serializers.HyperlinkedModelSerializer):
    address = serializers.SerializerMethodField()
    rank = serializers.IntegerField(read_only=True)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            return super(ActivistSerializer, self).to_internal_value(data)
        else:
            return relations.HyperlinkedRelatedField('activist-detail',
                    queryset=models.Activist.objects.all()).to_internal_value(data)

    def get_address(self, obj):
        return unicode(obj.address)

    class Meta:
        model = models.Activist
        fields = ('name',  'email', 'address', 'id', 'created', 'url', 'rank')

class SignupSerializer(EnumFieldSerializerMixin, serializers.HyperlinkedModelSerializer):
    activist = ActivistSerializer()

    class Meta:
        model = models.Signup
        fields = ('action', 'activist', 'state', 'id', 'url', 'created')

class ActionSerializer(serializers.HyperlinkedModelSerializer):
    signups = SignupSerializer(many=True, read_only=True)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            return super(ActionSerializer, self).to_internal_value(data)
        else:
            return relations.HyperlinkedRelatedField('action-detail',
                    queryset=models.Action.objects.all()).to_internal_value(data)
    class Meta:
        model = models.Action
        fields = ('name', 'date', 'id', 'signups', 'url', 'description')

class ViewActionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Action
        fields = ('name', 'description', 'date', 'id')

class ResponseSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_null=True)

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
