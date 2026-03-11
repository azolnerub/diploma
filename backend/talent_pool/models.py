from django.db import models
from employees.models import Employee, Position

class TalentPool(models.Model):
    PRIORITY_CHOICES = (
        (1, 'Низкий'),
        (2, 'Средний'),
        (3, 'Высокий'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, verbose_name='Сотрудник')
    target_position = models.ForeignKey(Position, on_delete=models.CASCADE, verbose_name="Целевая должность")
    inclusion_date = models.DateField('Дата включения', auto_now_add=True)
    priority = models.IntegerField('Приоритет', choices=PRIORITY_CHOICES, default=2)
    is_active = models.BooleanField('Активен', default=True)

    class Meta:
        verbose_name = 'Кадровый резерв'
        verbose_name_plural = 'Кадровый резерв'
        ordering = ['-priority']

    def __str__(self):
        return f"{self.employee} -> {self.target_position}"