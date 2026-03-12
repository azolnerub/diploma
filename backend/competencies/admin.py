from django.contrib import admin
from .models import CompetencyCategory, Competency

@admin.register(CompetencyCategory)
class CompetencyCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category')
    list_filter = ('category',)
    search_fields = ('name', 'description')