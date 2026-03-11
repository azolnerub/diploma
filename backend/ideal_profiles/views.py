from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import IdealProfile
from .serializers import IdealProfileSerializer

class IdealProfileViewSet(viewsets.ModelViewSet):
    queryset = IdealProfile.objects.all()
    serializer_class = IdealProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = IdealProfile.objects.all()
        position_id = self.request.query_params.get('position', None)
        if position_id:
            queryset = queryset.filter(position_id=position_id)
        return queryset

    @action(detail=True, methods=['get'])
    def for_position(self, request):
        position_id = request.query_params.get('position_id')
        if not position_id:
            return Response({'error': 'position_id required'}, status=status.HTTP_400_BAD_REQUEST)

        profiles = IdealProfile.objects.filter(position_id=position_id)
        serializer = self.get_serializer(profiles, many=True)

        total_weight = profiles.aggregate(Sum('weight'))['weight_sum'] or 0

        return Response({
            'profiles': serializer.data,
            'total_weight': total_weight
        })
    @action(detail=True, methods=['get'])
    def bulk_create(self, request):
        profiles_data = request.data.get('profiles', [])
        serializer = self.get_serializer(data=profiles_data, many=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)