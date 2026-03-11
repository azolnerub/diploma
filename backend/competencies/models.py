from django.db import models

class CompetencyCategory(models.Model):
    name = models.CharField('Название категории', max_length=100)

    class Meta:
        verbose_name = 'Категория компетенций'
        verbose_name_plural = 'Категории компетенций'

    def __str__(self):
        return self.name

class Competency(models.Model):
    name = models.CharField('Название компетенции', max_length=150)
    description = models.TextField('Описание компетенции')
    category = models.ForeignKey(CompetencyCategory, on_delete=models.CASCADE, verbose_name='Категория')

    class Meta:
        verbose_name = 'Компетенция'
        verbose_name_plural = 'Компетенции'

    def __str__(self):
        return self.name
