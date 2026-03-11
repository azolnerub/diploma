from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Max, Min
from datetime import datetime, timedelta
from .models import Assessment, AssessmentHistory
#from employees.models import Employee
from .serializers import AssessmentSerializer, AssessmentHistorySerializer

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Assessment.objects.all()
        employee_id = self.request.query_params.get('employee', None)
        competency_id = self.request.query_params.get('competency', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if competency_id:
            queryset = queryset.filter(competency_id=competency_id)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset

    def perform_create(self, serializer):
        assessment = serializer.save(assessor=self.request.user)
        AssessmentHistory.objects.create(
            employee=assessment.employee,
            competency=assessment.competency,
            value=assessment.value,
            date=assessment.date
        )

    @action(detail=False, methods=['get'])
    def employee_statistics(self, request):
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response({'error': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)

        assessments = Assessment.objects.filter(employee_id=employee_id)

        #Общая статистика
        stats = {
            'total_assessments': assessments.count(),
            'average_score': assessments.aggregate(Avg('value'))['value__avg'],
            'max_score': assessments.aggregate(Max('value'))['value__max'],
            'min_score': assessments.aggregate(Min('value'))['value__min'],
            'by_competency': []
        }

        #Статистика по компетенциям
        for competency in assessments.values('competency').distinct():
            comp_assessments = assessments.filter(competency=competency['competency'])
            stats['by_competency'].append({
                'competency_id': competency['competency'],
                'competency_name': comp_assessments.first().competency.name,
                'average': comp_assessments.aggregate(Avg('value'))['value__avg'],
                'count': comp_assessments.count()
            })
        return Response(stats)

    @action(detail=False, methods=['get'])
    def dynamics(self, request):
        employee_id = request.query_params.get('employee_id')
        days = int(request.query_params.get('days', 90))  # по умолчанию за 90 дней

        if not employee_id:
            return Response({'error': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)

        date_threshold = datetime.now().date() - timedelta(days=days)

        history = AssessmentHistory.objects.filter(
            employee_id=employee_id,
            date__gte=date_threshold
        ).order_by('date')

        serializer = AssessmentHistorySerializer(history, many=True)
        return Response(serializer.data)

class AssessmentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssessmentHistory.objects.all()
    serializer_class = AssessmentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]