from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import list_route
from . import models, serializers

class IntrospectiveViewSet(viewsets.ModelViewSet):
    @list_route(methods=['get'])
    def fields(self, request):
        fields = []
        for fieldName, field in self.get_serializer().fields.iteritems():
            fields.append({'label': field.label, 'key':
                field.source.replace('.', '__')})
        return Response({'fields': fields})

class DistrictViewSet(IntrospectiveViewSet):
    queryset = models.District.objects.all()
    serializer_class = serializers.DistrictSerializer

views = {
    'districts': DistrictViewSet
}
