from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Department, Position, Employee
from .serializers import DepartmentSerializer, PositionSerializer, EmployeeSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Position.objects.all()
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.all()
        status = self.request.query_params.get('status', None)
        department = self.request.query_params.get('department', None)

        if status:
            queryset = queryset.filter(status=status)
        if department:
            queryset = queryset.filter(position__department_id=department)
        return queryset

    @action(detail=True, methods=['get'])
    def assessments(self, request, pk=None):
        employee = self.get_object()
        from assessments.models import Assessment
        assessments = Assessment.objects.filter(employee=employee)
        from assessments.serializers import AssessmentSerializer
        serializer = AssessmentSerializer(assessments, many=True)
        return Response(serializer.data)
