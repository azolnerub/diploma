from rest_framework import serializers

class EmployeeAnalyticsSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField()
    employee_name = serializers.CharField()
    average_score = serializers.FloatField()
    dynamics = serializers.FloatField()
    competencies_count = serializers.IntegerField()
    last_assessments_date = serializers.DateField()

class DepartmentAnalyticsSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField()
    department_name = serializers.CharField()
    employees_count = serializers.IntegerField()
    average_score = serializers.FloatField()
    top_performers = serializers.ListField()
    needs_training = serializers.ListField()
