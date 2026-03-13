from rest_framework import serializers
from .models import Assessment, AssessmentHistory
#from employees.serializers import EmployeeSerializer
#from competencies.serializers import CompetencySerializer

class AssessmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    assessor_name = serializers.CharField(source='assessor.get_full_name', read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'employee', 'employee_name', 'competency', 'competency_name',
                  'value', 'date', 'comment', 'assessor', 'assessor_name']
        read_only_fields = ['date']

class AssessmentHistorySerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)

    class Meta:
        model = AssessmentHistory
        fields = ['id', 'employee', 'competency', 'competency_name', 'value', 'date']

