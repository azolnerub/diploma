from rest_framework import generics, status
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Employee, Competency, Evaluation, IdealProfile, Department, Position
from .serializers import (EmployeeSerializer, CompetencySerializer, EvaluationSerializer,
                          IdealProfileSerializer, DeptSerializer, PosSerializer)

User = get_user_model()

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        employee = None
        try:
            employee = user.employee
        except AttributeError:
            pass

        data = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": employee.full_name if employee else user.username,
            "position": employee.position.name if employee and employee.position else None,
            "department": employee.department.name if employee and employee.department else None,
        }
        return Response(data)

class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.select_related('position', 'department').all()

        user = self.request.user

        if user.role == 'employee':
            queryset = queryset.filter(user=user)
        elif user.role == 'manager' and hasattr(user, 'employee'):
            queryset = queryset.filter(department=user.employee.department)

        return queryset

# === CRUD СОТРУДНИКА ===
class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            username = request.data.get('username', f"user_{request.data.get('full_name', 'new').replace(' ', '_').lower()}")

            user, created = User.objects.get_or_create(
                username = username,
                defaults={
                    'password': 'pbkdf2_sha256$600000$default$defaultpassword123',
                    'role': 'employee',
                    'is_active': True,
                }
            )

            employee = Employee.objects.create(
                user=user,
                full_name=request.data.get('full_name'),
                position_id=request.data.get('position_id'),
                department_id=request.data.get('department_id'),
                hire_date=request.data.get('hire_date'),
                status=request.data.get('status', 'Работает'),
            )

            serializer = self.get_serializer(employee)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Ошибка создания сотрудника:", str(e))
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Редактирование сотрудника
class EmployeeUpdateView(generics.UpdateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

# Удаление сотрудника
class EmployeeDeleteView(generics.DestroyAPIView):
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]

# Страница редактирования сотрудника
class EmployeeDetailView(generics.RetrieveAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

# Отделы
class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DeptSerializer
    permission_classes = [IsAuthenticated]

# Должности
class PositionListView(generics.ListAPIView):
    queryset = Position.objects.all()
    serializer_class = PosSerializer
    permission_classes = [IsAuthenticated]

# Компетенции
class CompetencyListView(generics.ListAPIView):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    permission_classes = [IsAuthenticated]

# Оценки сотрудников
class EmployeeEvaluationListView(generics.ListAPIView):
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'employee_id'

    def get_queryset(self):
        employee_id = self.kwargs['employee_id']
        return Evaluation.objects.filter(employee_id=employee_id)

# Добавление компетенции в профиль сотрудника
class AddCompetencyToEmployeeView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, employee_id):
        employee = get_object_or_404(Employee, id=employee_id)
        competency_id = request.data.get('competency_id')
        value = request.data.get('value', 3)
        comment = request.data.get('comment', '')

        competency = get_object_or_404(Competency, id=competency_id)

        evaluation = Evaluation.objects.create(
            employee=employee,
            competency=competency,
            value=value,
            comment=comment,
            manager=request.user
        )

        return Response({"message": "Компетенция добавлена", "evaluation_id": evaluation.id}, status=status.HTTP_201_CREATED)

# Удаление компетенции из профиля сотрудника
class RemoveCompetencyFromEmployeeView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id, competency_id):
        deleted = Evaluation.objects.filter(employee_id=employee_id, competency_id=competency_id).delete()
        if deleted[0] > 0:
            return Response({"message": "Компетенция удалена"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"message": "Компетенция не найдена"}, status=status.HTTP_404_NOT_FOUND)

# === ИДЕАЛЬНЫЕ ПРОФИЛИ ===
class IdealProfileListCreateView(generics.ListCreateAPIView):
    queryset = IdealProfile.objects.all()
    serializer_class = IdealProfileSerializer
    permission_classes = [IsAuthenticated]

class IdealProfileUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = IdealProfile.objects.all()
    serializer_class = IdealProfileSerializer
    permission_classes = [IsAuthenticated]