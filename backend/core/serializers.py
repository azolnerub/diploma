from rest_framework import serializers
from .models import Employee, Competency, Evaluation, IdealProfile, Position, Department, Category

class EmployeeSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(source='position.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position_name', 'department_name', 'hire_date', 'status']

class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = ['id', 'name', 'description', 'category']

class EvaluationSerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    competency_id = serializers.IntegerField(source='competency.id', read_only=True)

    class Meta:
        model = Evaluation
        fields = ['id', 'competency_id', 'competency_name', 'value', 'date', 'comment']

class IdealProfileSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(source='position.name', read_only=True)
    competency_name = serializers.CharField(source='competency.name', read_only=True)

    class Meta:
        model = IdealProfile
        fields = ['id', 'position', 'position_name', 'competency', 'competency_name', 'required_level', 'weight']

class DeptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class PosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ['id', 'name']
