from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from employees.models import Employee, Department
from assessments.models import Assessment, AssessmentHistory
from competencies.models import Competency
from ideal_profiles.models import IdealProfile
from .serializers import EmployeeAnalyticsSerializer, DepartmentAnalyticsSerializer

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def employee_dynamics(self, request):
        employee_id = request.query_params.get('employee_id')
        days = int(request.query_params.get('days', 365))

        if not employee_id:
            return Response({'error': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)

        date_threshold = datetime.now().date() - timedelta(days=days)
        history = AssessmentHistory.objects.filter(
            employee_id=employee_id,
            date__gte=date_threshold
        ).order_by('date')

        data = []
        for h in history:
            data.append({
                'date': h.date,
                'competency': h.competency.name,
                'value': h.value
            })

        if not data:
            return Response({'message': 'No data available'})
        df = pd.DataFrame(data)


        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly_avg = df.groupby(['month', 'competency'])['value'].mean().reset_index()

        # вычисление тренда
        competencies_trend = []
        for competency in df['competency'].unique():
            comp_data = df[df['competency'] == competency].sort_values('date')
            if len(comp_data) > 1:
                x = np.arange(len(comp_data))
                y = comp_data['value'].values
                z = np.polyfit(x, y, 1)
                trend = z[0]  # коэффициент наклона
            else:
                trend = 0

            competencies_trend.append({
                'competency': competency,
                'trend': trend,
                'current_value': comp_data['value'].iloc[-1] if len(comp_data) > 0 else 0
            })

        # общая статистика
        stats = {
            'employee_id': employee_id,
            'period_days': days,
            'total_assessments': len(history),
            'overall_avg': df['value'].mean(),
            'competencies_trend': competencies_trend,
            'monthly_data': monthly_avg.to_dict('records')
        }
        return Response(stats)

    @action(detail=False, methods=['get'])
    def department_comparison(self, request):
        departments = Department.objects.annotate(
            employees_count=Count('position__employee', filter=Q(position__employee__status='active')),
            avg_score=Avg('position__employee__assessment__value')
        )

        result = []
        for dept in departments:
            # Получаем топ сотрудников отдела
            top_employees = Employee.objects.filter(
                position__department=dept,
                status='active'
            ).annotate(
                avg_score=Avg('assessment__value')
            ).filter(avg_score__isnull=False).order_by('-avg_score')[:5]

            # Получаем сотрудников, нуждающихся в обучении
            needs_training = Employee.objects.filter(
                position__department=dept,
                status='active'
            ).annotate(
                avg_score=Avg('assessment__value')
            ).filter(avg_score__lt=3)[:5]

            result.append({
                'department_id': dept.id,
                'department_name': dept.name,
                'employees_count': dept.employees_count,
                'average_score': float(dept.avg_score) if dept.avg_score else 0,
                'top_employees': [str(emp) for emp in top_employees],
                'needs_training': [str(emp) for emp in needs_training]
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def competency_gap_analysis(self, request):
        department_id = request.query_params.get('department_id')

        # Получаем все должности (фильтруем по отделу если указан)
        positions = IdealProfile.objects.values_list('position', flat=True).distinct()
        if department_id:
            from employees.models import Position
            positions = Position.objects.filter(department_id=department_id)

        result = []
        for position in positions:
            # Получаем идеальный профиль
            ideal_profiles = IdealProfile.objects.filter(position=position)

            # Получаем сотрудников на этой должности
            employees = Employee.objects.filter(position=position, status='active')

            if not employees.exists():
                continue

            gap_analysis = []
            for ideal in ideal_profiles:
                current_level = Assessment.objects.filter(
                    employee__in=employees,
                    competency=ideal.competency
                ).aggregate(Avg('value'))['value__avg'] or 0

                gap = ideal.required_level - current_level

                gap_analysis.append({
                    'competency': ideal.competency.name,
                    'required_level': ideal.required_level,
                    'current_level': round(current_level, 2),
                    'gap': round(gap, 2),
                    'weight': ideal.weight
                })

            gap_analysis.sort(key=lambda x: x['gap'], reverse=True)

            result.append({
                'position_id': position.id,
                'position_name': position.name,
                'employees_count': employees.count(),
                'gaps': gap_analysis[:10]
            })
        return Response(result)

    @action(detail=False, methods=['get'])
    def training_effectiveness(self, request):
        """Оценка эффективности обучающих курсов"""
        course_id = request.query_params.get('course_id')
        days_after = int(request.query_params.get('days_after', 90))
        employees_with_course = Employee.objects.filter(status='active')[:10]

        result = []
        for employee in employees_with_course:
            # Оценки до курса
            before_date = datetime.now().date() - timedelta(days=days_after + 30)
            before_scores = Assessment.objects.filter(
                employee=employee,
                date__lte=before_date
            ).aggregate(Avg('value'))['value__avg'] or 0

            # Оценки после курса
            after_scores = Assessment.objects.filter(
                employee=employee,
                date__gte=before_date
            ).aggregate(Avg('value'))['value__avg'] or 0

            improvement = after_scores - before_scores

            result.append({
                'employee_id': employee.id,
                'employee_name': str(employee),
                'before_course': round(before_scores, 2),
                'after_course': round(after_scores, 2),
                'improvement': round(improvement, 2)
            })

        # Общая статистика
        improvements = [r['improvement'] for r in result]
        summary = {
            'total_employees': len(result),
            'average_improvement': round(np.mean(improvements), 2) if improvements else 0,
            'max_improvement': round(np.max(improvements), 2) if improvements else 0,
            'details': result
        }

        return Response(summary)

    @action(detail=False, methods=['get'])
    def export_report(self, request):
        """Экспорт отчета в CSV"""
        report_type = request.query_params.get('type', 'employees')

        if report_type == 'employees':
            # Отчет по сотрудникам
            employees = Employee.objects.filter(status='active')
            data = []
            for emp in employees:
                avg_score = Assessment.objects.filter(employee=emp).aggregate(Avg('value'))['value__avg']
                data.append({
                    'ФИО': str(emp),
                    'Должность': emp.position.name if emp.position else '',
                    'Отдел': emp.position.department.name if emp.position and emp.position.department else '',
                    'Дата приема': emp.hire_date,
                    'Средняя оценка': round(avg_score, 2) if avg_score else 0
                })

            df = pd.DataFrame(data)

        elif report_type == 'competencies':
            # Отчет по компетенциям
            competencies = Competency.objects.all()
            data = []
            for comp in competencies:
                avg_score = Assessment.objects.filter(competency=comp).aggregate(Avg('value'))['value__avg']
                data.append({
                    'Компетенция': comp.name,
                    'Категория': comp.category.name,
                    'Средняя оценка': round(avg_score, 2) if avg_score else 0,
                    'Количество оценок': Assessment.objects.filter(competency=comp).count()
                })

            df = pd.DataFrame(data)

        # Конвертируем в CSV
        csv_data = df.to_csv(index=False, encoding='utf-8-sig')

        from django.http import HttpResponse
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'

        return response




