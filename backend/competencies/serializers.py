from rest_framework import serializers
from .models import CompetencyCategory, Competency

class CompetencyCategorySerializer(serializers.ModelSerializer):
    competencies_count = serializers.IntegerField(source='competency_set.count', read_only=True)

    class Meta:
        model = CompetencyCategory
        fields = ['id', 'name', 'competencies_count']

class CompetencySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Competency
        fields = ['id', 'name', 'description', 'category', 'category_name']
