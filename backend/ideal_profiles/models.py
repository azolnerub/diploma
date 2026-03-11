from django.db import models
from employees.models import Position
from competencies.models import Competency

class IdealProfile(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, verbose_name='Должность')
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE, verbose_name='Компетенция')
    required_level = models. IntegerField('Требуемый уровень') # от 1 до 5 (ДЛЯ ТЕСТА!!!)
    weight = models.FloatField('Весовой коэффициент', default=1.0)

    class Meta:
        verbose_name = 'Идеальный профиль'
        verbose_name_plural = 'Идеальные профили'
        unique_together = ('position', 'competency')

    def __str__(self):
        return f"{self.position} - {self.competency}: {self.required_level}"
