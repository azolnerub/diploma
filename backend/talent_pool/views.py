from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
#from django.db.models import Q
from .models import TalentPool
from .serializers import TalentPoolSerializer
from employees.models import Employee
from assessments.models import Assessment
from ideal_profiles.models import IdealProfile

class TalentPoolViewSet(viewsets.ModelViewSet):
    queryset = TalentPool.objects.all()
    serializer_class = TalentPoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TalentPool.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        priority = self.request.query_params.get('priority', None)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset

    @action(detail=False, methods=['get'])
    def candidates(self, request):
        # автоматический подбор кандидатов в резерв по формуле I = (Σ(Ci × Wi) / Σ Wi) × 100%
        position_id = request.query_params.get('position_id')
        min_score = float(request.query_params.get('min_score', 70))  # мин процент соответствия

        if not position_id:
            return Response({'error': 'position_id required'}, status=status.HTTP_400_BAD_REQUEST)
        ideal_profiles = IdealProfile.objects.filter(position_id=position_id)
        if not ideal_profiles.exists():
            return Response({'error': 'Ideal profile not found'}, status=status.HTTP_404_NOT_FOUND)

        employees = Employee.objects.filter(status='active')
        candidates = []
        total_weight = sum(p.weight for p in ideal_profiles)

        for employee in employees:
            score_sum = 0
            missing_competencies = []

            for ideal in ideal_profiles:
                latest_assessment = Assessment.objects.filter(
                    employee=employee,
                    competency=ideal.competency
                ).order_by('-date').first()

                if latest_assessment:
                    score_sum += latest_assessment.value * ideal.weight
                else:
                    missing_competencies.append(ideal.competency.name)

            if total_weight > 0:
                match_percentage = (score_sum / total_weight) * 100

                has_positive_dynamics = self.check_dynamics(employee)

                if match_percentage >= min_score and has_positive_dynamics:
                    candidates.append({
                        'employee_id': employee.id,
                        'employee_name': str(employee),
                        'current_position': employee.position.name,
                        'match_percentage': round(match_percentage, 2),
                        'missing_competencies': missing_competencies
                    })

        # Сортируем по проценту соответствия
        candidates.sort(key=lambda x: x['match_percentage'], reverse=True)

        return Response(candidates)

    def check_dynamics(self, employee):
        from assessments.models import AssessmentHistory
        from django.db.models import Avg
        from datetime import datetime, timedelta

        now = datetime.now().date()
        period1_start = now - timedelta(days=90)
        period2_start = now - timedelta(days=180)

        period1_avg = AssessmentHistory.objects.filter(
            employee=employee,
            date__gte=period1_start
        ).aggregate(Avg('value'))['value__avg'] or 0

        period2_avg = AssessmentHistory.objects.filter(
            employee=employee,
            date__gte=period2_start,
            date__lt=period1_start
        ).aggregate(Avg('value'))['value__avg'] or 0

        return period1_avg > period2_avg

    @action(detail=True, methods=['post'])
    def promote(self, request, pk=None):
        talent = self.get_object()

        if not talent.is_active:
            return Response({'error': 'Candidate is not active'}, status=status.HTTP_400_BAD_REQUEST)

        # обновление должности сотрудника
        employee = talent.employee
        employee.position = talent.target_position
        employee.save()

        # удаление записи в резерве
        talent.is_active = False
        talent.save()

        return Response({'status': 'success', 'message': 'Employee promoted'})