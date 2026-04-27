from rest_framework import serializers
from .models import (Employee, Competency, Evaluation,
                     Position, Department, Category, Role,
                     RoleProfile, PositionProfile, Reserve)

class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = ['id', 'name', 'description', 'category']

class EmployeeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='user.role', read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(source='department', queryset=Department.objects.all())
    competencies = CompetencySerializer(many=True, read_only=True)
    position_id = serializers.PrimaryKeyRelatedField(source='position',  queryset=Position.objects.all())
    dynamics_score = serializers.SerializerMethodField()
    in_reserve = serializers.SerializerMethodField()
    reserved_positions = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position_name', 'department_name', 'department_id', 'hire_date',
                  'status', 'competencies', 'dynamics_score', 'in_reserve', 'reserved_positions', 'position_id', 'role']

    def get_dynamics_score(self, obj):
        from .views import calculate_dynamics_score
        return calculate_dynamics_score(obj)

    def get_in_reserve(self, obj):
        return Reserve.objects.filter(employee=obj).exists()

    def get_reserved_positions(self, obj):
        reserves = Reserve.objects.filter(employee=obj).select_related('position')
        return [
            {
                'id': reserve.position.id,
                'name': reserve.position.name
            }
            for reserve in reserves
        ]

class EvaluationSerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    competency_id = serializers.IntegerField(source='competency.id', read_only=True)

    class Meta:
        model = Evaluation
        fields = ['id', 'competency_id', 'competency_name', 'value', 'date', 'comment']

class DeptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class PosSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField(source='department.id', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    candidate_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'name', 'department_id', 'department_name', 'candidate_count']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class RoleSerializer(serializers.ModelSerializer):
    positions = serializers.PrimaryKeyRelatedField(many=True, queryset=Position.objects.all(), required=False)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'department', 'department_name', 'positions']

class RoleProfileSerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    category_name = serializers.CharField(source='competency.category.name', read_only=True)

    class Meta:
        model = RoleProfile
        fields = ['id', 'competency', 'competency_name', 'category_name',
                  'required_level', 'weight']

class PositionProfileSerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    description = serializers.CharField(source='competency.description', read_only=True)

    class Meta:
        model = PositionProfile
        fields = ['id', 'competency', 'competency_name', 'description', 'required_level', 'weight', 'is_key']
