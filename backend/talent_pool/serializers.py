from rest_framework import serializers
from .models import TalentPool
#from employees.serializers import EmployeeSerializer
#from employees.models import Employee

class TalentPoolSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full.name', read_only=True)
    current_position = serializers.CharField(source='employee.position.name', read_only=True)
    target_position_name = serializers.CharField(source='target_position.name', read_only=True)

    class Meta:
        model = TalentPool
        fields = ['id', 'employee', 'employee_name', 'current_position', 'target_position',
                  'target_position_name', 'inclusion_date', 'priority', 'is_active']
        read_only_fields = ['inclusion_date']

