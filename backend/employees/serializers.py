from rest_framework import serializers
from .models import Department, Position, Employee
from users.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'name', 'department', 'department_name']

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)
    department_name = serializers.CharField(source='position.department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'user_id', 'position', 'position_name',
                  'department_name', 'hire_date', 'status']