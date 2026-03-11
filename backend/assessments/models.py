from django.db import models
from employees.models import Employee
from competencies.models import Competency
from users.models import User

class Assessment(models.Model):
    SCALE_CHOICES = [(i, str(i)) for i in range(1, 6)] # оценки от 1 до 5 (ДЛЯ ТЕСТА!!!)

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, verbose_name='Сотрудник')
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE, verbose_name='Компетенция')
    value = models.IntegerField('Оценка', choices=SCALE_CHOICES)
    date = models.DateField('Дата оценки', auto_now_add=True)
    comment = models.TextField('Комментарий', blank=True)
    assessor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='Оценивающий')

    class Meta:
        verbose_name = 'Оценка'
        verbose_name_plural = 'Оценки'
        ordering = ['-date']

    def __str__(self):
         return f"{self.employee} - {self.competency}: {self.value}"

class AssessmentHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, verbose_name='Сотрудник')
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE, verbose_name='Компетенция')
    value = models.IntegerField('Оценка')
    date = models.DateField('Дата оценки')

    class Meta:
        verbose_name = 'История оценок'
        verbose_name_plural = 'История оценок'
        ordering = ['date']