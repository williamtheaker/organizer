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

class FormResponseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormResponse
        fields = ('value', 'id')

class SignupSerializer(EnumFieldSerializerMixin, serializers.HyperlinkedModelSerializer):
    activist = ActivistSerializer()
    responses = FormResponseSerializer(read_only=True)

    class Meta:
        model = models.Signup
        fields = ('action', 'activist', 'state', 'responses', 'id', 'url')

class FieldSerializer(EnumFieldSerializerMixin, serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.FormField
        fields = ('id', 'name', 'control_type', 'control_data', 'form', 'url')

class ActionFormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    class Meta:
        model = models.Form
        fields = ('fields', 'title', 'description', 'id', 'url', 'active')

class ActionSerializer(serializers.HyperlinkedModelSerializer):
    signups = SignupSerializer(many=True, read_only=True)
    fields = FieldSerializer(many=True, read_only=True)
    forms = ActionFormSerializer(many=True, read_only=True)
    class Meta:
        model = models.Action
        fields = ('name', 'date', 'id', 'signups', 'forms',
                'fields', 'url')

class ViewFormSerializer(serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(many=True)
    action = serializers.SerializerMethodField()

    def get_action(self, obj):
        return {'name': obj.action.name}

    class Meta:
        model = models.Form
        fields = ('fields', 'action', 'title', 'description', 'url')

class FormSerializer(EnumFieldSerializerMixin, serializers.HyperlinkedModelSerializer):
    fields = FieldSerializer(required=False, many=True)
    action = ActionSerializer()

    class Meta:
        model = models.Form
        fields = ('fields', 'action', 'title', 'description', 'url', 'id', 'next_state', 'active')

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
