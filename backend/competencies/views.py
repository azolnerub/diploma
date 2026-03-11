from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CompetencyCategory, Competency
from .serializers import CompetencyCategorySerializer, CompetencySerializer

class CompetencyCategoryViewSet(viewsets.ModelViewSet):
    queryset = CompetencyCategory.objects.all()
    serializer_class = CompetencyCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def competencies(self, request, pk=None):
        category = self.get_object()
        competencies = Competency.objects.filter(category=category)
        serializer = CompetencySerializer(competencies, many=True)
        return Response(serializer.data)

class CompetencyViewSet(viewsets.ModelViewSet):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Competency.objects.all()
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    @action(detail=True, methods=['get'])
    def assesments(self, request, pk=None):
        competency = self.get_object()
        from assessments.models import Assessment
        assessments = Assessment.objects.filter(competency=competency)
        from assessments.serializers import AssessmentSerializer
        serializer = AssessmentSerializer(assessments, many=True)
        return Response(serializer.data)