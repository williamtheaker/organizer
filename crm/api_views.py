from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import list_route, detail_route
import logging
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from django.template import loader, engines
from django.db.models import Q, Count, Subquery, OuterRef
from django.contrib.auth import logout
import django_rq
from emails.models import TemplatedEmail
from . import models, serializers
import address

class IntrospectiveViewSet(viewsets.ModelViewSet):
    @list_route(methods=['get'])
    def fields(self, request):
        fields = []
        for fieldName, field in self.get_serializer().fields.iteritems():
            fields.append({'label': field.label, 'key': fieldName})
        return Response({'fields': fields})

    def get_queryset(self):
        filterArg = Q()
        sortKeys = []
        if 'sort' in self.request.query_params:
            sortKeys = [self.request.query_params.get('sort')]
        serializer = self.get_serializer()

        for param, value in self.request.query_params.iteritems():
            if param == "sort":
                continue
            filterArg &= Q(**{param: value})
        results = super(IntrospectiveViewSet, self).get_queryset().filter(filterArg)

        for sortKey in sortKeys:
            results = results.order_by(sortKey)

        return results

class UserViewSet(IntrospectiveViewSet):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def logout(self, request):
        logout(request)
        return Response()

    def get_object(self):
        pk = self.kwargs.get('pk')

        if pk == 'me':
            return self.request.user

        return super(UserViewSet, self).get_object()

class ActivistViewSet(IntrospectiveViewSet):
    queryset = models.Activist.objects.all()
    serializer_class = serializers.ActivistSerializer
    permission_classes = (IsAuthenticated,)

class SignupViewSet(IntrospectiveViewSet):
    queryset = models.Signup.objects.all()
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.SignupSerializer

class ActionViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Action.objects.all()
    serializer_class = serializers.ActionSerializer

    @detail_route(methods=['get'])
    def suggestions(self, request, pk=None):
        action_obj = self.get_object()
        current_activists = models.Activist.objects.filter(signups__action=action_obj)
        related_actions = models.Action.objects.filter(signups__activist__in=current_activists)
        related_signups = models.Signup.objects.filter(action__in=related_actions).exclude(activist__in=current_activists)
        related_activists = models.Activist.objects.filter(signups__in=related_signups).order_by('-calc_rank').distinct()[0:5]
        serializer = serializers.ActivistSerializer(related_activists,
                context={'request': request}, many=True)
        return Response({'results': serializer.data})

    @detail_route(methods=['post'])
    def bulk_add_activists(self, request, pk=None):
        action_obj = self.get_object()
        serializer = serializers.AddActivistSerializer(data={
            'activists': request.data.get('activists', None)
        })
        if serializer.is_valid():
            signups = map(lambda a:
                    models.Signup.objects.get_or_create(activist_id=a,
                        action=action_obj, defaults={'state':
                            models.SignupState.prospective.value }),
                        serializer.validated_data.get('activists'))
            return Response()
        else:
            return Response({'errors': serializer.errors}, 400)

    @detail_route(methods=['post'])
    def email_activists_preview(self, request, pk=None):
        action_obj = self.get_object()
        serializer = serializers.EmailSerializer(data={
            'subject': request.data.get('subject', None),
            'body': request.data.get('body', None),
            'signups': request.data.get('signups', None)
        })
        if serializer.is_valid():
            templated_body = engines['django'].from_string(serializer.validated_data.get('body'))
            email_template = loader.get_template('email.eml')
            signups = models.Signup.objects.filter(
                action=action_obj,
                pk__in=serializer.validated_data.get('signups')
            )
            s = signups[0]
            cxt = {
                'action': action_obj,
                'signup': s,
                'activist': s.activist
            }
            generated_email = email_template.render({
                'signup': s,
                'body': templated_body.render(cxt)
            })
            return Response({'body': generated_email})
        else:
            return Response({'errors': serializer.errors}, 400)

    @detail_route(methods=['post'])
    def email_activists(self, request, pk=None):
        action_obj = self.get_object()
        serializer = serializers.EmailSerializer(data={
            'subject': request.data.get('subject', None),
            'body': request.data.get('body', None),
            'signups': request.data.get('signups', None)
        })
        if serializer.is_valid():
            templated_email = TemplatedEmail.objects.create(
                subject=serializer.validated_data.get('subject'),
                body=serializer.validated_data.get('body')
            )
            signups = models.Signup.objects.filter(
                action=action_obj,
                pk__in=serializer.validated_data.get('signups')
            )
            activists = [s.activist for s in signups]
            templated_email.send_to_activists(activists, request.user.email)
            return Response({'body': ""})
        else:
            return Response({'errors': serializer.errors}, 400)

class FormViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Form.objects.all()
    serializer_class = serializers.FormSerializer

    @detail_route(methods=['get'], permission_classes=(AllowAny,))
    def embed(self, request, pk=None):
        form_obj = self.get_object()
        embed_data = {
            'version': '1.0',
            'type': 'rich',
            'width': 400,
            'height': 500,
            'html': "<iframe src=\"https://organizing.eastbayforward.org/crm/f/%s\" width=400 height=500></iframe>"%(form_obj.id)
        }
        return Response(embed_data)

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

class FieldViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.FormField.objects.all()
    serializer_class = serializers.FieldSerializer

class CityViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = address.models.Locality.objects.all()
    serializer_class = serializers.CitySerializer

    @list_route(methods=['get'])
    def search(self, request):
        results = address.models.Locality.objects.filter(name__icontains=request.GET.get('q')).order_by('name')
        page = self.paginate_queryset(results)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)


views = {
    'users': UserViewSet,
    'actions': ActionViewSet,
    'forms': FormViewSet,
    'fields': FieldViewSet,
    'signups': SignupViewSet,
    'activists': ActivistViewSet,
    'cities': CityViewSet
}
