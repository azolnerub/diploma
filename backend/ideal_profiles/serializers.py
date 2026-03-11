from rest_framework import serializers
from .models import IdealProfile
#from employees.serializers import PositionSerializer
#from competencies.serializers import CompetencySerializer

class IdealProfileSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(source='position.name', read_only=True)
    competency_name = serializers.CharField(source='competency.name', read_only=True)

    class Meta:
        model = IdealProfile
        fields = ['id', 'position', 'position_name', 'competency',
                  'competency_name', 'required_level', 'weight']

        def validate(self, data):
            if data['required_level'] < 1 or data['required_level'] > 5:
                raise serializers.ValidationError("Требуемый уровень должен быть от 1 до 5")
            if data['weight'] <= 0:
                raise serializers.ValidationError("Весовой коэффициент должен быть положительным")
            return data
